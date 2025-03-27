import { useState, useRef, useEffect } from 'react';
import { IoChevronDown, IoRemove, IoAdd } from 'react-icons/io5';
import clsx from 'clsx';
import escapeRegExp from '@utils/escapeRegExp';

import { fetchDocuments } from '../../../hooks/CRUD/retrieveDocuments';

const NearbyBuildingDropdown = ({
    availableBuildings,
    nearbyBuildings,
    setNearbyBuildings,
    currentBuildingId, // Add this prop
}) => {

    const [searchValue, setSearchValue] = useState('');

    const searchInputRef = useRef(null);

    // Filter out the current building
    const filteredBuildings = Object.values(availableBuildings) // Convert object to array
        .filter((building) => building.id !== currentBuildingId)
        .filter((building) => {
            const escapedSearchValue = escapeRegExp(searchValue).split('\\').join('.'); // Escape regex properly
            const pattern = new RegExp(escapedSearchValue, 'i');
            return pattern.test(building.name);
        });

    // useEffect(() => {
    //     console.log('filteredBuildings: ', filteredBuildings);
    // }, [filteredBuildings]);

    // useEffect(() => {
    //     console.log('availableBuildings: ', availableBuildings);
    // }, [availableBuildings]);

    const handleToggleBuilding = (buildingCustomId) => {
        const updatedList = nearbyBuildings.includes(buildingCustomId)
            ? nearbyBuildings.filter((id) => id !== buildingCustomId)
            : [...nearbyBuildings, buildingCustomId];

        setNearbyBuildings(updatedList);
    };

    return (
        <div className='dropdown w-full max-w-md'>
            <div tabIndex={0} role='button' className='btn btn-sm w-full flex justify-between items-center'>
                <div className='text-left'>Select Nearby Buildings</div>
                <IoChevronDown size={16} />
            </div>
            <ul tabIndex={0} className='dropdown-content menu bg-base-100 rounded-box z-[1] w-80 p-2 shadow'>
                <li>
                    <input
                        type='text'
                        placeholder='Search buildings'
                        ref={searchInputRef}
                        className='input input-bordered input-sm w-full'
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                    />
                </li>
                <div className='overflow-y-scroll max-h-40 scrollbar-hide' style={{ WebkitOverflowScrolling: 'touch' }}>
                    {filteredBuildings.length === 0 ? (
                        <div className='px-4 py-2 opacity-50'>No buildings found</div>
                    ) : (
                        filteredBuildings.map((building) => (
                            <li key={building.id} role='button' onClick={() => handleToggleBuilding(building.id)}>
                                <div className='flex justify-between items-center'>
                                    <a className={clsx('w-full')}>{availableBuildings[building.id]?.name}</a>
                                    {nearbyBuildings.some((b) => b.id === building.id) ? (
                                        <IoRemove size={20} className='text-red-500' />
                                    ) : (
                                        <IoAdd size={20} className='text-green-400' />
                                    )}
                                </div>
                            </li>
                        ))
                    )}
                </div>
            </ul>

            {/* Display the selected nearby buildings as badges */}
            {nearbyBuildings.length > 0 && (
                <div className='flex flex-wrap gap-2 mt-3'>
                    {nearbyBuildings.map((building) => (
                        <span
                            key={availableBuildings[building]?.id}
                            // key={building.custom_id}
                            className='badge badge-primary gap-2 cursor-pointer'
                            onClick={() => handleToggleBuilding(building)}
                        >
                            {availableBuildings[building]?.name}
                            {/* {buildings.custom_id} */}
                            <IoRemove size={16} className='ml-2' />
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NearbyBuildingDropdown;
