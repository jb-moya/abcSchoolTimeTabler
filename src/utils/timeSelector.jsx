import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CiClock1 } from 'react-icons/ci';

function TimeSelector({ interval = 5, time = '06:00 AM', setTime = () => {}, am = 0, pm = 0 }) {
    const [isPanelVisible, setIsPanelVisible] = useState(false);
    const [selectedTime, setSelectedTime] = useState({ hour: '', minute: '', period: '' });

    const ref = useRef();
    const lastTimeRef = useRef();

    const hours = useMemo(() => Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')), []);
    const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')), []);
    const periods = useMemo(() => {
        if (am === 1 && pm === 0) return ['AM']; // Show only AM
        if (am === 0 && pm === 1) return ['PM']; // Show only PM
        return ['AM', 'PM']; // Show both AM and PM
    }, [am, pm]);

    const handleButtonClick = () => setIsPanelVisible((prev) => !prev);

    const updateSelectedTime = (key, value) => {
        setSelectedTime((prev) => ({ ...prev, [key]: value }));
    };

    useEffect(() => {
        if (time !== lastTimeRef.current) {
            lastTimeRef.current = time;

            const [hourAndMinute, period] = time.split(' ');
            const [hour, minute] = hourAndMinute.split(':');

            setSelectedTime({ hour, minute, period });
        }
    }, [time]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const newTime = `${selectedTime.hour}:${selectedTime.minute} ${selectedTime.period}`;
            if (newTime !== time) {
                setTime(newTime);
            }
        }, 300); // Debounce time updates

        return () => clearTimeout(timeoutId);
    }, [selectedTime]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                setIsPanelVisible(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={ref} className='relative'>
            <div
                className={`flex flex-wrap h-12 bg-base-100 border border-base-content border-opacity-20 text-base ${
                    isPanelVisible ? 'rounded-t-md' : 'rounded-md'
                }`}
            >
                <div className='w-5/6 h-full'>
                    <div className='p-4 w-full h-full flex items-center justify-start'>
                        {selectedTime.hour && selectedTime.minute && selectedTime.period
                            ? `${selectedTime.hour}:${selectedTime.minute} ${selectedTime.period}`
                            : '--:--- --'}
                    </div>
                </div>
                <button className='w-1/6 flex items-center justify-center ' onClick={handleButtonClick}>
                    <CiClock1 size={20} />
                </button>
            </div>

            {isPanelVisible && (
                <div className='w-5/6 absolute p-2 flex bg-base-100 border border-base-content border-opacity-20 rounded-b-md shadow-lg z-[1000]'>
                    {/* Hours */}
                    <div className='w-1/3 p-1 border-r border-gray-300 overflow-y-auto max-h-48'>
                        {hours.map((hour) => (
                            <div
                                key={hour}
                                className={`p-2 text-center cursor-pointer ${
                                    selectedTime.hour === hour ? 'font-bold text-blue-500' : ''
                                }`}
                                onClick={() => updateSelectedTime('hour', hour)}
                            >
                                {hour}
                            </div>
                        ))}
                    </div>

                    {/* Minutes */}
                    <div className='w-1/3 p-1 border-r border-gray-300 overflow-y-auto max-h-48'>
                        {minutes
                            .filter((minute) => minute % interval === 0)
                            .map((minute) => (
                                <div
                                    key={minute}
                                    className={`p-2 text-center cursor-pointer ${
                                        selectedTime.minute === minute ? 'font-bold text-blue-500' : ''
                                    }`}
                                    onClick={() => updateSelectedTime('minute', minute)}
                                >
                                    {minute}
                                </div>
                            ))}
                    </div>

                    {/* AM/PM */}
                    <div className='w-1/3 p-1'>
                        {periods.map((period) => (
                            <div
                                key={period}
                                className={`p-2 text-center cursor-pointer ${
                                    selectedTime.period === period ? 'font-bold text-blue-500' : ''
                                }`}
                                onClick={() => updateSelectedTime('period', period)}
                            >
                                {period}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default TimeSelector;
