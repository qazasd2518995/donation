import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default function DonationDashboard() {
  const [likes, setLikes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const target = 10000; // 目標金額 NT$
  
  useEffect(() => {
    // 初始加載
    loadLikes();
    
    // 設定定時更新 (每 30 秒)
    const intervalId = setInterval(loadLikes, 30000);
    
    // 清理函數
    return () => clearInterval(intervalId);
  }, []);
  
  async function loadLikes() {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/likes`);
      if (!response.ok) {
        throw new Error('無法獲取按讚數');
      }
      const data = await response.json();
      setLikes(data.like_count);
      setError(null);
    } catch (err) {
      console.error('獲取按讚數時出錯:', err);
      setError('無法連接到服務器');
    } finally {
      setLoading(false);
    }
  }
  
  // 1 按讚 = 1 NT$
  const donated = likes;
  const percentage = Math.min((donated / target) * 100, 100);
  
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
          保護妳，也保護地球
        </h1>
        
        <div className="text-center mb-8">
          <p className="mb-2 text-lg">每 1 個 ❤️ = NT$ 1 捐給</p>
          <p className="mb-8 text-xl font-semibold">
            中華鯨豚協會 Taiwan Cetacean Society
          </p>
        </div>
        
        <div className="w-full max-w-xl mx-auto">
          {/* 進度條 */}
          <div className="h-8 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-secondary rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1 }}
            />
          </div>
          
          {/* 金額顯示 */}
          <div className="mt-4 flex justify-between items-center text-lg">
            <AnimatePresence mode="wait">
              <motion.p
                key={donated}
                className="font-bold"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.5 }}
              >
                已累積: NT$ {donated.toLocaleString()}
              </motion.p>
            </AnimatePresence>
            <p className="font-bold">目標: NT$ {target.toLocaleString()}</p>
          </div>
          
          {/* 錯誤顯示 */}
          {error && (
            <div className="mt-4 p-2 bg-red-500/20 rounded text-center">
              {error}
            </div>
          )}
          
          {/* 資訊區塊 */}
          <div className="mt-16 p-6 bg-white/10 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">關於中華鯨豚協會</h2>
            <p className="mb-4">
              台灣海域擁有豐富的鯨豚資源，中華鯨豚協會致力於台灣沿海的鯨豚生態系研究、鯨豚保育與海洋環境教育活動，推動鯨豚觀光與保育之平衡，提昇整體海洋生態系永續經營之理念。
            </p>
            <p>
              您的每一個按讚都將轉化為實質捐款，幫助協會持續推動海洋保育工作，讓我們一起為保護海洋生態盡一份心力！
            </p>
          </div>
          
          {/* 底部資訊 */}
          <div className="mt-8 text-center text-sm text-white/70">
            <p>© 2023 Instagram Giveway Campaign</p>
            <p>數據更新頻率: 每 30 秒</p>
          </div>
        </div>
      </div>
    </div>
  );
} 