import Breadcrumbs from '@components/Admin/Breadcrumbs';
import RoomListContainer from '@components/Admin/RoomsAndBuildings/RoomMapping';

function Rooms() {
    const links = [
        { name: 'Home', href: '/' },
    ];

    
    return (
        <div className='App container mx-auto px-4 mb-10'>
            <Breadcrumbs title='Room Mapping' links={links} />

            <div className='flex flex-col gap-4'>
                <div className='card w-full bg-base-100 shadow-md'>
                    <div className='card-body'>
                        <RoomListContainer editable={true} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Rooms;
