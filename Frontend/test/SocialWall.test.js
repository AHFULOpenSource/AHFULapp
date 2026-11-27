import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import socialWallReducer, {
  socialWallInitialState,
  syncCacheUser,
  clearSocialWall,
  pullPublicPosts,
  pullConversations,
  pullConversationThread,
  sendWallPost,
  removeWallPost,
} from "../src/SocialWall/SocialWallSlice.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("SocialWallSlice reducer & cache behaviors", async (t) => {
  await t.test("syncCacheUser resets cache when switching user emails", () => {
    const populated = {
      ...socialWallInitialState,
      cachedUserEmail: "alice@example.com",
      publicPosts: [{ _id: "p1", notes: "Hi" }],
      conversations: [{ conversation_id: "dm_123", title: "Bob" }],
      messagesByConversationId: { dm_123: [{ _id: "m1", notes: "Hey" }] },
    };

    const sameUser = socialWallReducer(populated, syncCacheUser("ALICE@example.com"));
    assert.equal(sameUser.publicPosts.length, 1);
    assert.equal(sameUser.conversations.length, 1);

    const switchedUser = socialWallReducer(populated, syncCacheUser("bob@example.com"));
    assert.equal(switchedUser.cachedUserEmail, "bob@example.com");
    assert.deepEqual(switchedUser.publicPosts, []);
    assert.deepEqual(switchedUser.conversations, []);
    assert.deepEqual(switchedUser.messagesByConversationId, {});
  });

  await t.test("clearSocialWall resets entire slice state", () => {
    const populated = {
      ...socialWallInitialState,
      cachedUserEmail: "alice@example.com",
      publicPosts: [{ _id: "p1" }],
      conversations: [{ conversation_id: "dm_123" }],
    };
    const cleared = socialWallReducer(populated, clearSocialWall());
    assert.deepEqual(cleared, socialWallInitialState);
  });

  await t.test("sendWallPost.fulfilled prepends public post and upserts private conversation", () => {
    let state = socialWallInitialState;

    const pubPost = {
      _id: "pub1",
      notes: "Public workout note",
      is_public: true,
      is_mine: true,
      conversation_id: null,
      owner: { name: "Alice", email: "alice@example.com" },
      shared_to_user: null,
      created_at: 1000,
    };
    state = socialWallReducer(state, sendWallPost.fulfilled(pubPost, "req1", {}));
    assert.equal(state.publicPosts.length, 1);
    assert.equal(state.publicPosts[0]._id, "pub1");

    const dmPost = {
      _id: "dm1",
      notes: "Hey Bob!",
      is_public: false,
      is_mine: true,
      conversation_id: "dm_abcdef0123456789abcdef01",
      owner: { name: "Alice", email: "alice@example.com" },
      shared_to_user: { name: "Bob", email: "bob@example.com" },
      created_at: 2000,
    };
    state = socialWallReducer(state, sendWallPost.fulfilled(dmPost, "req2", {}));
    assert.equal(state.conversations.length, 1);
    assert.equal(state.conversations[0].conversation_id, "dm_abcdef0123456789abcdef01");
    assert.equal(state.conversations[0].message_count, 1);
    assert.equal(state.messagesByConversationId["dm_abcdef0123456789abcdef01"].length, 1);
  });

  await t.test("pullConversationThread.fulfilled merges incremental updates without duplicates", () => {
    const convId = "dm_abcdef0123456789abcdef01";
    const initial = {
      ...socialWallInitialState,
      conversations: [
        {
          conversation_id: convId,
          title: "Bob",
          last_message: { _id: "m1", notes: "First", created_at: 100 },
          last_message_at: 100,
          message_count: 1,
        },
      ],
      messagesByConversationId: {
        [convId]: [{ _id: "m1", notes: "First", created_at: 100 }],
      },
    };

    const next = socialWallReducer(
      initial,
      pullConversationThread.fulfilled(
        {
          conversationId: convId,
          incremental: true,
          payload: {
            messages: [
              { _id: "m1", notes: "First", created_at: 100 },
              { _id: "m2", notes: "Second", created_at: 105 },
            ],
          },
        },
        "req3",
        { conversationId: convId, incremental: true }
      )
    );

    assert.equal(next.messagesByConversationId[convId].length, 2);
    assert.equal(next.conversations[0].last_message._id, "m2");
    assert.equal(next.conversations[0].message_count, 2);
  });

  await t.test("removeWallPost.fulfilled removes public posts and empty private threads", () => {
    const convId = "dm_abcdef0123456789abcdef01";
    const initial = {
      ...socialWallInitialState,
      publicPosts: [{ _id: "p1", notes: "Public" }],
      conversations: [
        {
          conversation_id: convId,
          title: "Bob",
          last_message: { _id: "m1", notes: "Only msg", created_at: 100 },
          last_message_at: 100,
          message_count: 1,
        },
      ],
      messagesByConversationId: {
        [convId]: [{ _id: "m1", notes: "Only msg", created_at: 100 }],
      },
    };

    const afterPub = socialWallReducer(
      initial,
      removeWallPost.fulfilled({ postId: "p1", isPublic: true, conversationId: null }, "r1", {})
    );
    assert.equal(afterPub.publicPosts.length, 0);

    const afterDm = socialWallReducer(
      afterPub,
      removeWallPost.fulfilled({ postId: "m1", isPublic: false, conversationId: convId }, "r2", {})
    );
    assert.equal(afterDm.conversations.length, 0);
    assert.equal(afterDm.messagesByConversationId[convId], undefined);
  });

  await t.test("pullPublicPosts and pullConversations populate cache timestamps", () => {
    const s1 = socialWallReducer(
      socialWallInitialState,
      pullPublicPosts.fulfilled([{ _id: "p1" }], "r1", {})
    );
    assert.equal(s1.publicPosts.length, 1);
    assert.ok(typeof s1.lastFetchedPublicAt === "number");

    const s2 = socialWallReducer(
      s1,
      pullConversations.fulfilled([{ conversation_id: "dm_1", last_message_at: 50 }], "r2", {})
    );
    assert.equal(s2.conversations.length, 1);
    assert.ok(typeof s2.lastFetchedConvsAt === "number");
  });
});

test("SocialWall UI & Redux wiring checks", () => {
  const socialWorkouts = fs.readFileSync(
    path.join(__dirname, "../src/SocialWall/SocialWorkouts.jsx"),
    "utf8"
  );
  const privateTab = fs.readFileSync(
    path.join(__dirname, "../src/SocialWall/PrivateMessagesTab.jsx"),
    "utf8"
  );
  const publicTab = fs.readFileSync(
    path.join(__dirname, "../src/SocialWall/PublicWallTab.jsx"),
    "utf8"
  );
  const storeJsx = fs.readFileSync(
    path.join(__dirname, "../src/store.jsx"),
    "utf8"
  );
  const logoutJs = fs.readFileSync(
    path.join(__dirname, "../src/Auth/HandleAHFULLogout.js"),
    "utf8"
  );

  assert.ok(socialWorkouts.includes("Public Wall"));
  assert.ok(socialWorkouts.includes("Private Messages"));
  assert.ok(socialWorkouts.includes("Shared Workouts"));
  assert.ok(socialWorkouts.includes("handleRefresh"));
  assert.ok(!socialWorkouts.includes("explore-content"));
  assert.ok(privateTab.includes("+ New Message"));
  assert.ok(privateTab.includes("getFriendsForCurrentUser"));
  assert.ok(!privateTab.includes("social-badge-private"));
  assert.ok(!privateTab.includes(">Refresh<"));
  assert.ok(publicTab.includes("Post Publicly"));
  assert.ok(!publicTab.includes("Refresh Public Wall"));
  assert.ok(storeJsx.includes("socialWall"));
  assert.ok(logoutJs.includes("clearSocialWall"));
});
