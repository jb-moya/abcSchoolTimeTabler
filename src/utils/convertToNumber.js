function convertToNumber(timeStr) {
    // Parse the input time string
    let [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    // Convert to 24-hour format for easier calculation
    if (period === 'PM' && hours !== 12) {
        hours += 12;
    } else if (period === 'AM' && hours === 12) {
        hours = 0;
    }

    // Starting time is 6:00 AM
    const startHour = 6;
    const startMinute = 0;

    // Calculate the total minutes since 6:00 AM
    const totalMinutes = (hours - startHour) * 60 + (minutes - startMinute);

    // Each step corresponds to 10 minutes
    const num = Math.floor(totalMinutes / 10);

    return num >= 0 ? num : 0; // Ensure non-negative values
}

export { convertToNumber };
