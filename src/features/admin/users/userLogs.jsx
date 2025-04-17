import { useState } from 'react';
import { useSelector } from 'react-redux';
import formatDate from '../../../utils/formatDate';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { resetLogs } from '../../slice/userLogsSlice';
import { fetchLogs } from '../../slice/userLogsSlice';
import { getCountFromServer } from 'firebase/firestore';
import { collection, query } from 'firebase/firestore';
import { firestore } from '../../../firebase/firebase';
import { toast } from 'sonner';

const UserLogs = () => {
    const dispatch = useDispatch();
    const { logs: userLogs, loading, lastVisible } = useSelector((state) => state.userLogs);

    const itemsPerPage = 20;

    const [logsCount, setLogsCount] = useState(0);
    const [loadingLogsCount, setLoadingLogsCount] = useState(true);
    const [errorLogsCount, setErrorLogsCount] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Fetch total count of logs
    useEffect(() => {
        const fetchCount = async () => {
            try {
                setLoadingLogsCount(true);
                const q = query(collection(firestore, 'logs'));
                const snapshot = await getCountFromServer(q);
                setLogsCount(snapshot.data().count);
            } catch (err) {
                console.error('Failed to fetch count:', err);
                setErrorLogsCount('Error fetching count');
                toast.error('Failed to fetch total logs count.');
            } finally {
                setLoadingLogsCount(false);
            }
        };

        fetchCount();
    }, []);

    // Initial logs fetch
    useEffect(() => {
        dispatch(resetLogs());
        dispatch(fetchLogs({ lastVisible: null, limitItems: itemsPerPage }));
        setCurrentPage(1);
    }, [dispatch]);

    // Toast for total logs (only once after count is fetched)
    useEffect(() => {
        if (!loadingLogsCount && logsCount > 0) {
            toast.success(`Total logs: ${logsCount}`);
        }
    }, [loadingLogsCount, logsCount]);

    // Handle page changes (additional logs loading)
    const handlePageChange = (newPage) => {
        if (newPage > currentPage && userLogs.length < logsCount) {
            dispatch(fetchLogs({ lastVisible, limitItems: itemsPerPage }));
        }
        setCurrentPage(newPage);
    };

    const totalPages = Math.ceil(logsCount / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = userLogs.slice(indexOfFirstItem, indexOfLastItem);

    if (loading && userLogs.length === 0) return <div>Loading...</div>;
    if (userLogs.length === 0) return <div>No logs found.</div>;

    return (
        <div className='space-y-2 max-h-[calc(80vh-150px)] overflow-auto'>
            <div className='sticky top-0 z-10 py-2 bg-base-100 flex flex-wrap justify-between items-end'>
                <div>
                    {currentItems.length > 0 && (
                        <div className='join flex justify-center  mb-4 md:mb-0'>
                            <button
                                className={`join-item btn btn-sm ${currentPage === 1 ? 'btn-disabled' : ''}`}
                                onClick={() => {
                                    if (currentPage > 1) {
                                        handlePageChange(currentPage - 1);
                                    }
                                }}
                                disabled={currentPage === 1}
                            >
                                «
                            </button>
                            <button className='join-item w-32 btn btn-sm'>
                                Page {currentPage} of {totalPages}
                            </button>
                            <button
                                className={`join-item btn btn-sm ${currentPage === totalPages ? 'btn-disabled' : ''}`}
                                onClick={() => {
                                    if (currentPage < totalPages) {
                                        handlePageChange(currentPage + 1);
                                    }
                                }}
                                disabled={currentPage === totalPages}
                            >
                                »
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <table className='table w-full'>
                <thead className='sticky top-12 bg-base-100 z-10'>
                    <tr>
                        <th className='w-8 text-[10px]'>Total: {userLogs.length}</th>
                        <th>Username</th>
                        <th className='w-24'>Operation</th>
                        <th>Item</th>
                        <th>Collection Name</th>
                        <th className='w-56 text-right'>Date</th>
                    </tr>
                </thead>
                <tbody>
                    {userLogs.length > 0 ? (
                        currentItems.map((log, index) => (
                            <tr key={index}>
                                <td className='text-[10px]'>{index + 1}</td>
                                <td>{log.username ?? 'Unknown'}</td>
                                <td
                                    className={
                                        log.operation === 'added'
                                            ? 'text-green-600'
                                            : log.operation === 'deleted'
                                            ? 'text-red-600'
                                            : log.operation === 'edited'
                                            ? 'text-yellow-600'
                                            : ''
                                    }
                                >
                                    {log.operation}
                                </td>
                                <td>{log.item ?? '-'}</td>
                                <td>{log.collectionName ?? '-'}</td>
                                <td className='text-right'>{log.date ? formatDate(log.date) : '-'}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan='6' className='text-center text-gray-500 py-4'>
                                No logs found
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default UserLogs;
