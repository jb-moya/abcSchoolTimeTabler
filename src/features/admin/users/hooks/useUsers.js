import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, selectAllUsers, selectUserById } from '../usersSlice';

export const useUsers = () => {
    const dispatch = useDispatch();
    const users = useSelector(selectAllUsers);
    const { loading, error } = useSelector((state) => state.users);

    useEffect(() => {
        dispatch(fetchUsers());
    }, [dispatch]);

    return {
        users,
        loading,
        error,
        refreshUsers: () => dispatch(fetchUsers()),
    };
};

export const useUserById = (userId) => {
    const user = useSelector((state) => selectUserById(state, userId));
    return user;
};
