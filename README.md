# イベントブース用 双方向呼び出しボタンシステム

イベント会場のブース設置スマホから運営者のスマホを低レイテンシで呼び出し、運営者からの返信をブース画面へリアルタイムに表示するシステムです（Cloudflare Pages / Functions + ntfy.sh 構成）。

## 構成

- `public/index.html` - 呼び出しボタン UI・SSE リアルタイム受信・Wake Lock・クールダウン制御
- `public/reply.html` - 運営者用返信ページ（定型文ボタン・自由文送信）
- `public/manifest.json` / `public/icon.svg` - PWA 設定（`standalone` 表示）
- `functions/api/call.js` - `POST /api/call`（インメモリ連打防止 + Discord Webhook 通知送信）
- `functions/api/config.js` - `GET /api/config`（返信用トピック名の取得）
- `scripts/generate-topics.js` - トピック用 UUID 生成スクリプト

## セットアップ & デプロイ（Cloudflare Pages）

### 1. トピック用 UUID の生成

```bash
node scripts/generate-topics.js
```

### 2. Cloudflare Pages へのデプロイ

1. このリポジトリを GitHub に push します。
2. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** でリポジトリを連携します。
   - **Build command**: （空欄）
   - **Build output directory**: `public`
3. **Settings** → **Environment variables** に、以下を Secret（Encrypt）として登録し、再デプロイします。
   - `DISCORD_WEBHOOK_URL`（Discord チャンネルの Webhook URL）
   - `NTFY_REPLY_TOPIC`（手順 1 で生成した返信用 UUID）

### 3. アクセス制限（Cloudflare Access）

Cloudflare Zero Trust の **Access** → **Applications**（Self-hosted）で Pages ドメイン全体を保護し、ご自身のメールアドレスのみ許可するポリシーを設定してください。

### 4. ローカル検証（任意）

```bash
cp .dev.vars.example .dev.vars
# .dev.vars に手順 1 で生成した UUID を記入
npx wrangler pages dev public
```

## ライセンス

(c) 2026, Takuya Urakawa (@hsgw), 5z6p Instruments
[MIT](LICENSE) (`SPDX-License-Identifier: MIT`)
