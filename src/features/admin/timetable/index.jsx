import { useDispatch } from 'react-redux';
import { useState, useEffect } from 'react';
import packInt16ToInt32 from '../../../utils/packInt16ToInt32';
import { unpackInt32ToInt16 } from '../../../utils/packInt16ToInt32';
import packInt8ToInt32 from '../../../utils/packInt8ToInt32';
import { useSelector } from 'react-redux';
import { wrap } from 'comlink';
import WasmWorker from '@src/wasm.worker?worker';
import Configuration from '@components/Admin/Configuration';
import clsx from 'clsx';
import * as XLSX from 'xlsx';
import GeneratedTimetable from '@components/Admin/TimeTable';
import ForTest from '@components/Admin/ForTest';

import validateTimetableVariables from '@validation/validateTimetableVariables';
import { toast } from 'sonner';
import ViolationList from '@components/Admin/ViolationList';
import SubjectListContainer from '../../../components/SubjectComponents/SubjectListContainer';
import ProgramListContainer from '../../../components/Admin/ProgramComponents/ProgramListContainer';
import TeacherListContainer from '@components/Admin/Teacher/TeacherListContainer';
import SectionListContainer from '../../../components/Admin/SectionComponents/SectionListContainer';
import ExportImportDBButtons from '@components/Admin/ExportImportDBButtons';

import { getTimeSlotIndex, getTimeSlotString } from '@utils/timeSlotMapper';
import Breadcrumbs from '@components/Admin/Breadcrumbs';
import { clearAllEntriesAndResetIDs } from '@src/indexedDB';
import { enableMapSet } from 'immer';

enableMapSet();
const getTimetable = wrap(new WasmWorker());

import { fetchSections, editSection } from '@features/sectionSlice';
import { fetchPrograms, editProgram } from '@features/programSlice';
import { fetchSubjects } from '@features/subjectSlice';
import { fetchBuildings } from '@features/buildingSlice';
import { original } from 'immer';
import calculateTotalClass from '../../../utils/calculateTotalClass';
import deepEqual from '../../../utils/deepEqual';
import gcdOfArray from '../../../utils/getGCD';
import { packThreeSignedIntsToInt32 } from '../../../utils/packThreeSignedIntsToInt32';
import NotificationHandler from '../../../components/Admin/NotificationHandler';

function addObjectToMap(map, key, newObject, IDIncrementer, propertyIDName) {
    if (!map.has(key)) {
        map.set(key, []);
    }

    const currentArray = map.get(key);

    // console.log('🚀 ~ currentArray:', currentArray);

    const isDuplicate = currentArray.some((item) => {
        let { [propertyIDName]: _, ...rest } = item;
        let { [propertyIDName]: __, ...rest2 } = newObject;

        return deepEqual(rest, rest2);
    });

    if (!isDuplicate) {
        currentArray.push({
            [propertyIDName]: IDIncrementer,
            ...newObject,
        });
        map.set(key, currentArray);

        return IDIncrementer + 1;
    }

    return IDIncrementer;
}

function getVacantSlots(totalTimeslot, numOfSchoolDays, fixedPositions, fixedDays) {
    // Create an array of sets, each set initialized with the range [1, numOfSchoolDays].
    const vacant = Array.from(
        { length: totalTimeslot },
        () => new Set(Array.from({ length: numOfSchoolDays }, (_, index) => index + 1))
    );

    // Process each fixed position to adjust the `vacant` array.
    Object.entries(fixedPositions).forEach(([subjectID, fixedPosition]) => {
        fixedPosition.forEach((timeslot, index) => {
            if (timeslot !== 0) {
                const daysToDelete = fixedDays[subjectID][index];
                vacant[timeslot - 1].delete(daysToDelete); // Remove the day from the corresponding timeslot's set.
            }
        });
    });

    return vacant;
}

function Timetable() {
    const dispatch = useDispatch();

    const links = [
        { name: 'Home', href: '/' },
        // { name: 'Modify Subjects', href: '/modify-subjects' },
    ];

    const { subjects: subjectsStore, status: subjectStatus } = useSelector((state) => state.subject);
    const { buildings: buildingsStore, status: buildingStatus } = useSelector((state) => {
        return state.building;
    });
    const { teachers: teachersStore } = useSelector((state) => state.teacher);
    const { sections: sectionsStore, status: sectionStatus } = useSelector((state) => state.section);
    const { programs: programsStore, status: programStatus } = useSelector((state) => state.program);

    // ========================================================================

    const [numOfSchoolDays, setNumOfSchoolDays] = useState(() => {
        return localStorage.getItem('numOfSchoolDays') || 5;
    });

    const [breakTimeDuration, setBreakTimeDuration] = useState(() => {
        return localStorage.getItem('breakTimeDuration') || 30;
    });

    const [prevNumOfSchoolDays, setPrevNumOfSchoolDays] = useState(numOfSchoolDays);

    const [prevBreakTimeDuration, setPrevBreakTimeDuration] = useState(breakTimeDuration);

    // ========================================================================

    const [sectionTimetables, setSectionTimetables] = useState({});
    const [teacherTimetables, setTeacherTimetables] = useState({});
    const [mapVal, setMapVal] = useState(new Map());

    const [timetableGenerationStatus, setTimetableGenerationStatus] = useState('idle');
    const [violations, setViolations] = useState([]);

    // Scope and Limitations
    // Room-Section Relationship: Each room is uniquely assigned to a specific subject, establishing a 1:1 relationship.
    // Due to this strict pairing, room allocation is not a factor in timetable generation.
    // Curriculum-Driven Course Selection: Students are required to follow a predefined curriculum.
    // They do not have the option to select subjects independently.
    // Standardized Class Start and Break Times: The start time for the first class and the timing of breaks are
    // standardized across all sections and teachers, ensuring uniformity in the daily schedule.

    const validate = () => {
        const { canProceed, violations } = validateTimetableVariables({
            sections: sectionsStore,
            teachers: teachersStore,
            subjects: subjectsStore,
            programs: programsStore,
        });

        if (!canProceed) {
            if (violations.some((v) => v.type === 'emptyDatabase')) {
                toast.error('One or more tables are empty.');
            } else {
                toast.error('Invalid timetable variables');
            }
            setViolations(violations);
            return false;
        }

        setViolations([]);
        return true;
    };

    const handleButtonClick = async () => {
        const subjectMap = Object.entries(subjectsStore).reduce((acc, [, value], index) => {
            acc[index] = value.id;
            return acc;
        }, {});

        const buildingMapReverse = Object.entries(buildingsStore).reduce((acc, [, value], index) => {
            acc[value.id] = index;
            return acc;
        }, {});

        // console.log('🚀 ~ handleButtonClick ~ buildingsStore:', typeof buildingsStore, buildingsStore);
        // console.log('🚀 ~ handleButtonClick ~ buildingMapReverse:', buildingMapReverse);

        const buildingMap = Object.entries(buildingsStore).reduce((acc, [, building], index) => {
            console.log('🚀 ~ handleButtonClick ~ building:', building);

            acc[buildingMapReverse[building.id]] = {
                id: buildingMapReverse[building.id],

                adjacency: Array.isArray(building.nearbyBuildings)
                    ? building.nearbyBuildings
                          .map((buildingID) => buildingMapReverse[buildingID.id] ?? null)
                          .filter((building) => building !== null)
                    : [],

                floorRooms: building.rooms.reduce((acc, roomGroup) => [...acc, roomGroup.length], []),
            };
            return acc;
        }, {});

        // console.log('🚀 ~ handleButtonClick ~ buildingMap:', buildingMap);

        const buildingInfoArray = [];
        const buildingAdjacencyArray = [];

        Object.entries(buildingMap).forEach(([buildingID, building]) => {
            console.log('🚀 ~ Object.entries ~ building:', building);

            // console.log('🚀 ~ Object.entries ~ buildingID:', buildingID);
            building.adjacency.forEach((adjacentBuildingID) => {
                // console.log(
                //     '🚀 ~ building.adjacency.forEach ~ parseInt(buildingID):',
                //     parseInt(buildingID)
                // );
                // console.log(
                //     '🚀 ~ building.adjacency.forEach ~ parseInt(adjacentBuildingID):',
                //     parseInt(adjacentBuildingID)
                // );

                buildingAdjacencyArray.push(packInt16ToInt32(parseInt(buildingID), parseInt(adjacentBuildingID)));
            });

            building.floorRooms.forEach((floorRoomCount) => {
                buildingInfoArray.push(packInt16ToInt32(parseInt(buildingID), floorRoomCount));
            });
        });

        buildingInfoArray.push(-1);
        buildingAdjacencyArray.push(-1);

        const buildingInfo = new Int32Array([...buildingInfoArray]);
        const buildingAdjacency = new Int32Array([...buildingAdjacencyArray]);

        // console.log('🚀 ~ handleButtonClick ~ buildingAdjacencyArray:', buildingAdjacencyArray);

        const subjectMapReverse = Object.entries(subjectsStore).reduce((acc, [, subject], index) => {
            acc[subject.id] = {
                id: index,
                numOfClasses: Math.min(Math.ceil(subject?.weeklyMinutes / subject.classDuration), numOfSchoolDays),
                classDuration: subject.classDuration,
            };
            return acc;
        }, {});

        const teacherMap = Object.entries(teachersStore).reduce((acc, [, teacher], index) => {
            acc[index] = {
                subjects: teacher.subjects.map((subjectID) => subjectMapReverse[subjectID].id),
                id: teacher.id,
                additionalTeacherScheds: teacher.additionalTeacherScheds || [],
            };
            return acc;
        }, {});

        Object.entries(teachersStore).forEach(([key, section]) => {
            // console.log('🚀 ~ Object.entries ~ teachersStore:', teachersStore);
            // ...
        });

        const subjectConfigurationMap = new Map();
        let subjectConfigurationIDIncrementer = 0;

        Object.entries(sectionsStore).forEach(([key, section]) => {
            console.log('GUGU', key, section);

            const fixedDays = section.fixedDays;
            const fixedPositions = section.fixedPositions;
            const additionalScheds = section.additionalScheds;

            let totalNumOfClasses = calculateTotalClass(subjectsStore, section.subjects, numOfSchoolDays);

            let totalAdditionalScheduleNumOfClass = additionalScheds.reduce((total, additionalScheduleNumOfClass) => {
                return total + additionalScheduleNumOfClass.frequency;
            }, 0);

            console.log('🚀 ~ handleButtonClick ~ totalAdditionalScheduleNumOfClass:', totalAdditionalScheduleNumOfClass);

            let totalTimeslot = Math.ceil((totalNumOfClasses + totalAdditionalScheduleNumOfClass) / numOfSchoolDays);

            totalTimeslot += totalTimeslot >= 10 ? 2 : 1;

            const emptyEveryDayTimeslot = new Set(Array.from({ length: totalTimeslot }, (_, i) => i + 1));

            let vacant = getVacantSlots(totalTimeslot, numOfSchoolDays, fixedPositions, fixedDays);

            console.log('🚀 ~ Object.entries ~ vacant:', vacant);

            Object.keys(fixedPositions).forEach((subjectID) => {
                if (fixedPositions[subjectID].every((element) => element === fixedPositions[subjectID][0])) {
                    return;
                }

                fixedPositions[subjectID].forEach((timeslot) => {
                    emptyEveryDayTimeslot.delete(timeslot);
                });
            });

            console.log('::🚀::::: ~ Object.entries ~ emptyEveryDayTimeslot:', emptyEveryDayTimeslot);

            let subjectsEveryDay = [];

            Object.keys(fixedPositions).forEach((subjectID) => {
                const allElementsAreZero = fixedPositions[subjectID].every((element) => element === fixedPositions[subjectID][0]);

                const hasCorrectLength = fixedPositions[subjectID].length == numOfSchoolDays;

                if (allElementsAreZero && hasCorrectLength) {
                    subjectsEveryDay.push(subjectID);
                }
            });

            console.log('🚀🚀🚀🚀 ~ Object.entries ~ subjectsEveryDay:', subjectsEveryDay);

            // TODO:

            subjectsEveryDay.forEach((subjectID) => {
                const subjectConfiguration = {
                    subject: subjectMapReverse[subjectID].id,
                    is_consistent_everyday: emptyEveryDayTimeslot.size >= subjectsEveryDay.length,
                    classDuration: subjectMapReverse[subjectID].classDuration,
                    // fixed_timeslot: fixedPositions[subjectID][0] == 0 ? 0 : fixedPositions[subjectID][0] - 1,
                    fixed_timeslot: fixedPositions[subjectID][0],
                    fixedDay: 0,
                    isOverlappable: true,
                };

                subjectConfigurationIDIncrementer = addObjectToMap(
                    subjectConfigurationMap,
                    subjectMapReverse[subjectID].id,
                    subjectConfiguration,
                    subjectConfigurationIDIncrementer,
                    'subjectConfigurationID'
                );
            });

            Object.entries(fixedPositions)
                .filter(([subjectID]) => !subjectsEveryDay.includes(subjectID))
                .forEach(([subjectID, classBlock]) => {
                    // console.log(`${subjectID}: ${classBlock}`);

                    classBlock.forEach((timeslot, index) => {
                        const subjectConfiguration = {
                            subject: subjectMapReverse[subjectID].id,
                            is_consistent_everyday: false,
                            classDuration: subjectMapReverse[subjectID].classDuration,
                            // fixed_timeslot: timeslot == 0 ? 0 : timeslot - 1,
                            fixed_timeslot: timeslot,
                            fixedDay: fixedDays[subjectID][index],
                            isOverlappable: true,
                        };

                        subjectConfigurationIDIncrementer = addObjectToMap(
                            subjectConfigurationMap,
                            subjectMapReverse[subjectID].id,
                            subjectConfiguration,
                            subjectConfigurationIDIncrementer,
                            'subjectConfigurationID'
                        );
                    });
                });

            let vacant_iterator = section.shift == 0 ? -1 : 0;
            console.log('🚀 ~ Object.entries ~ vacant_iterator:', vacant_iterator);

            section.additionalScheds.forEach((additionalSchedule) => {
                for (let i = 0; i < additionalSchedule.frequency; i++) {
                    // console.log('🚀 ~ additionalScheds.forEach ~ vacant[vacant_iterator]:', vacant);
                    // console.log('🚀 ~ additionalScheds.forEach ~ vacant[vacant_iterator]:', vacant[0]);
                    // console.log('🚀 ~ additionalScheds.forEach ~ vacant[vacant_iterator]:', vacant[vacant_iterator]);

                    if (vacant.at(vacant_iterator).size == 0) {
                        vacant_iterator += section.shift == 0 ? -1 : 1;
                    }

                    const firstDay = vacant.at(vacant_iterator).values().next().value;
                    vacant.at(vacant_iterator).delete(firstDay);

                    console.log('PP', section.shift == 0 ? totalTimeslot + 1 + vacant_iterator : vacant_iterator + 1);
                    console.log('🚀 ~ AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', additionalSchedule?.duration || 0);

                    const subjectConfiguration = {
                        subject: subjectMapReverse[additionalSchedule.subject]?.id ?? -1,
                        is_consistent_everyday: false,
                        classDuration: additionalSchedule?.duration || 0,
                        fixed_timeslot: section.shift == 0 ? totalTimeslot + 1 + vacant_iterator : vacant_iterator + 1,
                        fixedDay: 0,
                        isOverlappable: false,
                    };

                    subjectConfigurationIDIncrementer = addObjectToMap(
                        subjectConfigurationMap,
                        subjectMapReverse[additionalSchedule.subject]?.id ?? -1,
                        subjectConfiguration,
                        subjectConfigurationIDIncrementer,
                        'subjectConfigurationID'
                    );
                }
            });
        });

        console.log('BBBBBBBBBBBB:', subjectConfigurationMap);

        const subjectConfigurationSubjectUnitsArray = [];
        const subjectConfigurationSubjectDurationArray = [];
        const subjectConfigurationSubjectFixedTimeslotArray = [];
        const subjectConfigurationSubjectFixedDayArray = [];
        const subjectConfigurationSubjectIsOverlappableArray = [];
        let totalNumOfSubjectConfigurations = 0;

        subjectConfigurationMap.forEach((subjectConfigurationArray) => {
            console.log('🚀 ~ subjectConfigurationArray:', subjectConfigurationArray);

            subjectConfigurationArray.forEach((subjectConfiguration) => {
                let id = subjectConfiguration.subjectConfigurationID;
                let subjectID = subjectConfiguration.subject;

                subjectConfigurationSubjectUnitsArray[id] = packInt16ToInt32(
                    subjectID,
                    subjectConfiguration.is_consistent_everyday ? 0 : 1
                );
                subjectConfigurationSubjectDurationArray[id] = packInt16ToInt32(subjectID, subjectConfiguration.classDuration);
                subjectConfigurationSubjectFixedTimeslotArray[id] = packInt16ToInt32(
                    subjectID,
                    subjectConfiguration.fixed_timeslot
                );
                subjectConfigurationSubjectFixedDayArray[id] = packInt16ToInt32(subjectID, subjectConfiguration.fixedDay);
                subjectConfigurationSubjectIsOverlappableArray[id] = subjectConfiguration.isOverlappable;

                totalNumOfSubjectConfigurations++;
            });
        });

        let breakTimeDuration = 30;

        const durationUniqueAdditionalTeacherScheds = [
            ...new Set(
                Object.values(teacherMap).flatMap((entry) => entry.additionalTeacherScheds.map((sched) => sched.duration))
            ),
        ];

        let timeDivision = gcdOfArray([
            ...subjectConfigurationSubjectDurationArray.map((duration) => {
                let { second: subjectDuration } = unpackInt32ToInt16(duration);
                return subjectDuration;
            }),
            breakTimeDuration,
            durationUniqueAdditionalTeacherScheds,
        ]);

        timeDivision = 5;

        console.log('🚀 ~ handleButtonClick ~ timeDivision:', timeDivision);

        subjectConfigurationSubjectDurationArray.forEach((duration, index) => {
            let { first: subjectID, second: subjectDuration } = unpackInt32ToInt16(duration);
            subjectConfigurationSubjectDurationArray[index] = packInt16ToInt32(subjectID, subjectDuration / timeDivision);
        });

        breakTimeDuration /= timeDivision;

        let lowestSubjectDuration = Math.min(
            ...subjectConfigurationSubjectDurationArray.map((duration) => {
                let { second: subjectDuration } = unpackInt32ToInt16(duration);
                return subjectDuration;
            }),
            breakTimeDuration
            // durationUniqueAdditionalTeacherScheds
        );
        console.log('🚀 ~ handleButtonClick ~ durationUniqueAdditionalTeacherScheds:', durationUniqueAdditionalTeacherScheds);
        console.log('🚀 ~ handleButtonClick ~ lowestSubjectDuration:', lowestSubjectDuration);

        let offset = lowestSubjectDuration - 1; // what is this minus 1 magic number?????
        console.log('🚀 ~ handleButtonClick ~ offset:', offset);
        // let offset = 0; // what is this minus 1 magic number?????

        subjectConfigurationSubjectDurationArray.forEach((duration, index) => {
            let { first: subjectID, second: subjectDuration } = unpackInt32ToInt16(duration);
            subjectConfigurationSubjectDurationArray[index] = packInt16ToInt32(subjectID, subjectDuration - offset);
        });

        subjectConfigurationMap.forEach((subjectConfigurationArray) => {
            subjectConfigurationArray.forEach((subjectConfiguration, index) => {
                subjectConfiguration.classDuration = subjectConfiguration.classDuration / timeDivision - offset;
            });
        });

        let totalSectionSubjects = 0;

        const sectionMap = Object.entries(sectionsStore).reduce((acc, [, section], index) => {
            console.log('sectionMap ~ section:', section);

            // Assuming section.subjects is an object with subject IDs as keys
            const subjectIDs = Object.keys(section.subjects);

            const fixedDays = section.fixedDays;
            const fixedPositions = section.fixedPositions;
            const additionalScheds = section.additionalScheds;

            let totalNumOfClasses = calculateTotalClass(subjectsStore, section.subjects, numOfSchoolDays);

            console.log('🚀hheee ~ handleButtonClick ~ section.additionalScheds:', section.additionalScheds);

            let totalAdditionalScheduleNumOfClass = additionalScheds.reduce((total, additionalScheduleNumOfClass) => {
                return total + additionalScheduleNumOfClass.frequency;
            }, 0);

            console.log('🚀 ~ handleButtonClick ~ totalAdditionalScheduleNumOfClass:', totalAdditionalScheduleNumOfClass);

            let totalTimeslot = Math.ceil((totalNumOfClasses + totalAdditionalScheduleNumOfClass) / numOfSchoolDays);

            totalTimeslot += totalTimeslot >= 10 ? 2 : 1;

            console.log('🚀 ~ sectionMap ~ fixedPositions:', fixedPositions);
            console.log('🚀 ~ sectionMap ~ fixedDays:', fixedDays);

            let vacant = getVacantSlots(totalTimeslot, numOfSchoolDays, fixedPositions, fixedDays);

            console.log('🚀 ~ sectionMap ~ vacant:', vacant);

            // console.log(
            //     '🚀 ~ handleButtonClick ~ fixedPositions:',
            //     fixedPositions
            // );

            const emptyEveryDayTimeslot = new Set(Array.from({ length: totalTimeslot }, (_, i) => i + 1));

            Object.keys(fixedPositions).forEach((subjectID) => {
                if (fixedPositions[subjectID].every((element) => element === fixedPositions[subjectID][0])) {
                    return;
                }

                fixedPositions[subjectID].forEach((timeslot) => {
                    emptyEveryDayTimeslot.delete(timeslot);
                });
            });

            let subjectsEveryDay = [];

            Object.keys(fixedPositions).forEach((subjectID) => {
                const allElementsAreZero = fixedPositions[subjectID].every((element) => element === fixedPositions[subjectID][0]);

                const hasCorrectLength = fixedPositions[subjectID].length == numOfSchoolDays;

                if (allElementsAreZero && hasCorrectLength) {
                    subjectsEveryDay.push(subjectID);
                }
            });

            let subjectConfigurationArray = [];

            Object.entries(fixedPositions).forEach(([subjectID, positionArray]) => {
                // console.log(`Key: ${subjectID}, Value: ${positionArray}`);

                if (
                    positionArray.length == numOfSchoolDays &&
                    emptyEveryDayTimeslot.size >= subjectsEveryDay.length &&
                    positionArray.every((element) => element === positionArray[0])
                ) {
                    const subjectConfiguration = {
                        subject: subjectMapReverse[subjectID].id,
                        is_consistent_everyday: true,
                        classDuration: subjectMapReverse[subjectID].classDuration / timeDivision - offset,
                        // fixed_timeslot: positionArray[0] == 0 ? 0 : positionArray[0] - 1,
                        fixed_timeslot: positionArray[0],
                        fixedDay: 0,
                        isOverlappable: true,
                    };

                    subjectConfigurationArray.push(subjectConfiguration);

                    return;
                }

                //  how can i store additional scheduels in subject configuration if the fixedDay is not set initially.

                positionArray.forEach((timeslot, index) => {
                    const subjectConfiguration = {
                        subject: subjectMapReverse[subjectID].id,
                        is_consistent_everyday: false,
                        classDuration: subjectMapReverse[subjectID].classDuration / timeDivision - offset,
                        // fixed_timeslot: timeslot == 0 ? 0 : timeslot - 1,
                        fixed_timeslot: timeslot,
                        fixedDay: fixedDays[subjectID][index],
                        isOverlappable: true,
                    };

                    subjectConfigurationArray.push(subjectConfiguration);
                });
            });

            let vacant_iterator = section.shift == 0 ? -1 : 0;

            additionalScheds.forEach((additionalSchedule) => {
                console.log('🚀 ~ additionalScheds.forEach ~ additionalSchedule:', additionalSchedule);

                for (let i = 0; i < additionalSchedule.frequency; i++) {
                    if (vacant.at(vacant_iterator).size == 0) {
                        vacant_iterator += section.shift == 0 ? -1 : 1;
                    }

                    const firstDay = vacant.at(vacant_iterator).values().next().value;
                    vacant.at(vacant_iterator).delete(firstDay);

                    subjectConfigurationArray.push({
                        subject: subjectMapReverse[additionalSchedule.subject]?.id ?? -1,
                        is_consistent_everyday: false,
                        classDuration: additionalSchedule?.duration / timeDivision - offset || 0,
                        fixed_timeslot: section.shift == 0 ? totalTimeslot + 1 + vacant_iterator : vacant_iterator + 1,
                        fixedDay: 0,
                        isOverlappable: false,
                    });
                }
            });

            console.log("🚀section ' s ~ subjectConfiguration:", section.id, subjectConfigurationArray);

            let sectionSubjectConfigurationIDs = [];

            subjectConfigurationArray.forEach((subjectConfiguration) => {
                let subjectID = subjectConfiguration.subject;
                // console.log(
                //     '🚀 ~ gaga ~ gag:',
                //     subjectConfiguration.subject
                // );

                subjectConfigurationMap.get(subjectID).forEach((sectionSubjectConfiguration) => {
                    // console.log(
                    //     '🚀 ~ eee ~ eee:',
                    //     sectionSubjectConfiguration
                    // );

                    const { subjectConfigurationID: sectionSubjectConfigurationID, ...sectionSubjectConfigurationMinusID } =
                        sectionSubjectConfiguration;

                    // console.log('comparing');
                    // console.log(subjectConfiguration);
                    // console.log(sectionSubjectConfigurationMinusID);

                    if (deepEqual(sectionSubjectConfigurationMinusID, subjectConfiguration)) {
                        sectionSubjectConfigurationIDs.push(sectionSubjectConfigurationID);

                        return;
                    }
                });
            });

            totalSectionSubjects += sectionSubjectConfigurationIDs.length;

            console.log('🚀 ~ fdff section subjectConfiguration IDs:', section.id, sectionSubjectConfigurationIDs);

            acc[index] = {
                subjectConfigurationIDs: sectionSubjectConfigurationIDs,
                subjects: section.subjects,
                startTime: section.startTime,
                id: section.id,
                additionalScheds: section.additionalScheds,
                roomDetails: section.roomDetails,
            };

            return acc;
        }, {});

        console.log('subjectMap', subjectMap);
        console.log('subjectMapReverse', subjectMapReverse);
        console.log('teacherMap', teacherMap);
        console.log('sectionMap', sectionMap);

        let defaultClassDuration = 40;

        let maxTeacherWorkLoad = 3000;
        let minTeacherWorkLoad = 100;

        defaultClassDuration /= timeDivision;
        maxTeacherWorkLoad /= timeDivision;
        minTeacherWorkLoad /= timeDivision;

        const sectionStartArray = [];
        const sectionConfigurationArray = [];
        const sectionSubjectConfigurationArray = [];
        const sectionLocationArray = [];

        Object.entries(subjectsStore).forEach(([key, value]) => {
            // console.log(`Key: ${key}, Value: ${value}`);

            if (value.classDuration < lowestSubjectDuration) {
                lowestSubjectDuration = value.classDuration;
            }
        });

        const commonSubjectCount = 9;

        // console.log('🚀 ~ handleButtonClick ~ offset:', offset);

        let minTotalClassDurationForTwoBreaks = commonSubjectCount * defaultClassDuration;
        console.log('🚀 ~ handleButtonClick ~ defaultClassDuration:', defaultClassDuration);

        defaultClassDuration -= offset;
        breakTimeDuration -= offset;
        minTotalClassDurationForTwoBreaks /= offset || 1;

        for (const [sectionKey, section] of Object.entries(sectionMap)) {
            sectionStartArray[sectionKey] = section.startTime;

            let totalNumOfClasses = calculateTotalClass(subjectsStore, section.subjects, numOfSchoolDays);

            let additionalScheduleTotalNumOfClasses = section.additionalScheds.reduce((acc, schedule) => {
                // console.log('schedule', schedule);
                let frequency = schedule?.frequency || 0;
                return acc + frequency;
            }, 0);

            let totalTimeslot = Math.ceil((totalNumOfClasses + additionalScheduleTotalNumOfClasses) / numOfSchoolDays);
            // console.log('🚀 ~ handleButtonClick ~ totalTimeslot:', totalTimeslot);

            // totalTimeslot =

            const numberOfBreak = totalTimeslot >= 10 ? 2 : 1;

            totalTimeslot += numberOfBreak;

            // const notAllowedBreakslotGap = totalTimeslot >= 7 ? 2 : 1;

            let notAllowedBreakslotGap = 0;
            if (totalTimeslot >= 5 && totalTimeslot < 7) {
                notAllowedBreakslotGap = 1;
            } else if (totalTimeslot >= 7) {
                notAllowedBreakslotGap = 2;
            } else if (totalTimeslot >= 10) {
                notAllowedBreakslotGap = 3;
            }

            // TODO: include teacher additional scheulde
            // TODO: update teacher workload in real data
            // TODO: test on real high data

            const isDynamicSubjectConsistentDuration = 0; // false

            sectionConfigurationArray[sectionKey] = packInt8ToInt32(
                numberOfBreak,
                totalTimeslot,
                notAllowedBreakslotGap,
                isDynamicSubjectConsistentDuration
            );

            section.subjectConfigurationIDs.forEach((subjectConfigurationID) => {
                sectionSubjectConfigurationArray.push(packInt16ToInt32(sectionKey, subjectConfigurationID));
            });

            const roomDetails = section.roomDetails;
            const buildingID = buildingMapReverse[roomDetails.buildingId];

            console.log('🚀 ~ handleButtonClick ~ section:', section);
            console.log('|| ~ handleButtonClick ~ notAllowedBreakslotGap:', notAllowedBreakslotGap);
            console.log('|| ~ handleButtonClick ~ numberOfBreak:', numberOfBreak);
            console.log('|| ~ handleButtonClick ~ totalTimeslot:', totalTimeslot);
            console.log('|| ~ roomDetails roomDetailsroomDetailsroomDetailsroomDetailsroomDetails ~ roomDetails:', roomDetails);
            console.log('|| ~ buildingMapReverse:', buildingMapReverse);
            console.log('|| ~ handleButtonClick ~ buildingID:');

            const exampleLocation = {
                buildingID: 0,
                floor: 0,
                room: 0,
            };

            console.log(buildingID, roomDetails.floorIdx, roomDetails.roomIdx);

            sectionLocationArray.push(
                packThreeSignedIntsToInt32(buildingID || 0, roomDetails.floorIdx || 0, roomDetails.roomIdx || 0)
            );

            // sectionLocationArray.push(
            //     packThreeSignedIntsToInt32(exampleLocation.buildingID || 0, exampleLocation.floor || 0, exampleLocation.room || 0)
            // );
        }

        console.log('🚀 ~ handleButtonClick ~ sectionStartArray:', sectionStartArray);

        const sectionLocation = new Int32Array([...sectionLocationArray]);

        const subjectConfigurationSubjectUnits = new Int32Array([...subjectConfigurationSubjectUnitsArray]);
        const subjectConfigurationSubjectDuration = new Int32Array([...subjectConfigurationSubjectDurationArray]);
        const subjectConfigurationSubjectFixedTimeslot = new Int32Array([...subjectConfigurationSubjectFixedTimeslotArray]);
        const subjectConfigurationSubjectFixedDay = new Int32Array([...subjectConfigurationSubjectFixedDayArray]);
        const subjectConfigurationSubjectIsOverlappable = new Int32Array([...subjectConfigurationSubjectIsOverlappableArray]);
        const sectionConfiguration = new Int32Array([...sectionConfigurationArray]);
        const sectionSubjectConfiguration = new Int32Array([...sectionSubjectConfigurationArray]);

        const maxIterations = 3000;
        const beesPopulations = 4;
        const beesEmployed = 2;
        const beesOnlooker = 2;
        const beesScout = 1;
        const totalTeachers = Object.keys(teacherMap).length;
        const totalSections = Object.keys(sectionMap).length;

        const limits = totalTeachers * totalSections;

        const sectionStarts = new Int32Array([...sectionStartArray]);

        const teacherSubjectArray = [];
        const teacherWeekLoadConfigArray = [];

        let teacherReservationConfigArray = [];
        let teacherReservationConfigIDArray = [];

        const teacherReservedScheduleConfigurationSet = new Set();

        for (const [teacherKey, { subjects, additionalTeacherScheds }] of Object.entries(teacherMap)) {
            for (const subject of subjects) {
                teacherSubjectArray.push(packInt16ToInt32(teacherKey, subject));
                teacherWeekLoadConfigArray.push(packInt16ToInt32(maxTeacherWorkLoad, minTeacherWorkLoad));
            }

            for (const additionalTeacherSched of additionalTeacherScheds) {
                // console.log(
                //     '🚀 ~ ]ofObject.entries ~ a a a a a additionalTeacherSched:',
                //     additionalTeacherSched
                // );

                let start = additionalTeacherSched.start;
                let duration = additionalTeacherSched.duration / timeDivision;
                let end = start + duration - 1;

                teacherReservedScheduleConfigurationSet.add(packInt16ToInt32(start, end));
            }
        }

        teacherReservationConfigArray = [...teacherReservedScheduleConfigurationSet];

        for (const [teacherKey, { additionalTeacherScheds }] of Object.entries(teacherMap)) {
            if (additionalTeacherScheds.length === 0) continue;

            for (const additionalTeacherSched of additionalTeacherScheds) {
                // console.log(
                //     '🚀 ~ ]ofObject.entries ~ a a a a a additionalTeacherSched:',
                //     additionalTeacherSched
                // );

                let start = additionalTeacherSched.start;
                let duration = additionalTeacherSched.duration / timeDivision;
                let end = start + duration - 1;

                let packedTeacherReservationConfig = unpackInt32ToInt16(start, end);

                for (const teacherReservationConfig of teacherReservedScheduleConfigurationSet) {
                    if (teacherReservationConfig === packedTeacherReservationConfig) {
                        teacherReservationConfigIDArray.push(packInt16ToInt32(teacherKey, teacherReservationConfig));

                        break;
                    }
                }
            }
        }

        teacherReservationConfigArray.push(-1);
        teacherReservationConfigIDArray.push(-1);

        // teacherReservationConfigArray = [-1];
        // teacherReservationConfigIDArray = [-1];

        const teacherReservationConfigID = new Int32Array([...teacherReservationConfigIDArray]);

        const teacherReservationConfig = new Int32Array([...teacherReservationConfigArray]);

        const teacherSubjects = new Int32Array([...teacherSubjectArray]);
        const teacherWeekLoadConfig = new Int32Array([...teacherWeekLoadConfigArray]);

        const subjectFixedTeacherSection = new Int32Array([-1]);
        const subjectFixedTeacher = new Int32Array([-1]);

        const teacherBreakThreshold = 4;

        const numOfViolationType = 7;

        const resultTimetableLength = totalSections * Object.entries(subjectsStore).length * numOfSchoolDays;

        const resultViolationLength = numOfViolationType * totalSections + numOfViolationType * totalTeachers;

        const teacherMiddleTimePointGrowAllowanceForBreakTimeslot = 4;

        const params2 = {
            maxIterations: maxIterations,
            numTeachers: totalTeachers,
            totalSectionSubjects: totalSectionSubjects,
            totalSection: totalSections,
            numberOfSubjectConfiguration: totalNumOfSubjectConfigurations,

            sectionConfiguration: sectionConfiguration,
            sectionLocation: sectionLocation,
            sectionSubjectConfiguration: sectionSubjectConfiguration,

            subjectConfigurationSubjectUnits: subjectConfigurationSubjectUnits,
            subjectConfigurationSubjectDuration: subjectConfigurationSubjectDuration,
            subjectConfigurationSubjectFixedTimeslot: subjectConfigurationSubjectFixedTimeslot,
            subjectConfigurationSubjectFixedDay: subjectConfigurationSubjectFixedDay,
            subjectConfigurationSubjectIsOverlappable: subjectConfigurationSubjectIsOverlappable,

            subjectFixedTeacherSection: subjectFixedTeacherSection,
            subjectFixedTeacher: subjectFixedTeacher,
            sectionStart: sectionStarts,
            teacherSubjects: teacherSubjects,
            teacherWeekLoadConfig: teacherWeekLoadConfig,
            buildingInfo: buildingInfo,
            buildingAdjacency: buildingAdjacency,

            teacherReservationConfig: teacherReservationConfig,
            teacherReservationConfigID: teacherReservationConfigID,

            teacherSubjectsLength: teacherSubjects.length,
            beesPopulation: beesPopulations,
            beesEmployed: beesEmployed,
            beesOnlooker: beesOnlooker,
            beesScout: beesScout,
            limit: limits,
            workWeek: numOfSchoolDays,

            breakTimeDuration: breakTimeDuration,
            teacherBreakThreshold: teacherBreakThreshold,
            teacherMiddleTimePointGrowAllowanceForBreakTimeslot: teacherMiddleTimePointGrowAllowanceForBreakTimeslot,
            minTotalClassDurationForTwoBreaks: minTotalClassDurationForTwoBreaks,
            defaultClassDuration: defaultClassDuration,
            offsetDuration: offset,
            resultTimetableLength: resultTimetableLength,
            resultViolationLength: resultViolationLength,

            enableLogging: false,
        };

        let generatedTimetable = [];

        setTimetableGenerationStatus('running');
        try {
            const { timetable, status } = await getTimetable(params2);

            console.log('🚀 ~ handleButtonClick ~ status:', status);
            setTimetableGenerationStatus(status);

            if (status === 'error') {
                toast.error('Timetable generation failed.');

                console.error('Error occurred during timetable generation:', timetable.error);
            } else {
                toast.success('Timetable generated successfully.');

                console.log('Generated timetable:', timetable);
                generatedTimetable = timetable;
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            setTimetableGenerationStatus('error');
        }

        const sectionTimetable = new Map();
        const teacherTimetable = new Map();
        const teacherTakenTime = new Map();

        function addToMap(map, key, value) {
            map.push([key, value]);
            map.sort((a, b) => a[0] - b[0]);
        }

        const addTimeslotToTimetable = (
            IDAttribute,
            timetableMap,
            section_id,
            subject_id,
            teacher_id,
            start,
            end,
            day,
            fieldName1,
            fieldName2,
            containerName,
            type
        ) => {
            const timeslotData = {
                section: section_id,
                subject: subject_id,
                teacher: teacher_id,
                fieldName1: fieldName1,
                fieldName2: fieldName2,
                day: day,
                end: end,
                start: start,
                type: type,
            };

            if (timetableMap.has(IDAttribute)) {
                const timetable = timetableMap.get(IDAttribute);
                addToMap(timetable.get('timetable'), start, timeslotData);
            } else {
                const timetable = new Map();
                timetable.set('containerName', containerName);
                timetable.set('timetable', []);
                addToMap(timetable.get('timetable'), start, timeslotData);
                timetableMap.set(IDAttribute, timetable);
            }
        };

        for (const entry of generatedTimetable) {
            // console.log('🚀 ~ handleButtonClick ~ entry of timetable:', entry);

            // console.log('x', teacher_id, start, end);

            const section_id = sectionMap[entry[0]].id;
            const subject_id = subjectMap[entry[1]] || null;
            const teacher_id = (teacherMap[entry[2]] || { id: null }).id;
            const timeslot = entry[3];
            const day = entry[4];

            const start = Number(entry[5]);
            const end = Number(entry[6]);
            const sectionType = 'section';
            addTimeslotToTimetable(
                section_id,
                sectionTimetable,
                section_id,
                subject_id,
                teacher_id,
                start,
                end,
                day,
                subjectsStore[subject_id]?.subject || null,
                teachersStore[teacher_id]?.teacher || null,
                sectionsStore[section_id]?.section,
                sectionType
            );

            if (teacher_id == null) {
                continue;
            }

            if (teacherTakenTime.has(teacher_id)) {
                for (let time = start; time < end; time++) {
                    teacherTakenTime.get(teacher_id).add(time);
                }
            } else {
                let takenTime = [];

                for (let time = start; time < end; time++) {
                    takenTime.push(time);
                }

                teacherTakenTime.set(teacher_id, new Set(takenTime));
            }
            const teacherType = 'teacher';

            addTimeslotToTimetable(
                teacher_id,
                teacherTimetable,
                section_id,
                subject_id,
                teacher_id,
                start,
                end,
                day,
                sectionsStore[section_id]?.section,
                subjectsStore[subject_id]?.subject,
                teachersStore[teacher_id]?.teacher,
                teacherType
            );
        }

        // teacherTakenTime.forEach((timeSet, teacher_id) => {
        //     let timeArray = Array.from(timeSet);
        //     timeArray.sort((a, b) => a - b);

        //     console.log('b teacher_id: ', teacher_id, timeArray);

        //     teacherTakenTime.set(teacher_id, timeArray); // Update the map correctly using set()
        // });

        // console.log('teacherTakenTime: ', teacherTakenTime);
        // teacherTakenTime.forEach((set, key) => {
        //     console.log('c key: ', key, set);

        //     let teacherStartTime = 0;
        //     let currentTime = teacherStartTime;

        //     set.forEach((value) => {
        //         if (value - currentTime > 1) {
        //             const result = [];

        //             for (let i = currentTime; i <= value; i++) {
        //                 result.push(i + 1);
        //             }

        //             const teacher = teacherTimetable.get(key).get('timetable');
        //             teacher.push([
        //                 currentTime == 0 ? currentTime : currentTime + 1,
        //                 {
        //                     section: null,
        //                     subject: null,
        //                     teacher: null,
        //                     fieldName1: null,
        //                     fieldName2: null,
        //                     day: null,
        //                     end: value,
        //                 },
        //             ]);

        //             // console.log('🚀 ~ s', teacher);
        //             // console.log('🚀 ~ set.forEach ~ teacher:', teacher);
        //         }

        //         currentTime = value;
        //     });
        // });

        // console.log("timetable", timetableMap);
        console.log('%cP O O P section timetable', 'color: red; font-weight: bold;', sectionTimetable);

        teacherTimetable.forEach((value, key) => {
            console.log('🚀 ~ teacherTimetable.forEach ~ value:', value);
            console.log('🚀 ~ teacherTimetable.forEach ~ key:', key);

            const timetable = value.get('timetable');

            console.log('🚀 ~ teacherTimetable.forEach ~ timetable:', timetable);

            console.log('🚀 ~ teacherTimetable.forEach ~  teacherMap[key]:', teachersStore[key]);
            const additionalTeacherScheds = teachersStore[key]?.additionalTeacherScheds || [];
            console.log('🚀 ~ teacherTimetable.forEach ~ additionalTeacherScheds:', additionalTeacherScheds);
            for (let i = 0; i < additionalTeacherScheds.length; i++) {
                const sched = additionalTeacherScheds[i];

                if (sched?.shown === false) {
                    continue;
                }

                const frequency = sched?.frequency || 1;
                const end = sched?.time + (sched?.duration || 0) / timeDivision;

                // frequency is the day from mon (1) to fri (5)
                for (let day = 1; day <= frequency; day++) {
                    timetable.push([
                        sched.time,
                        {
                            start: sched.time,
                            day: day,
                            end: end,
                            fieldName1: null,
                            fieldName2: sched.name,
                            section: null,
                            subject: sched.subject || null,
                            teacher: teachersStore[key].id,
                            type: 'teacher',
                        },
                    ]);
                }
            }
        });

        console.log('%cP O O P teacher timetable', 'color: red; font-weight: bold;', teacherTimetable);

        function mapToObject(map) {
            if (!(map instanceof Map)) return map; // If it's not a Map, return as is
            const obj = {};
            for (const [key, value] of map.entries()) {
                obj[key] = mapToObject(value); // Recursively handle nested Maps
            }
            return obj;
        }

        // const sectionString = JSON.stringify(mapToObject(sectionTimetable), null, 2);
        // const teacherString = JSON.stringify(mapToObject(teacherTimetable), null, 2);
        // console.log('teacherString: ', teacherString);
        // console.log('sectionString: ', sectionString);

        // setTimetable(timetableMap);
        setSectionTimetables(sectionTimetable);
        setTeacherTimetables(teacherTimetable);

        // const combined = combineMaps(sectionTimetable, teacherTimetable);
        // console.log('combined: ', combined);
        const sectionEdited = convertToHashMap(sectionTimetable, 'Section');
        const teacherEdited = convertToHashMap(teacherTimetable, 'Teacher');
        // console.log('sectionEdited: ', sectionEdited);
        // console.log('teacherEdited: ', teacherEdited);
        const combined = combineMaps(sectionEdited, teacherEdited);
        console.log('DATA SA DRAGDROP: ', combined);

        setMapVal(combined);
    };

    const handleSchedExport = () => {
        const sectionWorkbook = XLSX.utils.book_new();
        const teacherWorkbook = XLSX.utils.book_new();
        console.log(sectionTimetables);
        const cs1 = {
            fill: {
                fgColor: { rgb: 'FFFF00' },
            },
            font: {
                bold: true,
            },
        };

        Object.keys(sectionTimetables).forEach((sectionKey) => {
            const sectionSchedules = sectionTimetables[sectionKey];

            const sectionAdviserId = sectionsStore[sectionKey] ? sectionsStore[sectionKey].teacher : -1;
            console.log('sectionAdviserId', sectionAdviserId);
            const sectionAdviserName =
                sectionAdviserId && teachersStore[sectionAdviserId] ? teachersStore[sectionAdviserId].teacher : 'N/A';

            const setSched = [];
            const rows = [
                ['Section', sectionTimetables[sectionKey].containerName, '', '', '', ''],
                ['Adviser', sectionAdviserName, '', '', '', ''],
                ['Time', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
            ];
            const singleRows = [];
            const merges = [
                { s: { r: 0, c: 1 }, e: { r: 0, c: 5 } },
                { s: { r: 1, c: 1 }, e: { r: 1, c: 5 } },
            ];
            let secRow = 4;

            Object.keys(sectionSchedules).forEach((dayKey) => {
                const timeSchedules = sectionSchedules[dayKey];
                console.log(timeSchedules);
                const slotKeys = Object.keys(timeSchedules);

                if (slotKeys.length === 1) {
                    const slotKey = slotKeys[0];
                    console.log(timeSchedules);
                    const schedule = timeSchedules[slotKey];

                    if (schedule.subject !== null && schedule.subject !== undefined) {
                        const schedData = getTimeSlotString(schedule.start) + ' - ' + getTimeSlotString(schedule.end);

                        if (setSched.indexOf(schedData) === -1) {
                            setSched.push(schedData);

                            const newRow1 = [schedData, '', '', schedule.subject, '', ''];
                            const newRow2 = ['', '', '', schedule.teacher, '', ''];
                            rows.push(newRow1);
                            rows.push(newRow2);
                            singleRows.push(secRow);
                        }
                    }

                    if (schedule.subject === null && schedule.teacher === null && schedule.teacherID === null) {
                        const schedData = getTimeSlotString(schedule.start) + ' - ' + getTimeSlotString(schedule.end);
                        const newRow1 = [schedData, '', '', 'BREAK', '', ''];
                        const newRow2 = ['', '', '', '', '', ''];
                        rows.push(newRow1);
                        rows.push(newRow2);
                    }
                } else {
                    const sched = timeSchedules[slotKeys[0]];

                    const subjects = [];
                    const sections = [];
                    const teachers = [''];
                    let schedData = '';

                    if (sched.subject !== null && sched.subject !== undefined) {
                        schedData = getTimeSlotString(sched.start) + ' - ' + getTimeSlotString(sched.end);
                        subjects.push(schedData);
                    }

                    let prevSlotKey = 0;
                    slotKeys.forEach((slotKey) => {
                        const schedule = timeSchedules[slotKey];

                        if (schedule.subject !== null && schedule.subject !== undefined) {
                            subjects.push(schedule.subject);
                            teachers.push(schedule.teacher);
                        }
                        const gap = slotKey - prevSlotKey - 1;

                        for (let i = 0; i < gap; i++) {
                            subjects.push('');
                            sections.push('');
                        }

                        prevSlotKey = slotKey;
                    });

                    if (setSched.indexOf(schedData) === -1) {
                        setSched.push(schedData);

                        rows.push(subjects);
                        rows.push(teachers);
                    }
                }
                secRow = secRow + 2;
            });
            const worksheet = XLSX.utils.aoa_to_sheet(rows);

            worksheet['!merges'] = merges;
            worksheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

            XLSX.utils.book_append_sheet(sectionWorkbook, worksheet, `${sectionTimetables[sectionKey].containerName}`);
        });

        Object.keys(teacherTimetables).forEach((teacherKey) => {
            const teacherSchedules = teacherTimetables[teacherKey];
            const setSched = [];
            const rows = [
                ['Teacher', teacherTimetables[teacherKey].containerName, '', '', '', ''],
                ['Time', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
            ];
            const merges = [{ s: { r: 0, c: 1 }, e: { r: 0, c: 5 } }];

            Object.keys(teacherSchedules).forEach((dayKey) => {
                const timeSchedules = teacherSchedules[dayKey];
                const slotKeys = Object.keys(timeSchedules);

                if (slotKeys.length === 1) {
                    const slotKey = slotKeys[0];
                    const schedule = timeSchedules[slotKey];

                    if (schedule.subject !== null && schedule.subject !== undefined) {
                        const schedData = getTimeSlotString(schedule.start) + ' - ' + getTimeSlotString(schedule.end);

                        if (setSched.indexOf(schedData) === -1) {
                            setSched.push(schedData);

                            const newRow1 = [schedData, '', '', schedule.subject, '', ''];
                            const newRow2 = ['', '', '', schedule.section, '', ''];
                            rows.push(newRow1);
                            rows.push(newRow2);
                        }
                    }
                } else {
                    const sched = timeSchedules[slotKeys[0]];

                    const subjects = [];
                    const sections = [];
                    let schedData = '';

                    if (sched.subject !== null && sched.subject !== undefined) {
                        schedData = getTimeSlotString(sched.start) + ' - ' + getTimeSlotString(sched.end);
                        subjects.push(schedData);
                    }

                    let prevSlotKey = 0;
                    slotKeys.forEach((slotKey) => {
                        const schedule = timeSchedules[slotKey];

                        const gap = slotKey - prevSlotKey - 1;

                        for (let i = 0; i < gap; i++) {
                            subjects.push('');
                            sections.push('');
                        }

                        if (schedule.subject !== null && schedule.subject !== undefined) {
                            subjects.push(schedule.subject);
                            sections.push(schedule.section);
                        }

                        if (setSched.indexOf(schedData) === -1) {
                            setSched.push(schedData);

                            rows.push(subjects);
                            rows.push(sections);
                        }
                        prevSlotKey = slotKey;
                    });
                }
            });
            const worksheet = XLSX.utils.aoa_to_sheet(rows);

            worksheet['!merges'] = merges;
            worksheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

            XLSX.utils.book_append_sheet(teacherWorkbook, worksheet, `${teacherTimetables[teacherKey].containerName}`);
        });

        XLSX.writeFile(sectionWorkbook, 'section_schedules.xlsx');
        XLSX.writeFile(teacherWorkbook, 'teacher_schedules.xlsx');
    };

    const handleClearAndRefresh = async () => {
        // clearAllEntriesAndResetIDs().then(() => {
        //     setRefreshKey((prevKey) => prevKey + 1); // Increment refreshKey to trigger re-render
        // });
        await clearAllEntriesAndResetIDs();
    };

    const handleNumOfSchoolDaysChange = () => {
        localStorage.setItem('numOfSchoolDays', numOfSchoolDays);

        if (numOfSchoolDays === prevNumOfSchoolDays) return;
        setPrevNumOfSchoolDays(numOfSchoolDays);

        if (Object.keys(programsStore).length === 0) return;

        // Precompute values
        const classCountLookup = {};
        Object.entries(subjectsStore).forEach(([subjectID, subject]) => {
            (classCountLookup[subjectID] = Math.ceil(subject.weeklyMinutes / subject.classDuration)), numOfSchoolDays;
        });

        // Update program fixed days and fixed positions
        Object.entries(programsStore).forEach(([progId, prog]) => {
            const originalProgram = JSON.parse(JSON.stringify(prog));
            const newProgram = JSON.parse(JSON.stringify(prog));

            [7, 8, 9, 10].forEach((grade) => {
                if (newProgram[grade].subjects.length === 0) return;

                newProgram[grade].subjects.map((subId) => {
                    if (classCountLookup[subId] <= numOfSchoolDays) return;

                    const fixedDays = newProgram[grade].fixedDays[subId];
                    const fixedPositions = newProgram[grade].fixedPositions[subId];

                    for (let i = 0; i < fixedDays.length; i++) {
                        if (fixedDays[i] > numOfSchoolDays) {
                            fixedDays[i] = 0;
                            fixedPositions[i] = 0;
                        }
                    }

                    const numOfClasses = Math.min(classCountLookup[subId], numOfSchoolDays);

                    const dayPositionMap = new Map();

                    fixedDays.forEach((day, index) => {
                        const pos = fixedPositions[index];
                        if (
                            (day !== 0 && pos !== 0) ||
                            (day !== 0 && pos === 0) ||
                            (day === 0 && pos !== 0 && !dayPositionMap.has(`${day}-${pos}`))
                        ) {
                            dayPositionMap.set(`${day}-${pos}`, [day, pos]);
                        }
                    });

                    // console.log('dayPositionMap', dayPositionMap);

                    let result = [];
                    dayPositionMap.forEach(([day, pos]) => {
                        if (result.length < numOfClasses) {
                            result.push([day, pos]);
                        }
                    });

                    // console.log('result1', result);

                    // Pad with [0, 0] if necessary
                    while (result.length < numOfClasses) {
                        result.push([0, 0]);
                    }

                    // console.log('result2', result);

                    newProgram[grade].fixedDays[subId] = result.map(([day]) => day);
                    newProgram[grade].fixedPositions[subId] = result.map(([_, pos]) => pos);
                });
            });

            console.log('originalProgram:', originalProgram);
            console.log('newProgram:', newProgram);

            if (originalProgram !== newProgram) {
                dispatch(
                    editProgram({
                        programId: newProgram.id,
                        updatedProgram: newProgram,
                    })
                );
            }
        });

        if (Object.keys(sectionsStore).length === 0) return;

        // Update section fixed days and fixed positions
        Object.entries(sectionsStore).forEach(([secId, sec]) => {
            const originalSection = JSON.parse(JSON.stringify(sec));
            const newSection = JSON.parse(JSON.stringify(sec));

            newSection.subjects.map((subId) => {
                if (classCountLookup[subId] <= numOfSchoolDays) return;

                const fixedDays = newSection.fixedDays[subId];
                const fixedPositions = newSection.fixedPositions[subId];

                for (let i = 0; i < fixedDays.length; i++) {
                    if (fixedDays[i] > numOfSchoolDays) {
                        fixedDays[i] = 0;
                        fixedPositions[i] = 0;
                    }
                }

                const numOfClasses = Math.min(classCountLookup[subId], numOfSchoolDays);

                const dayPositionMap = new Map();

                fixedDays.forEach((day, index) => {
                    const pos = fixedPositions[index];
                    if (
                        (day !== 0 && pos !== 0) ||
                        (day !== 0 && pos === 0) ||
                        (day === 0 && pos !== 0 && !dayPositionMap.has(`${day}-${pos}`))
                    ) {
                        dayPositionMap.set(`${day}-${pos}`, [day, pos]);
                    }
                });

                // console.log('dayPositionMap', dayPositionMap);

                let result = [];
                dayPositionMap.forEach(([day, pos]) => {
                    if (result.length < numOfClasses) {
                        result.push([day, pos]);
                    }
                });

                // console.log('result1', result);

                // Pad with [0, 0] if necessary
                while (result.length < numOfClasses) {
                    result.push([0, 0]);
                }

                // console.log('result2', result);

                newSection.fixedDays[subId] = result.map(([day]) => day);
                newSection.fixedPositions[subId] = result.map(([_, pos]) => pos);
            });

            if (originalSection !== newSection) {
                dispatch(
                    editSection({
                        sectionId: newSection.id,
                        updatedSection: {
                            id: newSection.id,
                            teacher: newSection.teacher,
                            program: newSection.program,
                            section: newSection.section,
                            subjects: newSection.subjects,
                            fixedDays: newSection.fixedDays,
                            fixedPositions: newSection.fixedPositions,
                            year: newSection.year,
                            shift: newSection.shift,
                            startTime: getTimeSlotIndex(newSection.startTime || '06:00 AM'),
                        },
                    })
                );
            }
        });
    };

    const handleBreakTimeDurationChange = () => {
        // NEW ADDITION
        localStorage.setItem('breakTimeDuration', breakTimeDuration);

        if (breakTimeDuration === prevBreakTimeDuration) return;

        setPrevBreakTimeDuration(breakTimeDuration);

        if (Object.keys(programsStore).length === 0) return;

        Object.entries(programsStore).forEach(([progId, prog]) => {
            const originalProgram = JSON.parse(JSON.stringify(prog));
            const newProgram = JSON.parse(JSON.stringify(prog));

            [7, 8, 9, 10].forEach((grade) => {
                if (newProgram[grade].subjects.length === 0) return;

                const startTimeIdx = newProgram[grade].startTime;
                const breakTimeCount = newProgram[grade].subjects.length > 10 ? 2 : 1;

                let totalDuration = breakTimeCount * breakTimeDuration;

                newProgram[grade].subjects.forEach((subId) => {
                    totalDuration += subjectsStore[subId].classDuration;
                });

                const endTimeIdx = Math.ceil(totalDuration / 5) + startTimeIdx;

                newProgram[grade].endTime = endTimeIdx || 216; // 216 = 6:00 PM
            });

            if (originalProgram !== newProgram) {
                dispatch(
                    editProgram({
                        programId: newProgram.id,
                        updatedProgram: newProgram,
                    })
                );
            }
        });

        if (Object.keys(sectionsStore).length === 0) return;

        Object.entries(sectionsStore).forEach(([secId, sec]) => {
            const originalSection = JSON.parse(JSON.stringify(sec));
            const newSection = JSON.parse(JSON.stringify(sec));

            if (newSection.subjects.length === 0) return;

            const startTimeIdx = newSection.startTime;
            const breakTimeCount = newSection.subjects.length > 10 ? 2 : 1;

            let totalDuration = breakTimeCount * breakTimeDuration;

            newSection.subjects.forEach((subId) => {
                totalDuration += subjectsStore[subId].classDuration;
            });

            const endTimeIdx = Math.ceil(totalDuration / 5) + startTimeIdx;

            newSection.endTime = endTimeIdx || 216; // 216 = 6:00 PM

            if (originalSection !== newSection) {
                dispatch(
                    editSection({
                        sectionId: newSection.id,
                        updatedSection: newSection,
                    })
                );
            }
        });
    };

    useEffect(() => {
        console.log('timetableGenerationStatus', timetableGenerationStatus);

        // Function to handle the beforeunload event
        const handleBeforeUnload = (event) => {
            if (timetableGenerationStatus === 'running') {
                event.preventDefault();
                event.returnValue = ''; // Legacy for older browsers
            }
        };

        // if (timetableGenerationStatus === 'success') {
        //     const combinedMap = combineObjects(sectionStringObj, teacherStringObj);
        //     const map = convertToHashMap(combinedMap);
        //     console.log('combined: ', combinedMap);
        //     console.log('map: ', map);

        //     setMapVal(map);
        // }
        // Add the event listener
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Cleanup the event listener when the component unmounts
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [timetableGenerationStatus]); // The effect depends on the isProcessRunning state

    // const makeOtherTable = (table) => {
    //     let othertable = {};
    //     console.log("orig data: ",table);
    // };

    // makeOtherTable(sectionTimetables)
    // makeOtherTable(teacherTimetables)

    // const convertToHashMap = (inputObj) => {
    //     const resultMap = new Map(); // Initialize the outer Map

    //     // Iterate through each section in the input object
    //     for (let tableKey in inputObj) {
    //         let sectionData = inputObj[tableKey];
    //         // Each section has a container name
    //         let setTableKey = `${sectionData.containerName} - ${tableKey}`;

    //         // Check if the tableKey already exists under the tableKey
    //         if (!resultMap.has(setTableKey)) {
    //             resultMap.set(setTableKey, new Map());
    //         }
    //         const scheduleMap = resultMap.get(setTableKey);

    //         // Iterate through the nested objects (0, 1, 2,...)
    //         for (let key in sectionData) {
    //             // Skip the tableKey field to prevent redundant processing
    //             if (key === 'containerName') continue;
    //             // Iterate through inner objects (0, 1, 2,...)
    //             for (let innerKey in sectionData[key]) {
    //                 let schedule = sectionData[key][innerKey];
    //                 const type = schedule.teacher ? 'section' : 'teacher';
    //                 const partnerType = type === 'teacher' ? 'section' : 'teacher';

    //                 if (innerKey === '0') {
    //                     for (let i = 1; i <= 5; i++) {
    //                         const scheduleKey = `section-${schedule.sectionID}-teacher-${schedule.teacherID}-subject-${schedule.subjectID}-day-${i}-type-${type}`;
    //                         // Add the schedule to the nested Map
    //                         const keyToFind = scheduleKey.replace(/(type-)([^-]+)/, `$1${partnerType}`);

    //                         scheduleMap.set(scheduleKey, {
    //                             start: schedule.start,
    //                             end: schedule.end,
    //                             sectionID: schedule.sectionID,
    //                             subject: schedule.subject,
    //                             subjectID: schedule.subjectID,
    //                             teacherID: schedule.teacherID,
    //                             tableKey: setTableKey,
    //                             partnerKey: keyToFind,
    //                             id: scheduleKey,
    //                             dynamicID: scheduleKey,
    //                             day: i,
    //                             overlap: false,
    //                             type: type,
    //                             ...(schedule.section && {
    //                                 section: schedule.section,
    //                             }), // Add section if it exists
    //                             ...(schedule.teacher && {
    //                                 teacher: schedule.teacher,
    //                             }), // Add section if it exists
    //                         });
    //                     }
    //                 } else {
    //                     // Use sectionID, subjectID, and start time to create a unique key for the schedule
    //                     const scheduleKey = `section-${schedule.sectionID}-teacher-${schedule.teacherID}-subject-${schedule.subjectID}-day-${innerKey}-type-${type}`;
    //                     const keyToFind = scheduleKey.replace(/(type-)([^-]+)/, `$1${partnerType}`);
    //                     // Add the schedule to the nested Map
    //                     scheduleMap.set(scheduleKey, {
    //                         start: schedule.start,
    //                         end: schedule.end,
    //                         sectionID: schedule.sectionID,
    //                         subject: schedule.subject,
    //                         subjectID: schedule.subjectID,
    //                         teacherID: schedule.teacherID,
    //                         tableKey: setTableKey,
    //                         partnerKey: keyToFind,
    //                         type: type,
    //                         id: scheduleKey,
    //                         dynamicID: scheduleKey,
    //                         day: Number(innerKey),
    //                         ...(schedule.section && {
    //                             section: schedule.section,
    //                         }), // Add section if it exists
    //                         ...(schedule.teacher && {
    //                             teacher: schedule.teacher,
    //                         }), // Add section if it exists
    //                     });
    //                 }
    //             }
    //         }
    //     }

    //     return resultMap;
    // };

    const convertToHashMap = (inputMap, type) => {
        const resultMap = new Map(); // Initialize the outer Map

        // Iterate through each entry in the input HashMap
        for (let [tableKey, sectionData] of inputMap.entries()) {
            // Each section has a container name
            let containerName = null;
            let timetable = null;

            for (let [key, value] of sectionData) {
                if (key === 'containerName') {
                    containerName = value;
                } else if (key === 'timetable') {
                    timetable = value;
                }
            }

            if (!containerName || !timetable) {
                console.warn(`Missing containerName or timetable for tableKey: ${tableKey}`);
                continue;
            }
            let setTableKey = `${type}: ${containerName} - ${tableKey}`;
            // console.log('sectionData: ', sectionData);
            // console.log('setTableKey: ', setTableKey);

            // Check if the tableKey already exists under the tableKey
            if (!resultMap.has(setTableKey)) {
                resultMap.set(setTableKey, new Map());
            }
            // console.log('resultMap: ', resultMap);
            const scheduleMap = resultMap.get(setTableKey);
            // console.log('scheduleMap: ', scheduleMap);

            // Iterate through the nested objects (0, 1, 2,...)
            // console.log('timetable: ', timetable);
            for (let item of timetable) {
                let [key, schedule] = item;
                // console.log('item in timetable: ', item);
                // console.log('key in timetable: ', key);
                // console.log('value in timetable: ', schedule);

                // console.log('day in timetable: ', schedule.day);
                const type = schedule.type;
                const partnerType = type === 'teacher' ? 'section' : 'teacher';

                if (schedule.day === 0) {
                    for (let i = 1; i <= 5; i++) {
                        const scheduleKey = `section-${schedule.section}-teacher-${schedule.teacher}-subject-${schedule.subject}-day-${i}-type-${type}`;
                        // Add the schedule to the nested Map
                        const keyToFind = scheduleKey.replace(/(type-)([^-]+)/, `$1${partnerType}`);

                        scheduleMap.set(scheduleKey, {
                            start: schedule.start - 72,
                            end: schedule.end - 72,
                            sectionID: schedule.section,
                            subject: type === 'section' ? schedule.fieldName1 : schedule.fieldName2,
                            subjectID: schedule.subject,
                            teacherID: schedule.teacher,
                            tableKey: setTableKey,
                            partnerKey: keyToFind,
                            id: scheduleKey,
                            dynamicID: scheduleKey,
                            day: i,
                            overlap: false,
                            type: type,
                            ...(type === 'teacher' && { section: schedule.fieldName1 }),
                            ...(type === 'section' && { teacher: schedule.fieldName2 }),
                        });
                    }
                } else {
                    // Use sectionID, subjectID, and start time to create a unique key for the schedule
                    const scheduleKey = `section-${schedule.section}-teacher-${schedule.teacher}-subject-${schedule.subject}-day-${schedule.day}-type-${type}`;
                    const keyToFind = scheduleKey.replace(/(type-)([^-]+)/, `$1${partnerType}`);
                    // Add the schedule to the nested Map
                    scheduleMap.set(scheduleKey, {
                        start: schedule.start - 72,
                        end: schedule.end - 72,
                        sectionID: schedule.section,
                        subject: type === 'section' ? schedule.fieldName1 : schedule.fieldName2,
                        subjectID: schedule.subject,
                        teacherID: schedule.teacher,
                        tableKey: setTableKey,
                        partnerKey: keyToFind,
                        type: type,
                        id: scheduleKey,
                        dynamicID: scheduleKey,
                        overlap: false,
                        day: schedule.day,
                        ...(type === 'teacher' && { section: schedule.fieldName1 }),
                        ...(type === 'section' && { teacher: schedule.fieldName2 }),
                    });
                }
            }
        }
        // console.log('resultMap: ', resultMap);

        return resultMap;
    };

    // Example usage with inputObj
    const inputObj = {
        1: {
            0: {
                0: {
                    start: 10,
                    end: 14,
                    sectionID: 1,
                    subject: 'Math1',
                    subjectID: 1,
                    teacher: 'Teacher 1',
                    teacherID: 1,
                },
            },
            1: {
                2: {
                    start: 30,
                    end: 36,
                    sectionID: 1,
                    subject: 'English2',
                    subjectID: 2,
                    teacher: 'Teacher2',
                    teacherID: 2,
                },
            },
            2: {
                0: {
                    start: 20,
                    end: 24,
                    sectionID: 1,
                    subject: 'PE3',
                    subjectID: 3,
                    teacher: 'Teacher3',
                    teacherID: 3,
                },
            },
            3: {
                0: {
                    start: 24,
                    end: 27,
                    sectionID: 1,
                    subject: null,
                    subjectID: null,
                    teacher: null,
                    teacherID: null,
                },
            },
            containerName: 'Section 1',
        },
        2: {
            0: {
                0: {
                    start: 0,
                    end: 4,
                    sectionID: 2,
                    subject: 'English2',
                    subjectID: 2,
                    teacher: 'Teacher2',
                    teacherID: 2,
                },
            },
            1: {
                1: {
                    start: 4,
                    end: 8,
                    sectionID: 2,
                    subject: 'PE3',
                    subjectID: 3,
                    teacher: 'Teacher3',
                    teacherID: 3,
                },
                2: {
                    start: 4,
                    end: 8,
                    sectionID: 2,
                    subject: 'PE3',
                    subjectID: 3,
                    teacher: 'Teacher3',
                    teacherID: 3,
                },
            },
            containerName: 'Section 2',
        },
    };

    const teacherMapStatic = {
        1: {
            containerName: 'T7',
            timetable: [
                [
                    144,
                    {
                        section: 1,
                        subject: 2,
                        teacher: 1,
                        fieldName1: 'Magalang',
                        fieldName2: 'sub 2',
                        day: 0,
                        end: 148,
                    },
                ],
                [
                    155,
                    {
                        section: 1,
                        subject: 1,
                        teacher: 3,
                        fieldName1: 'Masarap',
                        fieldName2: 'sub 1',
                        day: 0,
                        end: 159,
                    },
                ],
                [
                    159,
                    {
                        section: 1,
                        subject: 2,
                        teacher: 2,
                        fieldName1: 'Maangas',
                        fieldName2: 'sub 2',
                        day: 0,
                        end: 163,
                    },
                ],
                [
                    0,
                    {
                        section: null,
                        subject: null,
                        teacher: null,
                        fieldName1: null,
                        fieldName2: null,
                        day: null,
                        end: 144,
                    },
                ],
                [
                    148,
                    {
                        section: null,
                        subject: null,
                        teacher: null,
                        fieldName1: null,
                        fieldName2: null,
                        day: null,
                        end: 155,
                    },
                ],
            ],
        },
        2: {
            containerName: 'T8',
            timetable: [
                [
                    155,
                    {
                        section: 2,
                        subject: 1,
                        teacher: 2,
                        fieldName1: 'Maangas',
                        fieldName2: 'sub 1',
                        day: 0,
                        end: 159,
                    },
                ],
                [
                    159,
                    {
                        section: 2,
                        subject: 2,
                        teacher: 3,
                        fieldName1: 'Masarap',
                        fieldName2: 'sub 2',
                        day: 0,
                        end: 163,
                    },
                ],
                [
                    323,
                    {
                        section: 2,
                        subject: 2,
                        teacher: 4,
                        fieldName1: 'Matikas',
                        fieldName2: 'sub 2',
                        day: 0,
                        end: 327,
                    },
                ],
                [
                    0,
                    {
                        section: null,
                        subject: null,
                        teacher: null,
                        fieldName1: null,
                        fieldName2: null,
                        day: null,
                        end: 155,
                    },
                ],
                [
                    163,
                    {
                        section: null,
                        subject: null,
                        teacher: null,
                        fieldName1: null,
                        fieldName2: null,
                        day: null,
                        end: 323,
                    },
                ],
            ],
        },
        3: {
            containerName: 'T9',
            timetable: [
                [
                    144,
                    {
                        section: 3,
                        subject: 3,
                        teacher: 2,
                        fieldName1: 'Maangas',
                        fieldName2: 'sub 3',
                        day: 0,
                        end: 148,
                    },
                ],
                [
                    148,
                    {
                        section: 3,
                        subject: 3,
                        teacher: 1,
                        fieldName1: 'Magalang',
                        fieldName2: 'sub 3',
                        day: 0,
                        end: 152,
                    },
                ],
                [
                    159,
                    {
                        section: 3,
                        subject: 1,
                        teacher: 1,
                        fieldName1: 'Magalang',
                        fieldName2: 'sub 1',
                        day: 0,
                        end: 163,
                    },
                ],
                [
                    0,
                    {
                        section: null,
                        subject: null,
                        teacher: null,
                        fieldName1: null,
                        fieldName2: null,
                        day: null,
                        end: 144,
                    },
                ],
                [
                    152,
                    {
                        section: null,
                        subject: null,
                        teacher: null,
                        fieldName1: null,
                        fieldName2: null,
                        day: null,
                        end: 159,
                    },
                ],
            ],
        },
        4: {
            containerName: 'T10',
            timetable: [
                [
                    144,
                    {
                        section: 4,
                        subject: 3,
                        teacher: 3,
                        fieldName1: 'Masarap',
                        fieldName2: 'sub 3',
                        day: 0,
                        end: 148,
                    },
                ],
                [
                    319,
                    {
                        section: 4,
                        subject: 1,
                        teacher: 4,
                        fieldName1: 'Matikas',
                        fieldName2: 'sub 1',
                        day: 0,
                        end: 323,
                    },
                ],
                [
                    327,
                    {
                        section: 4,
                        subject: 3,
                        teacher: 4,
                        fieldName1: 'Matikas',
                        fieldName2: 'sub 3',
                        day: 0,
                        end: 331,
                    },
                ],
                [
                    0,
                    {
                        section: null,
                        subject: null,
                        teacher: null,
                        fieldName1: null,
                        fieldName2: null,
                        day: null,
                        end: 144,
                    },
                ],
                [
                    148,
                    {
                        section: null,
                        subject: null,
                        teacher: null,
                        fieldName1: null,
                        fieldName2: null,
                        day: null,
                        end: 319,
                    },
                ],
                [
                    323,
                    {
                        section: null,
                        subject: null,
                        teacher: null,
                        fieldName1: null,
                        fieldName2: null,
                        day: null,
                        end: 327,
                    },
                ],
            ],
        },
        6: {
            containerName: 'T100',
            timetable: [
                [
                    151,
                    {
                        section: 6,
                        subject: 4,
                        teacher: 2,
                        fieldName1: 'Maangas',
                        fieldName2: 'sub 4',
                        day: 0,
                        end: 155,
                    },
                ],
                [
                    0,
                    {
                        section: null,
                        subject: null,
                        teacher: null,
                        fieldName1: null,
                        fieldName2: null,
                        day: null,
                        end: 151,
                    },
                ],
            ],
        },
        7: {
            containerName: 'T101',
            timetable: [
                [
                    148,
                    {
                        section: 7,
                        subject: 4,
                        teacher: 3,
                        fieldName1: 'Masarap',
                        fieldName2: 'sub 4',
                        day: 0,
                        end: 152,
                    },
                ],
                [
                    0,
                    {
                        section: null,
                        subject: null,
                        teacher: null,
                        fieldName1: null,
                        fieldName2: null,
                        day: null,
                        end: 148,
                    },
                ],
            ],
        },
        9: {
            containerName: 'T103',
            timetable: [
                [
                    155,
                    {
                        section: 9,
                        subject: 4,
                        teacher: 1,
                        fieldName1: 'Magalang',
                        fieldName2: 'sub 4',
                        day: 0,
                        end: 159,
                    },
                ],
                [
                    312,
                    {
                        section: 9,
                        subject: 4,
                        teacher: 4,
                        fieldName1: 'Matikas',
                        fieldName2: 'sub 4',
                        day: 0,
                        end: 316,
                    },
                ],
                [
                    0,
                    {
                        section: null,
                        subject: null,
                        teacher: null,
                        fieldName1: null,
                        fieldName2: null,
                        day: null,
                        end: 155,
                    },
                ],
                [
                    159,
                    {
                        section: null,
                        subject: null,
                        teacher: null,
                        fieldName1: null,
                        fieldName2: null,
                        day: null,
                        end: 312,
                    },
                ],
            ],
        },
    };

    const sectionMapStatic = {
        1: {
            containerName: 'Magalang',
            timetable: [
                [
                    144,
                    {
                        section: 1,
                        subject: 2,
                        teacher: 1,
                        fieldName1: 'sub 2',
                        fieldName2: 'T7',
                        day: 0,
                        end: 148,
                    },
                ],
                [
                    148,
                    {
                        section: 1,
                        subject: 3,
                        teacher: 3,
                        fieldName1: 'sub 3',
                        fieldName2: 'T9',
                        day: 0,
                        end: 152,
                    },
                ],
                [
                    152,
                    {
                        section: 1,
                        subject: null,
                        teacher: null,
                        fieldName1: null,
                        fieldName2: null,
                        day: 0,
                        end: 155,
                    },
                ],
                [
                    155,
                    {
                        section: 1,
                        subject: 4,
                        teacher: 9,
                        fieldName1: 'sub 4',
                        fieldName2: 'T103',
                        day: 0,
                        end: 159,
                    },
                ],
                [
                    159,
                    {
                        section: 1,
                        subject: 1,
                        teacher: 3,
                        fieldName1: 'sub 1',
                        fieldName2: 'T9',
                        day: 0,
                        end: 163,
                    },
                ],
            ],
        },
        2: {
            containerName: 'Maangas',
            timetable: [
                [
                    144,
                    {
                        section: 2,
                        subject: 3,
                        teacher: 3,
                        fieldName1: 'sub 3',
                        fieldName2: 'T9',
                        day: 0,
                        end: 148,
                    },
                ],
                [
                    148,
                    {
                        section: 2,
                        subject: null,
                        teacher: null,
                        fieldName1: null,
                        fieldName2: null,
                        day: 0,
                        end: 151,
                    },
                ],
                [
                    151,
                    {
                        section: 2,
                        subject: 4,
                        teacher: 6,
                        fieldName1: 'sub 4',
                        fieldName2: 'T100',
                        day: 0,
                        end: 155,
                    },
                ],
                [
                    155,
                    {
                        section: 2,
                        subject: 1,
                        teacher: 2,
                        fieldName1: 'sub 1',
                        fieldName2: 'T8',
                        day: 0,
                        end: 159,
                    },
                ],
                [
                    159,
                    {
                        section: 2,
                        subject: 2,
                        teacher: 1,
                        fieldName1: 'sub 2',
                        fieldName2: 'T7',
                        day: 0,
                        end: 163,
                    },
                ],
            ],
        },
        3: {
            containerName: 'Masarap',
            timetable: [
                [
                    144,
                    {
                        section: 3,
                        subject: 3,
                        teacher: 4,
                        fieldName1: 'sub 3',
                        fieldName2: 'T10',
                        day: 0,
                        end: 148,
                    },
                ],
                [
                    148,
                    {
                        section: 3,
                        subject: 4,
                        teacher: 7,
                        fieldName1: 'sub 4',
                        fieldName2: 'T101',
                        day: 0,
                        end: 152,
                    },
                ],
                [
                    152,
                    {
                        section: 3,
                        subject: null,
                        teacher: null,
                        fieldName1: null,
                        fieldName2: null,
                        day: 0,
                        end: 155,
                    },
                ],
                [
                    155,
                    {
                        section: 3,
                        subject: 1,
                        teacher: 1,
                        fieldName1: 'sub 1',
                        fieldName2: 'T7',
                        day: 0,
                        end: 159,
                    },
                ],
                [
                    159,
                    {
                        section: 3,
                        subject: 2,
                        teacher: 2,
                        fieldName1: 'sub 2',
                        fieldName2: 'T8',
                        day: 0,
                        end: 163,
                    },
                ],
            ],
        },
        4: {
            containerName: 'Matikas',
            timetable: [
                [
                    312,
                    {
                        section: 4,
                        subject: 4,
                        teacher: 9,
                        fieldName1: 'sub 4',
                        fieldName2: 'T103',
                        day: 0,
                        end: 316,
                    },
                ],
                [
                    316,
                    {
                        section: 4,
                        subject: null,
                        teacher: null,
                        fieldName1: null,
                        fieldName2: null,
                        day: 0,
                        end: 319,
                    },
                ],
                [
                    319,
                    {
                        section: 4,
                        subject: 1,
                        teacher: 4,
                        fieldName1: 'sub 1',
                        fieldName2: 'T10',
                        day: 0,
                        end: 323,
                    },
                ],
                [
                    323,
                    {
                        section: 4,
                        subject: 2,
                        teacher: 2,
                        fieldName1: 'sub 2',
                        fieldName2: 'T8',
                        day: 0,
                        end: 327,
                    },
                ],
                [
                    327,
                    {
                        section: 4,
                        subject: 3,
                        teacher: 4,
                        fieldName1: 'sub 3',
                        fieldName2: 'T10',
                        day: 0,
                        end: 331,
                    },
                ],
            ],
        },
    };

    const sectionStringObj = {
        1: {
            0: {
                1: {
                    subject: 'MAPEH',
                    sectionID: 1,
                    teacher: 'Lorenzo Sypio',
                    teacherID: 4,
                    subjectID: 5,
                    start: 0,
                    end: 4,
                },
                3: {
                    subject: 'MAPEH',
                    sectionID: 1,
                    teacher: 'Paolo Santos',
                    teacherID: 18,
                    subjectID: 5,
                    start: 0,
                    end: 4,
                },
                4: {
                    subject: 'Filipino',
                    sectionID: 1,
                    teacher: 'Ernest Aguilar',
                    teacherID: 17,
                    subjectID: 4,
                    start: 0,
                    end: 4,
                },
                5: {
                    subject: 'Filipino',
                    sectionID: 1,
                    teacher: 'Ernest Aguilar',
                    teacherID: 17,
                    subjectID: 4,
                    start: 0,
                    end: 4,
                },
            },
            1: {
                0: {
                    subject: 'Science',
                    sectionID: 1,
                    teacher: 'Alexandria Brillo',
                    teacherID: 20,
                    subjectID: 7,
                    start: 4,
                    end: 8,
                },
            },
            2: {
                0: {
                    subject: 'EsP',
                    sectionID: 1,
                    teacher: 'Yul Canlas',
                    teacherID: 1,
                    subjectID: 2,
                    start: 8,
                    end: 12,
                },
            },
            3: {
                0: {
                    subject: 'TLE',
                    sectionID: 1,
                    teacher: 'Erika Velasquez',
                    teacherID: 14,
                    subjectID: 8,
                    start: 12,
                    end: 16,
                },
            },
            4: {
                0: {
                    subject: 'English',
                    sectionID: 1,
                    teacher: 'Grace Garchitorena',
                    teacherID: 16,
                    subjectID: 3,
                    start: 16,
                    end: 20,
                },
            },
            5: {
                0: {
                    subject: null,
                    sectionID: 1,
                    teacher: null,
                    teacherID: null,
                    subjectID: null,
                    start: 20,
                    end: 23,
                },
            },
            6: {
                1: {
                    subject: 'MAPEH',
                    sectionID: 1,
                    teacher: 'Lorenzo Sypio',
                    teacherID: 4,
                    subjectID: 5,
                    start: 23,
                    end: 27,
                },
                2: {
                    subject: 'Math',
                    sectionID: 1,
                    teacher: 'Nino Manzanero',
                    teacherID: 19,
                    subjectID: 6,
                    start: 23,
                    end: 27,
                },
                3: {
                    subject: 'Math',
                    sectionID: 1,
                    teacher: 'Romar Dela Pena',
                    teacherID: 12,
                    subjectID: 6,
                    start: 23,
                    end: 27,
                },
                5: {
                    subject: 'Filipino',
                    sectionID: 1,
                    teacher: 'Ernest Aguilar',
                    teacherID: 17,
                    subjectID: 4,
                    start: 23,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'AP',
                    sectionID: 1,
                    teacher: 'Yul Canlas',
                    teacherID: 1,
                    subjectID: 1,
                    start: 27,
                    end: 31,
                },
            },
            8: {
                0: {
                    subject: 'NMP',
                    sectionID: 1,
                    teacher: 'Deazelle Capistrano',
                    teacherID: 21,
                    subjectID: 9,
                    start: 31,
                    end: 34,
                },
            },
            containerName: 'Magalang',
        },
        2: {
            0: {
                0: {
                    subject: 'English',
                    sectionID: 2,
                    teacher: 'JB Moya',
                    teacherID: 2,
                    subjectID: 3,
                    start: 0,
                    end: 4,
                },
            },
            1: {
                0: {
                    subject: 'EsP',
                    sectionID: 2,
                    teacher: 'Michael Llosa',
                    teacherID: 8,
                    subjectID: 2,
                    start: 4,
                    end: 8,
                },
            },
            2: {
                0: {
                    subject: 'Math',
                    sectionID: 2,
                    teacher: 'Romar Dela Pena',
                    teacherID: 12,
                    subjectID: 6,
                    start: 8,
                    end: 12,
                },
            },
            3: {
                0: {
                    subject: null,
                    sectionID: 2,
                    teacher: null,
                    teacherID: null,
                    subjectID: null,
                    start: 12,
                    end: 15,
                },
            },
            4: {
                0: {
                    subject: 'TLE',
                    sectionID: 2,
                    teacher: 'Deazelle Capistrano',
                    teacherID: 21,
                    subjectID: 8,
                    start: 15,
                    end: 19,
                },
            },
            5: {
                0: {
                    subject: 'Filipino',
                    sectionID: 2,
                    teacher: 'Maverick Ramos',
                    teacherID: 10,
                    subjectID: 4,
                    start: 19,
                    end: 23,
                },
            },
            6: {
                0: {
                    subject: 'AP',
                    sectionID: 2,
                    teacher: 'Michael Llosa',
                    teacherID: 8,
                    subjectID: 1,
                    start: 23,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'Science',
                    sectionID: 2,
                    teacher: 'Raine Maximo',
                    teacherID: 13,
                    subjectID: 7,
                    start: 27,
                    end: 31,
                },
            },
            8: {
                0: {
                    subject: 'MAPEH',
                    sectionID: 2,
                    teacher: 'Joshua Margallo',
                    teacherID: 11,
                    subjectID: 5,
                    start: 31,
                    end: 35,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    sectionID: 2,
                    teacher: 'Raine Maximo',
                    teacherID: 13,
                    subjectID: 9,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'Mabait',
        },
        3: {
            0: {
                0: {
                    subject: 'Math',
                    sectionID: 3,
                    teacher: 'Nino Manzanero',
                    teacherID: 19,
                    subjectID: 6,
                    start: 0,
                    end: 4,
                },
            },
            1: {
                0: {
                    subject: 'TLE',
                    sectionID: 3,
                    teacher: 'Deazelle Capistrano',
                    teacherID: 21,
                    subjectID: 8,
                    start: 4,
                    end: 8,
                },
            },
            2: {
                0: {
                    subject: 'Filipino',
                    sectionID: 3,
                    teacher: 'Ernest Aguilar',
                    teacherID: 17,
                    subjectID: 4,
                    start: 8,
                    end: 12,
                },
            },
            3: {
                0: {
                    subject: 'English',
                    sectionID: 3,
                    teacher: 'Grace Garchitorena',
                    teacherID: 16,
                    subjectID: 3,
                    start: 12,
                    end: 16,
                },
            },
            4: {
                0: {
                    subject: null,
                    sectionID: 3,
                    teacher: null,
                    teacherID: null,
                    subjectID: null,
                    start: 16,
                    end: 19,
                },
            },
            5: {
                0: {
                    subject: 'MAPEH',
                    sectionID: 3,
                    teacher: 'Paolo Santos',
                    teacherID: 18,
                    subjectID: 5,
                    start: 19,
                    end: 23,
                },
            },
            6: {
                0: {
                    subject: 'Science',
                    sectionID: 3,
                    teacher: 'Alexandria Brillo',
                    teacherID: 20,
                    subjectID: 7,
                    start: 23,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'EsP',
                    sectionID: 3,
                    teacher: 'Alexandria Brillo',
                    teacherID: 20,
                    subjectID: 2,
                    start: 27,
                    end: 31,
                },
            },
            8: {
                0: {
                    subject: 'AP',
                    sectionID: 3,
                    teacher: 'Yul Canlas',
                    teacherID: 1,
                    subjectID: 1,
                    start: 31,
                    end: 35,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    sectionID: 3,
                    teacher: 'Alexandria Brillo',
                    teacherID: 20,
                    subjectID: 9,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'Masipag',
        },
        4: {
            0: {
                0: {
                    subject: 'EsP',
                    sectionID: 4,
                    teacher: 'Deazelle Capistrano',
                    teacherID: 21,
                    subjectID: 2,
                    start: 0,
                    end: 4,
                },
            },
            1: {
                0: {
                    subject: 'AP',
                    sectionID: 4,
                    teacher: 'Yul Canlas',
                    teacherID: 1,
                    subjectID: 1,
                    start: 4,
                    end: 8,
                },
            },
            2: {
                0: {
                    subject: 'English',
                    sectionID: 4,
                    teacher: 'JB Moya',
                    teacherID: 2,
                    subjectID: 3,
                    start: 8,
                    end: 12,
                },
            },
            3: {
                0: {
                    subject: 'Science',
                    sectionID: 4,
                    teacher: 'Raine Maximo',
                    teacherID: 13,
                    subjectID: 7,
                    start: 12,
                    end: 16,
                },
            },
            4: {
                0: {
                    subject: 'Filipino',
                    sectionID: 4,
                    teacher: 'Ernest Aguilar',
                    teacherID: 17,
                    subjectID: 4,
                    start: 16,
                    end: 20,
                },
            },
            5: {
                0: {
                    subject: null,
                    sectionID: 4,
                    teacher: null,
                    teacherID: null,
                    subjectID: null,
                    start: 20,
                    end: 23,
                },
            },
            6: {
                0: {
                    subject: 'MAPEH',
                    sectionID: 4,
                    teacher: 'Joshua Margallo',
                    teacherID: 11,
                    subjectID: 5,
                    start: 23,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'TLE',
                    sectionID: 4,
                    teacher: 'Deazelle Capistrano',
                    teacherID: 21,
                    subjectID: 8,
                    start: 27,
                    end: 31,
                },
            },
            8: {
                0: {
                    subject: 'Math',
                    sectionID: 4,
                    teacher: 'Nino Manzanero',
                    teacherID: 19,
                    subjectID: 6,
                    start: 31,
                    end: 35,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    sectionID: 4,
                    teacher: 'Grace Garchitorena',
                    teacherID: 16,
                    subjectID: 9,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'Masinop',
        },
        5: {
            0: {
                0: {
                    subject: 'AP',
                    sectionID: 5,
                    teacher: 'Michael Llosa',
                    teacherID: 8,
                    subjectID: 1,
                    start: 0,
                    end: 4,
                },
            },
            1: {
                0: {
                    subject: 'English',
                    sectionID: 5,
                    teacher: 'Grace Garchitorena',
                    teacherID: 16,
                    subjectID: 3,
                    start: 4,
                    end: 8,
                },
            },
            2: {
                0: {
                    subject: 'MAPEH',
                    sectionID: 5,
                    teacher: 'Paolo Santos',
                    teacherID: 18,
                    subjectID: 5,
                    start: 8,
                    end: 12,
                },
            },
            3: {
                0: {
                    subject: null,
                    sectionID: 5,
                    teacher: null,
                    teacherID: null,
                    subjectID: null,
                    start: 12,
                    end: 15,
                },
            },
            4: {
                0: {
                    subject: 'Science',
                    sectionID: 5,
                    teacher: 'Carl Senaris',
                    teacherID: 6,
                    subjectID: 7,
                    start: 15,
                    end: 19,
                },
            },
            5: {
                0: {
                    subject: 'Filipino',
                    sectionID: 5,
                    teacher: 'David Linao',
                    teacherID: 3,
                    subjectID: 4,
                    start: 19,
                    end: 23,
                },
            },
            6: {
                0: {
                    subject: 'TLE',
                    sectionID: 5,
                    teacher: 'Deazelle Capistrano',
                    teacherID: 21,
                    subjectID: 8,
                    start: 23,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'Math',
                    sectionID: 5,
                    teacher: 'Nino Manzanero',
                    teacherID: 19,
                    subjectID: 6,
                    start: 27,
                    end: 31,
                },
            },
            8: {
                0: {
                    subject: 'EsP',
                    sectionID: 5,
                    teacher: 'Romar Dela Pena',
                    teacherID: 12,
                    subjectID: 2,
                    start: 31,
                    end: 35,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    sectionID: 5,
                    teacher: 'Erika Velasquez',
                    teacherID: 14,
                    subjectID: 9,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'Matiwasay',
        },
        6: {
            0: {
                0: {
                    subject: 'Math',
                    sectionID: 6,
                    teacher: 'Romar Dela Pena',
                    teacherID: 12,
                    subjectID: 6,
                    start: 0,
                    end: 4,
                },
            },
            1: {
                0: {
                    subject: 'Science',
                    sectionID: 6,
                    teacher: 'Carl Senaris',
                    teacherID: 6,
                    subjectID: 7,
                    start: 4,
                    end: 8,
                },
            },
            2: {
                0: {
                    subject: 'EsP',
                    sectionID: 6,
                    teacher: 'Deazelle Capistrano',
                    teacherID: 21,
                    subjectID: 2,
                    start: 8,
                    end: 12,
                },
            },
            3: {
                0: {
                    subject: 'AP',
                    sectionID: 6,
                    teacher: 'Yul Canlas',
                    teacherID: 1,
                    subjectID: 1,
                    start: 12,
                    end: 16,
                },
            },
            4: {
                0: {
                    subject: null,
                    sectionID: 6,
                    teacher: null,
                    teacherID: null,
                    subjectID: null,
                    start: 16,
                    end: 19,
                },
            },
            5: {
                0: {
                    subject: 'MAPEH',
                    sectionID: 6,
                    teacher: 'Joshua Margallo',
                    teacherID: 11,
                    subjectID: 5,
                    start: 19,
                    end: 23,
                },
            },
            6: {
                0: {
                    subject: 'English',
                    sectionID: 6,
                    teacher: 'Grace Garchitorena',
                    teacherID: 16,
                    subjectID: 3,
                    start: 23,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'TLE',
                    sectionID: 6,
                    teacher: 'Wency Cruz',
                    teacherID: 7,
                    subjectID: 8,
                    start: 27,
                    end: 31,
                },
            },
            8: {
                0: {
                    subject: 'Filipino',
                    sectionID: 6,
                    teacher: 'David Linao',
                    teacherID: 3,
                    subjectID: 4,
                    start: 31,
                    end: 35,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    sectionID: 6,
                    teacher: 'Michael Llosa',
                    teacherID: 8,
                    subjectID: 9,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'Sampaguita',
        },
        7: {
            0: {
                0: {
                    subject: 'Science',
                    sectionID: 7,
                    teacher: 'Alexandria Brillo',
                    teacherID: 20,
                    subjectID: 7,
                    start: 0,
                    end: 4,
                },
            },
            1: {
                0: {
                    subject: 'TLE',
                    sectionID: 7,
                    teacher: 'Wency Cruz',
                    teacherID: 7,
                    subjectID: 8,
                    start: 4,
                    end: 8,
                },
            },
            2: {
                0: {
                    subject: 'EsP',
                    sectionID: 7,
                    teacher: 'Carl Senaris',
                    teacherID: 6,
                    subjectID: 2,
                    start: 8,
                    end: 12,
                },
            },
            3: {
                0: {
                    subject: 'MAPEH',
                    sectionID: 7,
                    teacher: 'Paolo Santos',
                    teacherID: 18,
                    subjectID: 5,
                    start: 12,
                    end: 16,
                },
            },
            4: {
                0: {
                    subject: null,
                    sectionID: 7,
                    teacher: null,
                    teacherID: null,
                    subjectID: null,
                    start: 16,
                    end: 19,
                },
            },
            5: {
                0: {
                    subject: 'Math',
                    sectionID: 7,
                    teacher: 'Romar Dela Pena',
                    teacherID: 12,
                    subjectID: 6,
                    start: 19,
                    end: 23,
                },
            },
            6: {
                0: {
                    subject: 'English',
                    sectionID: 7,
                    teacher: 'JB Moya',
                    teacherID: 2,
                    subjectID: 3,
                    start: 23,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'AP',
                    sectionID: 7,
                    teacher: 'Michael Llosa',
                    teacherID: 8,
                    subjectID: 1,
                    start: 27,
                    end: 31,
                },
            },
            8: {
                0: {
                    subject: 'Filipino',
                    sectionID: 7,
                    teacher: 'Ernest Aguilar',
                    teacherID: 17,
                    subjectID: 4,
                    start: 31,
                    end: 35,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    sectionID: 7,
                    teacher: 'Paolo Santos',
                    teacherID: 18,
                    subjectID: 9,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'Rosas',
        },
        8: {
            0: {
                0: {
                    subject: 'EsP',
                    sectionID: 8,
                    teacher: 'Erika Velasquez',
                    teacherID: 14,
                    subjectID: 2,
                    start: 0,
                    end: 4,
                },
            },
            1: {
                0: {
                    subject: 'MAPEH',
                    sectionID: 8,
                    teacher: 'Paolo Santos',
                    teacherID: 18,
                    subjectID: 5,
                    start: 4,
                    end: 8,
                },
            },
            2: {
                0: {
                    subject: 'TLE',
                    sectionID: 8,
                    teacher: 'Erika Velasquez',
                    teacherID: 14,
                    subjectID: 8,
                    start: 8,
                    end: 12,
                },
            },
            3: {
                0: {
                    subject: 'AP',
                    sectionID: 8,
                    teacher: 'Michael Llosa',
                    teacherID: 8,
                    subjectID: 1,
                    start: 12,
                    end: 16,
                },
            },
            4: {
                0: {
                    subject: 'Math',
                    sectionID: 8,
                    teacher: 'Nino Manzanero',
                    teacherID: 19,
                    subjectID: 6,
                    start: 16,
                    end: 20,
                },
            },
            5: {
                0: {
                    subject: null,
                    sectionID: 8,
                    teacher: null,
                    teacherID: null,
                    subjectID: null,
                    start: 20,
                    end: 23,
                },
            },
            6: {
                0: {
                    subject: 'Filipino',
                    sectionID: 8,
                    teacher: 'David Linao',
                    teacherID: 3,
                    subjectID: 4,
                    start: 23,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'English',
                    sectionID: 8,
                    teacher: 'JB Moya',
                    teacherID: 2,
                    subjectID: 3,
                    start: 27,
                    end: 31,
                },
            },
            8: {
                0: {
                    subject: 'Science',
                    sectionID: 8,
                    teacher: 'Alexandria Brillo',
                    teacherID: 20,
                    subjectID: 7,
                    start: 31,
                    end: 35,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    sectionID: 8,
                    teacher: 'Romar Dela Pena',
                    teacherID: 12,
                    subjectID: 9,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'Ilang Ilang',
        },
        9: {
            0: {
                0: {
                    subject: 'English',
                    sectionID: 9,
                    teacher: 'Grace Garchitorena',
                    teacherID: 16,
                    subjectID: 3,
                    start: 0,
                    end: 4,
                },
            },
            1: {
                0: {
                    subject: 'MAPEH',
                    sectionID: 9,
                    teacher: 'Joshua Margallo',
                    teacherID: 11,
                    subjectID: 5,
                    start: 4,
                    end: 8,
                },
            },
            2: {
                0: {
                    subject: 'Filipino',
                    sectionID: 9,
                    teacher: 'Maverick Ramos',
                    teacherID: 10,
                    subjectID: 4,
                    start: 8,
                    end: 12,
                },
            },
            3: {
                0: {
                    subject: 'TLE',
                    sectionID: 9,
                    teacher: 'Wency Cruz',
                    teacherID: 7,
                    subjectID: 8,
                    start: 12,
                    end: 16,
                },
            },
            4: {
                0: {
                    subject: 'AP',
                    sectionID: 9,
                    teacher: 'Yul Canlas',
                    teacherID: 1,
                    subjectID: 1,
                    start: 16,
                    end: 20,
                },
            },
            5: {
                0: {
                    subject: 'Science',
                    sectionID: 9,
                    teacher: 'Carl Senaris',
                    teacherID: 6,
                    subjectID: 7,
                    start: 20,
                    end: 24,
                },
            },
            6: {
                0: {
                    subject: null,
                    sectionID: 9,
                    teacher: null,
                    teacherID: null,
                    subjectID: null,
                    start: 24,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'Math',
                    sectionID: 9,
                    teacher: 'Romar Dela Pena',
                    teacherID: 12,
                    subjectID: 6,
                    start: 27,
                    end: 31,
                },
            },
            8: {
                0: {
                    subject: 'EsP',
                    sectionID: 9,
                    teacher: 'Michael Llosa',
                    teacherID: 8,
                    subjectID: 2,
                    start: 31,
                    end: 35,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    sectionID: 9,
                    teacher: 'Deazelle Capistrano',
                    teacherID: 21,
                    subjectID: 9,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'Water Lily',
        },
        10: {
            0: {
                0: {
                    subject: 'Filipino',
                    sectionID: 10,
                    teacher: 'David Linao',
                    teacherID: 3,
                    subjectID: 4,
                    start: 0,
                    end: 4,
                },
            },
            1: {
                0: {
                    subject: 'EsP',
                    sectionID: 10,
                    teacher: 'Ernest Aguilar',
                    teacherID: 17,
                    subjectID: 2,
                    start: 4,
                    end: 8,
                },
            },
            2: {
                0: {
                    subject: 'English',
                    sectionID: 10,
                    teacher: 'Grace Garchitorena',
                    teacherID: 16,
                    subjectID: 3,
                    start: 8,
                    end: 12,
                },
            },
            3: {
                0: {
                    subject: 'Math',
                    sectionID: 10,
                    teacher: 'Nino Manzanero',
                    teacherID: 19,
                    subjectID: 6,
                    start: 12,
                    end: 16,
                },
            },
            4: {
                0: {
                    subject: 'Science',
                    sectionID: 10,
                    teacher: 'Alexandria Brillo',
                    teacherID: 20,
                    subjectID: 7,
                    start: 16,
                    end: 20,
                },
            },
            5: {
                0: {
                    subject: null,
                    sectionID: 10,
                    teacher: null,
                    teacherID: null,
                    subjectID: null,
                    start: 20,
                    end: 23,
                },
            },
            6: {
                0: {
                    subject: 'AP',
                    sectionID: 10,
                    teacher: 'Yul Canlas',
                    teacherID: 1,
                    subjectID: 1,
                    start: 23,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'TLE',
                    sectionID: 10,
                    teacher: 'Erika Velasquez',
                    teacherID: 14,
                    subjectID: 8,
                    start: 27,
                    end: 31,
                },
            },
            8: {
                0: {
                    subject: 'MAPEH',
                    sectionID: 10,
                    teacher: 'Paolo Santos',
                    teacherID: 18,
                    subjectID: 5,
                    start: 31,
                    end: 35,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    sectionID: 10,
                    teacher: 'David Linao',
                    teacherID: 3,
                    subjectID: 9,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'Sunflower',
        },
        11: {
            0: {
                0: {
                    subject: 'Science',
                    sectionID: 11,
                    teacher: 'Carl Senaris',
                    teacherID: 6,
                    subjectID: 7,
                    start: 42,
                    end: 46,
                },
            },
            1: {
                0: {
                    subject: 'MAPEH',
                    sectionID: 11,
                    teacher: 'Lorenzo Sypio',
                    teacherID: 4,
                    subjectID: 5,
                    start: 46,
                    end: 50,
                },
            },
            2: {
                0: {
                    subject: 'Math',
                    sectionID: 11,
                    teacher: 'Mark Tagalogon',
                    teacherID: 5,
                    subjectID: 6,
                    start: 50,
                    end: 54,
                },
            },
            3: {
                0: {
                    subject: 'TLE',
                    sectionID: 11,
                    teacher: 'Wency Cruz',
                    teacherID: 7,
                    subjectID: 8,
                    start: 54,
                    end: 58,
                },
            },
            4: {
                0: {
                    subject: 'AP',
                    sectionID: 11,
                    teacher: 'Erika Formanes',
                    teacherID: 15,
                    subjectID: 1,
                    start: 58,
                    end: 62,
                },
            },
            5: {
                0: {
                    subject: 'Filipino',
                    sectionID: 11,
                    teacher: 'David Linao',
                    teacherID: 3,
                    subjectID: 4,
                    start: 62,
                    end: 66,
                },
            },
            6: {
                0: {
                    subject: null,
                    sectionID: 11,
                    teacher: null,
                    teacherID: null,
                    subjectID: null,
                    start: 66,
                    end: 69,
                },
            },
            7: {
                0: {
                    subject: 'EsP',
                    sectionID: 11,
                    teacher: 'Erika Formanes',
                    teacherID: 15,
                    subjectID: 2,
                    start: 69,
                    end: 73,
                },
            },
            8: {
                0: {
                    subject: 'English',
                    sectionID: 11,
                    teacher: 'Sandryl Torres',
                    teacherID: 9,
                    subjectID: 3,
                    start: 73,
                    end: 77,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    sectionID: 11,
                    teacher: 'Joshua Margallo',
                    teacherID: 11,
                    subjectID: 9,
                    start: 77,
                    end: 80,
                },
            },
            containerName: 'Pula',
        },
        12: {
            0: {
                0: {
                    subject: 'English',
                    sectionID: 12,
                    teacher: 'Sandryl Torres',
                    teacherID: 9,
                    subjectID: 3,
                    start: 42,
                    end: 46,
                },
            },
            1: {
                0: {
                    subject: 'TLE',
                    sectionID: 12,
                    teacher: 'Wency Cruz',
                    teacherID: 7,
                    subjectID: 8,
                    start: 46,
                    end: 50,
                },
            },
            2: {
                0: {
                    subject: 'MAPEH',
                    sectionID: 12,
                    teacher: 'Lorenzo Sypio',
                    teacherID: 4,
                    subjectID: 5,
                    start: 50,
                    end: 54,
                },
            },
            3: {
                0: {
                    subject: 'Filipino',
                    sectionID: 12,
                    teacher: 'David Linao',
                    teacherID: 3,
                    subjectID: 4,
                    start: 54,
                    end: 58,
                },
            },
            4: {
                0: {
                    subject: 'Science',
                    sectionID: 12,
                    teacher: 'Raine Maximo',
                    teacherID: 13,
                    subjectID: 7,
                    start: 58,
                    end: 62,
                },
            },
            5: {
                0: {
                    subject: null,
                    sectionID: 12,
                    teacher: null,
                    teacherID: null,
                    subjectID: null,
                    start: 62,
                    end: 65,
                },
            },
            6: {
                0: {
                    subject: 'AP',
                    sectionID: 12,
                    teacher: 'Erika Formanes',
                    teacherID: 15,
                    subjectID: 1,
                    start: 65,
                    end: 69,
                },
            },
            7: {
                0: {
                    subject: 'EsP',
                    sectionID: 12,
                    teacher: 'Mark Tagalogon',
                    teacherID: 5,
                    subjectID: 2,
                    start: 69,
                    end: 73,
                },
            },
            8: {
                0: {
                    subject: 'Math',
                    sectionID: 12,
                    teacher: 'Mark Tagalogon',
                    teacherID: 5,
                    subjectID: 6,
                    start: 73,
                    end: 77,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    sectionID: 12,
                    teacher: 'Sandryl Torres',
                    teacherID: 9,
                    subjectID: 9,
                    start: 77,
                    end: 80,
                },
            },
            containerName: 'Asul',
        },
        13: {
            0: {
                0: {
                    subject: 'Science',
                    sectionID: 13,
                    teacher: 'Raine Maximo',
                    teacherID: 13,
                    subjectID: 7,
                    start: 42,
                    end: 46,
                },
            },
            1: {
                0: {
                    subject: 'AP',
                    sectionID: 13,
                    teacher: 'Erika Formanes',
                    teacherID: 15,
                    subjectID: 1,
                    start: 46,
                    end: 50,
                },
            },
            2: {
                0: {
                    subject: 'English',
                    sectionID: 13,
                    teacher: 'Sandryl Torres',
                    teacherID: 9,
                    subjectID: 3,
                    start: 50,
                    end: 54,
                },
            },
            3: {
                0: {
                    subject: null,
                    sectionID: 13,
                    teacher: null,
                    teacherID: null,
                    subjectID: null,
                    start: 54,
                    end: 57,
                },
            },
            4: {
                0: {
                    subject: 'Math',
                    sectionID: 13,
                    teacher: 'Mark Tagalogon',
                    teacherID: 5,
                    subjectID: 6,
                    start: 57,
                    end: 61,
                },
            },
            5: {
                0: {
                    subject: 'EsP',
                    sectionID: 13,
                    teacher: 'Carl Senaris',
                    teacherID: 6,
                    subjectID: 2,
                    start: 61,
                    end: 65,
                },
            },
            6: {
                0: {
                    subject: 'MAPEH',
                    sectionID: 13,
                    teacher: 'Lorenzo Sypio',
                    teacherID: 4,
                    subjectID: 5,
                    start: 65,
                    end: 69,
                },
            },
            7: {
                0: {
                    subject: 'TLE',
                    sectionID: 13,
                    teacher: 'Wency Cruz',
                    teacherID: 7,
                    subjectID: 8,
                    start: 69,
                    end: 73,
                },
            },
            8: {
                0: {
                    subject: 'Filipino',
                    sectionID: 13,
                    teacher: 'David Linao',
                    teacherID: 3,
                    subjectID: 4,
                    start: 73,
                    end: 77,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    sectionID: 13,
                    teacher: 'Erika Formanes',
                    teacherID: 15,
                    subjectID: 9,
                    start: 77,
                    end: 80,
                },
            },
            containerName: 'Bughaw',
        },
        14: {
            0: {
                0: {
                    subject: 'TLE',
                    sectionID: 14,
                    teacher: 'Wency Cruz',
                    teacherID: 7,
                    subjectID: 8,
                    start: 42,
                    end: 46,
                },
            },
            1: {
                0: {
                    subject: 'Math',
                    sectionID: 14,
                    teacher: 'Mark Tagalogon',
                    teacherID: 5,
                    subjectID: 6,
                    start: 46,
                    end: 50,
                },
            },
            2: {
                0: {
                    subject: 'AP',
                    sectionID: 14,
                    teacher: 'Erika Formanes',
                    teacherID: 15,
                    subjectID: 1,
                    start: 50,
                    end: 54,
                },
            },
            3: {
                0: {
                    subject: null,
                    sectionID: 14,
                    teacher: null,
                    teacherID: null,
                    subjectID: null,
                    start: 54,
                    end: 57,
                },
            },
            4: {
                0: {
                    subject: 'English',
                    sectionID: 14,
                    teacher: 'Sandryl Torres',
                    teacherID: 9,
                    subjectID: 3,
                    start: 57,
                    end: 61,
                },
            },
            5: {
                0: {
                    subject: 'Filipino',
                    sectionID: 14,
                    teacher: 'Maverick Ramos',
                    teacherID: 10,
                    subjectID: 4,
                    start: 61,
                    end: 65,
                },
            },
            6: {
                0: {
                    subject: 'EsP',
                    sectionID: 14,
                    teacher: 'Carl Senaris',
                    teacherID: 6,
                    subjectID: 2,
                    start: 65,
                    end: 69,
                },
            },
            7: {
                0: {
                    subject: 'MAPEH',
                    sectionID: 14,
                    teacher: 'Lorenzo Sypio',
                    teacherID: 4,
                    subjectID: 5,
                    start: 69,
                    end: 73,
                },
            },
            8: {
                0: {
                    subject: 'Science',
                    sectionID: 14,
                    teacher: 'Carl Senaris',
                    teacherID: 6,
                    subjectID: 7,
                    start: 73,
                    end: 77,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    sectionID: 14,
                    teacher: 'Carl Senaris',
                    teacherID: 6,
                    subjectID: 9,
                    start: 77,
                    end: 80,
                },
            },
            containerName: 'Dilaw',
        },
        15: {
            0: {
                0: {
                    subject: 'Math',
                    sectionID: 15,
                    teacher: 'Mark Tagalogon',
                    teacherID: 5,
                    subjectID: 6,
                    start: 42,
                    end: 46,
                },
            },
            1: {
                0: {
                    subject: 'Science',
                    sectionID: 15,
                    teacher: 'Raine Maximo',
                    teacherID: 13,
                    subjectID: 7,
                    start: 46,
                    end: 50,
                },
            },
            2: {
                0: {
                    subject: 'Filipino',
                    sectionID: 15,
                    teacher: 'Maverick Ramos',
                    teacherID: 10,
                    subjectID: 4,
                    start: 50,
                    end: 54,
                },
            },
            3: {
                0: {
                    subject: 'AP',
                    sectionID: 15,
                    teacher: 'Erika Formanes',
                    teacherID: 15,
                    subjectID: 1,
                    start: 54,
                    end: 58,
                },
            },
            4: {
                0: {
                    subject: 'TLE',
                    sectionID: 15,
                    teacher: 'Wency Cruz',
                    teacherID: 7,
                    subjectID: 8,
                    start: 58,
                    end: 62,
                },
            },
            5: {
                0: {
                    subject: null,
                    sectionID: 15,
                    teacher: null,
                    teacherID: null,
                    subjectID: null,
                    start: 62,
                    end: 65,
                },
            },
            6: {
                0: {
                    subject: 'EsP',
                    sectionID: 15,
                    teacher: 'Mark Tagalogon',
                    teacherID: 5,
                    subjectID: 2,
                    start: 65,
                    end: 69,
                },
            },
            7: {
                0: {
                    subject: 'English',
                    sectionID: 15,
                    teacher: 'Sandryl Torres',
                    teacherID: 9,
                    subjectID: 3,
                    start: 69,
                    end: 73,
                },
            },
            8: {
                0: {
                    subject: 'MAPEH',
                    sectionID: 15,
                    teacher: 'Lorenzo Sypio',
                    teacherID: 4,
                    subjectID: 5,
                    start: 73,
                    end: 77,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    sectionID: 15,
                    teacher: 'Maverick Ramos',
                    teacherID: 10,
                    subjectID: 9,
                    start: 77,
                    end: 80,
                },
            },
            containerName: 'Itim',
        },
    };

    const teacherStringObj = {
        1: {
            1: {
                0: {
                    subject: 'AP',
                    subjectID: 1,
                    teacherID: 1,
                    section: 'Masinop',
                    sectionID: 4,
                    start: 4,
                    end: 8,
                },
            },
            2: {
                0: {
                    subject: 'EsP',
                    subjectID: 2,
                    teacherID: 1,
                    section: 'Magalang',
                    sectionID: 1,
                    start: 8,
                    end: 12,
                },
            },
            3: {
                0: {
                    subject: 'AP',
                    subjectID: 1,
                    teacherID: 1,
                    section: 'Sampaguita',
                    sectionID: 6,
                    start: 12,
                    end: 16,
                },
            },
            4: {
                0: {
                    subject: 'AP',
                    subjectID: 1,
                    teacherID: 1,
                    section: 'Water Lily',
                    sectionID: 9,
                    start: 16,
                    end: 20,
                },
            },
            6: {
                0: {
                    subject: 'AP',
                    subjectID: 1,
                    teacherID: 1,
                    section: 'Sunflower',
                    sectionID: 10,
                    start: 23,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'AP',
                    subjectID: 1,
                    teacherID: 1,
                    section: 'Magalang',
                    sectionID: 1,
                    start: 27,
                    end: 31,
                },
            },
            8: {
                0: {
                    subject: 'AP',
                    subjectID: 1,
                    teacherID: 1,
                    section: 'Masipag',
                    sectionID: 3,
                    start: 31,
                    end: 35,
                },
            },
            containerName: 'Yul Canlas',
        },
        2: {
            0: {
                0: {
                    subject: 'English',
                    subjectID: 3,
                    teacherID: 2,
                    section: 'Mabait',
                    sectionID: 2,
                    start: 0,
                    end: 4,
                },
            },
            2: {
                0: {
                    subject: 'English',
                    subjectID: 3,
                    teacherID: 2,
                    section: 'Masinop',
                    sectionID: 4,
                    start: 8,
                    end: 12,
                },
            },
            6: {
                0: {
                    subject: 'English',
                    subjectID: 3,
                    teacherID: 2,
                    section: 'Rosas',
                    sectionID: 7,
                    start: 23,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'English',
                    subjectID: 3,
                    teacherID: 2,
                    section: 'Ilang Ilang',
                    sectionID: 8,
                    start: 27,
                    end: 31,
                },
            },
            containerName: 'JB Moya',
        },
        3: {
            0: {
                0: {
                    subject: 'Filipino',
                    subjectID: 4,
                    teacherID: 3,
                    section: 'Sunflower',
                    sectionID: 10,
                    start: 0,
                    end: 4,
                },
            },
            3: {
                0: {
                    subject: 'Filipino',
                    subjectID: 4,
                    teacherID: 3,
                    section: 'Asul',
                    sectionID: 12,
                    start: 54,
                    end: 58,
                },
            },
            5: {
                0: {
                    subject: 'Filipino',
                    subjectID: 4,
                    teacherID: 3,
                    section: 'Matiwasay',
                    sectionID: 5,
                    start: 19,
                    end: 23,
                },
            },
            6: {
                0: {
                    subject: 'Filipino',
                    subjectID: 4,
                    teacherID: 3,
                    section: 'Ilang Ilang',
                    sectionID: 8,
                    start: 23,
                    end: 27,
                },
            },
            8: {
                0: {
                    subject: 'Filipino',
                    subjectID: 4,
                    teacherID: 3,
                    section: 'Sampaguita',
                    sectionID: 6,
                    start: 31,
                    end: 35,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    subjectID: 9,
                    teacherID: 3,
                    section: 'Sunflower',
                    sectionID: 10,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'David Linao',
        },
        4: {
            0: {
                1: {
                    subject: 'MAPEH',
                    subjectID: 5,
                    teacherID: 4,
                    section: 'Magalang',
                    sectionID: 1,
                    start: 0,
                    end: 4,
                },
            },
            1: {
                0: {
                    subject: 'MAPEH',
                    subjectID: 5,
                    teacherID: 4,
                    section: 'Pula',
                    sectionID: 11,
                    start: 46,
                    end: 50,
                },
            },
            2: {
                0: {
                    subject: 'MAPEH',
                    subjectID: 5,
                    teacherID: 4,
                    section: 'Asul',
                    sectionID: 12,
                    start: 50,
                    end: 54,
                },
            },
            6: {
                0: {
                    subject: 'MAPEH',
                    subjectID: 5,
                    teacherID: 4,
                    section: 'Bughaw',
                    sectionID: 13,
                    start: 65,
                    end: 69,
                },
                1: {
                    subject: 'MAPEH',
                    subjectID: 5,
                    teacherID: 4,
                    section: 'Magalang',
                    sectionID: 1,
                    start: 23,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'MAPEH',
                    subjectID: 5,
                    teacherID: 4,
                    section: 'Dilaw',
                    sectionID: 14,
                    start: 69,
                    end: 73,
                },
            },
            8: {
                0: {
                    subject: 'MAPEH',
                    subjectID: 5,
                    teacherID: 4,
                    section: 'Itim',
                    sectionID: 15,
                    start: 73,
                    end: 77,
                },
            },
            containerName: 'Lorenzo Sypio',
        },
        5: {
            0: {
                0: {
                    subject: 'Math',
                    subjectID: 6,
                    teacherID: 5,
                    section: 'Itim',
                    sectionID: 15,
                    start: 42,
                    end: 46,
                },
            },
            1: {
                0: {
                    subject: 'Math',
                    subjectID: 6,
                    teacherID: 5,
                    section: 'Dilaw',
                    sectionID: 14,
                    start: 46,
                    end: 50,
                },
            },
            2: {
                0: {
                    subject: 'Math',
                    subjectID: 6,
                    teacherID: 5,
                    section: 'Pula',
                    sectionID: 11,
                    start: 50,
                    end: 54,
                },
            },
            4: {
                0: {
                    subject: 'Math',
                    subjectID: 6,
                    teacherID: 5,
                    section: 'Bughaw',
                    sectionID: 13,
                    start: 57,
                    end: 61,
                },
            },
            6: {
                0: {
                    subject: 'EsP',
                    subjectID: 2,
                    teacherID: 5,
                    section: 'Itim',
                    sectionID: 15,
                    start: 65,
                    end: 69,
                },
            },
            7: {
                0: {
                    subject: 'EsP',
                    subjectID: 2,
                    teacherID: 5,
                    section: 'Asul',
                    sectionID: 12,
                    start: 69,
                    end: 73,
                },
            },
            8: {
                0: {
                    subject: 'Math',
                    subjectID: 6,
                    teacherID: 5,
                    section: 'Asul',
                    sectionID: 12,
                    start: 73,
                    end: 77,
                },
            },
            containerName: 'Mark Tagalogon',
        },
        6: {
            0: {
                0: {
                    subject: 'Science',
                    subjectID: 7,
                    teacherID: 6,
                    section: 'Pula',
                    sectionID: 11,
                    start: 42,
                    end: 46,
                },
            },
            1: {
                0: {
                    subject: 'Science',
                    subjectID: 7,
                    teacherID: 6,
                    section: 'Sampaguita',
                    sectionID: 6,
                    start: 4,
                    end: 8,
                },
            },
            2: {
                0: {
                    subject: 'EsP',
                    subjectID: 2,
                    teacherID: 6,
                    section: 'Rosas',
                    sectionID: 7,
                    start: 8,
                    end: 12,
                },
            },
            4: {
                0: {
                    subject: 'Science',
                    subjectID: 7,
                    teacherID: 6,
                    section: 'Matiwasay',
                    sectionID: 5,
                    start: 15,
                    end: 19,
                },
            },
            5: {
                0: {
                    subject: 'Science',
                    subjectID: 7,
                    teacherID: 6,
                    section: 'Water Lily',
                    sectionID: 9,
                    start: 20,
                    end: 24,
                },
            },
            6: {
                0: {
                    subject: 'EsP',
                    subjectID: 2,
                    teacherID: 6,
                    section: 'Dilaw',
                    sectionID: 14,
                    start: 65,
                    end: 69,
                },
            },
            8: {
                0: {
                    subject: 'Science',
                    subjectID: 7,
                    teacherID: 6,
                    section: 'Dilaw',
                    sectionID: 14,
                    start: 73,
                    end: 77,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    subjectID: 9,
                    teacherID: 6,
                    section: 'Dilaw',
                    sectionID: 14,
                    start: 77,
                    end: 80,
                },
            },
            containerName: 'Carl Senaris',
        },
        7: {
            0: {
                0: {
                    subject: 'TLE',
                    subjectID: 8,
                    teacherID: 7,
                    section: 'Dilaw',
                    sectionID: 14,
                    start: 42,
                    end: 46,
                },
            },
            1: {
                0: {
                    subject: 'TLE',
                    subjectID: 8,
                    teacherID: 7,
                    section: 'Rosas',
                    sectionID: 7,
                    start: 4,
                    end: 8,
                },
            },
            3: {
                0: {
                    subject: 'TLE',
                    subjectID: 8,
                    teacherID: 7,
                    section: 'Water Lily',
                    sectionID: 9,
                    start: 12,
                    end: 16,
                },
            },
            4: {
                0: {
                    subject: 'TLE',
                    subjectID: 8,
                    teacherID: 7,
                    section: 'Itim',
                    sectionID: 15,
                    start: 58,
                    end: 62,
                },
            },
            7: {
                0: {
                    subject: 'TLE',
                    subjectID: 8,
                    teacherID: 7,
                    section: 'Sampaguita',
                    sectionID: 6,
                    start: 27,
                    end: 31,
                },
            },
            containerName: 'Wency Cruz',
        },
        8: {
            0: {
                0: {
                    subject: 'AP',
                    subjectID: 1,
                    teacherID: 8,
                    section: 'Matiwasay',
                    sectionID: 5,
                    start: 0,
                    end: 4,
                },
            },
            1: {
                0: {
                    subject: 'EsP',
                    subjectID: 2,
                    teacherID: 8,
                    section: 'Mabait',
                    sectionID: 2,
                    start: 4,
                    end: 8,
                },
            },
            3: {
                0: {
                    subject: 'AP',
                    subjectID: 1,
                    teacherID: 8,
                    section: 'Ilang Ilang',
                    sectionID: 8,
                    start: 12,
                    end: 16,
                },
            },
            6: {
                0: {
                    subject: 'AP',
                    subjectID: 1,
                    teacherID: 8,
                    section: 'Mabait',
                    sectionID: 2,
                    start: 23,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'AP',
                    subjectID: 1,
                    teacherID: 8,
                    section: 'Rosas',
                    sectionID: 7,
                    start: 27,
                    end: 31,
                },
            },
            8: {
                0: {
                    subject: 'EsP',
                    subjectID: 2,
                    teacherID: 8,
                    section: 'Water Lily',
                    sectionID: 9,
                    start: 31,
                    end: 35,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    subjectID: 9,
                    teacherID: 8,
                    section: 'Sampaguita',
                    sectionID: 6,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'Michael Llosa',
        },
        9: {
            0: {
                0: {
                    subject: 'English',
                    subjectID: 3,
                    teacherID: 9,
                    section: 'Asul',
                    sectionID: 12,
                    start: 42,
                    end: 46,
                },
            },
            2: {
                0: {
                    subject: 'English',
                    subjectID: 3,
                    teacherID: 9,
                    section: 'Bughaw',
                    sectionID: 13,
                    start: 50,
                    end: 54,
                },
            },
            4: {
                0: {
                    subject: 'English',
                    subjectID: 3,
                    teacherID: 9,
                    section: 'Dilaw',
                    sectionID: 14,
                    start: 57,
                    end: 61,
                },
            },
            7: {
                0: {
                    subject: 'English',
                    subjectID: 3,
                    teacherID: 9,
                    section: 'Itim',
                    sectionID: 15,
                    start: 69,
                    end: 73,
                },
            },
            8: {
                0: {
                    subject: 'English',
                    subjectID: 3,
                    teacherID: 9,
                    section: 'Pula',
                    sectionID: 11,
                    start: 73,
                    end: 77,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    subjectID: 9,
                    teacherID: 9,
                    section: 'Asul',
                    sectionID: 12,
                    start: 77,
                    end: 80,
                },
            },
            containerName: 'Sandryl Torres',
        },
        10: {
            2: {
                0: {
                    subject: 'Filipino',
                    subjectID: 4,
                    teacherID: 10,
                    section: 'Water Lily',
                    sectionID: 9,
                    start: 8,
                    end: 12,
                },
            },
            5: {
                0: {
                    subject: 'Filipino',
                    subjectID: 4,
                    teacherID: 10,
                    section: 'Mabait',
                    sectionID: 2,
                    start: 19,
                    end: 23,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    subjectID: 9,
                    teacherID: 10,
                    section: 'Itim',
                    sectionID: 15,
                    start: 77,
                    end: 80,
                },
            },
            containerName: 'Maverick Ramos',
        },
        11: {
            1: {
                0: {
                    subject: 'MAPEH',
                    subjectID: 5,
                    teacherID: 11,
                    section: 'Water Lily',
                    sectionID: 9,
                    start: 4,
                    end: 8,
                },
            },
            5: {
                0: {
                    subject: 'MAPEH',
                    subjectID: 5,
                    teacherID: 11,
                    section: 'Sampaguita',
                    sectionID: 6,
                    start: 19,
                    end: 23,
                },
            },
            6: {
                0: {
                    subject: 'MAPEH',
                    subjectID: 5,
                    teacherID: 11,
                    section: 'Masinop',
                    sectionID: 4,
                    start: 23,
                    end: 27,
                },
            },
            8: {
                0: {
                    subject: 'MAPEH',
                    subjectID: 5,
                    teacherID: 11,
                    section: 'Mabait',
                    sectionID: 2,
                    start: 31,
                    end: 35,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    subjectID: 9,
                    teacherID: 11,
                    section: 'Pula',
                    sectionID: 11,
                    start: 77,
                    end: 80,
                },
            },
            containerName: 'Joshua Margallo',
        },
        12: {
            0: {
                0: {
                    subject: 'Math',
                    subjectID: 6,
                    teacherID: 12,
                    section: 'Sampaguita',
                    sectionID: 6,
                    start: 0,
                    end: 4,
                },
            },
            2: {
                0: {
                    subject: 'Math',
                    subjectID: 6,
                    teacherID: 12,
                    section: 'Mabait',
                    sectionID: 2,
                    start: 8,
                    end: 12,
                },
            },
            5: {
                0: {
                    subject: 'Math',
                    subjectID: 6,
                    teacherID: 12,
                    section: 'Rosas',
                    sectionID: 7,
                    start: 19,
                    end: 23,
                },
            },
            6: {
                3: {
                    subject: 'Math',
                    subjectID: 6,
                    teacherID: 12,
                    section: 'Magalang',
                    sectionID: 1,
                    start: 23,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'Math',
                    subjectID: 6,
                    teacherID: 12,
                    section: 'Water Lily',
                    sectionID: 9,
                    start: 27,
                    end: 31,
                },
            },
            8: {
                0: {
                    subject: 'EsP',
                    subjectID: 2,
                    teacherID: 12,
                    section: 'Matiwasay',
                    sectionID: 5,
                    start: 31,
                    end: 35,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    subjectID: 9,
                    teacherID: 12,
                    section: 'Ilang Ilang',
                    sectionID: 8,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'Romar Dela Pena',
        },
        13: {
            0: {
                0: {
                    subject: 'Science',
                    subjectID: 7,
                    teacherID: 13,
                    section: 'Bughaw',
                    sectionID: 13,
                    start: 42,
                    end: 46,
                },
            },
            1: {
                0: {
                    subject: 'Science',
                    subjectID: 7,
                    teacherID: 13,
                    section: 'Itim',
                    sectionID: 15,
                    start: 46,
                    end: 50,
                },
            },
            3: {
                0: {
                    subject: 'Science',
                    subjectID: 7,
                    teacherID: 13,
                    section: 'Masinop',
                    sectionID: 4,
                    start: 12,
                    end: 16,
                },
            },
            4: {
                0: {
                    subject: 'Science',
                    subjectID: 7,
                    teacherID: 13,
                    section: 'Asul',
                    sectionID: 12,
                    start: 58,
                    end: 62,
                },
            },
            7: {
                0: {
                    subject: 'Science',
                    subjectID: 7,
                    teacherID: 13,
                    section: 'Mabait',
                    sectionID: 2,
                    start: 27,
                    end: 31,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    subjectID: 9,
                    teacherID: 13,
                    section: 'Mabait',
                    sectionID: 2,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'Raine Maximo',
        },
        14: {
            0: {
                0: {
                    subject: 'EsP',
                    subjectID: 2,
                    teacherID: 14,
                    section: 'Ilang Ilang',
                    sectionID: 8,
                    start: 0,
                    end: 4,
                },
            },
            2: {
                0: {
                    subject: 'TLE',
                    subjectID: 8,
                    teacherID: 14,
                    section: 'Ilang Ilang',
                    sectionID: 8,
                    start: 8,
                    end: 12,
                },
            },
            3: {
                0: {
                    subject: 'TLE',
                    subjectID: 8,
                    teacherID: 14,
                    section: 'Magalang',
                    sectionID: 1,
                    start: 12,
                    end: 16,
                },
            },
            7: {
                0: {
                    subject: 'TLE',
                    subjectID: 8,
                    teacherID: 14,
                    section: 'Sunflower',
                    sectionID: 10,
                    start: 27,
                    end: 31,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    subjectID: 9,
                    teacherID: 14,
                    section: 'Matiwasay',
                    sectionID: 5,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'Erika Velasquez',
        },
        15: {
            1: {
                0: {
                    subject: 'AP',
                    subjectID: 1,
                    teacherID: 15,
                    section: 'Bughaw',
                    sectionID: 13,
                    start: 46,
                    end: 50,
                },
            },
            2: {
                0: {
                    subject: 'AP',
                    subjectID: 1,
                    teacherID: 15,
                    section: 'Dilaw',
                    sectionID: 14,
                    start: 50,
                    end: 54,
                },
            },
            3: {
                0: {
                    subject: 'AP',
                    subjectID: 1,
                    teacherID: 15,
                    section: 'Itim',
                    sectionID: 15,
                    start: 54,
                    end: 58,
                },
            },
            4: {
                0: {
                    subject: 'AP',
                    subjectID: 1,
                    teacherID: 15,
                    section: 'Pula',
                    sectionID: 11,
                    start: 58,
                    end: 62,
                },
            },
            6: {
                0: {
                    subject: 'AP',
                    subjectID: 1,
                    teacherID: 15,
                    section: 'Asul',
                    sectionID: 12,
                    start: 65,
                    end: 69,
                },
            },
            7: {
                0: {
                    subject: 'EsP',
                    subjectID: 2,
                    teacherID: 15,
                    section: 'Pula',
                    sectionID: 11,
                    start: 69,
                    end: 73,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    subjectID: 9,
                    teacherID: 15,
                    section: 'Bughaw',
                    sectionID: 13,
                    start: 77,
                    end: 80,
                },
            },
            containerName: 'Erika Formanes',
        },
        16: {
            0: {
                0: {
                    subject: 'English',
                    subjectID: 3,
                    teacherID: 16,
                    section: 'Water Lily',
                    sectionID: 9,
                    start: 0,
                    end: 4,
                },
            },
            1: {
                0: {
                    subject: 'English',
                    subjectID: 3,
                    teacherID: 16,
                    section: 'Matiwasay',
                    sectionID: 5,
                    start: 4,
                    end: 8,
                },
            },
            2: {
                0: {
                    subject: 'English',
                    subjectID: 3,
                    teacherID: 16,
                    section: 'Sunflower',
                    sectionID: 10,
                    start: 8,
                    end: 12,
                },
            },
            3: {
                0: {
                    subject: 'English',
                    subjectID: 3,
                    teacherID: 16,
                    section: 'Masipag',
                    sectionID: 3,
                    start: 12,
                    end: 16,
                },
            },
            4: {
                0: {
                    subject: 'English',
                    subjectID: 3,
                    teacherID: 16,
                    section: 'Magalang',
                    sectionID: 1,
                    start: 16,
                    end: 20,
                },
            },
            6: {
                0: {
                    subject: 'English',
                    subjectID: 3,
                    teacherID: 16,
                    section: 'Sampaguita',
                    sectionID: 6,
                    start: 23,
                    end: 27,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    subjectID: 9,
                    teacherID: 16,
                    section: 'Masinop',
                    sectionID: 4,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'Grace Garchitorena',
        },
        17: {
            0: {
                4: {
                    subject: 'Filipino',
                    subjectID: 4,
                    teacherID: 17,
                    section: 'Magalang',
                    sectionID: 1,
                    start: 0,
                    end: 4,
                },
                5: {
                    subject: 'Filipino',
                    subjectID: 4,
                    teacherID: 17,
                    section: 'Magalang',
                    sectionID: 1,
                    start: 0,
                    end: 4,
                },
            },
            1: {
                0: {
                    subject: 'EsP',
                    subjectID: 2,
                    teacherID: 17,
                    section: 'Sunflower',
                    sectionID: 10,
                    start: 4,
                    end: 8,
                },
            },
            2: {
                0: {
                    subject: 'Filipino',
                    subjectID: 4,
                    teacherID: 17,
                    section: 'Masipag',
                    sectionID: 3,
                    start: 8,
                    end: 12,
                },
            },
            4: {
                0: {
                    subject: 'Filipino',
                    subjectID: 4,
                    teacherID: 17,
                    section: 'Masinop',
                    sectionID: 4,
                    start: 16,
                    end: 20,
                },
            },
            6: {
                5: {
                    subject: 'Filipino',
                    subjectID: 4,
                    teacherID: 17,
                    section: 'Magalang',
                    sectionID: 1,
                    start: 23,
                    end: 27,
                },
            },
            8: {
                0: {
                    subject: 'Filipino',
                    subjectID: 4,
                    teacherID: 17,
                    section: 'Rosas',
                    sectionID: 7,
                    start: 31,
                    end: 35,
                },
            },
            containerName: 'Ernest Aguilar',
        },
        18: {
            0: {
                3: {
                    subject: 'MAPEH',
                    subjectID: 5,
                    teacherID: 18,
                    section: 'Magalang',
                    sectionID: 1,
                    start: 0,
                    end: 4,
                },
            },
            1: {
                0: {
                    subject: 'MAPEH',
                    subjectID: 5,
                    teacherID: 18,
                    section: 'Ilang Ilang',
                    sectionID: 8,
                    start: 4,
                    end: 8,
                },
            },
            2: {
                0: {
                    subject: 'MAPEH',
                    subjectID: 5,
                    teacherID: 18,
                    section: 'Matiwasay',
                    sectionID: 5,
                    start: 8,
                    end: 12,
                },
            },
            3: {
                0: {
                    subject: 'MAPEH',
                    subjectID: 5,
                    teacherID: 18,
                    section: 'Rosas',
                    sectionID: 7,
                    start: 12,
                    end: 16,
                },
            },
            5: {
                0: {
                    subject: 'MAPEH',
                    subjectID: 5,
                    teacherID: 18,
                    section: 'Masipag',
                    sectionID: 3,
                    start: 19,
                    end: 23,
                },
            },
            8: {
                0: {
                    subject: 'MAPEH',
                    subjectID: 5,
                    teacherID: 18,
                    section: 'Sunflower',
                    sectionID: 10,
                    start: 31,
                    end: 35,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    subjectID: 9,
                    teacherID: 18,
                    section: 'Rosas',
                    sectionID: 7,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'Paolo Santos',
        },
        19: {
            0: {
                0: {
                    subject: 'Math',
                    subjectID: 6,
                    teacherID: 19,
                    section: 'Masipag',
                    sectionID: 3,
                    start: 0,
                    end: 4,
                },
            },
            3: {
                0: {
                    subject: 'Math',
                    subjectID: 6,
                    teacherID: 19,
                    section: 'Sunflower',
                    sectionID: 10,
                    start: 12,
                    end: 16,
                },
            },
            4: {
                0: {
                    subject: 'Math',
                    subjectID: 6,
                    teacherID: 19,
                    section: 'Ilang Ilang',
                    sectionID: 8,
                    start: 16,
                    end: 20,
                },
            },
            6: {
                2: {
                    subject: 'Math',
                    subjectID: 6,
                    teacherID: 19,
                    section: 'Magalang',
                    sectionID: 1,
                    start: 23,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'Math',
                    subjectID: 6,
                    teacherID: 19,
                    section: 'Matiwasay',
                    sectionID: 5,
                    start: 27,
                    end: 31,
                },
            },
            8: {
                0: {
                    subject: 'Math',
                    subjectID: 6,
                    teacherID: 19,
                    section: 'Masinop',
                    sectionID: 4,
                    start: 31,
                    end: 35,
                },
            },
            containerName: 'Nino Manzanero',
        },
        20: {
            0: {
                0: {
                    subject: 'Science',
                    subjectID: 7,
                    teacherID: 20,
                    section: 'Rosas',
                    sectionID: 7,
                    start: 0,
                    end: 4,
                },
            },
            1: {
                0: {
                    subject: 'Science',
                    subjectID: 7,
                    teacherID: 20,
                    section: 'Magalang',
                    sectionID: 1,
                    start: 4,
                    end: 8,
                },
            },
            4: {
                0: {
                    subject: 'Science',
                    subjectID: 7,
                    teacherID: 20,
                    section: 'Sunflower',
                    sectionID: 10,
                    start: 16,
                    end: 20,
                },
            },
            6: {
                0: {
                    subject: 'Science',
                    subjectID: 7,
                    teacherID: 20,
                    section: 'Masipag',
                    sectionID: 3,
                    start: 23,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'EsP',
                    subjectID: 2,
                    teacherID: 20,
                    section: 'Masipag',
                    sectionID: 3,
                    start: 27,
                    end: 31,
                },
            },
            8: {
                0: {
                    subject: 'Science',
                    subjectID: 7,
                    teacherID: 20,
                    section: 'Ilang Ilang',
                    sectionID: 8,
                    start: 31,
                    end: 35,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    subjectID: 9,
                    teacherID: 20,
                    section: 'Masipag',
                    sectionID: 3,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'Alexandria Brillo',
        },
        21: {
            0: {
                0: {
                    subject: 'EsP',
                    subjectID: 2,
                    teacherID: 21,
                    section: 'Masinop',
                    sectionID: 4,
                    start: 0,
                    end: 4,
                },
            },
            1: {
                0: {
                    subject: 'TLE',
                    subjectID: 8,
                    teacherID: 21,
                    section: 'Masipag',
                    sectionID: 3,
                    start: 4,
                    end: 8,
                },
            },
            2: {
                0: {
                    subject: 'EsP',
                    subjectID: 2,
                    teacherID: 21,
                    section: 'Sampaguita',
                    sectionID: 6,
                    start: 8,
                    end: 12,
                },
            },
            4: {
                0: {
                    subject: 'TLE',
                    subjectID: 8,
                    teacherID: 21,
                    section: 'Mabait',
                    sectionID: 2,
                    start: 15,
                    end: 19,
                },
            },
            6: {
                0: {
                    subject: 'TLE',
                    subjectID: 8,
                    teacherID: 21,
                    section: 'Matiwasay',
                    sectionID: 5,
                    start: 23,
                    end: 27,
                },
            },
            7: {
                0: {
                    subject: 'TLE',
                    subjectID: 8,
                    teacherID: 21,
                    section: 'Masinop',
                    sectionID: 4,
                    start: 27,
                    end: 31,
                },
            },
            8: {
                0: {
                    subject: 'NMP',
                    subjectID: 9,
                    teacherID: 21,
                    section: 'Magalang',
                    sectionID: 1,
                    start: 31,
                    end: 34,
                },
            },
            9: {
                0: {
                    subject: 'NMP',
                    subjectID: 9,
                    teacherID: 21,
                    section: 'Water Lily',
                    sectionID: 9,
                    start: 35,
                    end: 38,
                },
            },
            containerName: 'Deazelle Capistrano',
        },
    };

    const teacher = {
        1: {
            0: {
                0: {
                    start: 10,
                    end: 14,
                    sectionID: 1,
                    subject: 'Math1',
                    subjectID: 1,
                    section: 'Section 1',
                    teacherID: 1,
                },
            },
            containerName: 'Teacher 1',
        },
        2: {
            0: {
                2: {
                    start: 30,
                    end: 36,
                    sectionID: 1,
                    subject: 'English2',
                    subjectID: 2,
                    section: 'Section 1',
                    teacherID: 2,
                },
            },
            1: {
                1: {
                    start: 4,
                    end: 8,
                    sectionID: 2,
                    subject: 'PE3',
                    subjectID: 3,
                    section: 'Section 2',
                    teacherID: 3,
                },
                2: {
                    start: 4,
                    end: 8,
                    sectionID: 2,
                    subject: 'PE3',
                    subjectID: 3,
                    section: 'Section 2',
                    teacherID: 3,
                },
            },
            containerName: 'Teacher 2',
        },
        3: {
            0: {
                0: {
                    start: 20,
                    end: 24,
                    sectionID: 1,
                    subject: 'PE3',
                    subjectID: 3,
                    section: 'Section 3',
                    teacherID: 3,
                },
            },
            1: {
                0: {
                    start: 0,
                    end: 4,
                    sectionID: 2,
                    subject: 'English2',
                    subjectID: 2,
                    section: 'Section 2',
                    teacherID: 2,
                },
            },
            containerName: 'Teacher 3',
        },
    };

    function combineObjects(inputObj, teacher) {
        const combined = { ...inputObj }; // Start with inputObj

        // Find the largest numeric key in inputObj to continue numbering
        const maxKey = Math.max(...Object.keys(inputObj).map(Number));

        // Start appending `teacher` with new numeric keys
        let currentKey = maxKey + 1;

        for (const key in teacher) {
            combined[currentKey] = teacher[key];
            currentKey++;
        }

        return combined;
    }
    function combineMaps(map1, map2) {
        const combinedMap = new Map(map1); // Start with entries from map1

        for (const [key, value] of map2?.entries()) {
            combinedMap.set(key, value); // Use original keys from map2
        }

        return combinedMap;
    }

    // function combineMaps(map1, map2) {
    //     const combinedMap = new Map();
    //     let currentKey = 1;

    //     // Add entries from map1 starting with key 1
    //     for (const [, value] of map1.entries()) {
    //         combinedMap.set(currentKey, value);
    //         currentKey++;
    //     }

    //     // Add entries from map2 continuing the sequence
    //     for (const [, value] of map2?.entries()) {
    //         combinedMap.set(currentKey, value);
    //         currentKey++;
    //     }

    //     console.log('final: ', combinedMap);
    //     return combinedMap;
    // }

    function objectToMap(obj) {
        if (typeof obj !== 'object' || obj === null) return obj; // If not an object, return as is
        if (Array.isArray(obj)) return obj.map(objectToMap); // Handle arrays recursively

        const map = new Map();
        for (const [key, value] of Object.entries(obj)) {
            map.set(isNaN(key) ? key : +key, objectToMap(value)); // Convert keys to numbers if possible
        }
        return map;
    }

    useEffect(() => {
        handleNumOfSchoolDaysChange();
    }, [numOfSchoolDays]);

    useEffect(() => {
        handleBreakTimeDurationChange();
    }, [breakTimeDuration]);

    // ========================================================================

    useEffect(() => {
        if (sectionStatus === 'idle') {
            dispatch(fetchSections());
        }
    }, [sectionStatus, dispatch]);

    useEffect(() => {
        if (programStatus === 'idle') {
            dispatch(fetchPrograms());
        }
    }, [programStatus, dispatch]);

    useEffect(() => {
        if (subjectStatus === 'idle') {
            dispatch(fetchSubjects());
        }
    }, [subjectStatus, dispatch]);

    useEffect(() => {
        if (buildingStatus === 'idle') {
            dispatch(fetchBuildings());
        }
    }, [buildingStatus, dispatch]);

    // useEffect(() => {
    //     const teacherMap = objectToMap(teacherMapStatic);
    //     const sectionMap = objectToMap(sectionMapStatic);
    //     const sectionObj = convertToHashMap(sectionStringObj);
    //     // const teacherObj = convertToHashMap(teacherStringObj);

    //     console.log('sectionObj: ', sectionObj);

    //     console.log('teacherMap: ', teacherMap);
    //     console.log('sectionMap:', sectionMap);

    //     // const combinedMap = combineMaps(teacherMap, sectionMap);
    //     const combinedMap = combineObjects(sectionStringObj, teacherStringObj);
    //     const map = convertToHashMap(combinedMap);
    //     console.log('combined: ', combinedMap);
    //     console.log('map: ', map);

    //     setMapVal(map);
    // }, []);

    // useEffect(() => {
    //     console.log('changed: ', mapVal);
    //     console.log('Condition:', mapVal && mapVal.size > 0);
    // }, [mapVal]);
    console.log('retrigger index');
    return (
        <div className='App container mx-auto px-4 py-6'>
            <NotificationHandler timetableCondition={timetableGenerationStatus} />
            <div className='mb-6 flex justify-between items-center'>
                <Breadcrumbs title='Timetable' links={links} />
                <div className='flex items-center gap-2'>
                    <ExportImportDBButtons
                        onClear={handleClearAndRefresh}
                        numOfSchoolDays={numOfSchoolDays}
                        breakTimeDuration={breakTimeDuration}
                    />
                    <button
                        className={clsx('btn btn-primary', {
                            'cursor-not-allowed': timetableGenerationStatus === 'running',
                            'btn-error': timetableGenerationStatus === 'error',
                        })}
                        onClick={() => {
                            // if (validate()) {
                            handleButtonClick();
                            // }
                        }}
                        disabled={timetableGenerationStatus === 'running'}
                    >
                        {timetableGenerationStatus === 'running' ? (
                            <div className='flex gap-2 items-center'>
                                <span>Generating</span>
                                <span className='loading loading-spinner loading-xs'></span>
                            </div>
                        ) : (
                            'Generate Timetable'
                        )}
                    </button>
                </div>
            </div>

            <div className='mb-6'>
                <Configuration
                    numOfSchoolDays={numOfSchoolDays}
                    setNumOfSchoolDays={setNumOfSchoolDays}
                    breakTimeDuration={breakTimeDuration}
                    setBreakTimeDuration={setBreakTimeDuration}
                />
            </div>

            {/* Responsive card layout for Subject and Teacher Lists */}
            {/* <div className="flex flex-col lg:flex-row gap-6">
    <div className="w-full lg:w-4/12 bg-base-100 p-6 rounded-lg shadow-lg">
      <h2 className="text-lg font-semibold mb-4">Subjects</h2>
      <SubjectListContainer />
      </div>
      <div className="w-full lg:w-8/12 bg-base-100 p-6 rounded-lg shadow-lg">
      <h2 className="text-lg font-semibold mb-4">Teachers</h2>
      <TeacherListContainer />
    </div>
  </div> */}
            <div>
                <div className='mt-6 bg-base-100 p-6 rounded-lg shadow-lg'>
                    <h2 className='text-lg font-semibold mb-4'>Subjects</h2>
                    <SubjectListContainer numOfSchoolDays={numOfSchoolDays} breakTimeDuration={breakTimeDuration} />
                </div>

                <div className='mt-6 bg-base-100 p-6 rounded-lg shadow-lg'>
                    <h2 className='text-lg font-semibold mb-4'>Teachers</h2>
                    <TeacherListContainer />
                </div>

                {/* Program Lists */}
                <div className='mt-6 bg-base-100 p-6 rounded-lg shadow-lg'>
                    <h2 className='text-lg font-semibold mb-4'>Programs</h2>
                    <ProgramListContainer numOfSchoolDays={numOfSchoolDays} breakTimeDuration={breakTimeDuration} />
                </div>

                {/* Section List with the Generate Timetable Button */}
                <div className='mt-6'>
                    <div className='bg-base-100 p-6 rounded-lg shadow-lg'>
                        <h2 className='text-lg font-semibold mb-4'>Sections</h2>
                        <SectionListContainer numOfSchoolDays={numOfSchoolDays} breakTimeDuration={breakTimeDuration} />
                        <div className='mt-4'>
                            <ViolationList violations={violations} />
                        </div>
                    </div>
                </div>
            </div>
            {Object.keys(sectionTimetables).length > 0 && Object.keys(teacherTimetables).length > 0 && (
                <button className='btn btn-secondary bg-red-500 w-32 mt-6' onClick={handleSchedExport}>
                    EXPORT SCHEDULES
                </button>
            )}
            {mapVal && mapVal.size > 0 && (
                <>
                    {/* {console.log('Rendering ForTest with mapVal:', mapVal)} */}
                    <ForTest hashMap={mapVal} />
                </>
            )}

            {/* pag section need Container section + sectionid + teacherid for error */}
            {/* <GeneratedTimetable
                sectionTimetables={sectionTimetables}
                teacherTimetables={teacherTimetables}
                onUpdateTimetables={setSectionTimetables}
                errors={{
                    containerName: 'Rosas',
                    teacherID: [9],
                    sectionID: [7],
                }}
            /> */}

            {/* pag teacher need Container teacher + sectionid + subjectid for error */}

            {/* <GeneratedTimetable
                sectionTimetables={sectionTimetables}
                teacherTimetables={teacherTimetables}
                fieldparam={'teacher'}
                columnField={['subject', 'section']}
                onUpdateTimetables={setTeacherTimetables}
                errors={{
                    containerName: 'Mark Tagalogon',
                    subjectID: [6],
                    sectionID: [7],
                }}
            /> */}

            {/* <div className="grid grid-cols-1 col-span-full gap-4 sm:grid-cols-2"></div> */}
        </div>
    );
}

export default Timetable; 
