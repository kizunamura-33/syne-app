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
    name: "HARUKI",
    genre: "Hip-Hop",
    avatar: "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=200&h=200&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1501386761578-eaa54b7e40d8?w=800&h=400&fit=crop",
    bio: "ストリートから世界へ。言葉が武器。",
    followers: 8320,
    verified: true,
    monthlyPrice: 500,
  },
  {
    id: "airi",
    name: "AIRI",
    genre: "Pop / Electronic",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=400&fit=crop",
    bio: "音楽は感情のランゲージ。AIRIの音で感じて。",
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
    type: "image",
    content: "/ziou.jpg",
    caption: "新曲のレコーディング中。今回は全部自分でプロデュース。リリースまで待っててね🎵",
    likes: 2840,
    comments: 156,
    createdAt: "2026-04-02T10:00:00Z",
    isExclusive: false,
  },
  {
    id: "post2",
    artistId: "ziou",
    type: "image",
    content: "https://images.unsplash.com/photo-1598387993211-5e5e0e42e4e1?w=600&h=600&fit=crop",
    caption: "【限定】スタジオの裏側。メンバー限定で見せます👀",
    likes: 1920,
    comments: 89,
    createdAt: "2026-04-01T18:00:00Z",
    isExclusive: true,
    exclusiveType: "subscriber",
  },
  {
    id: "post3",
    artistId: "haruki",
    type: "image",
    content: "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=600&h=600&fit=crop",
    caption: "新しいビートができた。明日投稿する🔥 #HipHop #HARUKI",
    likes: 1456,
    comments: 78,
    createdAt: "2026-04-02T08:00:00Z",
    isExclusive: false,
  },
  {
    id: "post4",
    artistId: "airi",
    type: "image",
    content: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=600&fit=crop",
    caption: "MVの撮影終わった！公開は来週。楽しみにしてて✨",
    likes: 987,
    comments: 45,
    createdAt: "2026-04-01T15:00:00Z",
    isExclusive: false,
  },
  {
    id: "post5",
    artistId: "ziou",
    type: "text",
    content: "",
    caption: "【限定動画】ライブリハーサルの裏側を完全公開。今回のセットリストも少しだけ見せちゃいます。サブスク限定コンテンツ。",
    likes: 3240,
    comments: 201,
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
    likes: 654,
    comments: 32,
    createdAt: "2026-04-01T01:00:00Z",
    isExclusive: false,
  },
  {
    id: "post7",
    artistId: "haruki",
    type: "image",
    content: "https://images.unsplash.com/photo-1501386761578-eaa54b7e40d8?w=600&h=600&fit=crop",
    caption: "【限定】次のアルバムのコンセプトを語ります。フォロワー限定。",
    likes: 2100,
    comments: 134,
    createdAt: "2026-03-30T12:00:00Z",
    isExclusive: true,
    exclusiveType: "subscriber",
  },
];

export const comments: Comment[] = [
  {
    id: "c1",
    postId: "post1",
    userId: "user1",
    userName: "saki_fan",
    userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop",
    text: "最高すぎる😭💗 早くリリースして！",
    createdAt: "2026-04-02T10:30:00Z",
  },
  {
    id: "c2",
    postId: "post1",
    userId: "user2",
    userName: "music_lover_jp",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop",
    text: "ZIOUの音楽は本当に唯一無二。応援してます🎵",
    createdAt: "2026-04-02T11:00:00Z",
  },
  {
    id: "c3",
    postId: "post1",
    userId: "user3",
    userName: "takeshi_beats",
    userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop",
    text: "セルフプロデュースか！めちゃ楽しみ🔥",
    createdAt: "2026-04-02T12:00:00Z",
  },
  {
    id: "c4",
    postId: "post3",
    userId: "user1",
    userName: "saki_fan",
    userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop",
    text: "HARUKIのビートいつも神ってる！",
    createdAt: "2026-04-02T09:00:00Z",
  },
  {
    id: "c5",
    postId: "post3",
    userId: "user4",
    userName: "yuki_music",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop",
    text: "明日絶対チェックする！",
    createdAt: "2026-04-02T09:30:00Z",
  },
];

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
