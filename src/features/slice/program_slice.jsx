import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { collection, onSnapshot } from "firebase/firestore";
import { firestore } from "../../firebase/firebase";

export const subscribeToPrograms = createAsyncThunk(
  "programs/subscribe",
  async (_, { dispatch }) => {
    const collectionRef = collection(firestore, "programs");

    return new Promise((resolve, reject) => {
      const unsubscribe = onSnapshot(
        collectionRef,
        (snapshot) => {
          const programsObject = snapshot.docs.reduce((acc, doc) => {
            const docData = doc.data();
            const customId = docData.custom_id;
    
            if (customId !== undefined) {
              acc[customId] = { ...docData, id: doc.id };
            }
            return acc;
          }, {});

          dispatch(setPrograms(programsObject));
          resolve();
        },
        (error) => {
          console.error("Error subscribing to programs: ", error);
          reject(error.message);
        }
      );

      return () => unsubscribe();
    });
  }
);

const programSlice = createSlice({
  name: "programs",
  initialState: {
    data: {},
    loading: true,
    error: null,
  },
  reducers: {
    setPrograms: (state, action) => {
      state.data = action.payload;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(subscribeToPrograms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(subscribeToPrograms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setPrograms } = programSlice.actions;
export default programSlice.reducer;
