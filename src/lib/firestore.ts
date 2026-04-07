import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  increment,
  serverTimestamp,
  onSnapshot,
  QueryDocumentSnapshot,
  DocumentData,
  Timestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { db, storage } from "./firebase";

// ─── 型定義 ───────────────────────────────────────────
export type UserProfile = {
  id: string;
  displayName: string;
  email: string;
  photoURL: string;
  bio: string;
  isArtist: boolean;
  isPremiumSubscriber: boolean;
  createdAt: Timestamp | null;
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
  createdAt: Timestamp | null;
};

export type FirestoreComment = {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  content: string;
  createdAt: Timestamp | null;
};

// ─── ユーザープロフィール ──────────────────────────────
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as UserProfile;
}

export async function createUserProfile(uid: string, data: Partial<UserProfile>) {
  await setDoc(doc(db, "users", uid), {
    displayName: data.displayName ?? "",
    email: data.email ?? "",
    photoURL: data.photoURL ?? "",
    bio: "",
    isArtist: data.isArtist ?? false,
    isPremiumSubscriber: false,
    createdAt: serverTimestamp(),
  });
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  await updateDoc(doc(db, "users", uid), { ...data });
}

export async function deleteUserProfile(uid: string) {
  await deleteDoc(doc(db, "users", uid));
}

// ─── 投稿 ─────────────────────────────────────────────
export async function getPosts(
  lastDoc?: QueryDocumentSnapshot<DocumentData>,
  pageSize = 15
): Promise<{ posts: FirestorePost[]; lastDoc: QueryDocumentSnapshot<DocumentData> | undefined }> {
  let q = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc"),
    limit(pageSize)
  );
  if (lastDoc) {
    q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      startAfter(lastDoc),
      limit(pageSize)
    );
  }
  const snap = await getDocs(q);
  const posts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestorePost));
  return { posts, lastDoc: snap.docs[snap.docs.length - 1] };
}

export function subscribeToFeed(
  callback: (posts: FirestorePost[]) => void,
  pageSize = 20
) {
  const q = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc"),
    limit(pageSize)
  );
  return onSnapshot(q, (snap) => {
    const posts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestorePost));
    callback(posts);
  });
}

export async function getUserPosts(uid: string): Promise<FirestorePost[]> {
  const q = query(
    collection(db, "posts"),
    where("authorId", "==", uid),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestorePost));
}

export async function createPost(data: Omit<FirestorePost, "id" | "createdAt" | "likesCount" | "commentsCount">): Promise<string> {
  const docData: Record<string, unknown> = {
    authorId: data.authorId,
    authorName: data.authorName,
    authorPhoto: data.authorPhoto,
    content: data.content,
    isPremium: data.isPremium,
    tags: data.tags,
    likesCount: 0,
    commentsCount: 0,
    createdAt: serverTimestamp(),
  };
  if (data.mediaURL !== undefined) docData.mediaURL = data.mediaURL;
  if (data.mediaType !== undefined) docData.mediaType = data.mediaType;
  if (data.premiumType !== undefined) docData.premiumType = data.premiumType;
  if (data.price !== undefined) docData.price = data.price;
  const ref2 = await addDoc(collection(db, "posts"), docData);
  return ref2.id;
}

// ─── いいね ────────────────────────────────────────────
export async function toggleLike(postId: string, uid: string): Promise<boolean> {
  const likeRef = doc(db, "posts", postId, "likes", uid);
  const likeSnap = await getDoc(likeRef);
  const postRef = doc(db, "posts", postId);

  if (likeSnap.exists()) {
    await deleteDoc(likeRef);
    await updateDoc(postRef, { likesCount: increment(-1) });
    return false;
  } else {
    await setDoc(likeRef, { uid, createdAt: serverTimestamp() });
    await updateDoc(postRef, { likesCount: increment(1) });
    return true;
  }
}

export async function checkLiked(postId: string, uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "posts", postId, "likes", uid));
  return snap.exists();
}

// ─── コメント ─────────────────────────────────────────
export async function getComments(postId: string): Promise<FirestoreComment[]> {
  const q = query(
    collection(db, "posts", postId, "comments"),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, postId, ...d.data() } as FirestoreComment));
}

export function subscribeToComments(
  postId: string,
  callback: (comments: FirestoreComment[]) => void
) {
  const q = query(
    collection(db, "posts", postId, "comments"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    const comments = snap.docs.map((d) => ({ id: d.id, postId, ...d.data() } as FirestoreComment));
    callback(comments);
  });
}

export async function addComment(
  postId: string,
  data: { authorId: string; authorName: string; authorPhoto: string; content: string }
): Promise<string> {
  const ref2 = await addDoc(collection(db, "posts", postId, "comments"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "posts", postId), { commentsCount: increment(1) });
  return ref2.id;
}

// ─── メディアアップロード ──────────────────────────────
export async function uploadMedia(
  file: File,
  uid: string,
  onProgress?: (pct: number) => void
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
      }
    );
  });
}

export async function uploadAvatar(file: File, uid: string): Promise<string> {
  const storageRef = ref(storage, `avatars/${uid}/avatar`);
  const task = uploadBytesResumable(storageRef, file);
  await new Promise<void>((resolve, reject) =>
    task.on("state_changed", null, reject, resolve)
  );
  return getDownloadURL(task.snapshot.ref);
}
