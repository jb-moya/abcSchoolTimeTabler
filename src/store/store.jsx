// import { configureStore } from "@reduxjs/toolkit";
// import subjectReducer from "../features/subjectSlice";
// import teacherReducer from "../features/teacherSlice";
// import sectionReducer from "../features/sectionSlice";
// import programReducer from "../features/programSlice";
// export const store = configureStore({
//   reducer: {
//     subject: subjectReducer,
//     teacher: teacherReducer,
//     section: sectionReducer,
//     program: programReducer,
//   },
// });

import { configureStore } from '@reduxjs/toolkit';
import headerSlice from '../features/common/headerSlice';
import modalSlice from '../features/common/modalSlice';
import rightDrawerSlice from '../features/common/rightDrawerSlice';
import leadsSlice from '../features/leads/leadSlice';
import subjectReducer from '../features/subjectSlice';
import teacherReducer from '../features/teacherSlice';
import sectionReducer from '../features/sectionSlice';
import programReducer from '../features/programSlice';

const combinedReducer = {
  header: headerSlice,
  rightDrawer: rightDrawerSlice,
  modal: modalSlice,
  lead: leadsSlice,
  subject: subjectReducer,
  teacher: teacherReducer,
  section: sectionReducer,
  program: programReducer,
};

const store = configureStore({
  reducer: combinedReducer,
});

export default store;
