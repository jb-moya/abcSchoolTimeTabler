// import { useState, useRef } from 'react';
// import { Link } from 'react-router-dom';
// import LandingIntro from './LandingIntro';
// import ErrorText from '../../components/Typography/ErrorText';
// import InputText from '../../components/Input/InputText';
// import { useDispatch, useSelector } from 'react-redux';
// import { useNavigate } from 'react-router-dom';
// import { signUpWithEmailAndPassword } from '../userSlice';

function Register() {
    // const navigate = useNavigate();
    // const dispatch = useDispatch();

    // const INITIAL_REGISTER_OBJ = {
    //     name: '',
    //     password: '',
    //     confirmPassword: '',
    //     schoolName: '',
    //     email: '',
    // };

    // const [registerObj, setRegisterObj] = useState(INITIAL_REGISTER_OBJ);

    // const { user, error: userError, status: userStatus } = useSelector((state) => state.user);

    // const submitForm = (e) => {
    //     e.preventDefault();

    //     try {
    //         // const result = dispatch(signUpWithEmailAndPassword(registerObj)); // deprecated function (see signUpWithEmailAndPassword from userSlice.js)

    //         if (result.meta.requestStatus === 'rejected') {
    //             return;
    //         }

    //         console.log('successfully registered');
    //         navigate('/app/dashboard');
    //     } catch (error) {}
    // };

    // const updateFormValue = ({ updateType, value }) => {
    //     setRegisterObj({ ...registerObj, [updateType]: value });
    // };

    return (
        null
        // <form onSubmit={(e) => submitForm(e)}>
        //     <div className='mb-4'>
        //         <InputText
        //             defaultValue={registerObj.name}
        //             updateType='name'
        //             containerStyle='mt-4'
        //             labelTitle='Name'
        //             updateFormValue={updateFormValue}
        //         />

        //         <InputText
        //             defaultValue={registerObj.email}
        //             updateType='email'
        //             containerStyle='mt-4'
        //             labelTitle='Email'
        //             updateFormValue={updateFormValue}
        //         />

        //         <InputText
        //             defaultValue={registerObj.schoolName}
        //             updateType='schoolName'
        //             containerStyle='mt-4'
        //             labelTitle='School Name'
        //             updateFormValue={updateFormValue}
        //         />

        //         <InputText
        //             defaultValue={registerObj.password}
        //             type='password'
        //             updateType='password'
        //             containerStyle='mt-4'
        //             labelTitle='Password'
        //             updateFormValue={updateFormValue}
        //         />

        //         <InputText
        //             defaultValue={registerObj.confirmPassword}
        //             type='password'
        //             updateType='confirmPassword'
        //             containerStyle='mt-4'
        //             labelTitle='Confirm Password'
        //             updateFormValue={updateFormValue}
        //         />
        //     </div>

        //     {userError && <ErrorText styleClass='mt-8'>{userError}</ErrorText>}

        //     <button
        //         type='submit'
        //         className={`btn mt-4 w-full btn-primary text-white transition-all duration-75 ease-in-out flex items-center justify-center ${
        //             userStatus == 'loading' ? 'cursor-not-allowed ' : ''
        //         }`}
        //         disabled={userStatus == 'loading'}
        //     >
        //         {userStatus == 'loading' ? (
        //             <>
        //                 <span className='loading loading-spinner'></span>
        //                 Signing Up
        //             </>
        //         ) : (
        //             'Sign Up'
        //         )}
        //     </button>
        // </form>
    );
}

export default Register;
