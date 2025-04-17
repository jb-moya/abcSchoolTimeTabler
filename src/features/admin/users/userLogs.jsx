import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import formatDate from '../../../utils/formatDate';

const UserLogs = () => {
    const { logs: userLogs, loading } = useSelector((state) => state.logs);
    const [filter, setFilter] = useState('all');
    const [sortLatestFirst, setSortLatestFirst] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    const filteredLogs = useMemo(() => {
        return userLogs
            .filter((log) => {
                const operation = log.operation ?? '-';
                return filter === 'all' ? true : operation === filter;
            })
            .sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return sortLatestFirst ? dateB - dateA : dateA - dateB;
            });
    }, [userLogs, filter, sortLatestFirst]);

    if (loading) return <div>Loading...</div>;

    if (filteredLogs.length === 0) return <div>No logs found.</div>;

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className='space-y-2 max-h-[calc(80vh-150px)] overflow-auto'>
            <div className='sticky top-0 z-10 py-2 bg-base-100 flex flex-wrap justify-between items-end'>
                <div className='flex gap-4 items-end w-full max-w-xs'>
                    <label className='form-control w-full'>
                        <div className='label p-0'>
                            <span className='label-text'>Filter by operation</span>
                            <span className='label-text-alt'>Choose one</span>
                        </div>
                        <select
                            className='select select-bordered select-sm'
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        >
                            <option value='all'>All</option>
                            <option value='add'>Add</option>
                            <option value='edit'>Edit</option>
                            <option value='delete'>Delete</option>
                            <option value='-'>Unknown</option>
                        </select>
                    </label>
                    <button className='btn btn-sm btn-outline' onClick={() => setSortLatestFirst(!sortLatestFirst)}>
                        {sortLatestFirst ? 'Latest First' : 'Oldest First'}
                    </button>
                </div>

                <div>
                    {currentItems.length > 0 && (
                        <div className='join flex justify-center  mb-4 md:mb-0'>
                            <button
                                className={`join-item btn btn-sm ${currentPage === 1 ? 'btn-disabled' : ''}`}
                                onClick={() => {
                                    if (currentPage > 1) {
                                        setCurrentPage(currentPage - 1);
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
                                        setCurrentPage(currentPage + 1);
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
                <thead className='sticky top-16 bg-base-100 z-10'>
                    <tr>
                        <th className='w-8 text-[10px]'>Total: {filteredLogs.length}</th>
                        <th>Username</th>
                        <th className='w-24'>Operation</th>
                        <th>Item</th>
                        <th>Collection Name</th>
                        <th className='w-56 text-right'>Date</th>
                    </tr>
                </thead>
                <tbody>
                    {currentItems.map((log, index) => (
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
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserLogs;
