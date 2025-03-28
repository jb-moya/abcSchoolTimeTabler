import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { collection, onSnapshot } from "firebase/firestore";
import { firestore } from "../../firebase/firebase";

export const subscribeToDepartments = createAsyncThunk(
  "departments/subscribe",
  async (_, { dispatch }) => {
    const collectionRef = collection(firestore, "departments");

    return new Promise((resolve, reject) => {
      const unsubscribe = onSnapshot(
        collectionRef,
        (snapshot) => {
          const departmentsObject = snapshot.docs.reduce((acc, doc) => {
            const docData = doc.data();
            const customId = docData.custom_id;
    
            if (customId !== undefined) {
              acc[customId] = { ...docData, id: doc.id };
            }
            return acc;
          }, {});

          dispatch(setDepartments(departmentsObject));
          resolve();
        },
        (error) => {
          console.error("Error subscribing to departments: ", error);
          reject(error.message);
        }
      );

      return () => unsubscribe();
    });
  }
);

const departmentSlice = createSlice({
  name: "departments",
  initialState: {
    data: {},
    loading: true,
    error: null,
  },
  reducers: {
    setDepartments: (state, action) => {
      state.data = action.payload;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(subscribeToDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(subscribeToDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setDepartments } = departmentSlice.actions;
export default departmentSlice.reducer;
