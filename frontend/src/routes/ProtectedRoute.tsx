import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Why a ProtectedRoute component?
// React Router renders routes based on URL, not auth state.
// We need a wrapper that checks "is the user authenticated?"
// before rendering the protected content. If not, redirect to login.

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  // While we're checking localStorage for an existing session, show nothing.
  // Without this, there's a flash where the user is briefly redirected to login.
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
