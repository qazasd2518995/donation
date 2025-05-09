// IG Hashtag 抽獎系統後端 (簡化版)
import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 環境變數 - 使用提供的令牌和ID
const FB_API = `https://graph.facebook.com/v19.0`;
// 使用新的長期令牌，有效期至 7/8/2025
const IG_TOKEN = process.env.IG_TOKEN || "EAAZABZBFyTPjUBO81GfrzZBLej4EhHFZAL2a996JziCFuybnEehqSKMJnee7aRcBJE0j2saqWZCQb22ydzx6ysul8dyaJ0sh6sTV0SC10PhDHh7FVqNyMkjfYAaDyOncZAPsiqX7aqhacRvKZAuJb4w5YjIvwgvy7wdSqbouJtecOkSdZBCKPuywEx51cI93qPvKkrZBdJOZBZA";
const IG_USER_ID = process.env.IG_USER_ID || "17841474086492936"; // 正確的Instagram帳號ID
const IG_POST_ID = process.env.IG_POST_ID || "18079076146744868"; // 正確的Instagram貼文ID
const PORT = process.env.PORT || 10000; // 支援Render環境變數

// 同步 Instagram 評論
async function syncComments() {
  console.log('開始同步 Instagram 評論...');
  try {
    if (!IG_TOKEN) {
      console.log('警告: 未設定 IG_TOKEN 環境變數');
      return;
    }

    if (!IG_POST_ID) {
      console.log('警告: 未找到有效的貼文ID');
      return;
    }

    const url = `${FB_API}/${IG_POST_ID}/comments?fields=id,text,username,timestamp,from&limit=100&access_token=${IG_TOKEN}`;
    console.log(`正在從 ${url} 獲取評論...`);
    let next = url;
    let count = 0;
    let comments = [];

    while (next) {
      const response = await fetch(next);
      
      if (!response.ok) {
        throw new Error(`API 錯誤: ${response.status} ${response.statusText}`);
      }
      
      const { data, paging } = await response.json();
      
      if (!data || !Array.isArray(data)) {
        console.log('警告: 無法獲取評論資料', data);
        break;
      }

      // 將評論儲存在內存中
      for (const c of data) {
        comments.push({
          id: c.id,
          user: c.username || c.from?.name || 'unknown',
          text: c.text,
          ts: Date.parse(c.timestamp)
        });
        count++;
      }
      
      next = paging?.next;
    }
    
    console.log(`同步完成! 已處理 ${count} 則評論`);
    return comments;
    
  } catch (error) {
    console.error('同步評論時發生錯誤:', error);
    return [];
  }
}

// 獲取 Instagram 讚數
async function getLikeCount() {
  try {
    if (!IG_TOKEN || !IG_POST_ID) {
      console.log('警告: 未設定必要的環境變數');
      return 0;
    }

    const url = `${FB_API}/${IG_POST_ID}?fields=like_count&access_token=${IG_TOKEN}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API 錯誤: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const currentLikeCount = data.like_count || 0;
    
    return currentLikeCount;
  } catch (error) {
    console.error('獲取讚數時發生錯誤:', error);
    return 0;
  }
}

// 設定 Express
const app = express();
// 加強 CORS 配置，解決前端跨域問題
app.use(cors({
  origin: '*',  // 允許所有來源
  credentials: false,  // 關閉 credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization']
}));
app.use(express.json());

// 添加調試中間件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

// 簡單的健康檢查端點
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 端點 - 獲取按讚數
app.get('/likes', async (req, res) => {
  try {
    console.log('處理 /likes 請求');
    const likeCount = await getLikeCount();
    console.log('成功獲取按讚數:', likeCount);
    return res.json({ success: true, like_count: likeCount });
  } catch (error) {
    console.error('獲取按讚數時發生錯誤:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message || '伺服器內部錯誤'
    });
  }
});

// 提供每日捐款數據的 API 端點 (簡化版，直接根據讚數生成)
app.get('/daily-donations', async (req, res) => {
  try {
    console.log('處理 /daily-donations 請求');
    
    // 獲取最新的讚數
    const likeCount = await getLikeCount();
    console.log('獲取到按讚數:', likeCount);
    
    // 強制確保至少有1個讚用於測試 (實際部署時可酌情移除)
    const totalLikes = Math.max(1, likeCount);
    
    // 生成每日數據，確保總額等於讚數
    const dailyData = [];
    const today = new Date();
    let cumulativeTotal = 0;
    
    // 計算過去14天的日期
    const days = 14;
    
    // 確保每天至少分配一些讚數
    // 這裡使用一個簡單的增長模式，越接近今天讚數越多
    let remainingLikes = totalLikes;
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - (days - 1 - i)); // 從14天前到今天
      
      // 格式化日期為 MM/DD 格式
      const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
      
      let amount = 0;
      
      // 在最後一天分配所有剩餘的讚數
      if (i === days - 1) {
        amount = remainingLikes;
      } else if (remainingLikes > 1) {
        // 使用遞增的模式分配讚數
        // 第一天使用1%的讚數，最後一天前使用剩餘的40%
        const dayFactor = 0.01 + (i * 0.03); // 從1%開始，每天增加3%
        amount = Math.max(1, Math.round(totalLikes * dayFactor));
        
        // 確保不會超過剩餘的讚數
        amount = Math.min(amount, remainingLikes - 1);
      }
      
      remainingLikes -= amount;
      cumulativeTotal += amount;
      
      dailyData.push({
        date: formattedDate,
        amount: amount,
        total: cumulativeTotal
      });
    }
    
    console.log(`生成了 ${dailyData.length} 天的捐款數據`);
    
    return res.json({ 
      success: true, 
      totalLikes: totalLikes,
      dailyData: dailyData 
    });
  } catch (error) {
    console.error('獲取每日捐款數據時發生錯誤:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message || '伺服器內部錯誤'
    });
  }
});

// 獲取評論的API端點 (改為內存存儲)
app.get('/comments', async (req, res) => {
  try {
    console.log('處理 /comments 請求');
    const comments = await syncComments();
    console.log(`找到 ${comments.length} 條評論`);
    return res.json({ success: true, comments });
  } catch (error) {
    console.error('獲取評論時發生錯誤:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message || '伺服器內部錯誤'
    });
  }
});

// 獲取抽獎結果的API端點 (基於即時獲取的評論)
app.get('/winners', async (req, res) => {
  try {
    console.log('處理 /winners 請求');
    const count = parseInt(req.query.count) || 20;
    const HASHTAG = /\s*#\s*[psk]\b/i;
    
    const allComments = await syncComments();
    
    const uniqueUsers = new Map();
    allComments.forEach(comment => {
      if (HASHTAG.test(comment.text) && !uniqueUsers.has(comment.user)) {
        uniqueUsers.set(comment.user, comment);
      }
    });

    const validComments = Array.from(uniqueUsers.values());
    
    const winners = [];
    const tempComments = [...validComments];
    
    while (winners.length < count && tempComments.length) {
      const idx = Math.floor(Math.random() * tempComments.length);
      winners.push(tempComments.splice(idx, 1)[0]);
    }
    
    console.log(`選出 ${winners.length} 名得獎者`);
    return res.json({ success: true, winners });
  } catch (error) {
    console.error('選擇得獎者時發生錯誤:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message || '伺服器內部錯誤'
    });
  }
});

// 手動刷新數據端點
app.get('/refresh', async (req, res) => {
  try {
    console.log('執行手動數據刷新');
    await syncComments();
    const likeCount = await getLikeCount();
    res.json({ success: true, message: '數據已更新', likes: likeCount });
  } catch (error) {
    console.error('手動刷新時發生錯誤:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message || '伺服器內部錯誤'
    });
  }
});

// 獲取Instagram資訊端點
app.get('/instagram-info', async (req, res) => {
  try {
    // 獲取媒體列表
    const mediaUrl = `${FB_API}/${IG_USER_ID}/media?fields=id,caption,permalink,like_count,comments_count&access_token=${IG_TOKEN}`;
    const mediaResponse = await fetch(mediaUrl);
    
    if (!mediaResponse.ok) {
      throw new Error(`媒體列表API錯誤: ${mediaResponse.status}`);
    }
    
    const mediaData = await mediaResponse.json();
    
    // 尋找目標貼文
    let targetPost = null;
    if (mediaData.data && mediaData.data.length > 0) {
      for (const post of mediaData.data) {
        if (post.id === IG_POST_ID) {
          targetPost = post;
          break;
        }
      }
    }
    
    res.json({ 
      success: true, 
      instagramAccount: IG_USER_ID,
      mediaCount: mediaData.data?.length || 0,
      targetPost
    });
  } catch (error) {
    console.error('獲取Instagram資訊時發生錯誤:', error);
    res.status(500).json({ success: false, error: '伺服器內部錯誤' });
  }
});

// 添加 404 處理 - 需在所有路由之後
app.use((req, res) => {
  console.log(`404 - 找不到路徑: ${req.url}`);
  res.status(404).json({
    error: 'Not Found',
    message: `找不到請求的資源: ${req.url}`
  });
});

// 添加全局錯誤處理中間件 - 需在最後
app.use((err, req, res, next) => {
  console.error('全局錯誤處理:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    headers: req.headers
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || '伺服器內部錯誤'
  });
});

// 啟動服務
const startServer = async () => {
  try {
    // 啟動服務
    app.listen(PORT, () => {
      console.log(`伺服器已啟動在 http://localhost:${PORT}`);
      console.log(`Instagram 用戶 ID: ${IG_USER_ID}`);
      console.log(`Instagram 貼文 ID: ${IG_POST_ID}`);
      
      // 初始同步
      try {
        // 設置定時任務
        setInterval(syncComments, 60000); // 每分鐘同步一次
      } catch (error) {
        console.error('初始同步失敗:', error);
      }
    });
  } catch (error) {
    console.error('伺服器啟動失敗:', error);
    process.exit(1);
  }
};

// 啟動伺服器
startServer(); 