import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import FriendProfile from "../components/FriendProfile";
import NotificationBell from "../components/NotificationBell";
import styles from "./FriendsPage.module.css";

const SEARCH_MESSAGES = {
  not_found:         "No user found with that username.",
  self:              "That's you!",
  already_following: "You're already following this person.",
};

export default function FriendsPage({ myRatings, friendsState, username, notifications, unreadCount, onMarkAllRead, onBack }) {
  const { user } = useAuth();
  const [handle,       setHandle]       = useState("");
  const [friendSearch, setFriendSearch] = useState("");

  const {
    friends, friendRatings, loading, searching, error,
    searchResult, searchByUsername, followUser, unfollowUser,
    loadFriendRatings, clearSearch, clearError, followingIds,
  } = friendsState;

  const filteredFriends = friends.filter(f =>
    f.username?.toLowerCase().includes(friendSearch.toLowerCase())
  );

  function handleSearch(e) {
    e.preventDefault();
    if (handle.trim()) searchByUsername(handle);
  }

  return (
    <div className={styles.page}>

      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>← Back</button>
        <span className={styles.headerTitle}>Friends</span>
        <div className={styles.headerRight}>
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAllRead={onMarkAllRead}
            onFollowBack={followUser}
            followingIds={followingIds}
          />
        </div>
      </header>

      <main className={styles.main}>

        {/* Error banner */}
        {error && (
          <div className={styles.errorBanner}>
            {error}
            <button className={styles.dismissBtn} onClick={clearError}>✕</button>
          </div>
        )}

        {/* Add a friend */}
        <div className={styles.searchSection}>
          <h2 className={styles.sectionTitle}>Add a friend</h2>
          <form className={styles.searchForm} onSubmit={handleSearch}>
            <div className={styles.usernameInputWrap}>
              <span className={styles.at}>@</span>
              <input
                type="text"
                placeholder="username"
                value={handle}
                onChange={e => {
                  setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                  clearSearch();
                }}
                className={styles.searchInput}
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>
            <button
              type="submit"
              className={styles.searchBtn}
              disabled={searching || !handle.trim()}
            >
              {searching ? "Searching…" : "Search"}
            </button>
          </form>

          {/* Search result message */}
          {searchResult && typeof searchResult === "string" && (
            <p className={styles.searchMsg}>{SEARCH_MESSAGES[searchResult]}</p>
          )}

          {/* Search result card */}
          {searchResult && typeof searchResult === "object" && (
            <div className={styles.searchResultCard}>
              <div className={styles.resultInfo}>
                <p className={styles.resultName}>@{searchResult.username}</p>
              </div>
              <button className={styles.followBtn} onClick={() => followUser(searchResult)}>
                Follow
              </button>
            </div>
          )}
        </div>

        {/* Following list */}
        <div className={styles.friendsSection}>
          <h2 className={styles.sectionTitle}>
            Following
            <span className={styles.friendCount}>{friends.length}</span>
          </h2>

          {/* Friend search */}
          {friends.length > 0 && (
            <div className={styles.friendSearchWrap}>
              <span className={styles.friendSearchIcon}>⌕</span>
              <input
                type="text"
                placeholder="Search following…"
                value={friendSearch}
                onChange={e => setFriendSearch(e.target.value)}
                className={styles.friendSearchInput}
              />
              {friendSearch && (
                <button className={styles.friendSearchClear} onClick={() => setFriendSearch("")}>✕</button>
              )}
            </div>
          )}

          {loading ? (
            <div className={styles.loadingWrap}>
              <div className={styles.spinner} />
            </div>
          ) : friends.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>No friends yet</p>
              <p className={styles.emptyBody}>Search by username to add fellow Huskies.</p>
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>No results</p>
              <p className={styles.emptyBody}>No one in your following matches "{friendSearch}".</p>
            </div>
          ) : (
            filteredFriends.map(friend => (
              <FriendProfile
                key={friend.uid}
                friend={friend}
                myRatings={myRatings}
                friendRatings={friendRatings}
                onLoad={loadFriendRatings}
                onUnfollow={unfollowUser}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}