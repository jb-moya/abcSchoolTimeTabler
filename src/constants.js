import { a } from "motion/react-client";

export const APP_CONFIG = {
    PERMISSIONS: [
        'Generate Timetable',
        'Modify Subjects and Programs',
        'Modify Teachers',
        'Modify Sections',
        'Modify Departments',
        'Room Utilization',
        'Modify TimeTable',
    ],
};

export const COLLECTION_ABBREVIATION = {
    SUBJECTS: 'sb',
    PROGRAMS: 'p',
    SECTIONS: 's',
    RANKS: 'rk',
    TEACHERS: 't',
    DEPARTMENTS: 'd',
    BUILDINGS: 'b',
    SCHEDULES: 'sc',
    TIMETABLE_CONFIGURATIONS: 'tc',
};

export const ABBREVIATION_COLLECTION = {
    sb: 'subjects',
    p: 'programs',
    s: 'sections',
    rk: 'ranks',
    t: 'teachers',
    d: 'departments',
    b: 'buildings',
    sc: 'schedules',
    tc: 'timetable configurations',
};

export const ABBREVIATION_OPERATION = {
    a: 'added',
    e: 'edited',
    d: 'deleted',
}