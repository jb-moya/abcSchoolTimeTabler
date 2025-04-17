import { useSelector } from 'react-redux';
import formatFirebaseDate from '../../../utils/formatDate';

function NotificationBodyRightDrawer() {
    const { logs: userLogs } = useSelector((state) => state.notificationUserLogs);
    console.log('🚀 ~ userLogsuserLogsuserLogsuserLogsuserLogsuserLogs ~ logs:', userLogs);

    const getBgClassByOperation = (operation) => {
        switch (operation) {
            case 'added':
                return 'bg-green-100';
            case 'removed':
                return 'bg-red-100';
            case 'updated':
            case 'modified':
                return 'bg-yellow-100';
            default:
                return 'bg-gray-100';
        }
    };

    return (
        <div className='p-4 space-y-3'>
            {userLogs && userLogs.length > 0 ? (
                userLogs
                    .slice(0, 15)
                    .reverse()
                    .map((log, i) => (
                        <div
                            key={i}
                            className={`card p-4 rounded-xl shadow-sm grid gap-1 ${getBgClassByOperation(log.operation)}`}
                        >
                            <div className='text-sm text-gray-700'>
                                <span className='font-semibold'>{log.username}</span> {log.operation}{' '}
                                <span className='font-semibold'>{log.item}</span> in{' '}
                                <span className='font-semibold'>{log.collectionName}</span>.
                            </div>
                            <div className='text-xs text-gray-500 flex items-center gap-2'>
                                <span>{formatFirebaseDate(log.date)}</span>
                            </div>
                        </div>
                    ))
            ) : (
                <div className='text-center text-gray-500 mt-8'>No activity logs yet.</div>
            )}
        </div>
    );
}

export default NotificationBodyRightDrawer;
