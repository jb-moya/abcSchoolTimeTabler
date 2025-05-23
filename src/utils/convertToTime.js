/**
 * Converts a given number of steps into a time, starting from 6:00 AM.
 * Each step corresponds to a 5-minute increment.
 *
 * @param {number} num - The number of steps to add to the starting time (6:00 AM).
 * @returns {string} - The resulting time in the format "h:mm AM/PM".
 *
 * @example
 * convertToTime(0); // Returns "6:00 AM"
 * convertToTime(36); // Returns "9:00 AM"
 * convertToTime(90); // Returns "1:30 PM"
 */
function convertToTime(num) {
    // Starting time is 6:00 AM
    let startHour = 6;
    let startMinute = 0;

    // Each step increases the time by 5 minutes
    let totalMinutes = num * 5;

    // Calculate the new hours and minutes
    let hours = startHour + Math.floor(totalMinutes / 60);
    let minutes = startMinute + (totalMinutes % 60);

    // Adjust if the minutes overflow (not needed in this case but good to have)
    if (minutes >= 60) {
        hours += Math.floor(minutes / 60);
        minutes = minutes % 60;
    }

    // Determine AM/PM
    let period = hours >= 12 ? 'PM' : 'AM';
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12; // Handle the midnight case (12 AM)

    // Pad hours with 0 if it's a single digit
    let formattedHours = hours.toString().padStart(2, '0');

    // Return the formatted time with two-digit hours and minutes
    return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export { convertToTime };
