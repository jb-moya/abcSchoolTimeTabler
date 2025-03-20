import { Navigate } from 'react-router-dom';
import useAuth from '../app/useAuth';
import SuspenseContent from '../containers/SuspenseContent';

const ProtectedRoute = ({ element }) => {
    const { user, loading } = useAuth();

    if (loading) return <SuspenseContent />;

    return user ? element : <Navigate to='/auth/login' />;
};

export default ProtectedRoute;
