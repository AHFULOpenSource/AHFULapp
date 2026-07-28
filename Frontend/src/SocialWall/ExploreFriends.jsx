import React, { useState, useEffect } from "react";
import "../siteStyles.css";
import * as socialApi from "./socialApi";
import { useSelector } from "react-redux";

export function ExploreFriends() {
    // state (will be backed by backend)
    const [inputValue, setInputValue] = useState("");
    // pendingRequests: array of friendship objects (at minimum {_id, User1Email, User2Email, Status})
    const [pendingRequests, setPendingRequests] = useState([]);
    // friends: array of friend objects or friendship objects
    const [friends, setFriends] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const user = useSelector((state) => state.auth.user);

    const handleAddFriend = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const email = (inputValue || "").trim();
        if (email === "") {
            setError("Please enter an email address.");
            window.alert("Please enter an email address.");
            return;
        }
        const normalized = email.toLowerCase();
        // basic local dedupe
        if (
            pendingRequests.some((p) => (p.User2Email || "").toLowerCase() === normalized) ||
            friends.some((f) => ((f.User1Email || f.User2Email) || "").toLowerCase() === normalized)
        ) {
            setError("That user is already pending or a friend.");
            window.alert("That user is already pending or a friend.");
            return;
        }

        // call backend
        (async () => {
            const res = await socialApi.createFriendRequest(normalized);
            if (res.error) {
                setError(res.error);
                window.alert(res.error);
                return;
            }
            // add returned friendship object to pending (backend returns the created friendship)
            const obj = res.data || {};
            setPendingRequests((prev) => [...prev, obj]);
            setInputValue("");
            setError("");
        })();
    };

    const handleAccept = (friendship) => {
        const id = friendship._id || friendship.id || friendship._id?.$oid || friendship.friendship_id;
        if (!id) return;
        (async () => {
            const res = await socialApi.acceptFriendRequest(id);
            if (res.error) {
                setError(res.error);
                window.alert(res.error);
                return;
            }
            // move from pending to friends
            setPendingRequests((prev) => prev.filter((p) => (p._id || p.id) !== (friendship._id || friendship.id)));
            setFriends((prev) => [...prev, res.data || friendship]);
        })();
    };

    const handleCancelPending = (friendship) => {
        const id = friendship._id || friendship.id;
        if (!id) return;
        (async () => {
            const res = await socialApi.deleteFriendship(id);
            if (res.error) {
                setError(res.error);
                window.alert(res.error);
                return;
            }
            setPendingRequests((prev) => prev.filter((p) => (p._id || p.id) !== id));
        })();
    };

    const handleRemoveFriend = (friendship) => {
        const id = friendship._id || friendship.id;
        if (!id) return;
        (async () => {
            const res = await socialApi.deleteFriendship(id);
            if (res.error) {
                setError(res.error);
                window.alert(res.error);
                return;
            }
            setFriends((prev) => prev.filter((f) => (f._id || f.id) !== id));
        })();
    };

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            const pendingRes = await socialApi.getPendingForCurrentUser();
            const friendsRes = await socialApi.getFriendsForCurrentUser();
            if (!mounted) return;
            if (pendingRes.error) {
                console.warn("Failed to load pending friendships:", pendingRes.error);
            } else {
                // backend may return array or { data: [...] }
                const p = Array.isArray(pendingRes.data) ? pendingRes.data : (pendingRes.data && pendingRes.data.data) || [];
                setPendingRequests(p || []);
            }
            if (friendsRes.error) {
                console.warn("Failed to load friends:", friendsRes.error);
            } else {
                const f = Array.isArray(friendsRes.data) ? friendsRes.data : (friendsRes.data && friendsRes.data.data) || [];
                setFriends(f || []);
            }
            setLoading(false);
        })();
        return () => {
            mounted = false;
        };
    }, []);

    return (
        <div style={{ padding: "1rem" }}>
            {/* Top input hbox */}
            <div
                className="add-friend-hbox"
                style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1.25rem" }}
            >
                <label htmlFor="friend-email" style={{ minWidth: "140px", fontWeight: 600 }}>
                    Add friend by email
                </label>
                <input
                    id="friend-email"
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="friend@example.com"
                    aria-label="Friend email"
                    style={{ flex: 1, padding: "0.5rem" }}
                />
                <button onClick={handleAddFriend} aria-label="Send friend request">
                    Send Request
                </button>
            </div>

            {error && (
                <p className="error" style={{ color: "red", marginBottom: "1rem" }}>
                    {error}
                </p>
            )}

            {/* Two-column layout: left = pending, right = confirmed */}
            <div
                style={{
                    display: "flex",
                    gap: "1rem",
                    alignItems: "flex-start",
                }}
            >
                {/* Left: Pending Requests */}
                <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                    <h3 style={{ marginTop: 0 }}>Pending Requests</h3>
                                {loading ? (
                                    <p>Loading...</p>
                                ) : pendingRequests.length === 0 ? (
                                    <p>No pending friend requests.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {/* Split pending into requests sent by the current user vs received */}
                                        {(() => {
                                            const currentEmail = (user && user.email.toLowerCase()) || "";
                                            const sent = pendingRequests.filter((p) => ((p.User1Email || "") || "").toLowerCase() === currentEmail);
                                            const received = pendingRequests.filter((p) => ((p.User2Email || "") || "").toLowerCase() === currentEmail);
                                            return (
                                                <>
                                                    <div>
                                                        <strong>Requests you sent</strong>
                                                        {sent.length === 0 ? (
                                                            <div style={{ padding: '0.5rem', color: '#666' }}>None</div>
                                                        ) : (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                                {sent.map((p) => {
                                                                    const otherEmail = (p.User2Email || p.User1Email || "");
                                                                    return (
                                                                        <div key={p._id || p.id || otherEmail} className="pending-card" style={{ border: '1px solid #ddd', padding: '0.75rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                            <div style={{ fontWeight: 600 }}>{otherEmail}</div>
                                                                            <div>
                                                                                <button onClick={() => handleCancelPending(p)}>Cancel</button>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div style={{ marginTop: '0.75rem' }}>
                                                        <strong>Requests you received</strong>
                                                        {received.length === 0 ? (
                                                            <div style={{ padding: '0.5rem', color: '#666' }}>None</div>
                                                        ) : (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                                {received.map((p) => {
                                                                    const otherEmail = (p.User1Email || p.User2Email || "");
                                                                    return (
                                                                        <div key={p._id || p.id || otherEmail} className="pending-card" style={{ border: '1px solid #ddd', padding: '0.75rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                            <div style={{ fontWeight: 600 }}>{otherEmail}</div>
                                                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                                <button onClick={() => handleAccept(p)}>Accept</button>
                                                                                <button onClick={() => handleCancelPending(p)}>Decline</button>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}
                </div>

                {/* Right: Confirmed Friends */}
                <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                    <h3 style={{ marginTop: 0 }}>Your Friends</h3>
                    {loading ? (
                        <p>Loading...</p>
                    ) : friends.length === 0 ? (
                        <p>You have no friends yet.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {friends.map((f) => {
                                //TODO UPDATE HERE: backend will return a stic shape and this is too loose. 
                                let email = f.User1Email ;

                                if (email === user.email){
                                    email = f.User2Email;
                                }

                                const key = f._id || f.id || email;
                                return (
                                <div
                                    key={key}
                                    style={{
                                        border: '1px solid #eee',
                                        padding: '0.5rem',
                                        borderRadius: '6px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        width: '100%',
                                        boxSizing: 'border-box',
                                    }}
                                >
                                    <div>{email}</div>
                                    <div>
                                        <button onClick={() => handleRemoveFriend(f)}>Remove</button>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ExploreFriends;
