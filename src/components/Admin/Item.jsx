import { Reorder, useDragControls } from 'framer-motion';

export const Item = ({ item }) => {
    const controls = useDragControls();
    console.log(item);
    return (
        <Reorder.Item
            value={item}
            id={item.id}
            dragListener={false}
            dragControls={controls}
            className='flex items-center h-14 border-y border-primary-content'
        >
            <div className='w-1/12 text-center text-sm border-r border-primary-content p-2'>1 - 2</div>
            <span className='text-lg font-medium'>{item.name}</span>
            <div onPointerDown={(e) => controls.start(e)} className='w-1/12 text-center cursor-move'>
                :::
            </div>
        </Reorder.Item>
    );
};

export default Item;
