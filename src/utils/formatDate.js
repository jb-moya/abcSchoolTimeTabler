export default function formatFirebaseDate(dateInput) {
    try {
        if (!dateInput || typeof dateInput.toDate !== 'function') {
            return null;
        }

        const jsDate = dateInput.toDate();

        if (!(jsDate instanceof Date) || isNaN(jsDate.getTime())) {
            return null;
        }

        return jsDate.toLocaleString(undefined, {
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
