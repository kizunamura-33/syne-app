export type Artist = {
  id: string;
  name: string;
  genre: string;
  avatar: string;
  coverImage: string;
  bio: string;
  followers: number;
  verified: boolean;
  monthlyPrice: number;
};

export type Post = {
  id: string;
  artistId: string;
  type: "image" | "video" | "text";
  content: string;
  thumbnail?: string;
  caption: string;
  likes: number;
  comments: number;
  createdAt: string;
  isExclusive: boolean;
  exclusiveType?: "subscriber" | "paid";
  price?: number;
};

export type Comment = {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: string;
};

export type Notification = {
  id: string;
  artistId: string;
  type: "live" | "release" | "post" | "exclusive";
  message: string;
  createdAt: string;
  read: boolean;
};

export const artists: Artist[] = [
  {
    id: "ziou",
    name: "ZIOU",
    genre: "R&B / Soul",
    avatar: "/ziou.jpg",
    coverImage: "/ziou.jpg",
    bio: "音楽で繋がる。魂で語る。ZIOUの世界へようこそ。",
    followers: 12840,
    verified: true,
    monthlyPrice: 980,
  },
  {
    id: "haruki",
    name: "ひめの らむ",
    genre: "Pop / Idol",
    avatar: "/himeno-ramu.jpg",
    coverImage: "/himeno-ramu.jpg",
    bio: "夢を歌にして届けます。ひめの らむの世界へようこそ🎀",
    followers: 8320,
    verified: true,
    monthlyPrice: 500,
  },
  {
    id: "airi",
    name: "いりす ゆり",
    genre: "J-Pop",
    avatar: "/iris-yuri.jpg",
    coverImage: "/iris-yuri.jpg",
    bio: "音楽で笑顔を届けたい。いりす ゆりです🌸",
    followers: 5670,
    verified: false,
    monthlyPrice: 500,
  },
  {
    id: "ryusei",
    name: "RYUSEI",
    genre: "Jazz / Neo-Soul",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&h=400&fit=crop",
    bio: "夜に溶ける音楽。RYUSEIのJazz世界。",
    followers: 3210,
    verified: false,
    monthlyPrice: 300,
  },
];

export const posts: Post[] = [
  {
    id: "post1",
    artistId: "ziou",
    type: "video",
    content: "/ziou-post1.mp4",
    thumbnail: "/ziou.jpg",
    caption: "新曲のレコーディング中。今回は全部自分でプロデュース。リリースまで待っててね🎵",
    likes: 0,
    comments: 0,
    createdAt: "2026-04-02T10:00:00Z",
    isExclusive: false,
  },
  {
    id: "post2",
    artistId: "ziou",
    type: "image",
    content: "https://images.unsplash.com/photo-1598387993211-5e5e0e42e4e1?w=600&h=600&fit=crop",
    caption: "【限定】スタジオの裏側。メンバー限定で見せます👀",
    likes: 0,
    comments: 0,
    createdAt: "2026-04-01T18:00:00Z",
    isExclusive: true,
    exclusiveType: "subscriber",
  },
  {
    id: "post3",
    artistId: "haruki",
    type: "image",
    content: "/himeno-ramu.jpg",
    caption: "新しいビートができた。明日投稿する🔥 #HipHop #HARUKI",
    likes: 0,
    comments: 0,
    createdAt: "2026-04-02T08:00:00Z",
    isExclusive: false,
  },
  {
    id: "post4",
    artistId: "airi",
    type: "image",
    content: "/iris-yuri.jpg",
    caption: "MVの撮影終わった！公開は来週。楽しみにしてて✨",
    likes: 0,
    comments: 0,
    createdAt: "2026-04-01T15:00:00Z",
    isExclusive: false,
  },
  {
    id: "post5",
    artistId: "ziou",
    type: "text",
    content: "",
    caption: "【限定動画】ライブリハーサルの裏側を完全公開。今回のセットリストも少しだけ見せちゃいます。サブスク限定コンテンツ。",
    likes: 0,
    comments: 0,
    createdAt: "2026-03-31T20:00:00Z",
    isExclusive: true,
    exclusiveType: "paid",
    price: 300,
  },
  {
    id: "post6",
    artistId: "ryusei",
    type: "image",
    content: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=600&h=600&fit=crop",
    caption: "深夜のセッション。ピアノと向き合う時間が一番好き🎹",
    likes: 0,
    comments: 0,
    createdAt: "2026-04-01T01:00:00Z",
    isExclusive: false,
  },
  {
    id: "post7",
    artistId: "haruki",
    type: "image",
    content: "/himeno-ramu.jpg",
    caption: "【限定】次のアルバムのコンセプトを語ります。フォロワー限定。",
    likes: 0,
    comments: 0,
    createdAt: "2026-03-30T12:00:00Z",
    isExclusive: true,
    exclusiveType: "subscriber",
  },
];

export const comments: Comment[] = [];

export const notifications: Notification[] = [
  {
    id: "n1",
    artistId: "ziou",
    type: "live",
    message: "ZIOUが本日20:00からライブ配信します！",
    createdAt: "2026-04-02T15:00:00Z",
    read: false,
  },
  {
    id: "n2",
    artistId: "haruki",
    type: "release",
    message: "HARUKIの新曲「STREET LIGHT」がリリースされました🎵",
    createdAt: "2026-04-01T12:00:00Z",
    read: false,
  },
  {
    id: "n3",
    artistId: "ziou",
    type: "exclusive",
    message: "ZIOU限定コンテンツ「リハーサル裏側」が公開されました",
    createdAt: "2026-03-31T20:00:00Z",
    read: true,
  },
  {
    id: "n4",
    artistId: "airi",
    type: "post",
    message: "AIRIが新しい投稿をしました！MV撮影完了報告✨",
    createdAt: "2026-04-01T15:00:00Z",
    read: true,
  },
  {
    id: "n5",
    artistId: "ryusei",
    type: "live",
    message: "RYUSEIが今夜23:00からジャズセッションをライブ配信🎹",
    createdAt: "2026-04-01T22:00:00Z",
    read: true,
  },
];
