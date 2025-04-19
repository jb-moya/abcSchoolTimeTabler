// useSchedule.js
import { useState } from 'react';
import schedules from '../../indexedDB/savedSearchedSchedules';

export function useSchedule() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [scheduleNameAndID, setScheduleNameAndID] = useState([]);

    const getAllNameAndID = async (name) => {
        try {
            const schedulesData = await schedules.getAll(name);
            const simplified = schedulesData.map(({ id, n }) => ({ id, n }));

            setLoading(true);
            console.log('🚀 ~ getSchedule ~ schedule:', schedulesData);
            console.log("🚀 ~ getAllNameAndID ~ simplified:", simplified)
            // setSchedule(simplified);
            setLoading(false);
        } catch (err) {
            setError(err);
            setLoading(false);
        }
    };

    return { getAllNameAndID, scheduleNameAndID, loading, error };
}

