import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { collection, onSnapshot } from "firebase/firestore";
import { firestore } from "../../firebase/firebase";

export const subscribeToBuildings = createAsyncThunk(
  "buildings/subscribe",
  async (_, { dispatch }) => {
    const collectionRef = collection(firestore, "buildings");

    return new Promise((resolve, reject) => {
      const unsubscribe = onSnapshot(
        collectionRef,
        (snapshot) => {
          const buildingsObject = snapshot.docs.reduce((acc, doc) => {
            const docData = doc.data();
            const customId = docData.custom_id;
    
            if (customId !== undefined) {
              acc[customId] = { ...docData, id: doc.id };
            }
            return acc;
          }, {});

          dispatch(setBuildings(buildingsObject));
          resolve();
        },
        (error) => {
          console.error("Error subscribing to buildings: ", error);
          reject(error.message);
        }
      );

      return () => unsubscribe();
    });
  }
);

const buildingSlice = createSlice({
  name: "buildings",
  initialState: {
    data: {},
    loading: true,
    error: null,
  },
  reducers: {
    setBuildings: (state, action) => {
      state.data = action.payload;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(subscribeToBuildings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(subscribeToBuildings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setBuildings } = buildingSlice.actions;
export default buildingSlice.reducer;
