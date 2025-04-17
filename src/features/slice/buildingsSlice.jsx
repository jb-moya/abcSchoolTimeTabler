import { createSlice } from '@reduxjs/toolkit';
import { parse } from 'postcss';

const buildings = createSlice({
    name: 'buildings',
    initialState: {
        buildings: {},
        loading: true,
        error: null,
    },
    reducers: {
        upsert: (state, action) => {
            const parsedData = JSON.parse(action.payload.d);
            const { id } = action.payload;

            const roomNames = {};

            Object.entries(parsedData.r).forEach(([key_out, val_out]) =>{
                roomNames[key_out] = {};

                Object.entries(val_out).forEach(([key_in, val_in]) => {
                    roomNames[key_out][key_in] = {
                        roomName: val_in.n,
                    };
                });
            });

            const mappedObj = {
                id,
                name: parsedData.n,
                floors: parsedData.f,
                rooms: roomNames,
                image: parsedData.i,
                nearbyBuildings: parsedData.nb.map((building) => ({
                    id: building.id,
                    name: building.n,
                })),
            }

            state.buildings[id] = mappedObj;
        },
        remove: (state, action) => {
            delete state.buildings[action.payload];
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
    },
});

export const { upsert, remove, setLoading } = buildings.actions;
export default buildings.reducer;
