import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { collection, onSnapshot } from "firebase/firestore";
import { firestore } from "../../firebase/firebase";

export const subscribeToTimetables = createAsyncThunk(
  "timetables/subscribe",
  async (_, { dispatch }) => {
    const collectionRef = collection(firestore, "timetables");

    return new Promise((resolve, reject) => {
      const unsubscribe = onSnapshot(
        collectionRef,
        (snapshot) => {
          const timetablesObject = snapshot.docs.reduce((acc, doc) => {
            const docData = doc.data();
            const customId = docData.custom_id;
    
            if (customId !== undefined) {
              acc[customId] = { ...docData, id: doc.id };
            }
            return acc;
          }, {});

          dispatch(setTimetables(timetablesObject));
          resolve();
        },
        (error) => {
          console.error("Error subscribing to timetables: ", error);
          reject(error.message);
        }
      );

      return () => unsubscribe();
    });
  }
);

const timetableSlice = createSlice({
  name: "timetables",
  initialState: {
    data: {},
    loading: true,
    error: null,
  },
  reducers: {
    setTimetables: (state, action) => {
      state.data = action.payload;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(subscribeToTimetables.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(subscribeToTimetables.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setTimetables } = timetableSlice.actions;
export default timetableSlice.reducer;
