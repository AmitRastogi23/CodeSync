import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = () => {
  const { user } = useAuth();

  // Agar user logged in nahi hai, toh home page pe redirect kar do
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Agar logged in hai, toh andar ka content (Settings) render hone do
  return <Outlet />;
};

export default ProtectedRoute;
