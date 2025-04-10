import { configureStore } from '@reduxjs/toolkit';
import headerSlice from '../features/common/headerSlice';
import modalSlice from '../features/common/modalSlice';
import rightDrawerSlice from '../features/common/rightDrawerSlice';
import leadsSlice from '../features/leads/leadSlice';
import userSlice from '../features/userSlice';
import usersSlice from '../features/admin/users/usersSlice';
import configurationSlice from '../features/configurationSlice';

const combinedReducer = {
  header: headerSlice,
  rightDrawer: rightDrawerSlice,
  modal: modalSlice,
  lead: leadsSlice,
  user: userSlice,
  users: usersSlice,
  configuration: configurationSlice,
};

const store = configureStore({
  reducer: combinedReducer,
});

export default store;
