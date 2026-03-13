import { Navigate } from "react-router-dom"
import PropTypes from "prop-types"

/**
 * Protects a route based on required role.
 * Redirects to / if no role or role doesn't match.
 */
export default function RouteGuard({ allowedRoles, children }) {
  const role = localStorage.getItem("port2region_role")
  if (!role) return <Navigate to="/" replace />
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/" replace />
  return children
}

RouteGuard.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
  children: PropTypes.node.isRequired,
}
