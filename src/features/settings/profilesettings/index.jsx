import { useDispatch } from "react-redux";
import TitleCard from "../../../components/Cards/TitleCard";
import { showNotification } from "../../common/headerSlice";
import InputText from "../../../components/Input/InputText";

function ProfileSettings() {
    const dispatch = useDispatch();

    // Call API to update profile settings changes
    const updateProfile = () => {
        dispatch(showNotification({ message: "Profile Updated", status: 1 }));
    };

    const updateFormValue = ({ updateType, value }) => {
        console.log(`${updateType}: ${value}`);
    };

    return (
        <>
            <TitleCard title="Profile Settings" topMargin="mt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputText
                        labelTitle="Name"
                        defaultValue="Juan Dela Cruz"
                        updateFormValue={updateFormValue}
                    />
                    <InputText
                        labelTitle="Change Password"
                        defaultValue=""
                        updateFormValue={updateFormValue}
                        type="password"
                    />
                    <InputText
                        labelTitle="Username"
                        defaultValue="juantwothree"
                        updateFormValue={updateFormValue}
                    />
                    <InputText
                        labelTitle="Confirm Password"
                        defaultValue=""
                        updateFormValue={updateFormValue}
                        type="password"
                    />
                </div>
                <div className="divider"></div>
                <div className="mt-8">
                    <button
                        className="btn btn-primary float-right"
                        onClick={updateProfile}
                    >
                        Update
                    </button>
                </div>
            </TitleCard>
        </>
    );
}

export default ProfileSettings;
