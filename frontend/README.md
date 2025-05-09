# 即時捐款儀表板前端

這是一個用於顯示 Instagram 貼文按讚數和轉換為捐款金額的即時儀表板。專為 Taiwan Cetacean Society (中華鯨豚協會) 設計的捐款活動。

## 功能

- 從後端 API 獲取 Instagram 貼文的按讚數
- 將按讚數轉換為捐款金額 (1 讚 = 1 NT$)
- 顯示捐款進度條和目標
- 美觀的 UI 設計，包含鯨魚主題元素
- 響應式設計，適合各種設備

## 技術棧

- Next.js
- React
- Tailwind CSS
- Framer Motion (動畫)

## 安裝與設定

### 環境需求

- Node.js 14+
- npm 或 yarn

### 安裝步驟

1. 複製專案
   ```
   git clone <repository-url>
   cd frontend
   ```

2. 安裝依賴
   ```
   npm install
   ```

3. 配置環境變數
   - 創建 `.env.local` 檔案，設置後端 API 地址:
   ```
   NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
   ```

## 使用方法

### 開發模式

```
npm run dev
```

開發服務會在 `http://localhost:3000` 啟動

### 構建生產版本

```
npm run build
npm start
```

## 部署

此專案可以輕鬆部署到 Vercel、Netlify 或其他支援 Next.js 的平台。

### Vercel 部署 (推薦)

```
npm install -g vercel
vercel
```

### 自定義

- 主色 (#0086B8) 和輔色 (#FFB57A) 可以在 `tailwind.config.js` 中修改
- 捐款目標金額可以在 `components/DonationDashboard.js` 中修改
- SVG 鯨魚圖形可以在同一檔案中編輯 