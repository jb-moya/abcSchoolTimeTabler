import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import SuspenseContent from '../containers/SuspenseContent';

const ProtectedRoute = ({ children, requiredPermissions = [], requiredRole = null }) => {
    const { user, loading } = useSelector((state) => state.user);
    const userInfo = useSelector((state) => state.user);
    
    const { role = '', permissions = [] } = userInfo?.user || {};
    
    if (!children) {
        return <SuspenseContent />; // Show loading state if path or element are not available
    }
    
    if (loading) return <SuspenseContent />;
    
    if (!user && !loading) return <Navigate to='/auth/login' />;
    
    if (role === 'super admin') return children; // Super admin has access to everything
    
    const hasPermissions = role === 'admin' && requiredPermissions.every((perm) => permissions.includes(perm));

    const hasRequiredRole = requiredRole ? role === requiredRole : true;

    const hasAccess = hasPermissions && hasRequiredRole;

    return hasAccess ? children : <Navigate to='/unauthorized' />;
};

export default ProtectedRoute;
