import { Navigate } from 'react-router-dom';
import useAuth from '../app/useAuth';
import SuspenseContent from '../containers/SuspenseContent';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ path, element, requiredPermissions = [], requiredRole = null }) => {
    const { user, loading } = useAuth();
    const userInfo = useSelector((state) => state.user);

    if (!element) {
        return <SuspenseContent />; // Show loading state if path or element are not available
    }

    if (loading) return <SuspenseContent />;
    if (!user) return <Navigate to='/auth/login' />;

    // Super Admin always has access
    let hasAccess =
        userInfo.user.role === 'super admin' ||
        (userInfo.user.role === 'admin' &&
            Array.isArray(userInfo.user.permissions) &&
            requiredPermissions.every((perm) => userInfo.user.permissions.includes(perm)));


    if (requiredRole !== null) {
        hasAccess = hasAccess && userInfo.user.role === requiredRole;
    }

    return hasAccess ? element : <Navigate to='/app/unauthorized' />;
};

export default ProtectedRoute;
