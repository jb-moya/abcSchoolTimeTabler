import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';


const AddSubjectContainer = ({
    close,
    reduxFunction,
    errorMessage,
    setErrorMessage,
    errorField,
    setErrorField,
    defaultSubjectClassDuration,
}) => {

    const inputNameRef = useRef();
    const dispatch = useDispatch();

// ==============================================================================

    const subjects = useSelector((state) => state.subject.subjects);

// ==============================================================================

    const [subjectName, setSubjectName] = useState('');
    const [classSubjectDuration, setClassSubjectDuration] = useState(defaultSubjectClassDuration || 10);
    const [subjectWeeklyMinutes, setSubjectWeeklyMinutes] = useState(200);

// ==============================================================================

    const handleAddSubject = () => {

        if (!subjectName.trim()) {
            setErrorMessage('Subject name cannot be empty');
            setErrorField('name'); // Highlight Subject Name input
            return;
        } else if (!classSubjectDuration) {
            setErrorMessage('Class duration cannot be empty');
            setErrorField('duration'); // Highlight Class Duration input
            return;
        } else if (!subjectWeeklyMinutes) {
            alert('Subject weekly minutes cannot be empty');
            return;
        }

        const classDuration = parseInt(classSubjectDuration, 10);
        const weeklyMinutes = parseInt(subjectWeeklyMinutes, 10);

        const duplicateSubject = Object.values(subjects).find(
            (subject) =>
                subject.subject.trim().toLowerCase() ===
                subjectName.trim().toLowerCase()
        );

        if (duplicateSubject) {
            setErrorMessage('A subject with this name already exists');
            setErrorField('name');
        } else {

            dispatch(
                reduxFunction({
                    subject: subjectName,
                    classDuration: classDuration,
                    weeklyMinutes: weeklyMinutes,
                })
            );

            toast.success('Subject added successfully', {
                style: {
                    backgroundColor: 'green',
                    color: 'white',
                    bordercolor: 'green',
                },
            });

            handleReset();
            close();
        }
    };

    const handleReset = () => {
        setSubjectName('');
        setClassSubjectDuration(defaultSubjectClassDuration || 10);
        setSubjectWeeklyMinutes(200);

        setErrorMessage('');
        setErrorField('');
        if (inputNameRef.current) {
            inputNameRef.current.focus();
        }
    };

// =============================================================================

    // Tracks which input field has an error
    useEffect(() => {
        if (!close) {
            setErrorMessage('');
            setErrorField('');
        }
    }, [close, setErrorMessage, setErrorField]);

    useEffect(() => {
        if (inputNameRef.current) {
            inputNameRef.current.focus();
        }
    }, []);

    return (
        <div>
            <h3 className="text-lg font-bold mb-4">Add New Subject</h3>

            <hr className="mb-4" />
            
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                    Subject Name:
                </label>
                <input
                    type="text"
                    className={`input input-bordered w-full ${
                        errorField === 'name' ? 'border-red-500' : ''
                    }`}
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder="Enter subject name"
                    ref={inputNameRef}
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                    Class Duration (minutes):
                </label>
                <input
                    type="number"
                    className={`input input-bordered w-full ${
                        errorField === 'duration' ? 'border-red-500' : ''
                    }`}
                    value={classSubjectDuration}
                    onChange={(e) =>
                        setClassSubjectDuration(Number(e.target.value))
                    }
                    placeholder="Enter class duration"
                    step={5}
                    min={10}
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                    Subject Weekly Time Requirement (minutes):
                </label>
                <input
                    type="number"
                    className="input input-bordered w-full"
                    value={subjectWeeklyMinutes}
                    onChange={(e) => {
                        const value = Number(e.target.value);
                        setSubjectWeeklyMinutes(value);
                    }}
                    placeholder="Enter subject's weekly minutes"
                    step={5}
                />
            </div>

            {errorMessage && (
                <p className="text-red-500 text-sm my-4 font-medium select-none ">
                    {errorMessage}
                </p>
            )}

            <div className="flex justify-center gap-2">
                <button className="btn btn-primary" onClick={handleAddSubject}>
                    Add Subject
                </button>
                <button
                    className="btn btn-error border-0"
                    onClick={handleReset}
                >
                    Reset
                </button>
            </div>
        </div>
    );
};

export default  AddSubjectContainer;