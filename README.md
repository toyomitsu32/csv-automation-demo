# CSV自動化デモ

Python + Seleniumを使用したCSVファイルの自動ダウンロード・編集・アップロードのデモプロジェクトです。

## プロジェクト構成

```
csv-automation-demo/
├── csv_demo_automation.py  # Python+Selenium自動化スクリプト
├── demo_talk_script.md     # デモ説明用トークスクリプト
├── webapp/                 # デモ用Webアプリケーション
│   ├── client/            # フロントエンド (React + Tailwind)
│   ├── server/            # バックエンド (Node.js + tRPC)
│   └── drizzle/           # データベーススキーマ
└── README.md
```

## 機能

### Python+Seleniumスクリプト
- Webサイトへの自動ログイン（ID/パスワード形式）
- CSVファイルの自動ダウンロード
- CSVデータの編集（特定の値を変更）
- 編集したCSVファイルの自動アップロード
- データ更新の確認

### デモ用Webアプリケーション
- ユーザー認証（ID/パスワード形式）
- CSVデータの表示・ダウンロード
- CSVファイルのアップロードによるデータ更新
- Stripe決済機能

## セットアップ

### Python+Seleniumスクリプト

```bash
# 必要なライブラリをインストール
pip install selenium pandas

# スクリプトを実行
python csv_demo_automation.py
```

### Webアプリケーション（ローカル開発）

```bash
cd webapp

# 依存関係をインストール
pnpm install

# 開発サーバーを起動
pnpm dev
```

## 設定

### csv_demo_automation.py

スクリプト冒頭の設定セクションを編集してください：

```python
# デモサイトのURL
BASE_URL = "https://your-site-url.com"

# ログイン情報
USERNAME = "your_username"
PASSWORD = "your_password"

# CSV編集設定
TARGET_PRODUCT = "変更対象の製品名"
TARGET_COLUMN = "Quantity"
NEW_VALUE = "40"
```

## デプロイ

### Renderへのデプロイ

1. GitHubリポジトリをRenderに接続
2. 「New Web Service」を選択
3. 以下の設定を行う：
   - Root Directory: `webapp`
   - Build Command: `pnpm install && pnpm build`
   - Start Command: `pnpm start`
4. 環境変数を設定（DATABASE_URL等）

## ライセンス

MIT License
