// Utility to convert string table to functional map table
export function convertStringDataToMap(stringData) {
    const dataMap = new Map();
    const parsedData = JSON.parse(stringData);

    parsedData.forEach((value, index) => {
        const containerName = value[0];
        const tableValue = value[1];

        let type = '';
        for (const row of tableValue) {
            if (row[0]) {
                const initType = row[0];
                if (initType === 's') {
                    type = 'Section';
                } else if (initType === 't') {
                    type = 'Teacher';
                }
                break;
            }
        }

        let setTableKey = `${type}: ${containerName} - ${index}`;

        if (!dataMap.has(setTableKey)) {
            dataMap.set(setTableKey, new Map());
        }

        const scheduleMap = dataMap.get(setTableKey);
        for (const val of tableValue) {
            const type = val[0];
            const teacherID = val[1];
            const teacher = val[2];
            const sectionID = val[3];
            const section = val[4];
            const subjectID = val[5];
            const subject = val[6];
            const partnerType = type === 't' ? 's' : 't';
            const timeRange = val[7].split('-');
            const [start, end] = timeRange.map(Number);
            const day = val[8];

            if (day === 0) {
                for (let i = 1; i <= 5; i++) {
                    let scheduleKey = `${sectionID ?? 'n'}-${teacherID ?? 'n'}-${subjectID ?? 'n'}-${i ?? 'n'}-${type ?? 'n'}`;
                    let duplicate = false;
                    if (scheduleMap.has(scheduleKey)) {
                        duplicate = true;

                        scheduleKey = `a-${sectionID ?? 'n'}-${teacherID ?? 'n'}-${subjectID ?? 'n'}-${i ?? 'n'}-${type ?? 'n'}`;
                    }

                    let keyToFind = scheduleKey.replace(/[^-]+$/, partnerType ?? 'n');

                    scheduleMap.set(scheduleKey, {
                        start: start - 72,
                        end: end - 72,
                        sectionID: sectionID,
                        subject: subject,
                        subjectID: subjectID,
                        teacherID: teacherID,
                        tableKey: setTableKey,
                        partnerKey: keyToFind,
                        id: scheduleKey,
                        dynamicID: scheduleKey,
                        day: i,
                        overlap: false,
                        type: type,
                        additional: duplicate ? true : false,
                        containerName: containerName,
                        ...(type === 't' && { section: section }),
                        ...(type === 's' && { teacher: teacher }),
                    });
                }
            } else {
                let scheduleKey = `${sectionID ?? 'n'}-${teacherID ?? 'n'}-${subjectID ?? 'n'}-${day ?? 'n'}-${type ?? 'n'}`;

                let duplicate = false;
                if (scheduleMap.has(scheduleKey)) {
                    duplicate = true;
                    scheduleKey = `a-${sectionID ?? 'n'}-${teacherID ?? 'n'}-${subjectID ?? 'n'}-${day ?? 'n'}-${type ?? 'n'}`;
                }
                let keyToFind = scheduleKey.replace(/[^-]+$/, partnerType ?? 'n');

                scheduleMap.set(scheduleKey, {
                    start: start - 72,
                    end: end - 72,
                    sectionID: section,
                    subject: subject,
                    subjectID: subjectID,
                    teacherID: teacherID,
                    tableKey: setTableKey,
                    partnerKey: keyToFind,
                    type: type,
                    id: scheduleKey,
                    dynamicID: scheduleKey,
                    overlap: false,
                    day: day,
                    additional: duplicate ? true : false,
                    containerName: containerName,
                    ...(type === 't' && { section: section }),
                    ...(type === 's' && { teacher: teacher }),
                });
            }
        }
    });
    return dataMap;
}
