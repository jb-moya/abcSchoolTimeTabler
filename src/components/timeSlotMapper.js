const timeSlots = [
    "06:00 AM", "06:10 AM", "06:20 AM", "06:30 AM", "06:40 AM", "06:50 AM",
    "07:00 AM", "07:10 AM", "07:20 AM", "07:30 AM", "07:40 AM", "07:50 AM",
    "08:00 AM", "08:10 AM", "08:20 AM", "08:30 AM", "08:40 AM", "08:50 AM",
    "09:00 AM", "09:10 AM", "09:20 AM", "09:30 AM", "09:40 AM", "09:50 AM",
    "10:00 AM", "10:10 AM", "10:20 AM", "10:30 AM", "10:40 AM", "10:50 AM",
    "11:00 AM", "11:10 AM", "11:20 AM", "11:30 AM", "11:40 AM", "11:50 AM",
    "12:00 PM", "12:10 PM", "12:20 PM", "12:30 PM", "12:40 PM", "12:50 PM",
    "01:00 PM", "01:10 PM", "01:20 PM", "01:30 PM", "01:40 PM", "01:50 PM",
    "02:00 PM", "02:10 PM", "02:20 PM", "02:30 PM", "02:40 PM", "02:50 PM",
    "03:00 PM", "03:10 PM", "03:20 PM", "03:30 PM", "03:40 PM", "03:50 PM",
    "04:00 PM", "04:10 PM", "04:20 PM", "04:30 PM", "04:40 PM", "04:50 PM",
    "05:00 PM", "05:10 PM", "05:20 PM", "05:30 PM", "05:40 PM", "05:50 PM",
    "06:00 PM", "06:10 PM", "06:20 PM", "06:30 PM", "06:40 PM", "06:50 PM",
    "07:00 PM", "07:10 PM", "07:20 PM", "07:30 PM", "07:40 PM", "07:50 PM",
    "08:00 PM"
];

export const getTimeSlotIndex = (timeString) => {
    return timeSlots.indexOf(timeString);
};

export const getTimeSlotString = (index) => {
    if (index >= 0 && index < timeSlots.length) {
        return timeSlots[index];
    } else {
        return null;
    }
};