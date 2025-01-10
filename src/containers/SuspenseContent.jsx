function SuspenseContent() {
    return (
        <div className='absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-50 dark:text-gray-200 items-center justify-center flex flex-col gap-2'>
            <span className='loading loading-bars loading-lg'></span>
            <span>loading...</span>
        </div>
    );
}

export default SuspenseContent;
