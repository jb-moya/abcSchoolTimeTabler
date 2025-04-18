export default function formatFirebaseDate(dateInput) {
    try {
        let date;

        if (!dateInput) return null;

        if (typeof dateInput.toDate === 'function') {
            date = dateInput.toDate();
        } else if (dateInput instanceof Date) {
            date = dateInput;
        } else {
            return null;
        }

        if (!(date instanceof Date) || isNaN(date.getTime())) {
            return null;
        }

        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    } catch (error) {
        console.error('Error formatting Firebase date:', error);
        return null;
    }
}
