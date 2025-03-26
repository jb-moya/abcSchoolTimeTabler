import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { collection, onSnapshot } from "firebase/firestore";
import { firestore } from "../../firebase/firebase";

export const subscribeToSubjects = createAsyncThunk(
  "subjects/subscribe",
  async (_, { dispatch }) => {
    const collectionRef = collection(firestore, "subjects");

    return new Promise((resolve, reject) => {
      const unsubscribe = onSnapshot(
        collectionRef,
        (snapshot) => {
          const subjectsObject = snapshot.docs.reduce((acc, doc) => {
            const docData = doc.data();
            const customId = docData.custom_id;
    
            if (customId !== undefined) {
              acc[customId] = { ...docData, id: doc.id };
            }
            return acc;
          }, {});

          dispatch(setSubjects(subjectsObject));
          resolve();
        },
        (error) => {
          console.error("Error subscribing to subjects: ", error);
          reject(error.message);
        }
      );

      return () => unsubscribe();
    });
  }
);

const subjectSlice = createSlice({
  name: "subjects",
  initialState: {
    data: {},
    loading: true,
    error: null,
  },
  reducers: {
    setSubjects: (state, action) => {
      state.data = action.payload;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(subscribeToSubjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(subscribeToSubjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setSubjects } = subjectSlice.actions;
export default subjectSlice.reducer;
