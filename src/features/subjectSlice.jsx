import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
    addEntityToDB,
    removeEntityFromDB,
    getAllEntitiesFromDB,
    editEntityFromDB,
    STORE_NAMES,
} from "../indexedDB";

const initialState = {
    subjects: {},
    status: "idle",
    error: null,
};
import { firestore } from '../firebase/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export const listenToSubjectFirestore = (collectionName) => (dispatch, getState) => {
    const collectionRef = collection(firestore, collectionName);

    const unsubscribe = onSnapshot(
        collectionRef,
        (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                const docData = { ...change.doc.data(), id: change.doc.id };

                console.log("changes", change.type);

                if (change.type === 'added') {
                    dispatch(addSubject(docData));
                } else if (change.type === 'modified') {
                    dispatch(editSubject(docData));
                } else if (change.type === 'removed') {
                    dispatch(removeSubject(change.doc.id));
                }
            });
        },
        (error) => {
            console.error('Firestore listener error:', error);
        }
    );

    // Store unsubscribe function in Redux (optional)
    return unsubscribe;
};

export const fetchSubjects = createAsyncThunk(
    "subject/fetchSubjects",
    async () => {
        const subjects = await getAllEntitiesFromDB(STORE_NAMES.SUBJECTS);
        return subjects;
    }
);

export const addSubject = createAsyncThunk(
    "subject/addSubject",
    async (subject, { dispatch }) => {
        const key = await addEntityToDB(STORE_NAMES.SUBJECTS, subject);
        dispatch(subjectSlice.actions.addSubjectSync({ ...subject, id: key }));
    }
);

export const editSubject = createAsyncThunk(
    "subject/editSubject",
    async ({ subjectId, updatedSubject }, { dispatch }) => {
        await editEntityFromDB(STORE_NAMES.SUBJECTS, subjectId, updatedSubject);
        dispatch(
            subjectSlice.actions.editSubjectSync({
                id: subjectId,
                ...updatedSubject,
            })
        );
    }
);

export const removeSubject = createAsyncThunk(
    "subject/removeSubject",
    async (subjectId, { dispatch, rejectWithValue }) => {
        try {
            const success = await removeEntityFromDB(
                STORE_NAMES.SUBJECTS,
                subjectId
            );
            if (success) {
                dispatch(subjectSlice.actions.removeSubjectSync(subjectId));
            }
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const subjectSlice = createSlice({
    name: "subject",
    initialState,
    reducers: {
        addSubjectSync: (state, action) => {
            const subject = action.payload;
            state.subjects[subject.id] = subject;
        },
        editSubjectSync: (state, action) => {
            const updatedSubject = action.payload;
            state.subjects[updatedSubject.id] = {
                ...state.subjects[updatedSubject.id],
                ...updatedSubject,
            };
        },
        removeSubjectSync: (state, action) => {
            const subjectId = action.payload;
            delete state.subjects[subjectId];
        },
        setStatusIdle: (state) => {
            state.status = "idle";
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSubjects.pending, (state) => {
                state.status = "loading";
            })
            .addCase(fetchSubjects.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.subjects = action.payload;
            })
            .addCase(fetchSubjects.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.error.message;
            });
    },
});

export const { addSubjectSync, editSubjectSync, removeSubjectSync, setStatusIdle: setSubjectStatusIdle } =
    subjectSlice.actions;

export default subjectSlice.reducer;
