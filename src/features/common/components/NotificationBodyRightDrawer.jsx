import { useSelector } from 'react-redux';
import { GrClear } from 'react-icons/gr';
import { useDispatch } from 'react-redux';
import { clearLogs } from '../../slice/notificationUserLogs';

function NotificationBodyRightDrawer() {
    const { logs: userLogs } = useSelector((state) => state.notificationUserLogs);
    const dispatch = useDispatch();

    const getBgClassByOperation = (operation) => {
        switch (operation) {
            case 'added':
                return 'bg-green-100';
            case 'deleted':
                return 'bg-red-100';
            case 'edited':
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
                                <span>{log.date}</span>
                            </div>
                        </div>
                    ))
            ) : (
                <div className='text-center text-gray-500 mt-8'>No activity logs yet.</div>
            )}

            <button
                className='btn btn-xs w-full self-end btn-ghost'
                onClick={() => {
                    dispatch(clearLogs());
                }}
            >
                <GrClear />
                Clear Notifications
            </button>
        </div>
    );
}

export default NotificationBodyRightDrawer;
