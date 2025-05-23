import { useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { wrap } from 'comlink';
import clsx from 'clsx';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { enableMapSet } from 'immer';

import WasmWorker from '@src/wasm.worker?worker';
import { clearAllEntriesAndResetIDs } from '@src/indexedDB';
import { getTimeSlotIndex } from '../../../utils/timeSlotMapper';
import Configuration from '@components/Admin/Configuration';

import packInt16ToInt32 from '@utils/packInt16ToInt32';
import { unpackInt32ToInt16 } from '@utils/packInt16ToInt32';
import packInt8ToInt32 from '@utils/packInt8ToInt32';
import { packThreeSignedIntsToInt32 } from '@utils/packThreeSignedIntsToInt32';
import { getTimeSlotString } from '@utils/timeSlotMapper';
import calculateTotalClass from '@utils/calculateTotalClass';
import deepEqual from '@utils/deepEqual';

import SubjectListContainer from '@components/SubjectComponents/SubjectListContainer';
import ProgramListContainer from '@components/Admin/ProgramComponents/ProgramListContainer';
import TeacherListContainer from '@components/Admin/Teacher/TeacherListContainer';
import SectionListContainer from '@components/Admin/SectionComponents/SectionListContainer';
import ExportImportDBButtons from '@components/Admin/ExportImportDBButtons';
import NotificationHandler from '@components/Admin/NotificationHandler';
import Breadcrumbs from '@components/Admin/Breadcrumbs';

enableMapSet();
const getTimetable = wrap(new WasmWorker());

function addObjectToMap(map, key, newObject, IDIncrementer, propertyIDName) {
    if (!map.has(key)) {
        map.set(key, []);
    }

    const currentArray = map.get(key);

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
    const vacant = Array.from(
        { length: totalTimeslot },
        () => new Set(Array.from({ length: numOfSchoolDays }, (_, index) => index + 1))
    );

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
    const navigate = useNavigate();

    const links = [{ name: 'Home', href: '/' }];

    const { configurations, configurationsLoading } = useSelector((state) => state.configuration);

    const {
        subjects: subjectsStore,
        loading: subjectsStoreLoading,
        error: subjectsStoreError,
    } = useSelector((state) => state.subjects);
    const {
        programs: programsStore,
        loading: programsStoreLoading,
        error: programsStoreError,
    } = useSelector((state) => state.programs);
    const {
        sections: sectionsStore,
        loading: sectionsStoreLoading,
        error: sectionsStoreError,
    } = useSelector((state) => state.sections);
    const { ranks: ranksStore, loading: ranksStoreLoading, error: ranksStoreError } = useSelector((state) => state.ranks);
    const {
        teachers: teachersStore,
        loading: teachersStoreLoading,
        error: teachersStoreError,
    } = useSelector((state) => state.teachers);
    const {
        departments: departmentsStore,
        loading: departmentsStoreLoading,
        error: departmentsStoreError,
    } = useSelector((state) => state.departments);
    const {
        buildings: buildingsStore,
        loading: buildingsLoading,
        error: buildingsError,
    } = useSelector((state) => state.buildings);

    const [sectionTimetables, setSectionTimetables] = useState({});

    const [teacherTimetables, setTeacherTimetables] = useState({});

    const [timetableGenerationStatus, setTimetableGenerationStatus] = useState('idle');

    // Scope and Limitations
    // Room-Section Relationship: Each room is uniquely assigned to a specific subject, establishing a 1:1 relationship.
    // Due to this strict pairing, room allocation is not a factor in timetable generation.
    // Curriculum-Driven Course Selection: Students are required to follow a predefined curriculum.
    // They do not have the option to select subjects independently.
    // Standardized Class Start and Break Times: The start time for the first class and the timing of breaks are
    // standardized across all sections and teachers, ensuring uniformity in the daily schedule.

    const handleButtonClick = async (subjectData, buildingData, teacherData, sectionData) => {
        const subjectMap = Object.entries(subjectData).reduce((acc, [, value], index) => {
            acc[index] = value.id;
            return acc;
        }, {});

        const buildingMapReverse = Object.entries(buildingData).reduce((acc, [, value], index) => {
            acc[value.id] = index;
            return acc;
        }, {});

        // console.log('🚀 ~ handleButtonClick ~ buildingData:', typeof buildingData, buildingData);
        // console.log('🚀 ~ handleButtonClick ~ buildingMapReverse:', buildingMapReverse);

        const buildingMap = Object.entries(buildingData).reduce((acc, [, building], index) => {
            console.log('🚀 ~ handleButtonClick ~ buildingData:', buildingData);
            console.log('🚀 ~ handleButtonClick ~ building:', building);

            console.log('building.rooms: ', building.rooms);

            acc[buildingMapReverse[building.id]] = {
                id: buildingMapReverse[building.id],

                adjacency: Array.isArray(building.nearbyBuildings)
                    ? building.nearbyBuildings
                          .map((buildingID) => buildingMapReverse[buildingID.id] ?? null)
                          .filter((building) => building !== null)
                    : [],

                floorRooms: Object.values(building.rooms).reduce((acc, roomGroup) => [...acc, roomGroup.length], []),
            };
            return acc;
        }, {});

        // console.log('🚀 ~ handleButtonClick ~ buildingMap:', buildingMap);

        const buildingInfoArray = [];
        const buildingAdjacencyArray = [];

        Object.entries(buildingMap).forEach(([buildingID, building]) => {
            // console.log('🚀 ~ Object.entries ~ building:', building);

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

        console.log('🚀 ~ handleButtonClick ~ buildingAdjacencyArray:', buildingAdjacencyArray);
        console.log('🚀 ~ handleButtonClick ~ buildingAdjacencyArray:', buildingAdjacencyArray);

        const subjectMapReverse = Object.entries(subjectData).reduce((acc, [, subject], index) => {
            acc[subject.id] = {
                id: index,
                numOfClasses: Math.min(
                    Math.ceil(subject?.weeklyMinutes / subject.classDuration),
                    configurations[1].defaultNumberOfSchoolDays
                ),
                classDuration: subject.classDuration,
            };
            return acc;
        }, {});

        const teacherMap = Object.entries(teacherData).reduce((acc, [, teacher], index) => {
            acc[index] = {
                subjects: teacher.subjects.map((subjectID) => subjectMapReverse[subjectID].id),
                id: teacher.id,
                additionalTeacherScheds: teacher.additionalTeacherScheds || [],
            };
            return acc;
        }, {});

        Object.entries(teacherData).forEach(([key, section]) => {
            // console.log('🚀 ~ Object.entries ~ teacherData:', teacherData);
            // ...
        });

        const subjectConfigurationMap = new Map();
        let subjectConfigurationIDIncrementer = 0;

        Object.entries(sectionData).forEach(([key, section]) => {
            // console.log('GUGU', key, section);

            const fixedDays = section.fixedDays;
            const fixedPositions = section.fixedPositions;
            const additionalScheds = section.additionalScheds;

            let totalNumOfClasses = calculateTotalClass(
                subjectData,
                section.subjects,
                configurations[1].defaultNumberOfSchoolDays
            );

            let totalAdditionalScheduleNumOfClass = additionalScheds.reduce((total, additionalScheduleNumOfClass) => {
                return total + additionalScheduleNumOfClass.frequency;
            }, 0);

            // console.log('🚀 ~ handleButtonClick ~ totalAdditionalScheduleNumOfClass:', totalAdditionalScheduleNumOfClass);

            let totalTimeslot = Math.ceil(
                (totalNumOfClasses + totalAdditionalScheduleNumOfClass) / configurations[1].defaultNumberOfSchoolDays
            );

            totalTimeslot += totalTimeslot >= 10 ? 2 : 1;

            const emptyEveryDayTimeslot = new Set(Array.from({ length: totalTimeslot }, (_, i) => i + 1));

            let vacant = getVacantSlots(totalTimeslot, configurations[1].defaultNumberOfSchoolDays, fixedPositions, fixedDays);

            // console.log('🚀 ~ Object.entries ~ vacant:', vacant);

            Object.keys(fixedPositions).forEach((subjectID) => {
                if (fixedPositions[subjectID].every((element) => element === fixedPositions[subjectID][0])) {
                    return;
                }

                fixedPositions[subjectID].forEach((timeslot) => {
                    emptyEveryDayTimeslot.delete(timeslot);
                });
            });

            // console.log('::🚀::::: ~ Object.entries ~ emptyEveryDayTimeslot:', emptyEveryDayTimeslot);

            let subjectsEveryDay = [];

            Object.keys(fixedPositions).forEach((subjectID) => {
                const allElementsAreZero = fixedPositions[subjectID].every((element) => element === fixedPositions[subjectID][0]);

                const hasCorrectLength = fixedPositions[subjectID].length == configurations[1].defaultNumberOfSchoolDays;

                if (allElementsAreZero && hasCorrectLength) {
                    subjectsEveryDay.push(subjectID);
                }
            });

            // console.log('🚀🚀🚀🚀 ~ Object.entries ~ subjectsEveryDay:', subjectsEveryDay);

            // TODO:

            subjectsEveryDay.forEach((subjectID) => {
                const subjectConfiguration = {
                    name: '',
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
                            name: '',
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
            // console.log('🚀 ~ Object.entries ~ vacant_iterator:', vacant_iterator);

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

                    // console.log('PP', section.shift == 0 ? totalTimeslot + 1 + vacant_iterator : vacant_iterator + 1);
                    // console.log('🚀 ~ AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', additionalSchedule);

                    const subjectConfiguration = {
                        name: additionalSchedule.name,
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
                    subjectConfiguration.is_consistent_everyday ? 1 : 0
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

        console.log('wahaha');

        let breakTimeDurationForAlgo = configurations[1].defaultBreakTimeDuration;

        const durationUniqueAdditionalTeacherScheds = [
            ...new Set(
                Object.values(teacherMap).flatMap((entry) => entry.additionalTeacherScheds.map((sched) => sched.duration))
            ),
        ];

        // let timeDivision = gcdOfArray([
        //     ...subjectConfigurationSubjectDurationArray.map((duration) => {
        //         let { second: subjectDuration } = unpackInt32ToInt16(duration);
        //         return subjectDuration;
        //     }),
        //     breakTimeDurationForAlgo,
        //     durationUniqueAdditionalTeacherScheds,
        // ]);

        let timeDivision = 5;

        console.log('🚀 ~ handleButtonClick ~ timeDivision:', timeDivision);

        subjectConfigurationSubjectDurationArray.forEach((duration, index) => {
            let { first: subjectID, second: subjectDuration } = unpackInt32ToInt16(duration);
            subjectConfigurationSubjectDurationArray[index] = packInt16ToInt32(subjectID, subjectDuration / timeDivision);
        });

        breakTimeDurationForAlgo /= timeDivision;

        let lowestSubjectDuration = Math.min(
            ...subjectConfigurationSubjectDurationArray.map((duration) => {
                let { second: subjectDuration } = unpackInt32ToInt16(duration);
                return subjectDuration;
            }),
            breakTimeDurationForAlgo
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

        const sectionMap = Object.entries(sectionData).reduce((acc, [, section], index) => {
            console.log('sectionMap ~ section:', section);

            // Assuming section.subjects is an object with subject IDs as keys
            const subjectIDs = Object.keys(section.subjects);

            const fixedDays = section.fixedDays;
            const fixedPositions = section.fixedPositions;
            const additionalScheds = section.additionalScheds;

            let totalNumOfClasses = calculateTotalClass(
                subjectData,
                section.subjects,
                configurations[1].defaultNumberOfSchoolDays
            );

            console.log('🚀hheee ~ handleButtonClick ~ section.additionalScheds:', section.additionalScheds);

            let totalAdditionalScheduleNumOfClass = additionalScheds.reduce((total, additionalScheduleNumOfClass) => {
                return total + additionalScheduleNumOfClass.frequency;
            }, 0);

            console.log('🚀 ~ handleButtonClick ~ totalAdditionalScheduleNumOfClass:', totalAdditionalScheduleNumOfClass);

            let totalTimeslot = Math.ceil(
                (totalNumOfClasses + totalAdditionalScheduleNumOfClass) / configurations[1].defaultNumberOfSchoolDays
            );

            totalTimeslot += totalTimeslot >= 10 ? 2 : 1;

            console.log('🚀 ~ sectionMap ~ fixedPositions:', fixedPositions);
            console.log('🚀 ~ sectionMap ~ fixedDays:', fixedDays);

            let vacant = getVacantSlots(totalTimeslot, configurations[1].defaultNumberOfSchoolDays, fixedPositions, fixedDays);

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

                const hasCorrectLength = fixedPositions[subjectID].length == configurations[1].defaultNumberOfSchoolDays;

                if (allElementsAreZero && hasCorrectLength) {
                    subjectsEveryDay.push(subjectID);
                }
            });

            let subjectConfigurationArray = [];

            Object.entries(fixedPositions).forEach(([subjectID, positionArray]) => {
                // console.log(`Key: ${subjectID}, Value: ${positionArray}`);

                if (
                    positionArray.length == configurations[1].defaultNumberOfSchoolDays &&
                    emptyEveryDayTimeslot.size >= subjectsEveryDay.length &&
                    positionArray.every((element) => element === positionArray[0])
                ) {
                    const subjectConfiguration = {
                        name: '',
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
                        name: '',
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
                        name: additionalSchedule.name,
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

        let defaultClassDuration = configurations[1].defaultClassDuration;

        let maxTeacherWorkLoad = configurations[1].defaultMaximumTeachingLoad;
        // console.log('🚀 ~ handleButtonClick ~ maxTeachingLoad:', maxTeachingLoad);
        // console.log('🚀 ~ handleButtonClick ~ minTeachingLoad:', minTeachingLoad);
        let minTeacherWorkLoad = configurations[1].defaultMinimumTeachingLoad;

        // maxTeacherWorkLoad = 4000;
        // minTeacherWorkLoad = 100;

        defaultClassDuration /= timeDivision;
        maxTeacherWorkLoad /= timeDivision;
        minTeacherWorkLoad /= timeDivision;

        const sectionStartArray = [];
        const sectionConfigurationArray = [];
        const sectionSubjectConfigurationArray = [];
        const sectionLocationArray = [];

        Object.entries(subjectData).forEach(([key, value]) => {
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
        breakTimeDurationForAlgo -= offset;
        minTotalClassDurationForTwoBreaks /= offset || 1;

        for (const [sectionKey, section] of Object.entries(sectionMap)) {
            sectionStartArray[sectionKey] = section.startTime;

            let totalNumOfClasses = calculateTotalClass(
                subjectData,
                section.subjects,
                configurations[1].defaultNumberOfSchoolDays
            );

            let additionalScheduleTotalNumOfClasses = section.additionalScheds.reduce((acc, schedule) => {
                // console.log('schedule', schedule);
                let frequency = schedule?.frequency || 0;
                return acc + frequency;
            }, 0);

            let totalTimeslot = Math.ceil(
                (totalNumOfClasses + additionalScheduleTotalNumOfClasses) / configurations[1].defaultNumberOfSchoolDays
            );
            // console.log('🚀 ~ handleButtonClick ~ totalTimeslot:', totalTimeslot);

            // totalTimeslot =

            const numberOfBreak = totalTimeslot >= 10 ? 2 : 1;

            totalTimeslot += numberOfBreak;

            // const notAllowedBreakslotGap = totalTimeslot >= 7 ? 2 : 1;

            let notAllowedBreakslotGap = 0;
            if (totalTimeslot >= 3 && totalTimeslot < 7) {
                notAllowedBreakslotGap = 1;
            } else if (totalTimeslot == 7) {
                notAllowedBreakslotGap = 2;
            } else if (totalTimeslot >= 8) {
                notAllowedBreakslotGap = 3; // BE CAREFUL WITH THIS, ANYTHING HIGHER WILL CAUSE ERRORS IF BREAK SLOT IS TWO
            }

            // TODO: include teacher additional scheulde
            // TODO: update teacher workload in real data
            // TODO: test on real high data

            // const isDynamicSubjectConsistentDuration = 0; // false
            const isDynamicSubjectConsistentDuration = 1; // false

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

            // console.log('🚀 ~ handleButtonClick ~ section:', section);
            // console.log('|| ~ handleButtonClick ~ notAllowedBreakslotGap:', notAllowedBreakslotGap);
            // console.log('|| ~ handleButtonClick ~ numberOfBreak:', numberOfBreak);
            // console.log('|| ~ handleButtonClick ~ totalTimeslot:', totalTimeslot);
            // console.log('|| ~ roomDetails roomDetailsroomDetailsroomDetailsroomDetailsroomDetails ~ roomDetails:', roomDetails);
            // console.log('|| ~ buildingMapReverse:', buildingMapReverse);
            // console.log('|| ~ handleButtonClick ~ buildingID:');

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

        console.log(
            '🚀 ~ handleButtonClick ~ subjectConfigurationSubjectIsOverlappable:',
            subjectConfigurationSubjectIsOverlappable
        );

        const maxIterations = configurations[1].defaultABCMaxIteration;
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
        console.log('🚀 ~ handleButtonClick ~ teacherReservationConfigIDArray:', teacherReservationConfigIDArray);

        const teacherReservationConfig = new Int32Array([...teacherReservationConfigArray]);
        console.log('🚀 ~ handleButtonClick ~ teacherReservationConfigArray:', teacherReservationConfigArray);

        const teacherSubjects = new Int32Array([...teacherSubjectArray]);
        const teacherWeekLoadConfig = new Int32Array([...teacherWeekLoadConfigArray]);

        const subjectFixedTeacherSection = new Int32Array([-1]);
        const subjectFixedTeacher = new Int32Array([-1]);

        const teacherBreakThreshold = 4;

        const numOfViolationType = 7;

        const resultTimetableLength =
            totalSections * Object.entries(subjectData).length * configurations[1].defaultNumberOfSchoolDays;

        const resultViolationLength = numOfViolationType * totalSections + numOfViolationType * totalTeachers;

        // TEMPORARY
        const teacherMiddleTimePointGrowAllowanceForBreakTimeslot = 12;

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
            workWeek: configurations[1].defaultNumberOfSchoolDays,

            breakTimeDuration: breakTimeDurationForAlgo,
            teacherBreakThreshold: teacherBreakThreshold,
            teacherMiddleTimePointGrowAllowanceForBreakTimeslot: teacherMiddleTimePointGrowAllowanceForBreakTimeslot,
            minTotalClassDurationForTwoBreaks: minTotalClassDurationForTwoBreaks,
            defaultClassDuration: defaultClassDuration,
            offsetDuration: offset,
            resultTimetableLength: resultTimetableLength,
            resultViolationLength: resultViolationLength,

            enableLogging: false,
        };

        console.log('🚀 ~ handleButtonClick ~ params2.buildingAdjacency:', params2.buildingAdjacency);
        console.log('🚀 ~ handleButtonClick ~ params2.teacherReservationConfig:', params2.teacherReservationConfig);
        console.log('🚀 ~ handleButtonClick ~ params2.teacherReservationConfigID:', params2.teacherReservationConfigID);
        console.log(
            '🚀 ~ handleButtonClick ~ params2.subjectConfigurationSubjectIsOverlappable:',
            params2.subjectConfigurationSubjectIsOverlappable
        );

        // return;

        let generatedTimetable = [];

        setTimetableGenerationStatus('running');
        console.log('TIEEEEEEEEEEEZZZZDCDSDSZF SA LABABSS', params2);
        try {
            console.log('TIEEEEEEEEEEEZZZZDCDSDSZF ', params2);
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
            type,
            additional
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
                additional: additional,
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
            // console.log('sectionMap: ', sectionMap);
            const section_id = sectionMap[entry[0]].id;
            const subject_id = subjectMap[entry[1]] || null;
            const teacher_id = (teacherMap[entry[2]] || { id: null }).id;
            const timeslot = entry[3];
            const day = entry[4];

            const start = Number(entry[5]);
            const end = Number(entry[6]);

            const subjectConfigurationID = Number(entry[7]);

            // console.log(section_id, 'ETONG d', subjectConfigurationID, subject_id, subjectConfigurationMap.get(subjectMapReverse[subject_id]?.id));
            // console.log(
            //     section_id,
            //     'ETONG SAYO',
            //     subjectConfigurationID,
            //     subject_id,
            //     subjectConfigurationMap.get(subjectMapReverse[entry[1]]?.id)
            // );

            const subjectConfigurationData = subjectConfigurationMap.get(subjectMapReverse[subject_id]?.id);

            let name = '';
            if (subjectConfigurationData) {
                subjectConfigurationData.forEach((value, key) => {
                    // console.log("value", value)

                    if (value.subjectConfigurationID === subjectConfigurationID) {
                        // console.log("QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ");
                        name = value.name;
                    }
                });
            } else {
                // console.warn('No subject data found for subject_id:', subject_id);
            }

            // console.log('🚀 ~ handleButtonClick ~ name:', name);

            const sectionType = 'section';
            let additional = true;
            if (name === '') {
                additional = false;
            }

            addTimeslotToTimetable(
                //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// fasdf
                section_id,
                sectionTimetable,
                section_id,
                subject_id,
                teacher_id,
                start,
                end,
                day,
                name ? name + ' ' + subjectData[subject_id]?.subject : subjectData[subject_id]?.subject || null,
                teacherData[teacher_id]?.teacher || null,
                sectionData[section_id]?.section,
                sectionType,
                additional
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
                sectionData[section_id]?.section,
                name ? name + ' ' + subjectData[subject_id]?.subject : subjectData[subject_id]?.subject || null,
                teacherData[teacher_id]?.teacher,
                teacherType,
                additional
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

            console.log('🚀 ~ teacherTimetable.forEach ~  teacherMap[key]:', teacherData[key]);
            const additionalTeacherScheds = teacherData[key]?.additionalTeacherScheds || [];
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
                            teacher: teacherData[key].id,
                            type: 'teacher',
                            additional: true,
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
        console.log('sectionTimetable: ', sectionTimetable);
        console.log('teacherTimetable: ', teacherTimetable);
        const sectionEdited = convertToHashMap(sectionTimetable, 'Section');
        const teacherEdited = convertToHashMap(teacherTimetable, 'Teacher');

        // console.log('subjects: ', subjectsStore);
        // console.log('programs: ', programsStore);
        // console.log('buildings: ', buildingsStore);
        // console.log('teachers: ', teachersStore);
        // console.log('configuration: ', minTeachingLoad);
        // console.log('sectionEdited: ', sectionEdited);
        // console.log('teacherEdited: ', teacherEdited);
        const generatedMap = combineMaps(sectionEdited, teacherEdited);
        console.log('DATA SA DRAGDROP: ', generatedMap);
        navigate('/app/admin/modify-timetable', { state: { generatedMap, subjectsStore, sectionsStore, teachersStore } });

        // setMapVal(combined);
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

    const convertToHashMap = (inputMap, type) => {
        const resultMap = new Map(); // Initialize the outer Map
        // const { configurations, configurationsLoading } = useSelector((state) => state.configuration);
        console.log('defaultMorningStart: ', configurations[1].defaultMorningStart);
        // const timeslotindex = getTimeSlotIndex(configurations[1].defaultMorningStart);
        //always 6am start
        const timeslotindex = 72;
        console.log('timeslotindex: ', timeslotindex);
        console.log('inputMap: ', inputMap);
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

            let setTableKey = `${type}: ${containerName}`;
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
                const type = schedule.type[0];

                const partnerType = type === 't' ? 's' : 't';
                if (schedule.day === 0) {
                    for (let i = 1; i <= 5; i++) {
                        // let scheduleKey = `section-${schedule.section}-teacher-${schedule.teacher}-subject-${schedule.subject}-day-${i}-type-${type}`;
                        let scheduleKey = `${schedule.section ?? 'n'}-${schedule.teacher ?? 'n'}-${schedule.subject ?? 'n'}-${
                            i ?? 'n'
                        }-${type ?? 'n'}`;

                        let duplicate = false;
                        if (scheduleMap.has(scheduleKey)) {
                            duplicate = true;
                            // scheduleKey = `additional-section-${schedule.section}-teacher-${schedule.teacher}-subject-${schedule.subject}-day-${i}-type-${type}`;

                            scheduleKey = `a-${schedule.section ?? 'n'}-${schedule.teacher ?? 'n'}-${schedule.subject ?? 'n'}-${
                                i ?? 'n'
                            }-${type ?? 'n'}`;
                        }
                        // const keyToFind = scheduleKey.replace(/(type-)([^-]+)/, `$1${partnerType}`);
                        let keyToFind = scheduleKey.replace(/[^-]+$/, partnerType[0] ?? 'n');
                        console.log;
                        // console.log("modality: ",sectionsStore[schedule.section]?.modality)
                        scheduleMap.set(scheduleKey, {
                            start: schedule.start - timeslotindex,
                            end: schedule.end - timeslotindex,
                            sectionID: schedule.section,
                            subject: type === 's' ? schedule.fieldName1 : schedule.fieldName2,
                            subjectID: schedule.subject,
                            teacherID: schedule.teacher,
                            tableKey: setTableKey,
                            partnerKey: keyToFind,
                            id: scheduleKey,
                            dynamicID: scheduleKey,
                            day: i,
                            overlap: false,
                            type: type,
                            additional: schedule.additional, // Ensures 'additional' is false if not set
                            containerName: containerName,
                            // modality: type === 's' ? sectionsStore[schedule.section]?.modality : [],
                            ...(type === 't' && { section: schedule.fieldName1 }),
                            ...(type === 's' && { teacher: schedule.fieldName2 }),
                        });
                    }
                } else {
                    let scheduleKey = `${schedule.section ?? 'n'}-${schedule.teacher ?? 'n'}-${schedule.subject ?? 'n'}-${
                        schedule.day ?? 'n'
                    }-${type[0] ?? 'n'}`;

                    let duplicate = false;
                    if (scheduleMap.has(scheduleKey)) {
                        duplicate = true;
                        scheduleKey = `a-${schedule.section ?? 'n'}-${schedule.teacher ?? 'n'}-${schedule.subject ?? 'n'}-${
                            schedule.day ?? 'n'
                        }-${type[0] ?? 'n'}`;
                    }
                    let keyToFind = scheduleKey.replace(/[^-]+$/, partnerType[0] ?? 'n');

                    scheduleMap.set(scheduleKey, {
                        start: schedule.start - timeslotindex,
                        end: schedule.end - timeslotindex,
                        sectionID: schedule.section,
                        subject: type === 's' ? schedule.fieldName1 : schedule.fieldName2,
                        subjectID: schedule.subject,
                        teacherID: schedule.teacher,
                        tableKey: setTableKey,
                        partnerKey: keyToFind,
                        type: type,
                        id: scheduleKey,
                        dynamicID: scheduleKey,
                        overlap: false,
                        day: schedule.day,
                        // modality: type === 's' ? sectionsStore[schedule.section]?.modality : [],
                        additional: schedule.additional, // Ensures 'additional' is false if not set
                        containerName: containerName,
                        ...(type === 't' && { section: schedule.fieldName1 }),
                        ...(type === 's' && { teacher: schedule.fieldName2 }),
                    });
                }
            }
        }

        return resultMap;
    };

    function combineMaps(map1, map2) {
        const combinedMap = new Map(map1); // Start with entries from map1

        for (const [key, value] of map2?.entries()) {
            combinedMap.set(key, value); // Use original keys from map2
        }

        return combinedMap;
    }

    return (
        <div className='App container mx-auto px-4 py-6'>
            <NotificationHandler timetableCondition={timetableGenerationStatus} />
            <div className='mb-6 flex justify-between items-center'>
                <Breadcrumbs title='Timetable' links={links} />
                <div className='flex items-center gap-2'>
                    <ExportImportDBButtons
                        programs={programsStore}
                        subjects={subjectsStore}
                        teachers={teachersStore}
                        ranks={ranksStore}
                        departments={departmentsStore}
                        buildings={buildingsStore}
                        sections={sectionsStore}
                        onClear={handleClearAndRefresh}
                        defaultNumberOfSchoolDays={configurations[1].defaultNumberOfSchoolDays}
                        breakTimeDuration={configurations[1].defaultBreakTimeDuration}
                    />
                    <button
                        className={clsx('btn btn-primary', {
                            'cursor-not-allowed': timetableGenerationStatus === 'running',
                            'btn-error': timetableGenerationStatus === 'error',
                        })}
                        onClick={() => {
                            // if (validate()) {
                            handleButtonClick(subjectsStore, buildingsStore, teachersStore, sectionsStore);
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
                <Configuration />
            </div>

            <div>
                <div className='mt-6 bg-base-100 p-6 rounded-lg shadow-lg'>
                    <h2 className='text-lg font-semibold mb-4'>Subjects</h2>
                    <SubjectListContainer />
                </div>

                <div className='mt-6 bg-base-100 p-6 rounded-lg shadow-lg'>
                    <h2 className='text-lg font-semibold mb-4'>Teachers</h2>
                    <TeacherListContainer />
                </div>

                <div className='mt-6 bg-base-100 p-6 rounded-lg shadow-lg'>
                    <h2 className='text-lg font-semibold mb-4'>Programs</h2>
                    <ProgramListContainer />
                </div>

                <div className='mt-6'>
                    <div className='bg-base-100 p-6 rounded-lg shadow-lg'>
                        <h2 className='text-lg font-semibold mb-4'>Sections</h2>
                        <SectionListContainer />
                    </div>
                </div>
            </div>
            {Object.keys(sectionTimetables).length > 0 && Object.keys(teacherTimetables).length > 0 && (
                <button className='btn btn-secondary bg-red-500 w-32 mt-6' onClick={handleSchedExport}>
                    EXPORT SCHEDULES
                </button>
            )}
        </div>
    );
}

export default Timetable;