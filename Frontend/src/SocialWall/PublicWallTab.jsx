import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  sendWallPost,
  removeWallPost,
  selectPublicPosts,
  selectSocialWallLoadingPublic,
  selectSocialWallSending,
  selectSocialWallError,
} from "./SocialWallSlice.js";

function formatTimestamp(ts) {
  if (!ts) return "";
  return new Date(ts * 1000).toLocaleString();
}

export function PublicWallTab() {
  const dispatch = useDispatch();
  const publicPosts = useSelector(selectPublicPosts);
  const loadingPublic = useSelector(selectSocialWallLoadingPublic);
  const sending = useSelector(selectSocialWallSending);
  const sliceError = useSelector(selectSocialWallError);

  const [postNotes, setPostNotes] = useState("");
  const [localError, setLocalError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleCreatePublicPost = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const trimmed = postNotes.trim();
    if (!trimmed) {
      setLocalError("Please enter a public post message.");
      return;
    }

    setLocalError("");
    try {
      await dispatch(
        sendWallPost({
          notes: trimmed,
          isPublic: true,
          sharedToUserEmail: null,
        })
      ).unwrap();
      setPostNotes("");
    } catch (err) {
      setLocalError(typeof err === "string" ? err : "Failed to publish post.");
    }
  };

  const handleConfirmDelete = async (postId) => {
    setLocalError("");
    try {
      await dispatch(
        removeWallPost({ postId, isPublic: true, conversationId: null })
      ).unwrap();
      setConfirmDeleteId(null);
    } catch (err) {
      setLocalError(typeof err === "string" ? err : "Failed to delete post.");
    }
  };

  return (
    <div>
      <form className="social-composer" onSubmit={handleCreatePublicPost}>
        <textarea
          className="task-input"
          rows={3}
          placeholder="Share a public update with everyone..."
          value={postNotes}
          onChange={(e) => setPostNotes(e.target.value)}
        />
        <div className="social-composer-actions">
          <button type="submit" className="social-btn-primary" disabled={sending}>
            {sending ? "Posting..." : "Post Publicly"}
          </button>
        </div>
      </form>

      {(localError || sliceError) && (
        <div className="explore-error" style={{ marginBottom: 12 }}>
          {localError || sliceError}
        </div>
      )}

      {publicPosts.length === 0 ? (
        <div className="wh-status">
          {loadingPublic
            ? "Loading public posts..."
            : "No public posts yet. Be the first to post on the Public Wall!"}
        </div>
      ) : (
        <div className="social-feed-list">
          {publicPosts.map((post) => {
            const authorLabel =
              post.owner?.name || post.owner?.email || "Member";
            const isMine = Boolean(post.is_mine);
            const isConfirming = confirmDeleteId === post._id;

            return (
              <article key={post._id} className="social-post-card">
                <div className="social-post-meta">
                  <div className="social-post-author-row">
                    <strong>{authorLabel}</strong>
                    <span className="social-badge-public">Public</span>
                  </div>
                  <span className="social-post-time">
                    {formatTimestamp(post.created_at)}
                  </span>
                </div>

                <p className="social-post-body">{post.notes}</p>

                {isMine && (
                  <div className="social-post-footer">
                    {isConfirming ? (
                      <>
                        <button
                          type="button"
                          className="social-btn-danger"
                          onClick={() => handleConfirmDelete(post._id)}
                        >
                          Confirm Delete
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
                        onClick={() => setConfirmDeleteId(post._id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PublicWallTab;
