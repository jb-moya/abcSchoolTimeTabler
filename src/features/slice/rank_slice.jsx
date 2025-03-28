import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { collection, onSnapshot } from "firebase/firestore";
import { firestore } from "../../firebase/firebase";

export const subscribeToRanks = createAsyncThunk(
  "ranks/subscribe",
  async (_, { dispatch }) => {
    const collectionRef = collection(firestore, "ranks");

    return new Promise((resolve, reject) => {
      const unsubscribe = onSnapshot(
        collectionRef,
        (snapshot) => {
          const ranksObject = snapshot.docs.reduce((acc, doc) => {
            const docData = doc.data();
            const customId = docData.custom_id;
    
            if (customId !== undefined) {
              acc[customId] = { ...docData, id: doc.id };
            }
            return acc;
          }, {});

          dispatch(setRanks(ranksObject));
          resolve();
        },
        (error) => {
          console.error("Error subscribing to ranks: ", error);
          reject(error.message);
        }
      );

      return () => unsubscribe();
    });
  }
);

const rankSlice = createSlice({
  name: "ranks",
  initialState: {
    data: {},
    loading: true,
    error: null,
  },
  reducers: {
    setRanks: (state, action) => {
      state.data = action.payload;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(subscribeToRanks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(subscribeToRanks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setRanks } = rankSlice.actions;
export default rankSlice.reducer;
