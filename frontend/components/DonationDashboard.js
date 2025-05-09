import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// 通過環境變數獲取API基礎URL
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:10000';

export default function DonationDashboard() {
  const [likes, setLikes] = useState(0);
  const [dailyData, setDailyData] = useState([]);
  const [totalDonation, setTotalDonation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // 初始加載
    loadData();
    
    // 設定定時更新 (每 30 秒)
    const intervalId = setInterval(loadData, 30000);
    
    // 清理函數
    return () => clearInterval(intervalId);
  }, []);
  
  async function loadData() {
    try {
      setLoading(true);
      
      // 加載按讚數據 - 專注獲取真實數據
      const likesURL = `${API_BASE_URL}/likes`;
      console.log('正在獲取按讚數據，URL:', likesURL);
      try {
        // 使用配置優化的GET請求
        const likesResponse = await fetch(likesURL, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          },
          mode: 'cors',
          credentials: 'omit' // 不發送認證信息，減少跨域問題
        });
        console.log('按讚數據回應狀態:', likesResponse.status);
        
        if (likesResponse.ok) {
          const likesData = await likesResponse.json();
          console.log('成功獲取按讚數據:', likesData);
          setLikes(likesData.like_count);
          
          // 加載每日捐款數據 - 專注獲取真實數據
          const dailyURL = `${API_BASE_URL}/daily-donations`;
          console.log('正在獲取每日捐款數據，URL:', dailyURL);
          
          const dailyResponse = await fetch(dailyURL, {
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            },
            mode: 'cors',
            credentials: 'omit' // 不發送認證信息，減少跨域問題
          });
          console.log('每日捐款數據回應狀態:', dailyResponse.status);
          
          if (dailyResponse.ok) {
            const dailyData = await dailyResponse.json();
            console.log('成功獲取每日捐款數據:', dailyData);
            
            if (dailyData.dailyData && dailyData.dailyData.length > 0) {
              setDailyData(dailyData.dailyData);
              setTotalDonation(dailyData.dailyData[dailyData.dailyData.length - 1].total);
            } else {
              setError('每日捐款數據格式不正確');
            }
          } else {
            setError('無法獲取每日捐款數據 (HTTP ' + dailyResponse.status + ')');
          }
        } else {
          setError('無法獲取按讚數據 (HTTP ' + likesResponse.status + ')');
        }
      } catch (apiError) {
        console.error('API請求失敗:', apiError);
        setError('數據加載失敗: ' + apiError.message);
      }
    } catch (err) {
      console.error('整體數據加載出錯:', err);
      setError('無法連接到服務器');
    } finally {
      setLoading(false);
    }
  }
  
  // 自定義 Tooltip 內容
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 p-3 rounded-lg shadow-lg text-primary">
          <p className="font-bold">{label}</p>
          <p>當日新增: NT$ {payload[0].payload.amount}</p>
          <p>累計總額: NT$ {payload[0].payload.total}</p>
        </div>
      );
    }
  
    return null;
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
          
          {/* 折線圖 */}
          <div className="bg-white/10 p-4 rounded-lg shadow-lg mb-8">
            <h2 className="text-xl font-semibold mb-4 text-center">捐款趨勢圖</h2>
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dailyData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="date" 
                      stroke="rgba(255,255,255,0.6)"
                      tick={{ fill: 'rgba(255,255,255,0.8)' }}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.6)"
                      tick={{ fill: 'rgba(255,255,255,0.8)' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="累計捐款 (NT$)"
                      stroke="#FFB57A"
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
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