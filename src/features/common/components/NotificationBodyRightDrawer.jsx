import { useSelector } from 'react-redux';
import formatDate from '../../../utils/formatDate';

function NotificationBodyRightDrawer() {
    const { logs: userLogs } = useSelector((state) => state.logs);

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

    const getTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;

        const seconds = Math.floor(diffMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
        if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;

        const days = Math.floor(hours / 24);
        return `${days} day${days !== 1 ? 's' : ''} ago`;
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
                                <span>{getTimeAgo(log.date)}</span> • <span>{formatDate(log.date)}</span>
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
