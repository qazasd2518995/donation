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

// 全局變量存儲抽獎結果
let currentWinners = [];

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

// 獲取Instagram上的按讚數
async function getLikeCount() {
  try {
    console.log('開始同步 Instagram 按讚數...');
    
    const url = `${FB_API}/${IG_POST_ID}?fields=like_count&access_token=${IG_TOKEN}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`獲取按讚數時發生錯誤: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const likeCount = data.like_count || 0;
    
    // 更新緩存的按讚數
    global.cachedLikeCount = likeCount;
    
    return likeCount;
  } catch (error) {
    console.error('獲取按讚數時發生錯誤:', error);
    // 發生錯誤時返回緩存的值，或者默認值
    return global.cachedLikeCount || 0;
  }
}

// 同步版本的獲取按讚數函數（用於不需要等待的場景）
function getLikeCountSync() {
  try {
    // 為避免重複發送API請求，使用緩存的按讚數
    if (global.cachedLikeCount) {
      return global.cachedLikeCount;
    }
    
    // 如果沒有緩存，則使用一個初始值
    return 5; // 默認值
  } catch (error) {
    console.error('同步獲取按讚數時發生錯誤:', error);
    return 1; // 出錯時返回一個安全的默認值
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

// 獲取按讚數的API端點
app.get('/api/likes', async (req, res) => {
  try {
    console.log('處理 /api/likes 請求');
    const likeCount = await getLikeCount();
    console.log('成功獲取按讚數:', likeCount);
    res.json({ success: true, count: likeCount });
  } catch (error) {
    console.error('獲取按讚數時發生錯誤:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '獲取按讚數時發生錯誤'
    });
  }
});

// 獲取每日捐款數據的API端點
app.get('/api/daily-donations', (req, res) => {
  try {
    console.log('處理 /api/daily-donations 請求');
    const likeCount = getLikeCountSync();
    console.log('獲取到按讚數:', likeCount);
    
    // 生成過去 14 天的捐款數據 (按讚數 + 隨機波動)
    const today = new Date();
    const dailyData = [];
    
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
      
      // 以當前按讚數為基準，為每天加入一些隨機波動
      let dailyAmount;
      if (i === 0) {
        // 今天的數據使用實際按讚數
        dailyAmount = likeCount;
      } else {
        // 過去的數據以按讚數為基準，添加隨機波動
        const randomFactor = 0.7 + Math.random() * 0.6; // 0.7 到 1.3 之間的隨機數
        dailyAmount = Math.floor(likeCount * randomFactor * (i / 14 + 0.3));
      }
      
      dailyData.push({
        date: formattedDate,
        amount: dailyAmount
      });
    }
    
    console.log('生成了 14 天的捐款數據');
    res.json({ success: true, data: dailyData });
  } catch (error) {
    console.error('獲取每日捐款數據時發生錯誤:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '獲取每日捐款數據時發生錯誤'
    });
  }
});

// 獲取評論的API端點 (改為內存存儲)
app.get('/api/comments', async (req, res) => {
  try {
    console.log('處理 /api/comments 請求');
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

// 獲取抽獎結果的API端點
app.get('/api/winners', async (req, res) => {
  try {
    console.log('處理 /api/winners 請求');
    
    // 如果已經有抽獎結果，直接返回
    if (currentWinners.length > 0) {
      console.log(`返回現有抽獎結果: ${currentWinners.length} 名得獎者`);
      return res.json({ success: true, winners: currentWinners });
    }
    
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
    
    // 保存抽獎結果
    currentWinners = winners;
    
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

// 清空抽獎結果的API端點
app.post('/api/winners/clear', (req, res) => {
  try {
    console.log('處理 /api/winners/clear 請求 - 清空抽獎結果');
    
    // 清空抽獎結果
    currentWinners = [];
    
    console.log('清空抽獎結果成功');
    return res.json({ 
      success: true, 
      message: '抽獎結果已清空，可以重新抽獎'
    });
  } catch (error) {
    console.error('清空抽獎結果時發生錯誤:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message || '伺服器內部錯誤'
    });
  }
});

// 自定義抽獎端點 - 只從已確認追蹤的用戶中抽取
app.post('/api/winners-custom', async (req, res) => {
  try {
    console.log('處理 /api/winners-custom 請求');
    const { count = 18, verifiedUserIds = [] } = req.body;
    
    console.log(`從 ${verifiedUserIds.length} 個已確認追蹤的用戶中抽取 ${count} 名得獎者`);
    
    // 如果沒有提供有效的verifiedUserIds，返回錯誤
    if (!Array.isArray(verifiedUserIds) || verifiedUserIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '未提供已確認追蹤的用戶ID列表'
      });
    }
    
    // 獲取所有評論
    const allComments = await syncComments();
    
    // 只保留已確認追蹤的用戶的評論
    const validComments = allComments.filter(comment => verifiedUserIds.includes(comment.id));
    
    // 確保每個用戶只被選中一次（使用用戶名作為鍵）
    const uniqueUsers = new Map();
    validComments.forEach(comment => {
      if (!uniqueUsers.has(comment.user)) {
        uniqueUsers.set(comment.user, comment);
      }
    });
    
    // 從唯一用戶集合中隨機選擇獲獎者
    const winners = [];
    const eligibleComments = Array.from(uniqueUsers.values());
    
    while (winners.length < count && eligibleComments.length) {
      const idx = Math.floor(Math.random() * eligibleComments.length);
      winners.push(eligibleComments.splice(idx, 1)[0]);
    }
    
    // 保存抽獎結果
    currentWinners = winners;
    
    console.log(`成功選出 ${winners.length} 名得獎者`);
    return res.json({ success: true, winners });
  } catch (error) {
    console.error('自定義抽獎時發生錯誤:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message || '伺服器內部錯誤'
    });
  }
});

// 獎品列表端點
app.get('/api/prizes', (req, res) => {
  try {
    console.log('處理 /api/prizes 請求');
    
    // 獎項清單
    const prizes = [
      { rank: 1,  name: "PSK海洋探索大獎", detail: "灣臥海景頂級房＋輕盈美肌組", value: 10797 },
      { rank: 2,  name: "海洋守護獎", detail: "環保海龜飲料杯套＋輕盈美肌組", value: 1789 },
      { rank: 3,  name: "海洋守護獎", detail: "環保海龜飲料杯套＋美肌清潔明星組", value: 1740 },
      { rank: 4,  name: "海洋守護獎", detail: "環保海龜飲料杯套＋輕盈美肌組", value: 1789 },
      { rank: 5,  name: "鯨豚之友獎", detail: "ONE+ 虎鯨鑰匙圈＋美肌清潔明星組", value: 669 },
      { rank: 6,  name: "鯨豚之友獎", detail: "ONE+ 鯨魚鑰匙圈＋毛孔淨化組", value: 634 },
      { rank: 7,  name: "PSK美肌獎", detail: "ONE+ 虎鯨鑰匙圈＋毛孔淨化組", value: 669 },
      { rank: 8,  name: "PSK美肌獎", detail: "ONE+ 鯨魚鑰匙圈＋溫和洗卸組", value: 634 },
      { rank: 9,  name: "PSK美肌獎", detail: "輕盈美肌組", value: 600 },
      { rank: 10, name: "PSK美肌獎", detail: "輕盈美肌組", value: 600 },
      { rank: 11, name: "PSK美肌獎", detail: "輕盈美肌組", value: 600 },
      { rank: 12, name: "PSK美肌獎", detail: "美肌清潔明星組", value: 580 },
      { rank: 13, name: "PSK美肌獎", detail: "毛孔淨化組", value: 550 },
      { rank: 14, name: "PSK美肌獎", detail: "毛孔淨化組", value: 550 },
      { rank: 15, name: "PSK美肌獎", detail: "溫和洗卸組", value: 520 },
      { rank: 16, name: "PSK美肌獎", detail: "美肌清潔明星組", value: 580 },
      { rank: 17, name: "PSK美肌獎", detail: "溫和洗卸組", value: 520 },
      { rank: 18, name: "PSK美肌獎", detail: "溫和洗卸組", value: 520 },
    ];
    
    return res.json({ success: true, prizes });
  } catch (error) {
    console.error('獲取獎品列表時發生錯誤:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message || '伺服器內部錯誤'
    });
  }
});

// 手動刷新數據端點
app.get('/api/refresh', async (req, res) => {
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
app.get('/api/instagram-info', async (req, res) => {
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