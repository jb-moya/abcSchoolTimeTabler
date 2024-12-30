export const generateTimeSlots = (interval = 5) => {
    const timeSlots = [];
    let timeMap = new Map();
    let hours = 0;
    let minutes = 0;
    let index = 0;

    while (hours < 24) { // Stop at 11:59 PM
        const suffix = hours < 12 ? "AM" : "PM";
        const formattedHour = (hours % 12 === 0 ? 12 : hours % 12).toString().padStart(2, "0");
        const formattedMinutes = minutes.toString().padStart(2, "0");

        const timeString = `${formattedHour}:${formattedMinutes} ${suffix}`;
        timeSlots.push(timeString);
        timeMap.set(timeString, index);

        // Increment time by the specified interval
        minutes += interval;
        if (minutes >= 60) {
            minutes = 0;
            hours += 1;
        }
        index++;
    }

    return { timeSlots, timeMap };
};

// Generate the timeSlots and the map for fast lookups
const { timeSlots, timeMap } = generateTimeSlots(5);

export const getTimeSlotIndex = (timeString) => {
    return timeMap.get(timeString) ?? -1; // Return -1 if timeString is not found
};

export const getTimeSlotString = (index) => {
    if (index >= 0 && index < timeSlots.length) {
        return timeSlots[index];
    } else {
        return null;
    }
};
