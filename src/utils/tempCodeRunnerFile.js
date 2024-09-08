function distributeBreaks(timeslot, breaks = 1) {
    let breakPositions = [];

    if (breaks === 1) {
        // Place the single break in the middle of the timeslot
        breakPositions.push(Math.round(timeslot / 2));
    } else {
        // Calculate the interval between the breaks
        let interval = timeslot / (breaks + 1);

        // Calculate the break positions and round them to the nearest integer
        for (let i = 1; i <= breaks; i++) {
            breakPositions.push(Math.round(i * interval));
        }
    }

    return breakPositions;
}

// Example usage:
let timeslot = 13;
let breakPositions = distributeBreaks(timeslot, 2);
console.log(breakPositions);

// 1 2 3 [4] 5 6 7 8 [9] 10 11 12 13