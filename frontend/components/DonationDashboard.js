import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// 通過環境變數獲取API基礎URL
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:10000';

export default function DonationDashboard() {
  const [likes, setLikes] = useState(0);
  const [dailyData, setDailyData] = useState([]);
  const [totalDonation, setTotalDonation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    loadData();
    
    // 設定定時更新 (每 30 秒)
    const intervalId = setInterval(() => loadData(), 30000);
    
    // 清理函數
    return () => clearInterval(intervalId);
  }, []);
  
  async function loadData(retryCount = 0) {
    try {
      setLoading(true);
      
      // 加載按讚數據
      const likesURL = `${API_BASE_URL}/api/likes`;
      console.log('正在獲取按讚數據，URL:', likesURL);
      
      const likesResponse = await fetch(likesURL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        cache: 'no-cache' // 防止緩存問題
      });
      
      if (!likesResponse.ok) {
        throw new Error(`HTTP error! status: ${likesResponse.status}`);
      }
      
      const likesData = await likesResponse.json();
      console.log('成功獲取按讚數據:', likesData);
      setLikes(likesData.count);
      
      // 加載每日捐款數據
      const dailyURL = `${API_BASE_URL}/api/daily-donations`;
      console.log('正在獲取每日捐款數據，URL:', dailyURL);
      
      const dailyResponse = await fetch(dailyURL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        cache: 'no-cache' // 防止緩存問題
      });
      
      if (!dailyResponse.ok) {
        throw new Error(`HTTP error! status: ${dailyResponse.status}`);
      }
      
      const dailyData = await dailyResponse.json();
      console.log('成功獲取每日捐款數據:', dailyData);
      
      if (dailyData.data && dailyData.data.length > 0) {
        setDailyData(dailyData.data);
        setTotalDonation(dailyData.data[dailyData.data.length - 1].amount);
      } else {
        setError('每日捐款數據格式不正確');
      }
      
      // 重置錯誤狀態
      setError(null);
      
    } catch (error) {
      console.error('API請求失敗:', error);
      
      // 如果重試次數小於3次，則重試
      if (retryCount < 3) {
        console.log(`重試中... (${retryCount + 1}/3)`);
        setTimeout(() => loadData(retryCount + 1), 2000 * (retryCount + 1));
      } else {
        setError(`數據加載失敗: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }
  
  // 產生隨機位置的小魚或氣泡
  const generateBubbles = (count) => {
    const bubbles = [];
    const maxBubbles = Math.min(count, 100); // 限制最大顯示數量為100，避免性能問題
    
    for (let i = 0; i < maxBubbles; i++) {
      const size = Math.random() * 16 + 8; // 8-24px
      const x = Math.random() * 90 + 5; // 5-95%
      const y = Math.random() * 70 + 10; // 10-80%
      const delay = Math.random() * 10;
      const duration = Math.random() * 15 + 10; // 10-25s
      
      bubbles.push(
        <motion.div
          key={i}
          className="absolute rounded-full bg-secondary/60"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            left: `${x}%`,
            top: `${y}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: duration,
            delay: delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      );
    }
    return bubbles;
  };
  
  // 產生多彩的小魚群
  const generateFishes = (count) => {
    const fishes = [];
    // 小魚SVG路徑集合，不同形狀的小魚
    const fishShapes = [
      "M0,0 C3,2 5,2 8,0 C5,-2 3,-2 0,0 Z", // 簡單魚形
      "M0,0 C2,3 6,3 8,0 C6,-3 2,-3 0,0 M8,0 L10,3 M8,0 L10,-3", // 帶尾巴的魚
      "M0,0 Q4,4 8,0 Q4,-4 0,0 M8,0 L11,2 L10,0 L11,-2 Z", // 可愛圓潤的魚
      "M0,0 Q2,2 5,2 Q8,2 8,0 Q8,-2 5,-2 Q2,-2 0,0 M8,0 L10,1 L11,0 L10,-1 Z", // 卡通魚
      "M0,0 Q3,3 6,3 T10,0 Q7,-3 0,0 M10,0 L12,2 M10,0 L12,-2", // 熱帶魚
    ];
    
    // 小魚顏色組合
    const fishColors = [
      "#FFB6C1", // 淺粉紅
      "#ADD8E6", // 淺藍
      "#90EE90", // 淺綠
      "#FFA07A", // 淺鮭魚色
      "#FFFACD", // 檸檬綠
      "#E6E6FA", // 薰衣草
      "#F0E68C", // 卡其黃
      "#87CEFA", // 淺天藍
      "#DDA0DD", // 李子紫
      "#B0E0E6", // 粉藍
    ];
    
    const maxFishes = Math.min(count, 100); // 限制最大顯示數量
    
    for (let i = 0; i < maxFishes; i++) {
      const size = Math.random() * 20 + 15; // 15-35px
      const x = Math.random() * 85 + 5; // 5-90%
      const y = Math.random() * 65 + 15; // 15-80%
      const delay = Math.random() * 8;
      const duration = Math.random() * 20 + 15; // 15-35s
      const direction = Math.random() > 0.5 ? 1 : -1; // 魚的朝向 (左或右)
      const shapeIndex = Math.floor(Math.random() * fishShapes.length);
      const colorIndex = Math.floor(Math.random() * fishColors.length);
      const eyeColor = "#000"; // 眼睛顏色
      
      fishes.push(
        <motion.div
          key={`fish-${i}`}
          className="absolute"
          style={{
            width: `${size}px`,
            height: `${size / 2}px`,
            left: `${x}%`,
            top: `${y}%`,
            transform: `scaleX(${direction})`,
          }}
          animate={{
            x: [0, direction * 30, 0],
            y: [0, -10, 5, -5, 0],
          }}
          transition={{
            duration: duration,
            delay: delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <svg width="100%" height="100%" viewBox="0 0 12 6" preserveAspectRatio="xMidYMid meet">
            {/* 魚身 */}
            <path
              d={fishShapes[shapeIndex]}
              fill={fishColors[colorIndex]}
              stroke="#ffffff"
              strokeWidth="0.2"
            />
            {/* 魚眼 */}
            <circle
              cx={direction > 0 ? 2 : 8}
              cy="0"
              r="0.8"
              fill={eyeColor}
            />
            <circle
              cx={direction > 0 ? 2 : 8}
              cy="0"
              r="0.3"
              fill="#ffffff"
            />
          </svg>
        </motion.div>
      );
    }
    
    return fishes;
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-primary text-white relative overflow-hidden">
      {/* 背景裝飾 */}
      <div className="absolute inset-0 wave-background opacity-10 z-0"></div>
      
      {/* 鯨魚 SVG 背景 */}
      <svg viewBox="0 0 800 600" className="absolute inset-0 opacity-10 z-0">
        <path
          d="M550,220 C600,180 620,120 580,100 C540,80 500,120 480,140 C460,100 400,80 360,100 C320,120 300,180 320,220 C300,240 240,320 220,380 C200,440 220,500 300,520 C380,540 460,500 520,440 C580,380 600,300 580,260 C560,220 520,240 550,220 Z"
          fill="currentColor"
        />
        {/* 鯨魚噴水 */}
        <path
          d="M498,180 C500,160 510,140 530,120"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        {/* 氣泡 */}
        <circle cx="540" cy="100" r="10" fill="currentColor" opacity="0.7" />
        <circle cx="560" cy="80" r="6" fill="currentColor" opacity="0.5" />
        <circle cx="530" cy="70" r="8" fill="currentColor" opacity="0.6" />
      </svg>
      
      <div className="z-10 w-full max-w-4xl px-4">
        <h1 className="text-4xl md:text-6xl font-bold tracking-wider mb-6 text-center">
          PSK x 台灣鯨豚協會：海洋守護計畫
        </h1>
        
        <div className="text-center mb-8">
          <p className="mb-2 text-lg">每 1 個 ❤️ = NT$ 1 捐給</p>
          <p className="mb-8 text-xl font-semibold">
            台灣鯨豚協會 Taiwan Cetacean Society
          </p>
        </div>
        
        <div className="w-full max-w-xl mx-auto">
          {/* 總金額顯示 */}
          <div className="bg-white/10 p-6 rounded-lg shadow-lg mb-8">
            <div className="flex flex-col items-center">
              <h2 className="text-lg opacity-80 mb-2">已累積總捐款金額</h2>
              <AnimatePresence mode="wait">
                <motion.p
                  key={totalDonation}
                  className="text-4xl md:text-5xl font-bold text-secondary"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.5 }}
                >
                  NT$ {totalDonation.toLocaleString()}
                </motion.p>
              </AnimatePresence>
              <p className="mt-2 text-sm opacity-70">今日已獲得 {likes} 個讚</p>
            </div>
          </div>
          
          {/* 互動式鯨魚計數器 - 取代原有的折線圖 */}
          <div className="bg-white/10 p-4 rounded-lg shadow-lg mb-8">
            <h2 className="text-xl font-semibold mb-4 text-center">海洋生態計數器</h2>
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="h-64 w-full bg-gradient-to-b from-blue-900/40 to-blue-600/20 rounded-lg relative overflow-hidden">
                {/* 海洋背景 */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-500/30"></div>
                
                {/* 海底裝飾 */}
                <div className="absolute bottom-0 inset-x-0 h-12">
                  <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
                    <path 
                      d="M0,120 C150,90 350,100 500,95 C650,90 700,60 900,80 C1050,95 1150,80 1200,90 L1200,120 L0,120 Z" 
                      className="fill-blue-800/10"
                    ></path>
                  </svg>
                  {/* 海草 */}
                  <div className="absolute bottom-2 left-[15%]">
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="w-1 h-16 bg-green-400/30 rounded-full origin-bottom"
                    ></motion.div>
                  </div>
                  <div className="absolute bottom-2 left-[25%]">
                    <motion.div
                      animate={{ rotate: [0, -6, 6, 0] }}
                      transition={{ duration: 3.5, repeat: Infinity }}
                      className="w-1 h-12 bg-green-500/30 rounded-full origin-bottom"
                    ></motion.div>
                  </div>
                  <div className="absolute bottom-2 right-[20%]">
                    <motion.div
                      animate={{ rotate: [0, 8, -3, 0] }}
                      transition={{ duration: 5, repeat: Infinity }}
                      className="w-1 h-14 bg-green-400/30 rounded-full origin-bottom"
                    ></motion.div>
                  </div>
                </div>
                
                {/* 海面波浪 */}
                <div className="absolute top-0 inset-x-0 h-6 bg-blue-500/10">
                  <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
                    <path 
                      d="M0,0 C150,20 350,0 500,5 C650,10 700,35 900,20 C1050,5 1150,20 1200,10 L1200,0 L0,0 Z" 
                      className="fill-white/20"
                    ></path>
                  </svg>
                </div>
                
                {/* 主要鯨魚 - 更可愛的版本 */}
                <motion.div
                  className="absolute bottom-8 left-10"
                  animate={{
                    x: [0, 15, 0, -15, 0],
                    y: [0, -8, 0, -5, 0],
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <svg width="140" height="80" viewBox="0 0 140 80" className="fill-blue-200">
                    {/* 鯨魚身體 */}
                    <path d="M120,40 C110,25 100,15 85,15 C75,15 70,20 65,20 C60,20 55,15 45,15 C35,15 25,25 15,40 C25,55 35,65 45,65 C55,65 60,60 65,60 C70,60 75,65 85,65 C100,65 110,55 120,40 Z" 
                      strokeWidth="2" 
                      stroke="#88AADD" 
                      className="fill-blue-300"
                    />
                    {/* 鯨魚腹部 */}
                    <path d="M35,40 C40,50 55,55 85,55 C105,55 110,50 115,40 C110,30 105,25 85,25 C55,25 40,30 35,40 Z" 
                      className="fill-blue-100"
                    />
                    {/* 鯨魚眼睛 */}
                    <circle cx="35" cy="35" r="3" className="fill-blue-900" />
                    <circle cx="35" cy="35" r="1" className="fill-white" />
                    {/* 鯨魚噴水孔 */}
                    <path d="M75,18 C75,10 80,5 80,5" stroke="white" strokeWidth="2" fill="none" />
                    {/* 鯨魚尾巴 */}
                    <path d="M120,40 L130,30 L135,40 L130,50 Z" 
                      strokeWidth="2" 
                      stroke="#88AADD" 
                      className="fill-blue-300"
                    />
                    {/* 鯨魚鰭 */}
                    <path d="M60,55 Q65,65 75,60" 
                      strokeWidth="2" 
                      stroke="#88AADD" 
                      className="fill-blue-300"
                    />
                    {/* 鯨魚嘴巴 - 微笑 */}
                    <path d="M25,42 Q30,46 35,42" 
                      stroke="#88AADD" 
                      strokeWidth="1.5" 
                      fill="none"
                    />
                  </svg>
                </motion.div>
                
                {/* 小魚群 - 根據讚數生成不同顏色和樣式的小魚 */}
                {generateFishes(likes)}
                
                {/* 氣泡群 */}
                {generateBubbles(likes < 10 ? likes * 2 : 20)}
                
                {/* 讚數顯示 */}
                <div className="absolute bottom-2 right-2 bg-white/20 px-3 py-1 rounded-full text-sm">
                  捐款越多，小魚越多！
                </div>
              </div>
            )}
          </div>
          
          {/* 錯誤顯示 */}
          {error && (
            <div className="mt-4 p-2 bg-red-500/20 rounded text-center">
              {error}
            </div>
          )}
          
          {/* 資訊區塊 */}
          <div className="mt-8 p-6 bg-white/10 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">關於台灣鯨豚協會</h2>
            <p className="mb-4">
              台灣海域擁有豐富的鯨豚資源，台灣鯨豚協會致力於台灣沿海的鯨豚生態系研究、鯨豚保育與海洋環境教育活動，推動鯨豚觀光與保育之平衡，提昇整體海洋生態系永續經營之理念。
            </p>
            <p className="mb-4">
              您的每一個按讚都將轉化為實質捐款，幫助協會持續推動海洋保育工作，讓我們一起為保護海洋生態盡一份心力！
            </p>
            <p>
              除了按讚捐款，您也可以參與我們的抽獎活動！只需追蹤 PSK 官方 Instagram 帳號、按讚貼文，並在貼文下留言加上 #P、#S 或 #K 標籤，即可有機會獲得多項精美獎品！
            </p>
          </div>
          
          {/* 底部資訊 */}
          <div className="mt-8 text-center text-sm text-white/70">
            <div className="mb-4">
              <Link href="/winners" className="text-white hover:text-secondary transition-colors text-base font-semibold bg-white/20 px-4 py-2 rounded-full">
                查看活動規則與抽獎結果
              </Link>
            </div>
            <p>© 2024 PSK x Taiwan Cetacean Society</p>
            <p>數據更新頻率: 每 30 秒</p>
          </div>
        </div>
      </div>
    </div>
  );
} 