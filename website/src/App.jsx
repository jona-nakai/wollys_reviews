import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useRatings } from "./hooks/useRatings";
import { useNotifications } from "./hooks/useNotifications";
import { useFriends } from "./hooks/useFriends";
import { useUsername } from "./hooks/useUsername";
import LoginPage from "./pages/LoginPage";
import UsernameSetupPage from "./pages/UsernameSetupPage";
import RatingsPage from "./pages/RatingsPage";
import FriendsPage from "./pages/FriendsPage";

function AppRoutes() {
  const { user } = useAuth();
  const [page, setPage] = useState("ratings");

  const { needsSetup, loaded, username, saving, error, checkAvailability, saveUsername } = useUsername(user);
  const ratingsState    = useRatings(user);
  const { notifications, unreadCount, markAllRead, createFollowNotification } = useNotifications(user);
  const friendsState    = useFriends(user, username, createFollowNotification);

  if (user === undefined) return null;
  if (!user) return <LoginPage />;
  if (!loaded) return null;

  if (needsSetup) {
    return (
      <UsernameSetupPage
        user={user}
        onSave={saveUsername}
        checkAvailability={checkAvailability}
        saving={saving}
        error={error}
      />
    );
  }

  if (page === "friends") {
    return (
      <FriendsPage
        myRatings={ratingsState.ratings}
        friendsState={friendsState}
        username={username}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAllRead={markAllRead}
        onBack={() => setPage("ratings")}
      />
    );
  }

  return (
    <RatingsPage
      ratingsState={ratingsState}
      username={username}
      notifications={notifications}
      unreadCount={unreadCount}
      onMarkAllRead={markAllRead}
      onFollowBack={friendsState.followUser}
      followingIds={friendsState.followingIds}
      onOpenFriends={() => setPage("friends")}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}