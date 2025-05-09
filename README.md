# IG Hashtag 抽獎與捐款儀表板系統

這是一個集成了 Instagram 抽獎與捐款儀表板功能的完整解決方案，專為中華鯨豚協會設計。系統由兩個主要部分組成：

1. **後端服務 (Service A)** - IG Hashtag 抽獎系統
2. **前端服務 (Service B)** - 即時捐款儀表板

## 功能概述

### IG Hashtag 抽獎系統

- 抓取 Instagram 貼文評論
- 過濾含有特定 hashtag 的評論 (#P, #S, #K)
- 隨機抽選 20 名獲獎者
- 提供貼文按讚數 API

### 即時捐款儀表板

- 顯示 Instagram 貼文按讚數轉換為的捐款金額
- 清晰的捐款進度條
- 具有海洋保育主題的美觀 UI
- 自動更新數據

## 技術架構

- **後端**：Node.js, Express, SQLite
- **前端**：Next.js, React, Tailwind CSS, Framer Motion
- **API**：RESTful API 連接前後端
- **資料儲存**：SQLite 本地資料庫

## 快速開始

### 系統需求

- Node.js 14+
- npm 或 yarn

### 安裝與運行

1. **克隆專案**

   ```bash
   git clone <repository-url>
   cd ig-campaign
   ```

2. **後端設定**

   ```bash
   cd backend
   npm install
   # 編輯 .env 文件設定 Instagram API (如需使用真實數據)
   npm start
   ```

   後端服務會在 http://localhost:3001 運行

3. **前端設定**

   ```bash
   cd ../frontend
   npm install
   # 確保 .env.local 中設定了正確的後端 URL
   npm run dev
   ```

   前端服務會在 http://localhost:3000 運行

4. **使用抽獎功能**

   ```bash
   cd backend
   npm run draw
   ```

   這將從符合條件的評論中隨機選出 20 名獲獎者。

## 部署

### 後端部署 (Render)

1. 在 Render.com 建立新的 Web Service
2. 連接到 GitHub 專案
3. 設定構建命令：`cd backend && npm install`
4. 設定啟動命令：`cd backend && npm start`
5. 設定環境變數 (IG_TOKEN, IG_POST_ID)

### 前端部署 (Vercel)

1. 安裝 Vercel CLI: `npm install -g vercel`
2. 進入前端目錄: `cd frontend`
3. 部署: `vercel`
4. 設定環境變數: `NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.render.com`

## 自訂與擴展

- 獎品列表可在 `backend/app.js` 中修改
- 捐款目標金額可在 `frontend/components/DonationDashboard.js` 中調整
- UI 主題色可在 `frontend/tailwind.config.js` 中變更

## 資料安全與隱私

- 系統只存儲公開的 Instagram 評論和按讚數
- 不收集或儲存用戶的隱私資訊
- 抽獎過程完全隨機且透明

## 作者與貢獻

此專案為中華鯨豚協會捐款活動特別設計。歡迎貢獻改進或修正。

## 授權

MIT License 