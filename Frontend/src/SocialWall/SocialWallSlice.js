import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getPublicWallPosts,
  getConversations,
  getConversationMessages,
  createWallPost,
  deleteWallPost,
} from "./socialApi.js";

export const PUBLIC_TTL_MS = 30_000;
export const CONVERSATIONS_TTL_MS = 15_000;
export const THREAD_TTL_MS = 10_000;

export const socialWallInitialState = {
  cachedUserEmail: null,
  publicPosts: [],
  conversations: [],
  messagesByConversationId: {},
  lastFetchedPublicAt: null,
  lastFetchedConvsAt: null,
  lastFetchedThreadsAt: {},
  loadingPublic: false,
  loadingConversations: false,
  loadingThread: false,
  sending: false,
  error: null,
};

function sortConversationsDesc(conversations) {
  return [...conversations].sort(
    (a, b) => (b.last_message_at || 0) - (a.last_message_at || 0)
  );
}

function mergeMessagesChronological(existing, incoming) {
  const byId = new Map();
  for (const msg of existing || []) {
    if (msg && msg._id) byId.set(msg._id, msg);
  }
  for (const msg of incoming || []) {
    if (msg && msg._id) byId.set(msg._id, msg);
  }
  return Array.from(byId.values()).sort(
    (a, b) => (a.created_at || 0) - (b.created_at || 0)
  );
}

export const pullPublicPosts = createAsyncThunk(
  "socialWall/pullPublicPosts",
  async (_, { rejectWithValue }) => {
    const res = await getPublicWallPosts();
    if (res.error) return rejectWithValue(res.error);
    return res.data || [];
  },
  {
    condition: (arg = {}, { getState }) => {
      const state = getState().socialWall;
      if (!state) return true;
      if (state.loadingPublic) return false;
      if (arg?.force) return true;
      if (!state.lastFetchedPublicAt) return true;
      return Date.now() - state.lastFetchedPublicAt >= PUBLIC_TTL_MS;
    },
  }
);

export const pullConversations = createAsyncThunk(
  "socialWall/pullConversations",
  async (_, { rejectWithValue }) => {
    const res = await getConversations();
    if (res.error) return rejectWithValue(res.error);
    return res.data || [];
  },
  {
    condition: (arg = {}, { getState }) => {
      const state = getState().socialWall;
      if (!state) return true;
      if (state.loadingConversations) return false;
      if (arg?.force) return true;
      if (!state.lastFetchedConvsAt) return true;
      return Date.now() - state.lastFetchedConvsAt >= CONVERSATIONS_TTL_MS;
    },
  }
);

export const pullConversationThread = createAsyncThunk(
  "socialWall/pullConversationThread",
  async ({ conversationId, incremental = false }, { getState, rejectWithValue }) => {
    const state = getState().socialWall;
    const existing = state?.messagesByConversationId?.[conversationId] || [];
    let since = null;
    if (incremental && existing.length > 0) {
      const lastTs = existing[existing.length - 1]?.created_at;
      if (typeof lastTs === "number") {
        // Subtract 1 second and deduplicate by _id so messages sharing a second aren't missed
        since = Math.max(0, lastTs - 1);
      }
    }
    const res = await getConversationMessages(conversationId, since);
    if (res.error) return rejectWithValue(res.error);
    return {
      conversationId,
      incremental: Boolean(incremental && since !== null),
      payload: res.data || {},
    };
  },
  {
    condition: (arg = {}, { getState }) => {
      const { conversationId, force = false } = arg;
      if (!conversationId) return false;
      const state = getState().socialWall;
      if (!state) return true;
      if (force) return true;
      const lastAt = state.lastFetchedThreadsAt?.[conversationId];
      if (!lastAt) return true;
      return Date.now() - lastAt >= THREAD_TTL_MS;
    },
  }
);

export const sendWallPost = createAsyncThunk(
  "socialWall/sendWallPost",
  async ({ notes, isPublic, sharedToUserEmail }, { rejectWithValue }) => {
    const res = await createWallPost({ notes, isPublic, sharedToUserEmail });
    if (res.error) return rejectWithValue(res.error);
    return res.data;
  }
);

export const removeWallPost = createAsyncThunk(
  "socialWall/removeWallPost",
  async ({ postId, isPublic, conversationId }, { rejectWithValue }) => {
    const res = await deleteWallPost(postId);
    if (res.error) return rejectWithValue(res.error);
    return { postId, isPublic: Boolean(isPublic), conversationId: conversationId || null };
  }
);

const socialWallSlice = createSlice({
  name: "socialWall",
  initialState: socialWallInitialState,
  reducers: {
    syncCacheUser: (state, action) => {
      const normalized =
        typeof action.payload === "string" ? action.payload.trim().toLowerCase() : null;
      if (!normalized) return;
      if (state.cachedUserEmail && state.cachedUserEmail !== normalized) {
        return { ...socialWallInitialState, cachedUserEmail: normalized };
      }
      state.cachedUserEmail = normalized;
    },
    clearSocialWall: () => socialWallInitialState,
    clearSocialWallError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(pullPublicPosts.pending, (state) => {
        state.loadingPublic = true;
        state.error = null;
      })
      .addCase(pullPublicPosts.fulfilled, (state, action) => {
        state.publicPosts = action.payload;
        state.loadingPublic = false;
        state.lastFetchedPublicAt = Date.now();
      })
      .addCase(pullPublicPosts.rejected, (state, action) => {
        state.loadingPublic = false;
        state.error = action.payload || "Failed to load public wall posts.";
      })

      .addCase(pullConversations.pending, (state) => {
        state.loadingConversations = true;
        state.error = null;
      })
      .addCase(pullConversations.fulfilled, (state, action) => {
        state.conversations = sortConversationsDesc(action.payload);
        state.loadingConversations = false;
        state.lastFetchedConvsAt = Date.now();
      })
      .addCase(pullConversations.rejected, (state, action) => {
        state.loadingConversations = false;
        state.error = action.payload || "Failed to load private conversations.";
      })

      .addCase(pullConversationThread.pending, (state, action) => {
        if (!action.meta.arg?.incremental) {
          state.loadingThread = true;
        }
        state.error = null;
      })
      .addCase(pullConversationThread.fulfilled, (state, action) => {
        const { conversationId, incremental, payload } = action.payload;
        const incoming = Array.isArray(payload.messages) ? payload.messages : [];
        const existing = state.messagesByConversationId[conversationId] || [];

        const updatedThread = incremental
          ? mergeMessagesChronological(existing, incoming)
          : mergeMessagesChronological([], incoming);

        state.messagesByConversationId[conversationId] = updatedThread;
        state.lastFetchedThreadsAt[conversationId] = Date.now();
        state.loadingThread = false;

        if (updatedThread.length > 0) {
          const latest = updatedThread[updatedThread.length - 1];
          const convIndex = state.conversations.findIndex(
            (c) => c.conversation_id === conversationId
          );
          if (convIndex !== -1) {
            state.conversations[convIndex] = {
              ...state.conversations[convIndex],
              last_message: latest,
              last_message_at: latest.created_at,
              message_count: Math.max(
                state.conversations[convIndex].message_count || 0,
                updatedThread.length
              ),
            };
            state.conversations = sortConversationsDesc(state.conversations);
          }
        }
      })
      .addCase(pullConversationThread.rejected, (state, action) => {
        state.loadingThread = false;
        state.error = action.payload || "Failed to load conversation messages.";
      })

      .addCase(sendWallPost.pending, (state) => {
        state.sending = true;
        state.error = null;
      })
      .addCase(sendWallPost.fulfilled, (state, action) => {
        state.sending = false;
        const post = action.payload;
        if (!post || !post._id) return;

        if (post.is_public) {
          if (!state.publicPosts.some((p) => p._id === post._id)) {
            state.publicPosts = [post, ...state.publicPosts];
          }
          return;
        }

        const convId = post.conversation_id;
        if (!convId) return;

        const existingThread = state.messagesByConversationId[convId] || [];
        const wasAlreadyPresent = existingThread.some((m) => m._id === post._id);
        state.messagesByConversationId[convId] = mergeMessagesChronological(
          existingThread,
          [post]
        );

        const peer = post.shared_to_user || post.owner;
        const convIndex = state.conversations.findIndex(
          (c) => c.conversation_id === convId
        );
        if (convIndex !== -1) {
          const prev = state.conversations[convIndex];
          state.conversations[convIndex] = {
            ...prev,
            last_message: post,
            last_message_at: post.created_at,
            message_count: wasAlreadyPresent
              ? prev.message_count
              : (prev.message_count || 0) + 1,
          };
        } else if (peer) {
          state.conversations.unshift({
            conversation_id: convId,
            type: "direct",
            title: peer.name || peer.email || "Friend",
            peer_user: peer,
            participants: [peer],
            last_message: post,
            last_message_at: post.created_at,
            message_count: 1,
          });
        }
        state.conversations = sortConversationsDesc(state.conversations);
      })
      .addCase(sendWallPost.rejected, (state, action) => {
        state.sending = false;
        state.error = action.payload || "Failed to send post.";
      })

      .addCase(removeWallPost.fulfilled, (state, action) => {
        const { postId, isPublic, conversationId } = action.payload;
        if (isPublic) {
          state.publicPosts = state.publicPosts.filter((p) => p._id !== postId);
          return;
        }
        if (!conversationId) return;

        const existing = state.messagesByConversationId[conversationId] || [];
        const remaining = existing.filter((m) => m._id !== postId);

        if (remaining.length === 0) {
          delete state.messagesByConversationId[conversationId];
          state.conversations = state.conversations.filter(
            (c) => c.conversation_id !== conversationId
          );
        } else {
          state.messagesByConversationId[conversationId] = remaining;
          const latest = remaining[remaining.length - 1];
          const convIndex = state.conversations.findIndex(
            (c) => c.conversation_id === conversationId
          );
          if (convIndex !== -1) {
            state.conversations[convIndex] = {
              ...state.conversations[convIndex],
              last_message: latest,
              last_message_at: latest.created_at,
              message_count: remaining.length,
            };
            state.conversations = sortConversationsDesc(state.conversations);
          }
        }
      })
      .addCase(removeWallPost.rejected, (state, action) => {
        state.error = action.payload || "Failed to delete message.";
      });
  },
});

export const { syncCacheUser, clearSocialWall, clearSocialWallError } =
  socialWallSlice.actions;

export const selectPublicPosts = (state) => state.socialWall.publicPosts;
export const selectConversations = (state) => state.socialWall.conversations;
export const selectMessagesByConversationId = (state) =>
  state.socialWall.messagesByConversationId;
export const selectSocialWallLoadingPublic = (state) => state.socialWall.loadingPublic;
export const selectSocialWallLoadingConversations = (state) =>
  state.socialWall.loadingConversations;
export const selectSocialWallLoadingThread = (state) => state.socialWall.loadingThread;
export const selectSocialWallSending = (state) => state.socialWall.sending;
export const selectSocialWallError = (state) => state.socialWall.error;

export default socialWallSlice.reducer;
