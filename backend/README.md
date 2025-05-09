# IG Hashtag 抽獎系統後端

這是一個用於 Instagram 貼文活動的抽獎後端系統，可以從指定貼文的評論中，篩選出包含特定 hashtag 的評論，進行隨機抽獎選出得獎者。

## 功能

- 從 Instagram 貼文抓取評論（使用官方 API 或模擬數據）
- 過濾含有 `#P`、`#S` 或 `#K` 標籤的評論
- 隨機抽出指定數量的得獎者
- 提供按讚數 API 接口 (用於捐款儀表板)
- 提供評論統計接口

## 安裝與設定

### 環境需求

- Node.js 16+
- npm 或 yarn

### 安裝步驟

1. 複製專案
   ```
   git clone <repository-url>
   cd backend
   ```

2. 安裝依賴
   ```
   npm install
   ```

3. 配置環境變數
   - 複製 `.env.example` 到 `.env`
   - 填入您的 Instagram API Token 和貼文 ID
   ```
   IG_TOKEN=your_instagram_token_here
   IG_POST_ID=your_post_id_here
   PORT=3001
   ```

## 使用方法

### 啟動伺服器

```
npm start
```

伺服器會在 `http://localhost:3001` 啟動

### 抽獎功能

執行抽獎腳本選出得獎者：

```
npm run draw [人數]
```

預設會抽出 20 位得獎者。結果會顯示在終端機上。

### API 端點

- `GET /likes` - 獲取貼文的按讚數
- `GET /comments` - 獲取所有評論 (測試用)
- `GET /stats` - 獲取評論統計資訊 (按標籤分類)
- `GET /prizes` - 獲取獎品列表

## 注意事項

- 本系統預設使用模擬數據進行開發和演示
- 如需使用真實 Instagram API，請設定有效的 `IG_TOKEN` 和 `IG_POST_ID`
- 獲取 Instagram API Token 需要創建 Facebook Developer 應用並獲得授權

## 技術棧

- Node.js
- Express.js
- SQLite (better-sqlite3)
- Instagram Graph API 