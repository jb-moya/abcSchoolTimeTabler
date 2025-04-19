function mapToArrayDeploy(map, buildings, sections) {
    if (!(map instanceof Map)) return map;

    let tableArray = [];
    Array.from(map.entries()).forEach(([keyTable, table]) => {
        let tableValue = [];
        let containerName = '';
        for (const row of table) {
            if (row[1].containerName) {
                containerName = row[1].containerName;
                break; // Exit the loop early
            }
        }

        tableValue.push(containerName);
        let rowArray = [];

        let type = table?.entries()?.next()?.value?.[1]?.type ?? '';

        Array.from(table.entries()).forEach(([keyCell, cellBlocks]) => {
            const currSectionID = cellBlocks.sectionID;
            const sectionRoom =
                buildings[sections[currSectionID]?.roomDetails?.buildingId]?.rooms[
                    sections[currSectionID]?.roomDetails?.floorIdx
                ][sections[currSectionID]?.roomDetails?.roomIdx].roomName;

            let cellArray = [];
            cellArray.push(cellBlocks.type);
            cellArray.push(cellBlocks.teacherID);
            cellArray.push(cellBlocks.teacher);
            cellArray.push(cellBlocks.sectionID);
            cellArray.push(cellBlocks.section);
            cellArray.push(cellBlocks.subjectID);
            cellArray.push(cellBlocks.subject);
            const timeString = `${cellBlocks.start}-${cellBlocks.end}`;
            cellArray.push(timeString);
            cellArray.push(cellBlocks.day);
            cellArray.push(cellBlocks.type === 't' ? sectionRoom : '');
            rowArray.push(cellArray);
        });
        tableValue.push(rowArray);
        tableValue.push(type);

        tableArray.push(tableValue);
    });

    return tableArray;
}

export default mapToArrayDeploy;
