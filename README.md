# Nostr マルコフ連鎖クイズ

Nostr上のユーザーの投稿をマルコフ連鎖で解析し、生成された文章から元のユーザーを当てるクイズゲームです。

## 特徴

- **Webアプリ**: GitHub Pagesでいつでもクイズに挑戦
- **手動運用**: GitHub Actionsでbot機能を手動・プッシュ時実行
- **透明性**: 許可ユーザーリストやシステム情報を公開
- **プライバシー重視**: 許可したユーザーのみクイズ対象

## アクセス

**クイズで遊ぶ**: https://tiltpapa.github.io/markov-quiz/

## 使い方

### ユーザーとして参加
1. Nostr上でbotに「OK」とリプライして参加許可
2. Webサイトでクイズに挑戦
3. 参加停止は「NG」とリプライ

### Bot管理者として
GitHub Actionsのsecretsに以下を設定：
- `NOSTR_PRIVATE_KEY`: BotのNostr秘密鍵
- `GH_PAT`: GitHubパーソナルアクセストークン

環境変数（GitHub Repository Variables）:
- `PUBLISH_RELAYS`: 投稿先リレーURL（スペース区切り）
- `PUBLISH_RELAYS_ACTION`: Nostr Actions用リレーURL

## プロジェクト構成

```
markov-quiz/
├── src/
│   ├── lib/           # 共通ライブラリ
│   │   ├── quiz.ts    # クイズ生成ロジック
│   │   ├── nostr.ts   # Nostr関連機能
│   │   ├── markov.ts  # マルコフ連鎖
│   │   ├── ndk.ts     # NDK関連機能
│   │   ├── storage.ts # データ保存処理
│   │   └── types.ts   # 型定義
│   ├── bot/           # Bot機能（GitHub Actions用）
│   │   ├── listen.ts  # リプライ監視
│   │   ├── generate.ts# クイズ生成
│   │   ├── fetch-users-info.ts # ユーザー情報取得
│   │   └── cli.ts     # CLI エントリーポイント
│   └── app/           # Svelte Webアプリ
│       ├── App.svelte
│       ├── main.ts
│       └── components/
│           ├── QuizComponent.svelte
│           ├── AnswerInput.svelte
│           └── EmojiText.svelte
├── .github/workflows/ # GitHub Actions設定
│   ├── bot.yml        # Bot運用（手動実行・開発用）
│   └── deploy.yml     # GitHub Pages自動デプロイ
├── src/data/          # データファイル
│   ├── quiz.json      # 現在のクイズ
│   ├── allowedUsers.json # 許可ユーザーリスト
│   ├── allowedUsersInfo.json # ユーザー詳細情報
│   └── quiz_*.json    # 過去のクイズデータ
└── index.html         # Webアプリ用HTML
```

## 動作フロー

### 手動運用（GitHub Actions）
1. **手動実行**: workflow_dispatchでクイズ生成
2. **開発時**: 非mainブランチへのプッシュで動作確認
3. **コード変更時**: GitHub Pagesに自動デプロイ（mainブランチ）

### セキュリティ
- ✅ 秘密鍵は環境変数で管理
- ✅ データは透明化（src/data/で公開）
- ✅ セルフホストランナーで安全実行
- ✅ mainブランチでのbot実行は無効化

## 開発

### 依存関係インストール
```bash
npm ci
```

### 開発サーバー起動
```bash
npm run dev
```

### ビルド
```bash
# Webアプリビルド
npm run build:web

# CLIビルド
npm run build:cli

# 全ビルド
npm run build:all

# GitHub Pages用ビルド
npm run build:github
```

### Bot手動実行
```bash
# クイズ生成
npm run bot:generate

# リプライ監視
npm run bot:listen

# ユーザー情報取得
npm run bot:fetch-users
```

## 技術スタック

- **Frontend**: Svelte + Vite
- **Backend**: Node.js + TypeScript
- **UI**: Bootstrap
- **Nostr**: @nostr-dev-kit/ndk, nostr-fetch, nostr-tools
- **マルコフ連鎖**: kurwov
- **日本語処理**: budoux
- **CLI**: commander
- **デプロイ**: GitHub Pages + GitHub Actions
