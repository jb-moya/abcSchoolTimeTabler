import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
    addEntityToDB,
    removeEntityFromDB,
    getAllEntitiesFromDB,
    editEntityFromDB,
    STORE_NAMES,
} from "../indexedDB";
import { editDocument } from "../hooks/CRUD/editDocument";
import { fetchDocuments } from "../hooks/CRUD/retrieveDocuments";

import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { firestore } from "../firebase/firebase";
import { getDocs } from "firebase/firestore";

const initialState = {
    sections: {}, // Change from array to object
    status: "idle",
    error: null,
};

export const listenToFirestore = (collectionName) => (dispatch, getState) => {
    const collectionRef = collection(firestore, collectionName);

    const unsubscribe = onSnapshot(
        collectionRef,
        (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                const docData = { ...change.doc.data(), id: change.doc.id };

                console.log("changes", change.type);

                if (change.type === 'added') {
                    dispatch(addSection(docData));
                } else if (change.type === 'modified') {
                    dispatch(editSection(docData));
                } else if (change.type === 'removed') {
                    dispatch(removeSection(change.doc.id));
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

export const fetchSections = createAsyncThunk(
    "section/fetchSections",
    async () => {
        console.log("sections fasdl fjl;askdjf lksdjf lk;sdajf l;ksadjf l;ksdajfl");
        // const sections = await getAllEntitiesFromDB(STORE_NAMES.SECTIONS);

        const collectionRef = collection(firestore, 'sections');

        const querySnapshot = await getDocs(collectionRef);

        const allSections = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        console.log('🚀 ~ allSections:', allSections);
        
        // const sections = fetchDocuments('sections');
        // console.log("🚀 ~ asf sadf dsf sections:", sections)
        // return sections;
    }
);

export const addSection = createAsyncThunk(
    "section/addSection",
    async (section, { dispatch }) => {
        const key = await addEntityToDB(STORE_NAMES.SECTIONS, section);
        dispatch(sectionSlice.actions.addSectionSync({ ...section, id: key }));
    }
);

export const editSection = createAsyncThunk(
    "section/editSection",
    async ({ sectionId, updatedSection }, { dispatch }) => {
        await editDocument('sections', sectionId, updatedSection);
        // await editEntityFromDB(STORE_NAMES.SECTIONS, sectionId, updatedSection);
        dispatch(
            sectionSlice.actions.editSectionSync({
                id: sectionId,
                ...updatedSection,
            })
        );
    }
);

export const removeSection = createAsyncThunk(
    "section/removeSection",
    async (sectionId, { dispatch, rejectWithValue }) => {
        try {
            const success = await removeEntityFromDB(
                STORE_NAMES.SECTIONS,
                sectionId
            );
            if (success) {
                dispatch(sectionSlice.actions.removeSectionSync(sectionId));
            }
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const sectionSlice = createSlice({
    name: "section",
    initialState,
    reducers: {
        addSectionSync: (state, action) => {
            const section = action.payload;
            state.sections[section.id] = section;
        },
        editSectionSync: (state, action) => {
            const updatedSection = action.payload;
            state.sections[updatedSection.id] = {
                ...state.sections[updatedSection.id],
                ...updatedSection,
            };
        },
        removeSectionSync: (state, action) => {
            const sectionId = action.payload;
            delete state.sections[sectionId];
        },
        setStatusIdle: (state) => {
            state.status = "idle";
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSections.pending, (state) => {
                state.status = "loading";
            })
            .addCase(fetchSections.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.sections = action.payload;
            })
            .addCase(fetchSections.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.error.message;
            });
    },
});

export const { addSectionSync, editSectionSync, removeSectionSync, setStatusIdle: setSectionStatusIdle } =
    sectionSlice.actions;

export default sectionSlice.reducer;
