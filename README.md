# 🎯 Nostr マルコフ連鎖クイズ

Nostr上のユーザーの投稿をマルコフ連鎖で解析し、生成された文章から元のユーザーを当てるクイズゲームです。

## 🌟 特徴

- **Webアプリ**: GitHub Pagesでいつでもクイズに挑戦
- **自動運用**: GitHub Actionsでbot機能を自動実行
- **透明性**: 許可ユーザーリストやシステム情報を公開
- **プライバシー重視**: 許可したユーザーのみクイズ対象

## 🚀 アクセス

**クイズで遊ぶ**: https://tiltpapa.github.io/markov-quiz/

## 🎮 使い方

### ユーザーとして参加
1. Nostr上でbotに「OK」とリプライして参加許可
2. Webサイトでクイズに挑戦
3. 参加停止は「NG」とリプライ

### Bot管理者として
GitHub Actionsのsecretsに以下を設定：
- `NOSTR_PRIVATE_KEY`: BotのNostr秘密鍵

環境変数（GitHub Repository Variables）:
- `LISTEN_RELAY`: 監視するリレーURL  
- `PUBLISH_RELAYS`: 投稿先リレーURL（スペース区切り）

## 📁 プロジェクト構成

```
markov-quiz/
├── src/
│   ├── lib/           # 共通ライブラリ
│   │   ├── quiz.ts    # クイズ生成ロジック
│   │   ├── nostr.ts   # Nostr関連機能
│   │   ├── markov.ts  # マルコフ連鎖
│   │   └── types.ts   # 型定義
│   ├── bot/           # Bot機能（GitHub Actions用）
│   │   ├── listen.ts  # リプライ監視
│   │   ├── generate.ts# クイズ生成
│   │   └── cli.ts     # CLI エントリーポイント
│   └── app/           # Svelte Webアプリ
│       ├── App.svelte
│       ├── main.ts
│       └── components/
├── .github/workflows/ # GitHub Actions設定
│   ├── bot.yml        # Bot運用（毎日クイズ生成・リプライ監視）
│   └── deploy.yml     # GitHub Pages自動デプロイ
├── src/data/          # データファイル
│   ├── quiz.json      # 現在のクイズ
│   ├── allowedUsers.json # 許可ユーザーリスト
│   └── lastSince.json # 最終同期情報
└── index.html         # Webアプリ用HTML
```

## 🔄 動作フロー

### 自動運用（GitHub Actions）
1. **毎日JST 9:00**: 新しいクイズを生成・投稿
2. **6時間おき**: リプライを監視し許可リストを更新
3. **コード変更時**: GitHub Pagesに自動デプロイ

### セキュリティ
- ✅ 秘密鍵は環境変数で管理（privateKey.txt廃止）
- ✅ データは透明化（static/data/で公開）
- ✅ セルフホストランナーで安全実行

## 🛠️ 開発

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
npm run build

# Botビルド
npm run build:bot
```

### Bot手動実行
```bash
# クイズ生成
npm run bot:generate

# リプライ監視
npm run bot:listen
```

## 📊 技術スタック

- **Frontend**: Svelte + Vite
- **Backend**: Node.js + TypeScript
- **Nostr**: nostr-tools, nostr-fetch
- **マルコフ連鎖**: markov-strings
- **日本語処理**: budoux
- **デプロイ**: GitHub Pages + GitHub Actions

## 📝 ライセンス

ISC License