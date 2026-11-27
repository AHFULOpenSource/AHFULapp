import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as socialApi from "./socialApi.js";
import { selectAuthStatus } from "../Auth/AuthSlice.js";
import {
  pullConversations,
  pullConversationThread,
  sendWallPost,
  removeWallPost,
  selectConversations,
  selectMessagesByConversationId,
  selectSocialWallLoadingConversations,
  selectSocialWallLoadingThread,
  selectSocialWallSending,
  selectSocialWallError,
} from "./SocialWallSlice.js";

const POLL_INTERVAL_MS = 15_000;

function formatTimeShort(ts) {
  if (!ts) return "";
  return new Date(ts * 1000).toLocaleString();
}

export function PrivateMessagesTab({
  userEmail,
  selectedConversationId,
  onSelectConversation,
}) {
  const dispatch = useDispatch();
  const authStatus = useSelector(selectAuthStatus);
  const conversations = useSelector(selectConversations);
  const messagesByConversationId = useSelector(selectMessagesByConversationId);
  const loadingConversations = useSelector(selectSocialWallLoadingConversations);
  const loadingThread = useSelector(selectSocialWallLoadingThread);
  const sending = useSelector(selectSocialWallSending);
  const sliceError = useSelector(selectSocialWallError);

  const [draftEmail, setDraftEmail] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [localError, setLocalError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [mobileShowThread, setMobileShowThread] = useState(false);

  // New Message friend picker modal state
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [friendsList, setFriendsList] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsError, setFriendsError] = useState("");
  const [friendSearch, setFriendSearch] = useState("");

  const messagesEndRef = useRef(null);

  const activeConversation = conversations.find(
    (c) => c.conversation_id === selectedConversationId
  );
  const activeMessages = selectedConversationId
    ? messagesByConversationId[selectedConversationId] || []
    : [];

  // Load selected thread when active conversation changes
  useEffect(() => {
    if (selectedConversationId) {
      dispatch(pullConversationThread({ conversationId: selectedConversationId }));
    }
  }, [dispatch, selectedConversationId]);

  // Auto-scroll to bottom when messages load or change
  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === "function") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedConversationId, activeMessages.length]);

  // Visibility-aware periodic polling for active private messages
  useEffect(() => {
    if (authStatus !== "authenticated") {
      return;
    }

    const syncPrivateData = () => {
      if (authStatus !== "authenticated") {
        return;
      }
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      dispatch(pullConversations({ force: true }));
      if (selectedConversationId) {
        dispatch(
          pullConversationThread({
            conversationId: selectedConversationId,
            incremental: true,
            force: true,
          })
        );
      }
    };

    const intervalId = setInterval(syncPrivateData, POLL_INTERVAL_MS);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        syncPrivateData();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibility);
    }
    return () => {
      clearInterval(intervalId);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibility);
      }
    };
  }, [dispatch, selectedConversationId, authStatus]);

  const handleSelectConversation = (conversationId) => {
    setDraftEmail(null);
    onSelectConversation(conversationId);
    setConfirmDeleteId(null);
    setLocalError("");
    setMobileShowThread(true);
  };

  const handleOpenNewMessage = async () => {
    setShowNewMessageModal(true);
    setFriendSearch("");
    setFriendsError("");
    setFriendsLoading(true);
    const res = await socialApi.getFriendsForCurrentUser();
    setFriendsLoading(false);
    if (res.error) {
      setFriendsError(res.error);
      setFriendsList([]);
      return;
    }
    const rawList = Array.isArray(res.data) ? res.data : res.data?.data || [];
    const normalizedMe = (userEmail || "").toLowerCase();
    const emails = rawList
      .map((friendship) => {
        const u1 = (friendship?.User1Email || "").trim().toLowerCase();
        const u2 = (friendship?.User2Email || "").trim().toLowerCase();
        if (u1 && u1 !== normalizedMe) return u1;
        if (u2 && u2 !== normalizedMe) return u2;
        return null;
      })
      .filter(Boolean);
    setFriendsList([...new Set(emails)].sort());
  };

  const handlePickFriendEmail = (friendEmail) => {
    const normalized = friendEmail.toLowerCase();
    const existingConv = conversations.find(
      (c) => (c.peer_user?.email || "").toLowerCase() === normalized
    );
    setShowNewMessageModal(false);
    setLocalError("");
    setConfirmDeleteId(null);
    if (existingConv) {
      setDraftEmail(null);
      onSelectConversation(existingConv.conversation_id);
    } else {
      onSelectConversation(null);
      setDraftEmail(normalized);
    }
    setMobileShowThread(true);
  };

  const handleSendMessage = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const trimmed = replyText.trim();
    const targetEmail = draftEmail || activeConversation?.peer_user?.email;
    if (!trimmed) {
      setLocalError("Please enter a message.");
      return;
    }
    if (!targetEmail) {
      setLocalError("Select a conversation or start a new message first.");
      return;
    }

    setLocalError("");
    try {
      const created = await dispatch(
        sendWallPost({
          notes: trimmed,
          isPublic: false,
          sharedToUserEmail: targetEmail,
        })
      ).unwrap();
      setReplyText("");
      if (created?.conversation_id) {
        setDraftEmail(null);
        onSelectConversation(created.conversation_id);
      }
    } catch (err) {
      setLocalError(typeof err === "string" ? err : "Failed to send message.");
    }
  };

  const handleComposerKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeleteMessage = async (postId) => {
    if (!selectedConversationId) return;
    setLocalError("");
    try {
      await dispatch(
        removeWallPost({
          postId,
          isPublic: false,
          conversationId: selectedConversationId,
        })
      ).unwrap();
      setConfirmDeleteId(null);
    } catch (err) {
      setLocalError(typeof err === "string" ? err : "Failed to delete message.");
    }
  };

  const filteredFriends = friendsList.filter((email) =>
    email.includes(friendSearch.trim().toLowerCase())
  );

  const targetTitle =
    activeConversation?.title ||
    activeConversation?.peer_user?.name ||
    draftEmail ||
    "";
  const targetEmailDisplay =
    activeConversation?.peer_user?.email || draftEmail || "";

  return (
    <div>
      {(localError || sliceError) && (
        <div className="explore-error" style={{ marginBottom: 10 }}>
          {localError || sliceError}
        </div>
      )}

      <div className="pm-shell">
        {/* Left Sidebar: Existing Conversations Only + New Message */}
        <aside className={`pm-sidebar ${mobileShowThread ? "mobile-hidden" : ""}`}>
          <div className="pm-sidebar-header">
            <span className="pm-sidebar-title">Conversations</span>
            <button
              type="button"
              className="social-btn-primary"
              onClick={handleOpenNewMessage}
            >
              + New Message
            </button>
          </div>

          <div className="pm-conv-list">
            {loadingConversations && conversations.length === 0 ? (
              <div className="pm-empty-state">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="pm-empty-state">
                <span>No private conversations yet.</span>
                <button
                  type="button"
                  className="social-btn-secondary"
                  onClick={handleOpenNewMessage}
                >
                  Start a Conversation
                </button>
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = conv.conversation_id === selectedConversationId;
                const lastMsg = conv.last_message;
                const previewText = lastMsg
                  ? `${lastMsg.is_mine ? "You: " : ""}${lastMsg.notes || ""}`
                  : "";
                return (
                  <button
                    key={conv.conversation_id}
                    type="button"
                    className={`pm-conv-item ${isActive ? "active" : ""}`}
                    onClick={() => handleSelectConversation(conv.conversation_id)}
                  >
                    <div className="pm-conv-top">
                      <span className="pm-conv-name">
                        {conv.title || conv.peer_user?.email || "Friend"}
                      </span>
                      <span className="pm-conv-time">
                        {formatTimeShort(conv.last_message_at)}
                      </span>
                    </div>
                    <div className="pm-conv-preview">{previewText}</div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Pane: Selected Conversation Thread or Draft */}
        <section className={`pm-thread-pane ${!mobileShowThread ? "mobile-hidden" : ""}`}>
          {!selectedConversationId && !draftEmail ? (
            <div className="pm-empty-state">
              <strong>Private Messages</strong>
              <span>
                Select an existing conversation on the left, or click{" "}
                <strong>+ New Message</strong> to message a friend.
              </span>
            </div>
          ) : (
            <>
              <div className="pm-thread-header">
                <div className="pm-thread-title-group">
                  <button
                    type="button"
                    className="social-btn-secondary pm-mobile-back"
                    onClick={() => setMobileShowThread(false)}
                  >
                    ← Back
                  </button>
                  <div style={{ minWidth: 0 }}>
                    <strong>{targetTitle}</strong>
                    {targetEmailDisplay && targetEmailDisplay !== targetTitle && (
                      <div className="pm-thread-subtitle">{targetEmailDisplay}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pm-messages-scroll">
                {loadingThread && activeMessages.length === 0 ? (
                  <div className="pm-empty-state">Loading messages...</div>
                ) : activeMessages.length === 0 ? (
                  <div className="pm-empty-state">
                    No messages yet with {targetTitle}. Send a private message below!
                  </div>
                ) : (
                  activeMessages.map((msg) => {
                    const isMine = Boolean(msg.is_mine);
                    const isConfirming = confirmDeleteId === msg._id;

                    return (
                      <div
                        key={msg._id}
                        className={`pm-bubble-row ${isMine ? "mine" : "theirs"}`}
                      >
                        <div className="pm-bubble">{msg.notes}</div>
                        <div className="pm-bubble-meta">
                          <span>{formatTimeShort(msg.created_at)}</span>
                          {isMine && (
                            <>
                              {isConfirming ? (
                                <>
                                  <button
                                    type="button"
                                    className="social-btn-danger"
                                    onClick={() => handleDeleteMessage(msg._id)}
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    type="button"
                                    className="social-btn-secondary"
                                    onClick={() => setConfirmDeleteId(null)}
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  className="social-btn-danger"
                                  onClick={() => setConfirmDeleteId(msg._id)}
                                >
                                  Delete
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="pm-thread-composer" onSubmit={handleSendMessage}>
                <textarea
                  className="task-input pm-thread-input"
                  rows={2}
                  placeholder={`Message ${targetTitle}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={handleComposerKeyDown}
                />
                <button type="submit" className="social-btn-primary" disabled={sending}>
                  {sending ? "Sending..." : "Send"}
                </button>
              </form>
            </>
          )}
        </section>
      </div>

      {/* New Message Confirmed-Friend Picker Modal */}
      {showNewMessageModal && (
        <div
          className="pm-modal-overlay"
          onClick={() => setShowNewMessageModal(false)}
        >
          <div className="pm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="pm-modal-header">
              <strong>New Private Message</strong>
              <button
                type="button"
                className="social-btn-secondary"
                onClick={() => setShowNewMessageModal(false)}
              >
                Close
              </button>
            </div>

            <input
              type="text"
              placeholder="Filter confirmed friends by email..."
              value={friendSearch}
              onChange={(e) => setFriendSearch(e.target.value)}
            />

            {friendsLoading && <div>Loading friends...</div>}
            {!friendsLoading && friendsError && (
              <div className="explore-error">{friendsError}</div>
            )}
            {!friendsLoading && !friendsError && filteredFriends.length === 0 && (
              <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                No matching confirmed friends found.
              </div>
            )}

            <div className="pm-modal-friends-list">
              {filteredFriends.map((email) => (
                <button
                  key={email}
                  type="button"
                  className="pm-modal-friend-btn"
                  onClick={() => handlePickFriendEmail(email)}
                >
                  <span>{email}</span>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    Message →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PrivateMessagesTab;
