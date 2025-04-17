import { configureStore } from '@reduxjs/toolkit';
import headerSlice from '../features/common/headerSlice';
import modalSlice from '../features/common/modalSlice';
import rightDrawerSlice from '../features/common/rightDrawerSlice';
import leadsSlice from '../features/leads/leadSlice';
import userSlice from '../features/userSlice';
import usersSlice from '../features/admin/users/usersSlice';
import timetableConfigurationSlice from '../features/slice/timetableConfigurationSlice';
import departmentsSlice from '../features/slice/departmentsSlice';
import teachersSlice from '../features/slice/teachersSlice';
import sectionsSlice from '../features/slice/sectionsSlice';
import subjectsSlice from '../features/slice/subjectsSlice';
import ranksSlice from '../features/slice/ranksSlice';
import programsSlice from '../features/slice/programsSlice';
import buildingsSlice from '../features/slice/buildingsSlice';
import schedulesSlice from '../features/slice/schedulesSlice';
import logsSlice from '../features/slice/userLogsSlice';

const combinedReducer = {
    header: headerSlice,
    rightDrawer: rightDrawerSlice,
    modal: modalSlice,
    lead: leadsSlice,
    user: userSlice,
    users: usersSlice,
    configuration: timetableConfigurationSlice,
    departments: departmentsSlice,
    teachers: teachersSlice,
    sections: sectionsSlice,
    subjects: subjectsSlice,
    ranks: ranksSlice,
    programs: programsSlice,
    buildings: buildingsSlice,
    schedules: schedulesSlice,
    logs: logsSlice,
};

const store = configureStore({
    reducer: combinedReducer,
});

export default store;
