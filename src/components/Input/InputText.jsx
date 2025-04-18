import { useState } from 'react';

function InputText({
    labelTitle,
    labelStyle,
    type,
    containerStyle,
    value,
    placeholder,
    updateFormValue,
    updateType,
    inputProps,
}) {
    const [inputType, setInputType] = useState(type || 'text');

    const updateInputValue = (val) => {
        updateFormValue({ updateType, value: val });
    };

    const toggleVisibility = () => {
        setInputType((prevType) => (prevType === 'password' ? 'text' : 'password'));
    };

    return (
        <div className={`form-control w-full ${containerStyle}`}>
            <label className='label font-semibold'>
                <span className={'label-text text-base-content ' + (labelStyle || '')}>{labelTitle}</span>
            </label>
            <div className='relative'>
                <input
                    type={inputType}
                    value={value}
                    placeholder={placeholder || ''}
                    onChange={(e) => updateInputValue(e.target.value)}
                    className='input input-bordered w-full'
                    {...inputProps}
                />
                {type === 'password' && (
                    <button
                        type='button'
                        onClick={toggleVisibility}
                        className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600'
                    >
                        {inputType === 'password' ? (
                            <svg
                                xmlns='http://www.w3.org/2000/svg'
                                fill='none'
                                viewBox='0 0 24 24'
                                strokeWidth='1.5'
                                stroke='currentColor'
                                className='w-5 h-5'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    d='M3.98 8.223a10.477 10.477 0 0116.05-.001m-16.05.001A10.477 10.477 0 0112 4.5c4.5 0 8.293 2.61 10.02 6.223m-16.04-.001a10.476 10.476 0 000 5.554m16.04 0A10.477 10.477 0 0112 19.5c-4.5 0-8.293-2.61-10.02-6.223m16.04.001A10.477 10.477 0 0112 19.5m-4.5-6.75a3 3 0 116 0 3 3 0 01-6 0z'
                                />
                            </svg>
                        ) : (
                            <svg
                                xmlns='http://www.w3.org/2000/svg'
                                fill='none'
                                viewBox='0 0 24 24'
                                strokeWidth='1.5'
                                stroke='currentColor'
                                className='w-5 h-5'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    d='M3.98 8.223a10.477 10.477 0 0116.05-.001m-16.05.001A10.477 10.477 0 0112 4.5c4.5 0 8.293 2.61 10.02 6.223m-16.04-.001a10.476 10.476 0 000 5.554m16.04 0A10.477 10.477 0 0112 19.5c-4.5 0-8.293-2.61-10.02-6.223m16.04.001L3.98 8.223m-1.557 1.557L20.556 18.556'
                                />
                            </svg>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}

export default InputText;
