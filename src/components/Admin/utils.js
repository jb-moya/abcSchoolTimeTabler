// Utility to generate dynamic time slots
export function generateTimeSlots(startTime, endTime) {
    const timeSlots = [];

    const parseTime = (time) => {
        const [hour, minute] = time.match(/\d+/g).map(Number);
        const isPM = time.toLowerCase().includes('pm');
        return (hour % 12) + (isPM ? 12 : 0) + minute / 60;
    };

    const formatTime = (hours) => {
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        const period = h >= 12 ? 'PM' : 'AM';
        const formattedHour = h % 12 === 0 ? 12 : h % 12;
        return `${formattedHour.toString().padStart(2, '0')}:${m
            .toString()
            .padStart(2, '0')}${period}`;
    };

    let current = parseTime(startTime);
    const end = parseTime(endTime);

    while (current <= end) {
        timeSlots.push(formatTime(current));
        current += 1; // Increment by 1 hour
    }

    return timeSlots;
}
