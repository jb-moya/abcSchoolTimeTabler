const LoadingButton = ({ isLoading = false, children, loadingText = 'Loading...', className = '', ...props }) => {
    return (
        <button
            className={`btn flex items-center justify-center transition-all duration-75 ease-in-out ${className} ${
                isLoading ? 'cursor-not-allowed' : ''
            }`}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? (
                <>
                    <span className='loading loading-spinner mr-2'></span>
                    {loadingText}
                </>
            ) : (
                children
            )}
        </button>
    );
};

export default LoadingButton;
