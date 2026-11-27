# イベントブース用 双方向呼び出しボタンシステム

イベント会場のブース設置スマホから運営者のスマホを低レイテンシで呼び出し、運営者からの定型文ボタン・自由文返信をブース画面へリアルタイムに表示するシステムです（Cloudflare Pages / Functions + Telegram Bot API 構成）。

## 構成

- `public/index.html` - 呼び出しボタン UI・返信ポーリング・Wake Lock・クールダウン制御
- `public/manifest.json` / `public/icon.svg` - PWA 設定（`standalone` 表示）
- `functions/api/call.js` - `POST /api/call`（インメモリ連打防止 + Telegram `sendMessage`）
- `functions/api/poll.js` - `GET /api/poll`（Telegram `getUpdates` による返信取得・ボタン応答）

## セットアップ & デプロイ（Cloudflare Pages）

### 1. Telegram Bot の作成と Chat ID の取得

1. Telegram で `@BotFather` に `/newbot` を送信し、Bot Token（`TELEGRAM_BOT_TOKEN`）を取得します。
2. 作成した Bot を Telegram で開き、「Start」（`/start`）を送信します。
3. ブラウザで `https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getUpdates` を開き、`chat.id`（`TELEGRAM_CHAT_ID`）を確認します。

### 2. Cloudflare Pages へのデプロイ

1. このリポジトリを GitHub に push します。
2. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** でリポジトリを連携します。
3. **Settings** → **Environment variables** に、以下を Secret（Encrypt）として登録し、再デプロイします。
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`

### 3. アクセス制限（Cloudflare Access）

Cloudflare Zero Trust の **Access** → **Applications**（Self-hosted）で Pages ドメイン全体を保護し、ご自身のメールアドレスのみ許可するポリシーを設定してください。

### 4. ローカル検証（任意）

```bash
cp .dev.vars.example .dev.vars
# .dev.vars に TELEGRAM_BOT_TOKEN と TELEGRAM_CHAT_ID を記入
npx wrangler pages dev public
```

## ライセンス

(c) 2026, Takuya Urakawa (@hsgw), 5z6p Instruments
[MIT](LICENSE) (`SPDX-License-Identifier: MIT`)
