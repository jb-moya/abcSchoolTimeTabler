import { Navigate } from 'react-router-dom';
import useAuth from '../app/useAuth';
import SuspenseContent from '../containers/SuspenseContent';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ element, requiredPermissions = [] }) => {
    console.log('🚀 ~ ProtectedRoute ~ requiredPermissions:', requiredPermissions);
    const { user, loading } = useAuth();
    const userInfo = useSelector((state) => state.user);
    console.log('🚀 ~ ProtectedRoute ~ userInfo:', userInfo);

    if (loading) return <SuspenseContent />;
    if (!user) return <Navigate to='/auth/login' />;

    // Super Admin always has access
    let hasAccess =
        userInfo.user.role === 'super admin' ||
        (userInfo.user.role === 'admin' &&
            Array.isArray(userInfo.user.permissions) &&
            requiredPermissions.every((perm) => userInfo.user.permissions.includes(perm)));

    console.log('🚀 ~ ProtectedRoute ~ hasAccess 1:', userInfo.user.role);
   
    console.log('🚀 ~ ProtectedRoute ~ hasAccess 3:', hasAccess);
    //  hasAccess = true;

    return hasAccess ? element : <Navigate to='/app/unauthorized' />;
};

export default ProtectedRoute;
