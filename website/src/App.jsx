import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RatingsPage from "./pages/RatingsPage";

function AppRoutes() {
  const { user } = useAuth();
  if (user === undefined) return null; // still resolving auth state
  return user ? <RatingsPage /> : <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}