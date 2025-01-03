const calculateTotalClass = (subjects, subjectList, numOfSchoolDays) => {
    const totalNumOfClasses = subjectList.reduce((total, subject) => {
        const classesPerWeek = Math.min(
            Math.ceil(
                subjects[subject].weeklyMinutes /
                    subjects[subject].classDuration
            ),
            numOfSchoolDays
        );
        return total + classesPerWeek;
    }, 0);

    return totalNumOfClasses;
};

export default calculateTotalClass;
