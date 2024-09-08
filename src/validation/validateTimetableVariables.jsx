const validateTimetableVariables = ({ sections, teachers, subjects, programs }) => {
    const violations = [];

    console.log("teachers subjects", teachers);
    console.log("sections subjects", sections);

    if (
        Object.keys(sections).length === 0 ||
        Object.keys(teachers).length === 0 ||
        Object.keys(subjects).length === 0 ||
        Object.keys(programs).length === 0
    ) {
        return { canProceed: false, violations: [{ type: "emptyDatabase" }] };
    }

    const includedSubjects = new Set();
    const teachersCoveredSubjects = new Set();

    Object.values(sections).forEach((section) => {
        // console.log("section", section);
        for (const subjectId of Object.keys(section.subjects)) {
            const intSubjectId = parseInt(subjectId, 10);
            console.log("typeof(subjectId)", typeof subjectId);
            includedSubjects.add(intSubjectId);
        }
    });

    Object.values(teachers).forEach((teacher) => {
        // console.log("teacher", teacher);
        for (const subject of teacher.subjects) {
            teachersCoveredSubjects.add(subject);
        }
    });

    console.log("includedSubjects", includedSubjects);
    console.log("teachersCoveredSubjects", teachersCoveredSubjects);

    function isSubset(subset, superset) {
        return Array.from(subset).every((element) => superset.has(element));
    }

    const isCovered = isSubset(teachersCoveredSubjects, includedSubjects);
    // console.log("isCovered", isCovered);

    function hasAtLeastOneUnique(set1, set2) {
        for (const element of set1) {
            if (!set2.has(element)) {
                return true;
            }
        }
        return false;
    }

    const isInsufficientTeacher = hasAtLeastOneUnique(
        includedSubjects,
        teachersCoveredSubjects
    );

    const isSurplusTeacher = hasAtLeastOneUnique(
        teachersCoveredSubjects,
        includedSubjects
    );

    const subjectsNotCovered = [];
    if (isInsufficientTeacher) {
        includedSubjects.forEach((subject) => {
            if (!teachersCoveredSubjects.has(subject)) {
                subjectsNotCovered.push(subject);
            }
        });
    }

    const teachersNotCovered = {};
    if (isSurplusTeacher) {
        Object.values(teachers).forEach((teacher) => {
            for (const subject of teacher.subjects) {
                if (!includedSubjects.has(subject)) {
                    if (!teachersNotCovered[teacher.id]) {
                        teachersNotCovered[teacher.id] = [];
                    }

                    teachersNotCovered[teacher.id].push(subject);
                }
            }
        });
    }

    if (Object.keys(teachersNotCovered).length > 0) {
        violations.push({
            type: "teachersNotCovered",
            variable: teachersNotCovered,
        });
    }

    if (subjectsNotCovered.length > 0) {
        violations.push({
            type: "subjectsNotCovered",
            variable: subjectsNotCovered,
        });
    }

    // console.log("subjectsNotCovered", subjectsNotCovered);
    // console.log("isInsufficientTeacher", isInsufficientTeacher);
    // console.log("teachersNotCovered", teachersNotCovered);
    // console.log("isSurplusTeacher", isSurplusTeacher);

    return { canProceed: subjectsNotCovered.length == 0, violations };
};

export default validateTimetableVariables;
