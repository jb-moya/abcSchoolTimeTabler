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
import validateTimetableVariables from '@validation/validateTimetableVariables';
import { toast } from 'sonner';
import ViolationList from '@components/Admin/ViolationList';
import SubjectListContainer from '../../../components/SubjectComponents/SubjectListContainer';
import ProgramListContainer from '../../../components/Admin/ProgramComponents/ProgramListContainer';
import TeacherListContainer from '@components/Admin/Teacher/TeacherListContainer';
import SectionListContainer from '@components/Admin/SectionListContainer';
import ExportImportDBButtons from '@components/Admin/ExportImportDBButtons';

import { getTimeSlotIndex } from '@components/Admin/timeSlotMapper';

import { getTimeSlotString } from '../../../components/Admin/timeSlotMapper';
import Breadcrumbs from '@components/Admin/Breadcrumbs';
import { clearAllEntriesAndResetIDs } from '@src/indexedDB';

import { fetchSections, editSection } from '@features/sectionSlice';
import { fetchPrograms, editProgram } from '@features/programSlice';
import { fetchSubjects } from '@features/subjectSlice';
import { fetchBuildings } from '@features/buildingSlice';
import { original } from 'immer';
import calculateTotalTimeslot from '../../../utils/calculateTotalTimeslot';
import deepEqual from '../../../utils/deepEqual';
import gcdOfArray from '../../../utils/getGCD';
import { packThreeSignedIntsToInt32 } from '../../../utils/packThreeSignedIntsToInt32';
const getTimetable = wrap(new WasmWorker());

function addObjectToMap(
    map,
    key,
    newObject,
    subjectConfigurationIDIncrementer
) {
    if (!map.has(key)) {
        map.set(key, []);
    }

    const currentArray = map.get(key);

    const isDuplicate = currentArray.some((item) => {
        let { subjectConfigurationID, ...rest } = item;
        let { subjectConfigurationID: newSubjectConfigurationID, ...rest2 } =
            newObject;

        return deepEqual(rest, rest2);
    });

    if (!isDuplicate) {
        currentArray.push({
            subjectConfigurationID: subjectConfigurationIDIncrementer,
            ...newObject,
        });
        map.set(key, currentArray);

        return subjectConfigurationIDIncrementer + 1;
    }

    return subjectConfigurationIDIncrementer;
}

function Timetable() {
    const dispatch = useDispatch();

    const links = [
        { name: 'Home', href: '/' },
        // { name: 'Modify Subjects', href: '/modify-subjects' },
    ];

    const { subjects: subjectsStore, status: subjectStatus } = useSelector(
        (state) => state.subject
    );
    const { buildings: buildingsStore, status: buildingStatus } = useSelector(
        (state) => {
            console.log('statee e e e ee  ee e e ', state);
            return state.building;
        }
    );
    const { teachers: teachersStore } = useSelector((state) => state.teacher);
    const { sections: sectionsStore, status: sectionStatus } = useSelector(
        (state) => state.section
    );
    const { programs: programsStore, status: programStatus } = useSelector(
        (state) => state.program
    );

    const [numOfSchoolDays, setNumOfSchoolDays] = useState(() => {
        return localStorage.getItem('numOfSchoolDays') || 5;
    });
    const [prevNumOfSchoolDays, setPrevNumOfSchoolDays] =
        useState(numOfSchoolDays);

    const [sectionTimetables, setSectionTimetables] = useState({});
    const [teacherTimetables, setTeacherTimetables] = useState({});
    const [timetableGenerationStatus, setTimetableGenerationStatus] =
        useState('idle');
    const [violations, setViolations] = useState([]);

    const [refreshKey, setRefreshKey] = useState(0);

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

    const mockBuildings = {
        1: {
            name: '1111',
            floors: 2,
            rooms: [['1111 - 101'], ['1111 - 201']],
            nearbyBuildings: [2, 3, 4],
            id: 1,
        },
        2: {
            name: 'test',
            floors: 4,
            rooms: [
                ['test - 101', 'test - 102', 'test - 103'],
                [
                    'test - 201',
                    'test - 202',
                    'test - 203',
                    'test - 204',
                    'test - 205',
                    'test - 206',
                ],
                [
                    'test - 301',
                    'test - 302',
                    'test - 303',
                    'test - 304',
                    'test - 305',
                    'test - 306',
                ],
                [
                    'test - 401',
                    'test - 402',
                    'test - 403',
                    'test - 404',
                    'test - 405',
                    'test - 406',
                ],
            ],
            nearbyBuildings: [],
            id: 2,
        },
        3: {
            name: 'mock',
            floors: 3,
            rooms: [['mock - 101'], ['mock - 201'], ['mock - 301']],
            nearbyBuildings: [],
            id: 3,
        },
        4: {
            name: 'example',
            floors: 5,
            rooms: [
                ['example - 101'],
                ['example - 201'],
                ['example - 301'],
                ['example - 401'],
                ['example - 501'],
            ],
            nearbyBuildings: [],
            id: 4,
        },
    };

    const handleButtonClick = async () => {
        const subjectMap = Object.entries(subjectsStore).reduce(
            (acc, [, value], index) => {
                acc[index] = value.id;
                return acc;
            },
            {}
        );

        const buildingMapReverse = Object.entries(buildingsStore).reduce(
            (acc, [, value], index) => {
                acc[value.id] = index;
                return acc;
            },
            {}
        );

        console.log(
            '🚀 ~ handleButtonClick ~ mockBuildings:',
            typeof mockBuildings,
            mockBuildings
        );

        console.log(
            '🚀 ~ handleButtonClick ~ buildingsStore:',
            typeof buildingsStore,
            buildingsStore
        );

        console.log(
            '🚀 ~ handleButtonClick ~ buildingMapReverse:',
            buildingMapReverse
        );

        const buildingMap = Object.entries(buildingsStore).reduce(
            (acc, [, building], index) => {
                console.log('🚀 ~ handleButtonClick ~ building:', building);

                acc[buildingMapReverse[building.id]] = {
                    id: buildingMapReverse[building.id],

                    adjacency: Array.isArray(building.nearbyBuildings)
                        ? building.nearbyBuildings
                              .map(
                                  (buildingID) =>
                                      buildingMapReverse[buildingID.id] ?? null
                              )
                              .filter((building) => building !== null)
                        : [],

                    floorRooms: building.rooms.reduce(
                        (acc, roomGroup) => [...acc, roomGroup.length],
                        []
                    ),
                };
                return acc;
            },
            {}
        );

        console.log('🚀 ~ handleButtonClick ~ buildingMap:', buildingMap);

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

                buildingAdjacencyArray.push(
                    packInt16ToInt32(
                        parseInt(buildingID),
                        parseInt(adjacentBuildingID)
                    )
                );
            });

            building.floorRooms.forEach((floorRoomCount) => {
                buildingInfoArray.push(
                    packInt16ToInt32(parseInt(buildingID), floorRoomCount)
                );
            });
        });

        buildingInfoArray.push(-1);
        buildingAdjacencyArray.push(-1);

        const teacherReservationConfigArray = [];
        const teacherReservationConfigIDArray = [];

        teacherReservationConfigArray.push(-1);
        teacherReservationConfigIDArray.push(-1);

        const teacherReservationConfig = new Int32Array([
            ...teacherReservationConfigArray,
        ]);
        const teacherReservationConfigID = new Int32Array([
            ...teacherReservationConfigIDArray,
        ]);

        const buildingInfo = new Int32Array([...buildingInfoArray]);
        const buildingAdjacency = new Int32Array([...buildingAdjacencyArray]);

        console.log(
            '🚀 ~ handleButtonClick ~ buildingAdjacencyArray:',
            buildingAdjacencyArray
        );

        const subjectMapReverse = Object.entries(subjectsStore).reduce(
            (acc, [, subject], index) => {
                acc[subject.id] = {
                    id: index,
                    numOfClasses: Math.min(
                        Math.ceil(
                            subject.weeklyMinutes / subject.classDuration
                        ),
                        numOfSchoolDays
                    ),
                    classDuration: subject.classDuration,
                };
                return acc;
            },
            {}
        );

        const teacherMap = Object.entries(teachersStore).reduce(
            (acc, [, teacher], index) => {
                acc[index] = {
                    subjects: teacher.subjects.map(
                        (subjectID) => subjectMapReverse[subjectID].id
                    ),
                    id: teacher.id,
                };
                return acc;
            },
            {}
        );

        const teacherReservedScheduleConfigurationMap = new Map();
        let teacherReservedScheduleIDIncrementer = 0;

        Object.entries(teachersStore).forEach(([key, section]) => {
            console.log('🚀 ~ Object.entries ~ teachersStore:', teachersStore);
            // ...
        });

        const subjectConfigurationMap = new Map();
        let subjectConfigurationIDIncrementer = 0;

        Object.entries(sectionsStore).forEach(([key, section]) => {
            console.log('GUGU', key, section);

            const fixedDays = section.fixedDays;
            const fixedPositions = section.fixedPositions;

            let totalTimeslot = calculateTotalTimeslot(
                subjectsStore,
                section.subjects,
                numOfSchoolDays
            );

            totalTimeslot += totalTimeslot >= 10 ? 2 : 1;

            const emptyEveryDayTimeslot = new Set(
                Array.from({ length: totalTimeslot }, (_, i) => i + 1)
            );

            Object.keys(fixedPositions).forEach((subjectID) => {
                if (
                    fixedPositions[subjectID].every(
                        (element) => element === fixedPositions[subjectID][0]
                    )
                ) {
                    return;
                }

                fixedPositions[subjectID].forEach((timeslot) => {
                    emptyEveryDayTimeslot.delete(timeslot);
                });
            });

            console.log(
                '::🚀::::: ~ Object.entries ~ emptyEveryDayTimeslot:',
                emptyEveryDayTimeslot
            );

            let subjectsEveryDay = [];

            Object.keys(fixedPositions).forEach((subjectID) => {
                const allElementsAreZero = fixedPositions[subjectID].every(
                    (element) => element === fixedPositions[subjectID][0]
                );

                const hasCorrectLength =
                    fixedPositions[subjectID].length == numOfSchoolDays;

                if (allElementsAreZero && hasCorrectLength) {
                    subjectsEveryDay.push(subjectID);
                }
            });

            console.log(
                '🚀🚀🚀🚀 ~ Object.entries ~ subjectsEveryDay:',
                subjectsEveryDay
            );

            // TODO: 

            subjectsEveryDay.forEach((subjectID) => {
                const subjectConfiguration = {
                    subject: subjectMapReverse[subjectID].id,
                    is_consistent_everyday:
                        emptyEveryDayTimeslot.size >= subjectsEveryDay.length,
                    classDuration: subjectMapReverse[subjectID].classDuration,
                    fixed_timeslot:
                        fixedPositions[subjectID][0] == 0
                            ? 0
                            : fixedPositions[subjectID][0] - 1,
                    fixedDay: 0,
                };

                subjectConfigurationIDIncrementer = addObjectToMap(
                    subjectConfigurationMap,
                    subjectMapReverse[subjectID].id,
                    subjectConfiguration,
                    subjectConfigurationIDIncrementer
                );
            });

            Object.entries(fixedPositions)
                .filter(([subjectID]) => !subjectsEveryDay.includes(subjectID))
                .forEach(([subjectID, classBlock]) => {
                    console.log(`${subjectID}: ${classBlock}`);

                    classBlock.forEach((timeslot, index) => {
                        const subjectConfiguration = {
                            subject: subjectMapReverse[subjectID].id,
                            is_consistent_everyday: false,
                            classDuration:
                                subjectMapReverse[subjectID].classDuration,
                            fixed_timeslot: timeslot == 0 ? 0 : timeslot - 1,
                            fixedDay: fixedDays[subjectID][index],
                        };

                        subjectConfigurationIDIncrementer = addObjectToMap(
                            subjectConfigurationMap,
                            subjectMapReverse[subjectID].id,
                            subjectConfiguration,
                            subjectConfigurationIDIncrementer
                        );
                    });
                });
        });

        console.log(
            '🚀 ~ section.subjects.forEach ~ subjectConfigurationArray:',
            subjectConfigurationMap
        );

        const subjectConfigurationSubjectUnitsArray = [];
        const subjectConfigurationSubjectDurationArray = [];
        const subjectConfigurationSubjectFixedTimeslotArray = [];
        const subjectConfigurationSubjectFixedDayArray = [];
        const subjectConfigurationSubjectIsOverlappableArray = [];
        let totalNumOfSubjectConfigurations = 0;

        subjectConfigurationMap.forEach((subjectConfigurationArray) => {
            console.log(
                '🚀 ~ subjectConfigurationArray:',
                subjectConfigurationArray
            );

            subjectConfigurationArray.forEach((subjectConfiguration) => {
                let id = subjectConfiguration.subjectConfigurationID;
                let subjectID = subjectConfiguration.subject;

                subjectConfigurationSubjectUnitsArray[id] = packInt16ToInt32(
                    subjectID,
                    subjectConfiguration.is_consistent_everyday ? 0 : 1
                );
                subjectConfigurationSubjectDurationArray[id] = packInt16ToInt32(
                    subjectID,
                    subjectConfiguration.classDuration
                );
                subjectConfigurationSubjectFixedTimeslotArray[id] =
                    packInt16ToInt32(
                        subjectID,
                        subjectConfiguration.fixed_timeslot
                    );
                subjectConfigurationSubjectFixedDayArray[id] = packInt16ToInt32(
                    subjectID,
                    subjectConfiguration.fixedDay
                );
                subjectConfigurationSubjectIsOverlappableArray[id] = 0;

                totalNumOfSubjectConfigurations++;
            });
        });

        let breakTimeDuration = 30;

        let timeDivision = gcdOfArray([
            ...subjectConfigurationSubjectDurationArray.map((duration) => {
                let { second: subjectDuration } = unpackInt32ToInt16(duration);
                return subjectDuration;
            }),
            breakTimeDuration,
        ]);

        // console.log(
        //     '🚀 ~ timeDivisiontimeDivisiontimeDivisiontimeDivision ~ timeDivision:',
        //     timeDivision
        // );

        subjectConfigurationSubjectDurationArray.forEach((duration, index) => {
            let { first: subjectID, second: subjectDuration } =
                unpackInt32ToInt16(duration);
            subjectConfigurationSubjectDurationArray[index] = packInt16ToInt32(
                subjectID,
                subjectDuration / timeDivision
            );
        });

        breakTimeDuration /= timeDivision;

        let lowestSubjectDuration = Math.min(
            ...subjectConfigurationSubjectDurationArray.map((duration) => {
                let { second: subjectDuration } = unpackInt32ToInt16(duration);
                // console.log(
                //     '🚀 ~ ...subjectConfigurationSubjectDurationArray.map ~ subjectDuration:',
                //     subjectDuration
                // );
                return subjectDuration;
            }),
            breakTimeDuration
        );
        // console.log(
        //     '🚀 ~ handleButtonClick ~ lowestSubjectDuration:',
        //     lowestSubjectDuration
        // );

        let offset = lowestSubjectDuration - 1;
        // console.log('🚀 ~ handleButtonClick ~ offset:', offset);

        subjectConfigurationSubjectDurationArray.forEach((duration, index) => {
            let { first: subjectID, second: subjectDuration } =
                unpackInt32ToInt16(duration);
            subjectConfigurationSubjectDurationArray[index] = packInt16ToInt32(
                subjectID,
                subjectDuration - offset
            );
        });

        // subjectConfigurationSubjectDurationArray.forEach((duration, index) => {
        //     let { first: subjectID, second: subjectDuration } =
        //         unpackInt32ToInt16(duration);
        //     console.log(
        //         '🚀 ~ subjectConfigurationSubjectDurationArray.forEach ~ subjectDuration:',
        //         subjectDuration
        //     );
        // });

        subjectConfigurationMap.forEach((subjectConfigurationArray) => {
            // console.log(
            //     '🚀 ~ subjectConfigurationArray:',
            //     subjectConfigurationArray
            // );

            subjectConfigurationArray.forEach((subjectConfiguration, index) => {
                subjectConfiguration.classDuration =
                    subjectConfiguration.classDuration / timeDivision - offset;
            });
        });

        // console.log(
        //     '🚀  A F T E R ~ subjectConfigurationArray:',
        //     subjectConfigurationMap
        // );

        let totalSectionSubjects = 0;

        const sectionMap = Object.entries(sectionsStore).reduce(
            (acc, [, section], index) => {
                // console.log('🚀 ~ sectionMap ~ section:', section);

                // Assuming section.subjects is an object with subject IDs as keys
                const subjectIDs = Object.keys(section.subjects);

                const fixedDays = section.fixedDays;
                const fixedPositions = section.fixedPositions;

                // console.log(
                //     '🚀 ~ handleButtonClick ~ fixedPositions:',
                //     fixedPositions
                // );

                let totalTimeslot = calculateTotalTimeslot(
                    subjectsStore,
                    section.subjects,
                    numOfSchoolDays
                );

                totalTimeslot += totalTimeslot >= 10 ? 2 : 1;

                const emptyEveryDayTimeslot = new Set(
                    Array.from({ length: totalTimeslot }, (_, i) => i + 1)
                );

                Object.keys(fixedPositions).forEach((subjectID) => {
                    if (
                        fixedPositions[subjectID].every(
                            (element) =>
                                element === fixedPositions[subjectID][0]
                        )
                    ) {
                        return;
                    }

                    fixedPositions[subjectID].forEach((timeslot) => {
                        emptyEveryDayTimeslot.delete(timeslot);
                    });
                });

                let subjectsEveryDay = [];

                Object.keys(fixedPositions).forEach((subjectID) => {
                    const allElementsAreZero = fixedPositions[subjectID].every(
                        (element) => element === fixedPositions[subjectID][0]
                    );

                    const hasCorrectLength =
                        fixedPositions[subjectID].length == numOfSchoolDays;

                    if (allElementsAreZero && hasCorrectLength) {
                        subjectsEveryDay.push(subjectID);
                    }
                });

                let subjectConfigurationArray = [];

                Object.entries(fixedPositions).forEach(
                    ([subjectID, positionArray]) => {
                        console.log(
                            `Key: ${subjectID}, Value: ${positionArray}`
                        );

                        if (
                            positionArray.length == numOfSchoolDays &&
                            emptyEveryDayTimeslot.size >=
                                subjectsEveryDay.length &&
                            positionArray.every(
                                (element) => element === positionArray[0]
                            )
                        ) {
                            const subjectConfiguration = {
                                subject: subjectMapReverse[subjectID].id,
                                is_consistent_everyday: true,
                                classDuration:
                                    subjectMapReverse[subjectID].classDuration /
                                        timeDivision -
                                    offset,
                                fixed_timeslot:
                                    positionArray[0] == 0
                                        ? 0
                                        : positionArray[0] - 1,
                                fixedDay: 0,
                            };

                            subjectConfigurationArray.push(
                                subjectConfiguration
                            );

                            return;
                        }

                        positionArray.forEach((timeslot, index) => {
                            const subjectConfiguration = {
                                subject: subjectMapReverse[subjectID].id,
                                is_consistent_everyday: false,
                                classDuration:
                                    subjectMapReverse[subjectID].classDuration /
                                        timeDivision -
                                    offset,
                                fixed_timeslot:
                                    timeslot == 0 ? 0 : timeslot - 1,
                                fixedDay: fixedDays[subjectID][index],
                            };

                            subjectConfigurationArray.push(
                                subjectConfiguration
                            );
                        });
                    }
                );

                // console.log(
                //     '🚀 ~ handleButtonClick ~ subjectConfiguration:',
                //     subjectConfigurationArray
                // );

                let sectionSubjectConfigurationIDs = [];

                subjectConfigurationArray.forEach((subjectConfiguration) => {
                    let subjectID = subjectConfiguration.subject;
                    // console.log(
                    //     '🚀 ~ gaga ~ gag:',
                    //     subjectConfiguration.subject
                    // );

                    subjectConfigurationMap
                        .get(subjectID)
                        .forEach((sectionSubjectConfiguration) => {
                            // console.log(
                            //     '🚀 ~ eee ~ eee:',
                            //     sectionSubjectConfiguration
                            // );

                            const {
                                subjectConfigurationID:
                                    sectionSubjectConfigurationID,
                                ...sectionSubjectConfigurationMinusID
                            } = sectionSubjectConfiguration;

                            // console.log('comparing');
                            // console.log(subjectConfiguration);
                            // console.log(sectionSubjectConfigurationMinusID);

                            if (
                                deepEqual(
                                    sectionSubjectConfigurationMinusID,
                                    subjectConfiguration
                                )
                            ) {
                                sectionSubjectConfigurationIDs.push(
                                    sectionSubjectConfigurationID
                                );
                            }
                        });
                });

                totalSectionSubjects += sectionSubjectConfigurationIDs.length;

                console.log(
                    '🚀 ~ fdff section subjectConfiguration IDs:',
                    section.id,
                    sectionSubjectConfigurationIDs
                );

                acc[index] = {
                    subjectConfigurationIDs: sectionSubjectConfigurationIDs,
                    subjects: section.subjects,
                    startTime: section.startTime,
                    id: section.id,
                };

                return acc;
            },
            {}
        );

        console.log('subjectMap', subjectMap);
        console.log('subjectMapReverse', subjectMapReverse);
        console.log('teacherMap', teacherMap);
        console.log('sectionMap', sectionMap);

        let defaultClassDuration = 40;

        let maxTeacherWorkLoad = 300;
        let minTeacherWorkLoad = 10;

        defaultClassDuration /= timeDivision;
        maxTeacherWorkLoad /= timeDivision;
        minTeacherWorkLoad /= timeDivision;

        const sectionStartArray = [];
        const sectionConfigurationArray = [];
        const sectionSubjectConfigurationArray = [];
        const sectionLocationArray = [];

        // console.log('🚀 ~ handleButtonClick ~ subjectsStore:', subjectsStore);

        Object.entries(subjectsStore).forEach(([key, value]) => {
            console.log(`Key: ${key}, Value: ${value}`);

            if (value.classDuration < lowestSubjectDuration) {
                lowestSubjectDuration = value.classDuration;
            }
        });

        const commonSubjectCount = 9;

        // const defaultOrder = 0;

        console.log('🚀 ~ handleButtonClick ~ offset:', offset);

        let minTotalClassDurationForTwoBreaks =
            commonSubjectCount * defaultClassDuration;

        defaultClassDuration -= offset;
        breakTimeDuration -= offset;
        minTotalClassDurationForTwoBreaks /= offset;

        for (const [sectionKey, section] of Object.entries(sectionMap)) {
            console.log('🚀 ~ handleButtonClick ~ section:', section);

            sectionStartArray[sectionKey] = section.startTime;

            let totalTimeslot = calculateTotalTimeslot(
                subjectsStore,
                section.subjects,
                numOfSchoolDays
            );

            const numberOfBreak = totalTimeslot >= 10 ? 2 : 1;

            totalTimeslot += numberOfBreak;

            // const notAllowedBreakslotGap = totalTimeslot >= 7 ? 2 : 1;

            let notAllowedBreakslotGap = 0;
            if (totalTimeslot >= 5 && totalTimeslot < 7) {
                notAllowedBreakslotGap = 1;
            } else if (totalTimeslot >= 7) {
                notAllowedBreakslotGap = 3;
            } else if (totalTimeslot >= 10) {
                notAllowedBreakslotGap = 3;
            }
            
            const isDynamicSubjectConsistentDuration = 0;

            sectionConfigurationArray[sectionKey] = packInt8ToInt32(
                numberOfBreak,
                totalTimeslot,
                notAllowedBreakslotGap,
                isDynamicSubjectConsistentDuration
            );

            section.subjectConfigurationIDs.forEach(
                (subjectConfigurationID) => {
                    sectionSubjectConfigurationArray.push(
                        packInt16ToInt32(sectionKey, subjectConfigurationID)
                    );
                }
            );

            const exampleLocation = {
                buildingID: 0,
                floor: 0,
                room: 0,
            };

            sectionLocationArray.push(
                packThreeSignedIntsToInt32(
                    exampleLocation.buildingID,
                    exampleLocation.floor,
                    exampleLocation.room
                )
            );
        }

        console.log(
            '🚀 ~ handleButtonClick ~ sectionStartArray:',
            sectionStartArray
        );

        const sectionLocation = new Int32Array([...sectionLocationArray]);

        const subjectConfigurationSubjectUnits = new Int32Array([
            ...subjectConfigurationSubjectUnitsArray,
        ]);
        const subjectConfigurationSubjectDuration = new Int32Array([
            ...subjectConfigurationSubjectDurationArray,
        ]);
        const subjectConfigurationSubjectFixedTimeslot = new Int32Array([
            ...subjectConfigurationSubjectFixedTimeslotArray,
        ]);
        const subjectConfigurationSubjectFixedDay = new Int32Array([
            ...subjectConfigurationSubjectFixedDayArray,
        ]);
        const subjectConfigurationSubjectIsOverlappable = new Int32Array([
            ...subjectConfigurationSubjectIsOverlappableArray,
        ]);
        const sectionConfiguration = new Int32Array([
            ...sectionConfigurationArray,
        ]);
        const sectionSubjectConfiguration = new Int32Array([
            ...sectionSubjectConfigurationArray,
        ]);

        const maxIterations = 500;
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

        for (const [teacherKey, { subjects }] of Object.entries(teacherMap)) {
            for (const subject of subjects) {
                teacherSubjectArray.push(packInt16ToInt32(teacherKey, subject));
                teacherWeekLoadConfigArray.push(
                    packInt16ToInt32(maxTeacherWorkLoad, minTeacherWorkLoad)
                );
            }
        }

        const teacherSubjects = new Int32Array([...teacherSubjectArray]);
        const teacherWeekLoadConfig = new Int32Array([
            ...teacherWeekLoadConfigArray,
        ]);

        const subjectFixedTeacherSection = new Int32Array([-1]);
        const subjectFixedTeacher = new Int32Array([-1]);

        const teacherBreakThreshold = 4;

        const numOfViolationType = 7;

        const resultTimetableLength =
            totalSections *
            Object.entries(subjectsStore).length *
            numOfSchoolDays;

        const resultViolationLength =
            numOfViolationType * totalSections +
            numOfViolationType * totalTeachers;

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
            subjectConfigurationSubjectDuration:
                subjectConfigurationSubjectDuration,
            subjectConfigurationSubjectFixedTimeslot:
                subjectConfigurationSubjectFixedTimeslot,
            subjectConfigurationSubjectFixedDay:
                subjectConfigurationSubjectFixedDay,
subjectConfigurationSubjectIsOverlappable:
                subjectConfigurationSubjectIsOverlappable,

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
            teacherMiddleTimePointGrowAllowanceForBreakTimeslot:
                teacherMiddleTimePointGrowAllowanceForBreakTimeslot,
            minTotalClassDurationForTwoBreaks:
                minTotalClassDurationForTwoBreaks,
            defaultClassDuration: defaultClassDuration,
            offsetDuration: offset,
            resultTimetableLength: resultTimetableLength,
            resultViolationLength: resultViolationLength,

            enableLogging: false,
        };

        // setTimetableGenerationStatus('running');
        // const { timetable: generatedTimetable, status } = await getTimetable(
        //     params2
        // );
        // console.log('🚀 ~ handleButtonClick ~ status:', status);

        // setTimetableGenerationStatus(status);

        let generatedTimetable = [];

        setTimetableGenerationStatus('running');
        try {
            const { timetable, status } = await getTimetable(params2);

            console.log('🚀 ~ handleButtonClick ~ status:', status);
            setTimetableGenerationStatus(status);

            if (status === 'error') {
                console.error(
                    'Error occurred during timetable generation:',
                    timetable.error
                );
            } else {
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
            timetableMap,
            section_id,
            subject_id,
            teacher_id,
            start,
            end,
            day,
            fieldName1,
            fieldName2,
            containerName
        ) => {
            const timeslotData = {
                section: section_id,
                subject: subject_id,
                teacher: teacher_id,
                fieldName1: fieldName1,
                fieldName2: fieldName2,
                day: day,
                end: end,
            };

            if (timetableMap.has(section_id)) {
                const timetable = timetableMap.get(section_id);
                addToMap(timetable.get('timetable'), start, timeslotData);
            } else {
                const timetable = new Map();
                timetable.set('containerName', containerName);
                timetable.set('timetable', []);
                addToMap(timetable.get('timetable'), start, timeslotData);
                timetableMap.set(section_id, timetable);
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

            addTimeslotToTimetable(
                sectionTimetable,
                section_id,
                subject_id,
                teacher_id,
                start,
                end,
                day,
                subjectsStore[subject_id]?.subject || null,
                teachersStore[teacher_id]?.teacher || null,
                sectionsStore[section_id]?.section
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

            addTimeslotToTimetable(
                teacherTimetable,
                teacher_id,
                subject_id,
                section_id,
                start,
                end,
                day,
                sectionsStore[section_id]?.section,
                subjectsStore[subject_id]?.subject,
                teachersStore[teacher_id]?.teacher
            );
        }

        teacherTakenTime.forEach((timeSet, teacher_id) => {
            let timeArray = Array.from(timeSet);
            timeArray.sort((a, b) => a - b);

            console.log('b teacher_id: ', teacher_id, timeArray);

            teacherTakenTime.set(teacher_id, timeArray); // Update the map correctly using set()
        });

        console.log('teacherTakenTime: ', teacherTakenTime);
        teacherTakenTime.forEach((set, key) => {
            console.log('c key: ', key, set);

            let teacherStartTime = 0;
            let currentTime = teacherStartTime;

            set.forEach((value) => {
                if (value - currentTime > 1) {
                    const result = [];

                    for (let i = currentTime; i <= value; i++) {
                        result.push(i + 1);
                    }

                    const teacher = teacherTimetable.get(key).get('timetable');
                    teacher.push([
                        currentTime == 0 ? currentTime : currentTime + 1,
                        {
                            section: null,
                            subject: null,
                            teacher: null,
                            fieldName1: null,
                            fieldName2: null,
                            day: null,
                            end: value,
                        },
                    ]);

                    // console.log('🚀 ~ s', teacher);
                    // console.log('🚀 ~ set.forEach ~ teacher:', teacher);
                }

                currentTime = value;
            });
        });

        // console.log("timetable", timetableMap);
        console.log('section timetable', sectionTimetable);
        console.log('teacher timetable', teacherTimetable);

        // // // setTimetable(timetableMap);
        setSectionTimetables(sectionTimetable);
        setTeacherTimetables(teacherTimetable);
    };

    const handleSchedExport = () => {
        const sectionWorkbook = XLSX.utils.book_new();
        const teacherWorkbook = XLSX.utils.book_new();

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

            const sectionAdviserId = sectionsStore[sectionKey]
                ? sectionsStore[sectionKey].teacher
                : -1;
            console.log('sectionAdviserId', sectionAdviserId);
            const sectionAdviserName =
                sectionAdviserId && teachersStore[sectionAdviserId]
                    ? teachersStore[sectionAdviserId].teacher
                    : 'N/A';

            const setSched = [];
            const rows = [
                [
                    'Section',
                    sectionTimetables[sectionKey].containerName,
                    '',
                    '',
                    '',
                    '',
                ],
                ['Adviser', sectionAdviserName, '', '', '', ''],
                [
                    'Time',
                    'MONDAY',
                    'TUESDAY',
                    'WEDNESDAY',
                    'THURSDAY',
                    'FRIDAY',
                ],
            ];
            const singleRows = [];
            const merges = [
                { s: { r: 0, c: 1 }, e: { r: 0, c: 5 } },
                { s: { r: 1, c: 1 }, e: { r: 1, c: 5 } },
            ];
            let secRow = 4;

            Object.keys(sectionSchedules).forEach((dayKey) => {
                const timeSchedules = sectionSchedules[dayKey];

                const slotKeys = Object.keys(timeSchedules);

                if (slotKeys.length === 1) {
                    const slotKey = slotKeys[0];
                    const schedule = timeSchedules[slotKey];

                    if (
                        schedule.subject !== null &&
                        schedule.subject !== undefined
                    ) {
                        const schedData =
                            getTimeSlotString(schedule.start) +
                            ' - ' +
                            getTimeSlotString(schedule.end);

                        if (setSched.indexOf(schedData) === -1) {
                            setSched.push(schedData);

                            const newRow1 = [
                                schedData,
                                '',
                                '',
                                schedule.subject,
                                '',
                                '',
                            ];
                            const newRow2 = [
                                '',
                                '',
                                '',
                                schedule.teacher,
                                '',
                                '',
                            ];
                            rows.push(newRow1);
                            rows.push(newRow2);
                            singleRows.push(secRow);
                        }
                    }

                    if (
                        schedule.subject === null &&
                        schedule.teacher === null &&
                        schedule.teacherID === null
                    ) {
                        const schedData =
                            getTimeSlotString(schedule.start) +
                            ' - ' +
                            getTimeSlotString(schedule.end);
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
                        schedData =
                            getTimeSlotString(sched.start) +
                            ' - ' +
                            getTimeSlotString(sched.end);
                        subjects.push(schedData);
                    }

                    let prevSlotKey = 0;
                    slotKeys.forEach((slotKey) => {
                        const schedule = timeSchedules[slotKey];

                        if (
                            schedule.subject !== null &&
                            schedule.subject !== undefined
                        ) {
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
            worksheet['!cols'] = [
                { wch: 20 },
                { wch: 15 },
                { wch: 15 },
                { wch: 15 },
                { wch: 15 },
                { wch: 15 },
            ];

            XLSX.utils.book_append_sheet(
                sectionWorkbook,
                worksheet,
                `${sectionTimetables[sectionKey].containerName}`
            );
        });

        Object.keys(teacherTimetables).forEach((teacherKey) => {
            const teacherSchedules = teacherTimetables[teacherKey];
            const setSched = [];
            const rows = [
                [
                    'Teacher',
                    teacherTimetables[teacherKey].containerName,
                    '',
                    '',
                    '',
                    '',
                ],
                [
                    'Time',
                    'MONDAY',
                    'TUESDAY',
                    'WEDNESDAY',
                    'THURSDAY',
                    'FRIDAY',
                ],
            ];
            const merges = [{ s: { r: 0, c: 1 }, e: { r: 0, c: 5 } }];

            Object.keys(teacherSchedules).forEach((dayKey) => {
                const timeSchedules = teacherSchedules[dayKey];
                const slotKeys = Object.keys(timeSchedules);

                if (slotKeys.length === 1) {
                    const slotKey = slotKeys[0];
                    const schedule = timeSchedules[slotKey];

                    if (
                        schedule.subject !== null &&
                        schedule.subject !== undefined
                    ) {
                        const schedData =
                            getTimeSlotString(schedule.start) +
                            ' - ' +
                            getTimeSlotString(schedule.end);

                        if (setSched.indexOf(schedData) === -1) {
                            setSched.push(schedData);

                            const newRow1 = [
                                schedData,
                                '',
                                '',
                                schedule.subject,
                                '',
                                '',
                            ];
                            const newRow2 = [
                                '',
                                '',
                                '',
                                schedule.section,
                                '',
                                '',
                            ];
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
                        schedData =
                            getTimeSlotString(sched.start) +
                            ' - ' +
                            getTimeSlotString(sched.end);
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

                        if (
                            schedule.subject !== null &&
                            schedule.subject !== undefined
                        ) {
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
            worksheet['!cols'] = [
                { wch: 20 },
                { wch: 15 },
                { wch: 15 },
                { wch: 15 },
                { wch: 15 },
                { wch: 15 },
            ];

            XLSX.utils.book_append_sheet(
                teacherWorkbook,
                worksheet,
                `${teacherTimetables[teacherKey].containerName}`
            );
        });

        XLSX.writeFile(sectionWorkbook, 'section_schedules.xlsx');
        XLSX.writeFile(teacherWorkbook, 'teacher_schedules.xlsx');
    };

    const handleClearAndRefresh = () => {
        // clearAllEntriesAndResetIDs().then(() => {
        //     setRefreshKey((prevKey) => prevKey + 1); // Increment refreshKey to trigger re-render
        // });
        clearAllEntriesAndResetIDs();
    };

    const handleNumOfSchoolDaysChange = () => {
        localStorage.setItem('numOfSchoolDays', numOfSchoolDays);

        if (numOfSchoolDays === prevNumOfSchoolDays) return;
        setPrevNumOfSchoolDays(numOfSchoolDays);

        if (Object.keys(programsStore).length === 0) return;

        // Precompute values
        const classCountLookup = {};
        Object.entries(subjectsStore).forEach(([subjectID, subject]) => {
            (classCountLookup[subjectID] = Math.ceil(
                subject.weeklyMinutes / subject.classDuration
            )),
                numOfSchoolDays;
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
                    const fixedPositions =
                        newProgram[grade].fixedPositions[subId];

                    for (let i = 0; i < fixedDays.length; i++) {
                        if (fixedDays[i] > numOfSchoolDays) {
                            fixedDays[i] = 0;
                            fixedPositions[i] = 0;
                        }
                    }

                    const numOfClasses = Math.min(
                        classCountLookup[subId],
                        numOfSchoolDays
                    );

                    const dayPositionMap = new Map();

                    fixedDays.forEach((day, index) => {
                        const pos = fixedPositions[index];
                        if (
                            (day !== 0 && pos !== 0) ||
                            (day !== 0 && pos === 0) ||
                            (day === 0 &&
                                pos !== 0 &&
                                !dayPositionMap.has(`${day}-${pos}`))
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

                    newProgram[grade].fixedDays[subId] = result.map(
                        ([day]) => day
                    );
                    newProgram[grade].fixedPositions[subId] = result.map(
                        ([_, pos]) => pos
                    );
                });
            });

            console.log('originalProgram:', originalProgram);
            console.log('newProgram:', newProgram);

            if (originalProgram !== newProgram) {
                dispatch(
                    editProgram({
                        programId: newProgram.id,
                        updatedProgram: {
                            program: newProgram.program,
                            7: {
                                subjects: newProgram[7].subjects,
                                fixedDays: newProgram[7].fixedDays,
                                fixedPositions: newProgram[7].fixedPositions,
                                shift: newProgram[7].shift,
                                startTime: getTimeSlotIndex(
                                    newProgram[7].startTime || '06:00 AM'
                                ),
                            },
                            8: {
                                subjects: newProgram[8].subjects,
                                fixedDays: newProgram[8].fixedDays,
                                fixedPositions: newProgram[8].fixedPositions,
                                shift: newProgram[8].shift,
                                startTime: getTimeSlotIndex(
                                    newProgram[8].startTime || '06:00 AM'
                                ),
                            },
                            9: {
                                subjects: newProgram[9].subjects,
                                fixedDays: newProgram[9].fixedDays,
                                fixedPositions: newProgram[9].fixedPositions,
                                shift: newProgram[9].shift,
                                startTime: getTimeSlotIndex(
                                    newProgram[9].startTime || '06:00 AM'
                                ),
                            },
                            10: {
                                subjects: newProgram[10].subjects,
                                fixedDays: newProgram[10].fixedDays,
                                fixedPositions: newProgram[10].fixedPositions,
                                shift: newProgram[10].shift,
                                startTime: getTimeSlotIndex(
                                    newProgram[10].startTime || '06:00 AM'
                                ),
                            },
                        },
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

                const numOfClasses = Math.min(
                    classCountLookup[subId],
                    numOfSchoolDays
                );

                const dayPositionMap = new Map();

                fixedDays.forEach((day, index) => {
                    const pos = fixedPositions[index];
                    if (
                        (day !== 0 && pos !== 0) ||
                        (day !== 0 && pos === 0) ||
                        (day === 0 &&
                            pos !== 0 &&
                            !dayPositionMap.has(`${day}-${pos}`))
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
                newSection.fixedPositions[subId] = result.map(
                    ([_, pos]) => pos
                );
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
                            startTime: getTimeSlotIndex(
                                newSection.startTime || '06:00 AM'
                            ),
                        },
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

        // Add the event listener
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Cleanup the event listener when the component unmounts
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [timetableGenerationStatus]); // The effect depends on the isProcessRunning state

    useEffect(() => {
        handleNumOfSchoolDaysChange();
    }, [numOfSchoolDays]);

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

    return (
        <div className="App container mx-auto px-4 py-6">
            <div className="mb-6 flex justify-between items-center">
                <Breadcrumbs title="Timetable" links={links} />
                <div className="flex items-center gap-2">
                    <ExportImportDBButtons
                        onClear={handleClearAndRefresh}
                        numOfSchoolDays={numOfSchoolDays}
                    />
                    <button
                        className={clsx('btn btn-primary', {
                            'cursor-not-allowed':
                                timetableGenerationStatus === 'running',
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
                            <div className="flex gap-2 items-center">
                                <span>Generating</span>
                                <span className="loading loading-spinner loading-xs"></span>
                            </div>
                        ) : (
                            'Generate Timetable'
                        )}
                    </button>
                </div>
            </div>

            <div className="mb-6">
                <Configuration
                    numOfSchoolDays={numOfSchoolDays}
                    setNumOfSchoolDays={setNumOfSchoolDays}
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
                <div className="mt-6 bg-base-100 p-6 rounded-lg shadow-lg">
                    <h2 className="text-lg font-semibold mb-4">Subjects</h2>
                    <SubjectListContainer numOfSchoolDays={numOfSchoolDays} />
                </div>

                <div className="mt-6 bg-base-100 p-6 rounded-lg shadow-lg">
                    <h2 className="text-lg font-semibold mb-4">Teachers</h2>
                    <TeacherListContainer />
                </div>

                {/* Program Lists */}
                <div className="mt-6 bg-base-100 p-6 rounded-lg shadow-lg">
                    <h2 className="text-lg font-semibold mb-4">Programs</h2>
                    <ProgramListContainer numOfSchoolDays={numOfSchoolDays} />
                </div>

                {/* Section List with the Generate Timetable Button */}
                <div className="mt-6">
                    <div className="bg-base-100 p-6 rounded-lg shadow-lg">
                        <h2 className="text-lg font-semibold mb-4">Sections</h2>
                        <SectionListContainer
                            numOfSchoolDays={numOfSchoolDays}
                        />
                        <div className="mt-4">
                            <ViolationList violations={violations} />
                        </div>
                    </div>
                </div>
            </div>

            {Object.keys(sectionTimetables).length > 0 &&
                Object.keys(teacherTimetables).length > 0 && (
                    <button
                        className="btn btn-secondary bg-red-500 w-32 mt-6"
                        onClick={handleSchedExport}
                    >
                        EXPORT SCHEDULES
                    </button>
                )}

            <GeneratedTimetable
                timetables={sectionTimetables}
                field={'section'}
            />

            <GeneratedTimetable
                timetables={teacherTimetables}
                field={'teacher'}
            />

            {/* <div className="grid grid-cols-1 col-span-full gap-4 sm:grid-cols-2"></div> */}
        </div>
    );
}

export default Timetable;

// /* eslint-disable no-undef */
// /* eslint-disable  no-restricted-globals */
// /* eslint-disable  no-unused-expressions */
// /* eslint-disable import/no-amd */
