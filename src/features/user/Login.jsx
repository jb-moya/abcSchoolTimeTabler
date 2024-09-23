// import { useState, useRef } from "react";
// import { Link } from "react-router-dom";
// import LandingIntro from "./LandingIntro";
// import ErrorText from "@components/Typography/ErrorText";
// import InputText from "../../components/Input/InputText";

// function Login() {
//     const INITIAL_LOGIN_OBJ = {
//         password: "123",
//         emailId: "123",
//     };

//     const [loading, setLoading] = useState(false);
//     const [errorMessage, setErrorMessage] = useState("");
//     const [loginObj, setLoginObj] = useState(INITIAL_LOGIN_OBJ);

//     const submitForm = (e) => {
//         e.preventDefault();
//         setErrorMessage("");

//         if (loginObj.emailId.trim() === "")
//             return setErrorMessage("Email Id is required! (use any value)");
//         if (loginObj.password.trim() === "")
//             return setErrorMessage("Password is required! (use any value)");
//         else {
//             setLoading(true);
//             // Call API to check user credentials and save token in localstorage
//             localStorage.setItem("token", "DumyTokenHere");
//             setLoading(false);
//             window.location.href = "/app/welcome";
//         }
//     };

//     const updateFormValue = ({ updateType, value }) => {
//         setErrorMessage("");
//         setLoginObj({ ...loginObj, [updateType]: value });
//     };

//     return (
//         <div  className="min-h-screen bg-base-200 flex items-center">
//             <div className="card mx-auto w-full max-w-5xl  shadow-xl">
//                 <div className="grid md:grid-cols-2 grid-cols-1  bg-base-100 rounded-xl">
//                     <div className="">
//                         <LandingIntro />
//                     </div>
//                     <div className="py-24 px-10">
//                         <h1 className="text-5xl font-bold mb-4 text-center">
//                             Welcome Back!
//                         </h1>
//                         <h2 className="text-base font-medium mb-2 text-center">
//                             To continue enter your credentials, 
//                         </h2>
//                         <form onSubmit={(e) => submitForm(e)}>
//                             <div className="mb-4">
//                                 <InputText
//                                     type="emailId"
//                                     defaultValue={loginObj.emailId}
//                                     updateType="emailId"
//                                     containerStyle="mt-4"
//                                     labelTitle="Username"
//                                     updateFormValue={updateFormValue}
//                                 />

//                                 <InputText
//                                     defaultValue={loginObj.password}
//                                     type="password"
//                                     updateType="password"
//                                     containerStyle="mt-4"
//                                     labelTitle="Password"
//                                     updateFormValue={updateFormValue}
//                                 />
//                             </div>

//                             <div className="text-right text-primary">
//                                 <Link to="/forgot-password">
//                                     <span className="text-sm  inline-block  hover:text-primary hover:underline hover:cursor-pointer transition duration-200">
//                                         Forgot Password?
//                                     </span>
//                                 </Link>
//                             </div>

//                             <ErrorText styleClass="mt-8">
//                                 {errorMessage}
//                             </ErrorText>
//                             <button
//                                 type="submit"
//                                 className={
//                                     "btn mt-2 w-full btn-primary text-white" +
//                                     (loading ? " loading" : "")
//                                 }
//                             >
//                                 Login
//                             </button>

//                             <div className="text-center mt-4">
//                                 Don't have an account yet?{" "}
//                                 <Link to="/register">
//                                     <span className="  inline-block  hover:text-primary hover:underline hover:cursor-pointer transition duration-200">
//                                         Register
//                                     </span>
//                                 </Link>
//                             </div>
//                         </form>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }

// export default Login;


// import { useState } from "react";
// import { Link } from "react-router-dom";
// import ErrorText from "@components/Typography/ErrorText";
// import InputText from "../../components/Input/InputText";

// import { Swiper, SwiperSlide } from "swiper/react";
// import { Autoplay } from "swiper/modules";
// import "swiper/css";
// import "swiper/css/autoplay";

// function Login() {
//     const INITIAL_LOGIN_OBJ = {
//         password: "123",
//         emailId: "123",
//     };

//     const [loading, setLoading] = useState(false);
//     const [errorMessage, setErrorMessage] = useState("");
//     const [loginObj, setLoginObj] = useState(INITIAL_LOGIN_OBJ);

//     const submitForm = (e) => {
//         e.preventDefault();
//         setErrorMessage("");

//         if (loginObj.emailId.trim() === "")
//             return setErrorMessage("Email Id is required!");
//         if (loginObj.password.trim() === "")
//             return setErrorMessage("Password is required!");
//         else {
//             setLoading(true);
//             // Call API to check user credentials and save token in localStorage
//             setTimeout(() => {
//                 localStorage.setItem("token", "DummyTokenHere");
//                 setLoading(false);
//                 window.location.href = "/app/welcome";
//             }, 1500);
//         }
//     };

//     const updateFormValue = ({ updateType, value }) => {
//         setErrorMessage("");
//         setLoginObj({ ...loginObj, [updateType]: value });
//     };

//     function imgUrl() {
//         const id = Math.floor(Math.random() * (200 - 1 + 1) + 1);
//         return `https://picsum.photos/id/${id}/1920/1080`;
//     }

//     return (
//         <div className="h-screen flex flex-col md:flex-row items-center justify-center">
//             {/* Landing Intro section */}
//             <div className="w-full md:w-2/3 bg-cover bg-center h-full hidden md:block">
//                 <Swiper
//                     modules={[Autoplay]}
//                     slidesPerView={1}
//                     autoplay={{ delay: 3000 }}
//                     className="h-full"
//                 >
//                     {Array.from({ length: 5 }).map((_, index) => (
//                         <SwiperSlide key={index}>
//                             <img
//                                 src={imgUrl()}
//                                 alt={`Slide ${index + 1}`}
//                                 className="w-full h-full object-cover"
//                             />
//                         </SwiperSlide>
//                     ))}
//                 </Swiper>
//             </div>
  
//             {/* Login form section */}
//             <div className="w-full md:w-1/3 flex items-center justify-center p-10">
//                 <div className="w-full max-w-md  ">
//                     {/* Logo section */}
//                     <div className="mb-4 flex flex-col justify-center items-center select-none">
//                         <img src="/Batasan Logo.png" alt="Logo" className="h-24 w-24 mb-2" />
//                         <div className="text-3xl font-bold text-center ">Batasan High School Timetabling</div>
//                     </div>

//                     {/* Welcome message */}
//                     {/* <h1 className="text-4xl font-bold mb-2 text-center text-gray-800">
//                         Welcome Back!
//                     </h1> */}
//                     <h2 className="text-base font-medium mb-4 text-center text-gray-500">
//                         Please enter your credentials to continue
//                     </h2>

//                     {/* Form */}
//                     <form onSubmit={(e) => submitForm(e)}>
//                         <div className="mb-6">
//                             {/* Email input */}
//                             <InputText
//                                 type="emailId"
//                                 defaultValue={loginObj.emailId}
//                                 updateType="emailId"
//                                 containerStyle="mt-4"
//                                 labelTitle="Username"
//                                 updateFormValue={updateFormValue}
//                             />

//                             {/* Password input */}
//                             <InputText
//                                 defaultValue={loginObj.password}
//                                 type="password"
//                                 updateType="password"
//                                 containerStyle="mt-4"
//                                 labelTitle="Password"
//                                 updateFormValue={updateFormValue}
//                             />
//                         </div>

//                         {/* Forgot password link */}
//                         <div className="text-right mb-4">
//                             <Link to="/forgot-password" className="text-sm text-primary hover:underline">
//                                 Forgot Password?
//                             </Link>
//                         </div>

//                         {/* Error message */}
//                         {errorMessage && (
//                             <ErrorText styleClass="mt-2 text-center">
//                                 {errorMessage}
//                             </ErrorText>
//                         )}

//                         {/* Submit button */}
//                         <button
//                             type="submit"
//                             className={`btn mt-4 w-full btn-primary text-white transition-all duration-75 ease-in-out flex items-center justify-center ${
//                                 loading ? "cursor-not-allowed" : ""
//                             }`}
//                             disabled={loading}
//                         >
//                             {loading ? (
//                                 <svg
//                                     className="animate-spin h-5 w-5 text-white mr-3"
//                                     xmlns="http://www.w3.org/2000/svg"
//                                     fill="none"
//                                     viewBox="0 0 24 24"
//                                 >
//                                     <circle
//                                         className="opacity-25"
//                                         cx="12"
//                                         cy="12"
//                                         r="10"
//                                         stroke="currentColor"
//                                         strokeWidth="4"
//                                     ></circle>
//                                     <path
//                                         className="opacity-75"
//                                         fill="currentColor"
//                                         d="M4 12a8 8 0 018-8v8H4z"
//                                     ></path>
//                                 </svg>
//                             ) : (
//                                 "Login"
//                             )}
//                         </button>

//                         {/* Register link */}
//                         <div className="text-center mt-6 text-gray-600">
//                             Don't have an account yet?{" "}
//                             <Link to="/register" className="text-primary hover:underline">
//                                 Register
//                             </Link>
//                         </div>
//                     </form>
//                 </div>
//             </div>
//         </div>
//     );
// }

// export default Login;

import { useState } from "react";
import { Link } from "react-router-dom";
import ErrorText from "@components/Typography/ErrorText";
import InputText from "../../components/Input/InputText";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/autoplay";

function Login() {
    const INITIAL_LOGIN_OBJ = {
        password: "123",
        emailId: "123",
    };

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [loginObj, setLoginObj] = useState(INITIAL_LOGIN_OBJ);

    const submitForm = (e) => {
        e.preventDefault();
        setErrorMessage("");

        if (loginObj.emailId.trim() === "")
            return setErrorMessage("Email Id is required!");
        if (loginObj.password.trim() === "")
            return setErrorMessage("Password is required!");
        else {
            setLoading(true);
            setTimeout(() => {
                localStorage.setItem("token", "DummyTokenHere");
                setLoading(false);
                window.location.href = "/app/welcome";
            }, 1500);
        }
    };

    const updateFormValue = ({ updateType, value }) => {
        setErrorMessage("");
        setLoginObj({ ...loginObj, [updateType]: value });
    };

    function imgUrl() {
        const id = Math.floor(Math.random() * (200 - 1 + 1) + 1);
        return `https://picsum.photos/id/${id}/1920/1080`;
    }

    return (
        <div className="relative h-screen w-screen">
            {/* Background section with Swiper */}
            <div className="absolute inset-0 z-0">
                <Swiper
                    modules={[Autoplay]}
                    slidesPerView={1}
                    autoplay={{ delay: 3000 }}
                    className="h-full"
                >
                    {Array.from({ length: 5 }).map((_, index) => (
                        <SwiperSlide key={index}>
                            <img
                                src={imgUrl()}
                                alt={`Slide ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>
                {/* Blur effect and dark overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm"></div>
            </div>

            {/* Login form section */}
            <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm ">
                <div className="w-full max-w-sm bg-white bg-opacity-90 backdrop-blur-md rounded-lg  shadow-2xl p-8">
                    {/* Logo section */}
                    <div className="mb-4 flex flex-col justify-center items-center select-none">
                        <img src="/Batasan Logo.png" alt="Logo" className="h-16 w-16 mb-2" />
                        <div className="text-2xl font-bold text-center">Batasan High School</div>
                        <div className="text-sm text-center text-gray-500">Timetabling System</div>
                    </div>

                    <h2 className="text-base font-medium mb-4 text-center text-gray-500">
                        Please enter your credentials to continue
                    </h2>

                    {/* Form */}
                    <form onSubmit={(e) => submitForm(e)}>
                        <div className="mb-6">
                            {/* Email input */}
                            <InputText
                                type="emailId"
                                defaultValue={loginObj.emailId}
                                updateType="emailId"
                                containerStyle="mt-4"
                                labelTitle="Username"
                                updateFormValue={updateFormValue}
                            />

                            {/* Password input */}
                            <InputText
                                defaultValue={loginObj.password}
                                type="password"
                                updateType="password"
                                containerStyle="mt-4"
                                labelTitle="Password"
                                updateFormValue={updateFormValue}
                            />
                        </div>

                        {/* Forgot password link */}
                        <div className="text-right mb-4">
                            <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                                Forgot Password?
                            </Link>
                        </div>

                        {/* Error message */}
                        {errorMessage && (
                            <ErrorText styleClass="mt-2 text-center">
                                {errorMessage}
                            </ErrorText>
                        )}

                        {/* Submit button */}
                        <button
                            type="submit"
                            className={`btn mt-4 w-full btn-primary text-white transition-all duration-75 ease-in-out flex items-center justify-center ${
                                loading ? "cursor-not-allowed" : ""
                            }`}
                            disabled={loading}
                        >
                            {loading ? (
                                <svg
                                    className="animate-spin h-5 w-5 text-white mr-3"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v8H4z"
                                    ></path>
                                </svg>
                            ) : (
                                "Login"
                            )}
                        </button>

                        {/* Register link */}
                        <div className="text-center mt-6 text-gray-600">
                            Don't have an account yet?{" "}
                            <Link to="/register" className="text-primary hover:underline">
                                Register
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;

