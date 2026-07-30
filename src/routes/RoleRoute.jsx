import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_DEFAULT_ROUTES } from '../constants/roles';

export default function RoleRoute({ allowedRoles = [], children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const hasAccess = allowedRoles.length === 0 || allowedRoles.includes(user.role);

  if (!hasAccess) {
    const defaultRoute = ROLE_DEFAULT_ROUTES[user.role] || '/dashboard';
    return <Navigate to={defaultRoute} replace />;
  }

  return children ? children : <Outlet />;
}
