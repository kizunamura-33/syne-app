# SYNE セットアップガイド

## 1. Firebase プロジェクト作成

1. [Firebase Console](https://console.firebase.google.com) を開く
2. 「プロジェクトを追加」→ プロジェクト名: `syne-app`
3. Google Analytics は任意でOK

## 2. Firebase サービスを有効化

### Authentication
- 左メニュー「Authentication」→「始める」
- 「Sign-in method」タブ
- **メール/パスワード** → 有効化
- **Google** → 有効化（プロジェクトのサポートメール設定）

### Firestore Database
- 左メニュー「Firestore Database」→「データベースの作成」
- 「テストモードで開始」を選択（後でルールを設定）
- リージョン: `asia-northeast1`（東京）

### Storage
- 左メニュー「Storage」→「始める」
- テストモードで開始

## 3. 環境変数の設定

Firebase Console → プロジェクト設定（歯車アイコン）→「アプリ」→「ウェブアプリを追加」

`.env.local` ファイルを作成:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456:web:abcdef
```

## 4. Firestore セキュリティルール

Firebase Console → Firestore → 「ルール」タブに貼り付け:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザープロフィール
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // 投稿
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null && request.auth.uid == resource.data.authorId;

      // いいね
      match /likes/{userId} {
        allow read: if true;
        allow write: if request.auth != null && request.auth.uid == userId;
      }

      // コメント
      match /comments/{commentId} {
        allow read: if true;
        allow create: if request.auth != null;
        allow delete: if request.auth != null && request.auth.uid == resource.data.authorId;
      }
    }
  }
}
```

## 5. Storage セキュリティルール

Firebase Console → Storage → 「ルール」タブ:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /posts/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId
                   && request.resource.size < 100 * 1024 * 1024; // 100MB
    }
    match /avatars/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 6. 起動

```bash
npm run dev
# → http://localhost:3000 でアクセス
```

## 機能一覧

| 機能 | 状態 |
|------|------|
| ファンログイン（メール） | ✅ Firebase Auth |
| ファンログイン（Google） | ✅ Firebase Auth |
| アーティストログイン | ✅ Supabase Auth |
| 投稿作成（テキスト） | ✅ Firestore |
| 投稿作成（画像） | ✅ Firebase Storage |
| 投稿作成（動画） | ✅ Firebase Storage |
| いいね（リアルタイム） | ✅ Firestore |
| コメント（リアルタイム） | ✅ Firestore |
| プレミアム限定コンテンツ | ✅ isPremium フラグ |
| アーティストプロフィール | ✅ |
| フォロー機能 | ✅ Supabase |
| チャット | ✅ モック（拡張可能） |
| ライブ配信 | 🔜 準備中 |
| 決済（サブスク） | 🔜 Stripe連携予定 |
