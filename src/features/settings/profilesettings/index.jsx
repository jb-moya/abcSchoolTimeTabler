import { useState } from 'react';
import TitleCard from '../../../components/Cards/TitleCard';
import InputText from '../../../components/Input/InputText';
import { useSelector } from 'react-redux';
import { useEditUserPassword } from '../../admin/users/hooks/useUpdateUserPassword';
import { toast } from 'sonner';

function ProfileSettings() {
    const { user, loading: userLoading } = useSelector((state) => state.user);
    const { editUserPassword, loading: editUserLoading, error: editUserError } = useEditUserPassword();

    const updateProfile = async () => {
        try {
            await editUserPassword(info.password, info.confirmPassword);

            toast.success('Password updated successfully');
        } catch (err) {
            console.log(err);
        }
    };

    const initial_info = {
        password: '',
        confirmPassword: '',
    };

    const [info, setInfo] = useState(initial_info);

    const updateFormValue = ({ updateType, value }) => {
        setInfo({ ...info, [updateType]: value });
    };

    const resetForm = () => setInfo(initial_info);

    if (userLoading) {
        return <div>Loading...</div>;
    }

    return (
        <>
            <TitleCard title='Profile Settings' topMargin='mt-2'>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        updateProfile();
                    }}
                >
                    <div className='grid grid-cols-1 w-1/2'>
                        <InputText
                            labelTitle='Username (read only)'
                            value={user?.username || ''}
                            inputProps={{ disabled: true }}
                        />
                        <InputText labelTitle='Email (read only)' value={user?.email} inputProps={{ disabled: true }} />
                        <div className='divider pt-10'>Change Password</div>
                        <InputText
                            labelTitle='Change Password'
                            defaultValue={info.password}
                            value={info.password}
                            updateType={'password'}
                            updateFormValue={updateFormValue}
                            type='password'
                            inputProps={{ autoComplete: 'new-password' }}
                        />
                        <InputText
                            labelTitle='Confirm Password'
                            defaultValue={info.confirmPassword}
                            value={info.confirmPassword}
                            updateType={'confirmPassword'}
                            updateFormValue={updateFormValue}
                            type='password'
                            inputProps={{ autoComplete: 'new-password' }}
                        />
                    </div>
                    <div className='divider'></div>
                    {editUserError && (
                        <div role='alert' className='alert alert-error'>
                            <svg
                                xmlns='http://www.w3.org/2000/svg'
                                className='h-6 w-6 shrink-0 stroke-current'
                                fill='none'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth='2'
                                    d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
                                />
                            </svg>
                            <span>{editUserError}</span>
                        </div>
                    )}
                    <div className='mt-8 gap-2 flex justify-end'>
                        <button className={'btn btn-outline float-right mr-2'} onClick={resetForm} disabled={editUserLoading}>
                            Reset
                        </button>
                        <button type='submit' className='btn btn-primary float-right' disabled={editUserLoading}>
                            {editUserLoading && <span className='loading loading-spinner'></span>}
                            {editUserLoading ? 'Loading' : 'Save'}
                        </button>
                    </div>
                </form>
            </TitleCard>
        </>
    );
}

export default ProfileSettings;
