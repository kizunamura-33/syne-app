import { auth, storage } from "./firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// ─── 型定義 ───────────────────────────────────────────
export type UserProfile = {
  id: string;
  displayName: string;
  email: string;
  photoURL: string;
  bio: string;
  isArtist: boolean;
  isPremiumSubscriber: boolean;
  createdAt: string | null;
};

export type FirestorePost = {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  content: string;
  mediaURL?: string;
  mediaType?: "image" | "video";
  isPremium: boolean;
  premiumType?: "subscriber" | "paid";
  price?: number;
  likesCount: number;
  commentsCount: number;
  tags: string[];
  createdAt: string | null;
};

export type FirestoreComment = {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  content: string;
  createdAt: string | null;
};

export type PostCursor = { createdAt: string | null; id: string } | undefined;

// ─── REST API ヘルパー ─────────────────────────────────

async function getToken(): Promise<string | null> {
  try {
    return (await auth.currentUser?.getIdToken()) ?? null;
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FVal = any;

function parseVal(v: FVal): unknown {
  if (!v || typeof v !== "object") return null;
  if ("stringValue" in v) return v.stringValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("timestampValue" in v) return v.timestampValue as string;
  if ("nullValue" in v) return null;
  if ("arrayValue" in v) return ((v.arrayValue.values as FVal[]) ?? []).map(parseVal);
  if ("mapValue" in v) return parseFDoc(v.mapValue.fields ?? {});
  return null;
}

function parseFDoc(fields: Record<string, FVal>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) out[k] = parseVal(v);
  return out;
}

function encodeVal(v: unknown): FVal {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") {
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  }
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(encodeVal) } };
  if (typeof v === "object") return { mapValue: { fields: encodeObj(v as Record<string, unknown>) } };
  return { nullValue: null };
}

function encodeObj(data: Record<string, unknown>): Record<string, FVal> {
  const out: Record<string, FVal> = {};
  for (const [k, v] of Object.entries(data)) out[k] = encodeVal(v);
  return out;
}

function authHeaders(token: string | null): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

async function doGet(path: string): Promise<Record<string, unknown> | null> {
  const token = await getToken();
  const h: Record<string, string> = {};
  if (token) h["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}/${path}`, { headers: h });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  const doc = await res.json();
  if (!doc.fields) return null;
  return { id: path.split("/").pop()!, ...parseFDoc(doc.fields) };
}

async function doCreate(collection: string, data: Record<string, unknown>): Promise<string> {
  const token = await getToken();
  const res = await fetch(`${BASE}/${collection}`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ fields: encodeObj(data) }),
  });
  if (!res.ok) throw new Error(`CREATE ${collection} failed: ${res.status} ${await res.text()}`);
  const doc = await res.json();
  return doc.name.split("/").pop() as string;
}

async function doSet(path: string, data: Record<string, unknown>): Promise<void> {
  const token = await getToken();
  const res = await fetch(`${BASE}/${path}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ fields: encodeObj(data) }),
  });
  if (!res.ok) throw new Error(`SET ${path} failed: ${res.status} ${await res.text()}`);
}

async function doDelete(path: string): Promise<void> {
  const token = await getToken();
  const h: Record<string, string> = {};
  if (token) h["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}/${path}`, { method: "DELETE", headers: h });
  if (!res.ok && res.status !== 404) throw new Error(`DELETE ${path} failed: ${res.status}`);
}

async function doIncrement(path: string, field: string, amount: number): Promise<void> {
  const token = await getToken();
  const fullPath = `projects/${PROJECT_ID}/databases/(default)/documents/${path}`;
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:batchWrite`;
  const res = await fetch(url, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      writes: [{
        transform: {
          document: fullPath,
          fieldTransforms: [{ fieldPath: field, increment: { integerValue: String(amount) } }],
        },
      }],
    }),
  });
  if (!res.ok) throw new Error(`INCREMENT ${path}.${field} failed: ${res.status}`);
}

interface QueryFilter { field: string; op: string; value: unknown }
interface QueryOrder { field: string; dir?: "ASCENDING" | "DESCENDING" }

async function doQuery(
  collectionId: string,
  filters: QueryFilter[] = [],
  order: QueryOrder[] = [],
  lim?: number,
  cursor?: Record<string, unknown>,
  parentPath?: string,
): Promise<Array<Record<string, unknown>>> {
  const token = await getToken();
  const structuredQuery: Record<string, unknown> = { from: [{ collectionId }] };

  if (filters.length === 1) {
    structuredQuery.where = {
      fieldFilter: {
        field: { fieldPath: filters[0].field },
        op: filters[0].op,
        value: encodeVal(filters[0].value),
      },
    };
  } else if (filters.length > 1) {
    structuredQuery.where = {
      compositeFilter: {
        op: "AND",
        filters: filters.map((f) => ({
          fieldFilter: {
            field: { fieldPath: f.field },
            op: f.op,
            value: encodeVal(f.value),
          },
        })),
      },
    };
  }

  if (order.length > 0) {
    structuredQuery.orderBy = order.map((o) => ({
      field: { fieldPath: o.field },
      direction: o.dir ?? "ASCENDING",
    }));
  }

  if (lim !== undefined) structuredQuery.limit = lim;

  if (cursor && order.length > 0) {
    structuredQuery.startAfter = { values: order.map((o) => encodeVal(cursor[o.field])) };
  }

  const url = parentPath ? `${BASE}/${parentPath}:runQuery` : `${BASE}:runQuery`;
  const res = await fetch(url, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ structuredQuery }),
  });
  if (!res.ok) throw new Error(`QUERY ${collectionId} failed: ${res.status} ${await res.text()}`);

  const results = await res.json();
  return results
    .filter((r: { document?: unknown }) => r.document)
    .map((r: { document: { name: string; fields: Record<string, FVal> } }) => ({
      id: r.document.name.split("/").pop()!,
      ...parseFDoc(r.document.fields),
    }));
}

// ─── ユーザープロフィール ──────────────────────────────
export async function getUserProfile(uid: string, idToken?: string): Promise<UserProfile | null> {
  const token = idToken ?? await getToken();
  const h: Record<string, string> = {};
  if (token) h["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}/users/${uid}`, { headers: h });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const doc = await res.json();
  if (!doc.fields) return null;
  const f = doc.fields;
  return {
    id: uid,
    displayName: f.displayName?.stringValue ?? "",
    email: f.email?.stringValue ?? "",
    photoURL: f.photoURL?.stringValue ?? "",
    bio: f.bio?.stringValue ?? "",
    isArtist: f.isArtist?.booleanValue ?? false,
    isPremiumSubscriber: f.isPremiumSubscriber?.booleanValue ?? false,
    createdAt: f.createdAt?.timestampValue ?? null,
  };
}

export async function createUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  await doSet(`users/${uid}`, {
    displayName: data.displayName ?? "",
    email: data.email ?? "",
    photoURL: data.photoURL ?? "",
    bio: "",
    isArtist: data.isArtist ?? false,
    isPremiumSubscriber: false,
    createdAt: new Date().toISOString(),
  });
}

export async function updateUserProfile(
  uid: string,
  data: Partial<UserProfile>,
  idToken?: string,
): Promise<void> {
  const token = idToken ?? await getToken();
  const fields: Record<string, FVal> = {};
  if (data.displayName !== undefined) fields.displayName = { stringValue: data.displayName };
  if (data.bio !== undefined) fields.bio = { stringValue: data.bio };
  if (data.photoURL !== undefined) fields.photoURL = { stringValue: data.photoURL };

  const masks = Object.keys(fields).map((k) => `updateMask.fieldPaths=${k}`).join("&");
  const res = await fetch(`${BASE}/users/${uid}?${masks}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error(`updateUserProfile failed: ${res.status} ${await res.text()}`);
}

export async function deleteUserProfile(uid: string): Promise<void> {
  await doDelete(`users/${uid}`);
}

// ─── 投稿 ─────────────────────────────────────────────
export async function getPosts(
  lastDoc?: PostCursor,
  pageSize = 15,
): Promise<{ posts: FirestorePost[]; lastDoc: PostCursor }> {
  const results = await doQuery(
    "posts",
    [],
    [{ field: "createdAt", dir: "DESCENDING" }],
    pageSize,
    lastDoc ? { createdAt: lastDoc.createdAt } : undefined,
  );
  const posts = results as unknown as FirestorePost[];
  const last = posts[posts.length - 1];
  return {
    posts,
    lastDoc: last ? { createdAt: last.createdAt, id: last.id } : undefined,
  };
}

export function subscribeToFeed(
  callback: (posts: FirestorePost[]) => void,
  pageSize = 20,
): () => void {
  let cancelled = false;
  doQuery("posts", [], [{ field: "createdAt", dir: "DESCENDING" }], pageSize)
    .then((results) => {
      if (!cancelled) callback(results as unknown as FirestorePost[]);
    })
    .catch(console.error);
  return () => { cancelled = true; };
}

export async function getUserPosts(uid: string): Promise<FirestorePost[]> {
  const results = await doQuery(
    "posts",
    [{ field: "authorId", op: "EQUAL", value: uid }],
    [{ field: "createdAt", dir: "DESCENDING" }],
  );
  return results as unknown as FirestorePost[];
}

export async function createPost(
  data: Omit<FirestorePost, "id" | "createdAt" | "likesCount" | "commentsCount">,
): Promise<string> {
  const docData: Record<string, unknown> = {
    authorId: data.authorId,
    authorName: data.authorName,
    authorPhoto: data.authorPhoto,
    content: data.content,
    isPremium: data.isPremium,
    tags: data.tags,
    likesCount: 0,
    commentsCount: 0,
    createdAt: new Date().toISOString(),
  };
  if (data.mediaURL !== undefined) docData.mediaURL = data.mediaURL;
  if (data.mediaType !== undefined) docData.mediaType = data.mediaType;
  if (data.premiumType !== undefined) docData.premiumType = data.premiumType;
  if (data.price !== undefined) docData.price = data.price;
  return doCreate("posts", docData);
}

// ─── いいね ────────────────────────────────────────────
export async function toggleLike(postId: string, uid: string): Promise<boolean> {
  const likePath = `posts/${postId}/likes/${uid}`;
  const existing = await doGet(likePath);
  if (existing) {
    await doDelete(likePath);
    doIncrement(`posts/${postId}`, "likesCount", -1).catch(() => {});
    return false;
  } else {
    await doSet(likePath, { uid, createdAt: new Date().toISOString() });
    doIncrement(`posts/${postId}`, "likesCount", 1).catch(() => {});
    return true;
  }
}

export async function checkLiked(postId: string, uid: string): Promise<boolean> {
  const result = await doGet(`posts/${postId}/likes/${uid}`);
  return result !== null;
}

// ─── コメント ─────────────────────────────────────────
export async function getComments(postId: string): Promise<FirestoreComment[]> {
  const results = await doQuery(
    "comments",
    [],
    [{ field: "createdAt", dir: "ASCENDING" }],
    undefined,
    undefined,
    `posts/${postId}`,
  );
  return results.map((r) => ({ ...r, postId } as FirestoreComment));
}

export function subscribeToComments(
  postId: string,
  callback: (comments: FirestoreComment[]) => void,
): () => void {
  let cancelled = false;
  getComments(postId)
    .then((comments) => { if (!cancelled) callback(comments); })
    .catch(console.error);
  return () => { cancelled = true; };
}

export async function addComment(
  postId: string,
  data: { authorId: string; authorName: string; authorPhoto: string; content: string },
): Promise<string> {
  const id = await doCreate(`posts/${postId}/comments`, {
    ...data,
    createdAt: new Date().toISOString(),
  });
  doIncrement(`posts/${postId}`, "commentsCount", 1).catch(() => {});
  return id;
}

// ─── メディアアップロード ──────────────────────────────
export async function uploadMedia(
  file: File,
  uid: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const ext = file.name.split(".").pop();
  const storageRef = ref(storage, `posts/${uid}/${Date.now()}.${ext}`);
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file);
    task.on(
      "state_changed",
      (snap) => {
        const pct = (snap.bytesTransferred / snap.totalBytes) * 100;
        onProgress?.(Math.round(pct));
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      },
    );
  });
}

export async function uploadAvatar(file: File, uid: string): Promise<string> {
  const storageRef = ref(storage, `avatars/${uid}/avatar`);
  const task = uploadBytesResumable(storageRef, file);
  await new Promise<void>((resolve, reject) =>
    task.on("state_changed", null, reject, resolve),
  );
  return getDownloadURL(task.snapshot.ref);
}
