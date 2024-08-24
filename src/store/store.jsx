import { configureStore } from "@reduxjs/toolkit";
import subjectReducer from "../features/subjectSlice";
import teacherReducer from "../features/teacherSlice";
import sectionReducer from "../features/sectionSlice";
import programReducer from "../features/programSlice";
export const store = configureStore({
    reducer: {
        subject: subjectReducer,
        teacher: teacherReducer,
        section: sectionReducer,
        program: programReducer,
    },
});
