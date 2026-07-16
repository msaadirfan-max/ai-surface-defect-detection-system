import {useAuth} from "../context/AuthContext";
import {Navigate} from "react-router-dom";


interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean; // Optional prop to require admin access
}


const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin }) => {
    const { isAuthenticated, isAdmin } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requireAdmin && !isAdmin) {
        return <Navigate to="/upload" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;