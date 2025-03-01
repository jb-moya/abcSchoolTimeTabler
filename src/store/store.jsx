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
import rankReducer from '../features/rankSlice';
import sectionReducer from '../features/sectionSlice';
import programReducer from '../features/programSlice';
import departmentReducer from '../features/departmentSlice';
import buildingReducer from '../features/buildingSlice';
import userSlice from '../features/userSlice';
import configurationSlice from '../features/configurationSlice';
import schedulesReducer from '../features/schedulesSlice';

const combinedReducer = {
  header: headerSlice,
  rightDrawer: rightDrawerSlice,
  modal: modalSlice,
  lead: leadsSlice,
  subject: subjectReducer,
  teacher: teacherReducer,
  rank: rankReducer,
  section: sectionReducer,
  program: programReducer,
  department: departmentReducer,
  building: buildingReducer,
  user: userSlice,
  configuration: configurationSlice,
  schedule: schedulesReducer,
};

const store = configureStore({
  reducer: combinedReducer,
});

export default store;
