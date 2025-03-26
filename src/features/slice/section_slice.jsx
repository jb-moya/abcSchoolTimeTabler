import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { collection, onSnapshot } from "firebase/firestore";
import { firestore } from "../../firebase/firebase";

export const subscribeToSections = createAsyncThunk(
  "sections/subscribe",
  async (_, { dispatch }) => {
    const collectionRef = collection(firestore, "sections");

    return new Promise((resolve, reject) => {
      const unsubscribe = onSnapshot(
        collectionRef,
        (snapshot) => {
          const sectionsObject = snapshot.docs.reduce((acc, doc) => {
            const docData = doc.data();
            const customId = docData.custom_id;
    
            if (customId !== undefined) {
              acc[customId] = { ...docData, id: doc.id };
            }
            return acc;
          }, {});

          dispatch(setSections(sectionsObject));
          resolve();
        },
        (error) => {
          console.error("Error subscribing to sections: ", error);
          reject(error.message);
        }
      );

      return () => unsubscribe();
    });
  }
);

const sectionSlice = createSlice({
  name: "sections",
  initialState: {
    data: {},
    loading: true,
    error: null,
  },
  reducers: {
    setSections: (state, action) => {
      state.data = action.payload;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(subscribeToSections.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(subscribeToSections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setSections } = sectionSlice.actions;
export default sectionSlice.reducer;
