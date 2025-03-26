import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { collection, onSnapshot } from "firebase/firestore";
import { firestore } from "../../firebase/firebase";

export const subscribeToTeachers = createAsyncThunk(
  "teachers/subscribe",
  async (_, { dispatch }) => {
    const collectionRef = collection(firestore, "teachers");

    return new Promise((resolve, reject) => {
      const unsubscribe = onSnapshot(
        collectionRef,
        (snapshot) => {
          const teachersObject = snapshot.docs.reduce((acc, doc) => {
            const docData = doc.data();
            const customId = docData.custom_id;
    
            if (customId !== undefined) {
              acc[customId] = { ...docData, id: doc.id };
            }
            return acc;
          }, {});

          dispatch(setTeachers(teachersObject));
          resolve();
        },
        (error) => {
          console.error("Error subscribing to teachers: ", error);
          reject(error.message);
        }
      );

      return () => unsubscribe();
    });
  }
);

const teacherSlice = createSlice({
  name: "teachers",
  initialState: {
    data: {},
    loading: true,
    error: null,
  },
  reducers: {
    setTeachers: (state, action) => {
      state.data = action.payload;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(subscribeToTeachers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(subscribeToTeachers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setTeachers } = teacherSlice.actions;
export default teacherSlice.reducer;
