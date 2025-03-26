import { configureStore } from '@reduxjs/toolkit';
import headerSlice from '../features/common/headerSlice';
import modalSlice from '../features/common/modalSlice';
import rightDrawerSlice from '../features/common/rightDrawerSlice';
import leadsSlice from '../features/leads/leadSlice';
import subjectSlice from '../features/slice/subject_slice';
import programSlice from '../features/slice/program_slice';
import rankSlice from '../features/slice/rank_slice';
import sectionSlice from '../features/slice/section_slice';
import teacherSlice from '../features/slice/teacher_slice';
import departmentSlice from '../features/slice/department_slice';
import buildingSlice from '../features/slice/building_slice';
import timetableSlice from '../features/slice/timetable_slice';

const combinedReducer = {
  header: headerSlice,
  rightDrawer: rightDrawerSlice,
  modal: modalSlice,
  lead: leadsSlice,
  subjects: subjectSlice,
  programs: programSlice,
  ranks: rankSlice,
  sections: sectionSlice,
  teachers: teacherSlice,
  departments: departmentSlice,
  buildings: buildingSlice,
  timetables: timetableSlice,
  // user: userSlice,
  // configuration: configurationSlice,
  // schedule: schedulesReducer,
};

const store = configureStore({
  reducer: combinedReducer,
});

export default store;
