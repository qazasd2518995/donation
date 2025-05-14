import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:10000';

// 獎項清單
const prizes = [
  { rank: 1,  name: "大獎", detail: "墾丁旅宿灣臥海景頂級房住宿券一晚＋PSK海洋友善保養禮盒＋台灣鯨豚協會紀念品組合", value: 10797 },
  { rank: 2,  name: "二獎", detail: "環保海龜飲料杯套＋PSK海洋系列保養組＋台灣鯨豚協會明信片組", value: 2200 },
  { rank: 3,  name: "二獎", detail: "環保海龜飲料杯套＋PSK海洋系列保養組＋台灣鯨豚協會明信片組", value: 2200 },
  { rank: 4,  name: "二獎", detail: "環保海龜飲料杯套＋PSK海洋系列保養組＋台灣鯨豚協會明信片組", value: 2200 },
  { rank: 5,  name: "三獎", detail: "ONE+ 虎鯨鑰匙圈＋PSK海洋深層保濕精華＋台灣鯨豚生態介紹手冊", value: 1580 },
  { rank: 6,  name: "三獎", detail: "ONE+ 鯨魚鑰匙圈＋PSK海洋深層保濕精華＋台灣鯨豚生態介紹手冊", value: 1580 },
  { rank: 7,  name: "四獎", detail: "PSK超值漂漂禮包＋海洋保育電子資源包", value: 669 },
  { rank: 8,  name: "四獎", detail: "PSK超值漂漂禮包＋海洋保育電子資源包", value: 669 },
  { rank: 9,  name: "四獎", detail: "PSK超值漂漂禮包＋海洋保育電子資源包", value: 669 },
  { rank: 10, name: "四獎", detail: "PSK超值漂漂禮包＋海洋保育電子資源包", value: 669 },
  { rank: 11, name: "四獎", detail: "PSK超值漂漂禮包＋海洋保育電子資源包", value: 669 },
  { rank: 12, name: "四獎", detail: "PSK超值漂漂禮包＋海洋保育電子資源包", value: 669 },
  { rank: 13, name: "四獎", detail: "PSK超值漂漂禮包＋海洋保育電子資源包", value: 669 },
  { rank: 14, name: "四獎", detail: "PSK超值漂漂禮包＋海洋保育電子資源包", value: 669 },
  { rank: 15, name: "四獎", detail: "PSK超值漂漂禮包＋海洋保育電子資源包", value: 669 },
  { rank: 16, name: "四獎", detail: "PSK超值漂漂禮包＋海洋保育電子資源包", value: 669 },
  { rank: 17, name: "四獎", detail: "PSK超值漂漂禮包＋海洋保育電子資源包", value: 669 },
  { rank: 18, name: "四獎", detail: "PSK超值漂漂禮包＋海洋保育電子資源包", value: 669 },
];

export default function WinnerPage() {
  const [winners, setWinners] = useState([]);
  const [prevWinnersCount, setPrevWinnersCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [count] = useState(18); // 固定抽獎人數為18人
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [followingUsers, setFollowingUsers] = useState({});
  const [activeTab, setActiveTab] = useState('winners'); // 'winners' 或 'verify'
  const [filterHashtag, setFilterHashtag] = useState('all'); // 'all', 'P', 'S', 'K'
  const [prizeList, setPrizeList] = useState([]);
  const [selectAll, setSelectAll] = useState(false); // 添加全選狀態
  const [showCelebration, setShowCelebration] = useState(false);
  const drawSoundRef = useRef(null);
  
  // 簡單密碼驗證函數
  const handleLogin = () => {
    // 這裡使用簡單密碼，實際應用應更安全
    if (password === 'psk2024') {
      setIsAdmin(true);
      localStorage.setItem('drawAdmin', 'true');
      setShowLoginForm(false);
    } else {
      alert('密碼錯誤');
    }
  };
  
  // 登出功能
  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('drawAdmin');
  };
  
  async function fetchComments() {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/comments`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        cache: 'no-cache' // 防止緩存問題
      });
      if (!response.ok) {
        throw new Error(`HTTP錯誤! 狀態碼: ${response.status}`);
      }
      const data = await response.json();
      console.log('評論數據:', data);
      setComments(data.comments || []);
      
      // 從localStorage恢復已確認的追蹤狀態
      const savedFollowingUsers = localStorage.getItem('followingUsers');
      if (savedFollowingUsers) {
        setFollowingUsers(JSON.parse(savedFollowingUsers));
      }
      
      setError(null);
    } catch (err) {
      console.error('獲取留言資料時出錯:', err);
      setError(`無法連接到服務器或獲取留言資料: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }
  
  // 添加抽獎音效播放
  const playDrawSound = () => {
    if (drawSoundRef.current) {
      drawSoundRef.current.currentTime = 0;
      drawSoundRef.current.play().catch(e => console.error('播放抽獎音效失敗:', e));
    }
  };
  
  // 執行限定追蹤用戶的抽獎
  const drawFromVerifiedUsers = async () => {
    try {
      setLoading(true);
      
      // 獲取所有已確認追蹤且有hashtag的用戶
      const verifiedUserIds = Object.keys(followingUsers).filter(id => followingUsers[id]);
      
      // 確保有足夠的合格用戶
      if (verifiedUserIds.length < count) {
        alert(`合格的用戶不足 ${count} 人，目前只有 ${verifiedUserIds.length} 人確認追蹤且留有hashtag`);
        setLoading(false);
        return;
      }
      
      // 記錄之前的獲獎者數量
      setPrevWinnersCount(winners.length);
      
      // 發送給後端執行抽獎，限定從已確認追蹤的用戶中抽
      const response = await fetch(`${API_BASE_URL}/api/winners-custom`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          count: count,
          verifiedUserIds: verifiedUserIds
        })
      });
      
      if (!response.ok) {
        throw new Error('抽獎請求失敗');
      }
      
      const data = await response.json();
      setWinners(data.winners || []);
      setError(null);
      setActiveTab('winners'); // 切換回抽獎結果頁
      
      // 顯示慶祝動畫
      setShowCelebration(true);
      
      // 播放抽獎音效
      playDrawSound();
      
      // 5秒後隱藏慶祝動畫
      setTimeout(() => {
        setShowCelebration(false);
      }, 5000);
      
    } catch (err) {
      console.error('執行抽獎時出錯:', err);
      setError('執行抽獎失敗: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  async function fetchWinners() {
    try {
      setLoading(true);
      setPrevWinnersCount(winners.length);
      
      const response = await fetch(`${API_BASE_URL}/api/winners?count=${count}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        cache: 'no-cache', // 防止緩存問題
        // 添加時間戳參數以避免緩存
        signal: AbortSignal.timeout(10000) // 添加10秒超時
      });
      if (!response.ok) {
        throw new Error(`HTTP錯誤! 狀態碼: ${response.status}`);
      }
      const data = await response.json();
      console.log('抽獎結果:', data);
      
      // 如果有抽獎結果，顯示獲獎者
      if (data.winners && data.winners.length > 0) {
        const newWinnersCount = data.winners.length;
        setWinners(data.winners);
        
        // 如果有新增的中獎者，顯示慶祝動畫
        if (newWinnersCount > prevWinnersCount && prevWinnersCount > 0) {
          setShowCelebration(true);
          playDrawSound();
          setTimeout(() => {
            setShowCelebration(false);
          }, 5000);
        }
      } else {
        // 如果沒有抽獎結果，只顯示符合條件的評論
        setWinners([]);
      }
      setError(null);
    } catch (err) {
      console.error('獲取抽獎結果時出錯:', err);
      setError(`無法連接到服務器或獲取抽獎結果: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }
  
  async function fetchPrizes() {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/prizes`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        cache: 'no-cache' // 防止緩存問題
      });
      if (!response.ok) {
        throw new Error(`HTTP錯誤! 狀態碼: ${response.status}`);
      }
      const data = await response.json();
      console.log('獎品列表:', data);
      setPrizeList(data.prizes || []);
      setError(null);
    } catch (err) {
      console.error('獲取獎品列表時出錯:', err);
      // 使用默認獎品列表作為備用
      setPrizeList(prizes);
    } finally {
      setLoading(false);
    }
  }
  
  // 更新追蹤狀態
  const toggleFollowing = (userId) => {
    const newFollowingUsers = {
      ...followingUsers,
      [userId]: !followingUsers[userId]
    };
    setFollowingUsers(newFollowingUsers);
    localStorage.setItem('followingUsers', JSON.stringify(newFollowingUsers));
  };
  
  // 過濾出符合條件的留言
  const filteredComments = comments.filter(comment => 
    hasHashtag(comment.text, filterHashtag)
  );
  
  // 清空抽獎結果
  const clearWinners = async () => {
    // 先進行確認
    if (!window.confirm('確定要清空當前抽獎結果嗎？此操作不可恢復！')) {
      return;
    }
    
    try {
      setLoading(true);
      console.log('正在嘗試清空抽獎結果...');
      console.log('呼叫端點:', `${API_BASE_URL}/api/winners/clear`);
      
      const response = await fetch(`${API_BASE_URL}/api/winners/clear`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('清空抽獎結果失敗，狀態碼:', response.status);
        throw new Error(`HTTP錯誤! 狀態碼: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('清空抽獎結果回應:', data);
      
      if (data.success) {
        // 清空本地抽獎結果
        setWinners([]);
        setError(null);
        // 顯示成功訊息
        alert('抽獎結果已清空，您可以重新抽獎了');
      } else {
        throw new Error(data.message || '清空抽獎結果失敗');
      }
    } catch (err) {
      console.error('清空抽獎結果時出錯:', err);
      setError('清空抽獎結果失敗: ' + err.message);
      alert('清空抽獎結果失敗: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // 全選或取消全選所有用戶
  const toggleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    
    // 創建一個新的狀態對象
    const newFollowingUsers = {};
    
    // 根據全選狀態設置所有過濾後的評論
    filteredComments.forEach(comment => {
      newFollowingUsers[comment.id] = newSelectAll;
    });
    
    // 合併現有的狀態（保留不在過濾結果中的用戶狀態）
    const mergedFollowingUsers = {
      ...followingUsers,
      ...newFollowingUsers
    };
    
    setFollowingUsers(mergedFollowingUsers);
    localStorage.setItem('followingUsers', JSON.stringify(mergedFollowingUsers));
  };
  
  useEffect(() => {
    fetchWinners();
    fetchComments();
    fetchPrizes();
    
    // 檢查是否已登入
    const adminStatus = localStorage.getItem('drawAdmin');
    if (adminStatus === 'true') {
      setIsAdmin(true);
    }
    
    // 定時更新評論列表
    const intervalId = setInterval(() => {
      fetchComments();
    }, 30000); // 每30秒更新一次
    
    return () => clearInterval(intervalId);
  }, []);

  // 增加偵錯日誌函數
  const logDebugInfo = () => {
    console.log('當前評論數據:', comments);
    console.log('有效評論數量:', filteredComments.length);
    console.log('已確認追蹤用戶:', Object.keys(followingUsers).filter(id => followingUsers[id]).length);
    console.log('當前追蹤狀態:', followingUsers);
  };
  
  // 判斷留言是否包含hashtag
  const hasHashtag = (text, tag = 'all') => {
    // 轉換為小寫以避免大小寫問題
    const lowerText = text.toLowerCase();
    
    if (tag === 'all') {
      // 使用正則表達式匹配，允許 hashtag 前後有空格
      return /\s*#\s*p\b/i.test(lowerText) || 
             /\s*#\s*s\b/i.test(lowerText) || 
             /\s*#\s*k\b/i.test(lowerText);
    }
    // 使用正則表達式匹配特定標籤，允許標籤前後有空格
    const regex = new RegExp(`\\s*#\\s*${tag.toLowerCase()}\\b`, 'i');
    return regex.test(lowerText);
  };
  
  return (
    <>
      <Head>
        <title>抽獎結果 | PSK 海洋保護計畫 - Lucky Draw Results | Ocean Protection Project</title>
        <meta name="description" content="PSK 海洋保護計畫抽獎活動結果頁面，感謝您的參與! Thank you for participating in the PSK Ocean Protection Project Lucky Draw!" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main className="min-h-screen bg-primary text-white py-12">
        {/* 隱藏的音效元素 */}
        <audio ref={drawSoundRef} src="/music/draw_sound.mp3" preload="auto" />
        
        {/* 抽獎慶祝動畫 */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div 
              className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* 彩色紙屑 */}
              {Array.from({ length: 100 }).map((_, i) => {
                const size = Math.random() * 15 + 5;
                const xPos = Math.random() * 100;
                const delay = Math.random() * 0.5;
                const duration = Math.random() * 3 + 2;
                const colors = ["#FF6B6B", "#4ECDC4", "#FFD166", "#06D6A0", "#118AB2"];
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                return (
                  <motion.div 
                    key={i}
                    className="absolute rounded-lg"
                    style={{ 
                      width: size, 
                      height: size * (Math.random() + 0.5), 
                      backgroundColor: color,
                      left: `${xPos}%`,
                      top: "-5%"
                    }}
                    initial={{ y: "-10%" }}
                    animate={{ 
                      y: "110%",
                      rotate: Math.random() * 360 * (Math.random() > 0.5 ? 1 : -1),
                      x: Math.random() * 100 - 50
                    }}
                    transition={{ 
                      duration: duration,
                      delay: delay,
                      ease: "easeOut"
                    }}
                  />
                );
              })}
              
              {/* 中央訊息 */}
              <motion.div
                className="bg-primary/70 backdrop-blur-md p-8 rounded-xl text-center z-10 border-4 border-secondary"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  type: "spring",
                  delay: 0.2,
                  duration: 0.8
                }}
              >
                <motion.div 
                  className="text-4xl md:text-6xl font-bold text-secondary mb-4"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 2, -2, 0]
                  }}
                  transition={{ 
                    duration: 1,
                    repeat: 2
                  }}
                >
                  🎉 恭喜中獎！
                </motion.div>
                <motion.div 
                  className="text-2xl md:text-3xl"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ 
                    duration: 0.5,
                    repeat: 3
                  }}
                >
                  Congratulations to all winners!
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-2">抽獎結果 / Lucky Draw Results</h1>
              <p className="text-lg opacity-80">
                感謝大家參與 PSK 海洋保護計畫，一起守護鯨豚，保護海洋生態!
                <br/>
                <span className="text-blue-200">Thank you for participating in the PSK Ocean Protection Project. Let's protect cetaceans and marine ecosystems together!</span>
              </p>
            </div>
            
            {isAdmin && (
              <div className="bg-white/10 rounded-xl p-4 mb-6">
                <div className="flex flex-wrap gap-2 justify-center">
                  <button 
                    className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'winners' ? 'bg-secondary text-white' : 'bg-white/10 hover:bg-white/20'}`}
                    onClick={() => setActiveTab('winners')}
                  >
                    抽獎結果 / Results
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'verify' ? 'bg-secondary text-white' : 'bg-white/10 hover:bg-white/20'}`}
                    onClick={() => setActiveTab('verify')}
                  >
                    確認追蹤用戶 / Verify Users
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500/30 hover:bg-red-500/50 rounded-lg transition-colors"
                  >
                    登出 / Logout
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === 'winners' ? (
              <div className="bg-white/10 rounded-xl p-6 mb-8">
                <div className="flex flex-wrap items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">{isAdmin ? '抽獎管理 / Draw Management' : '幸運得獎者 / Lucky Winners'}</h2>
                  
                  {isAdmin ? (
                    <div className="flex items-center flex-wrap gap-4 mt-4 md:mt-0">
                      <div className="flex items-center gap-2">
                        <span className="text-secondary font-medium">固定抽出 {count} 名幸運得獎者</span>
                      </div>
                      
                      <button
                        onClick={() => {
                          if (Object.keys(followingUsers).filter(id => followingUsers[id]).length > 0) {
                            drawFromVerifiedUsers();
                          } else {
                            alert('請先確認有追蹤帳號的用戶！');
                            setActiveTab('verify');
                          }
                        }}
                        disabled={loading}
                        className="px-4 py-2 bg-secondary rounded-lg hover:bg-opacity-80 transition-colors disabled:opacity-50"
                      >
                        從已確認用戶中抽獎
                      </button>
                      
                      <button
                        onClick={clearWinners}
                        disabled={loading || winners.length === 0}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-opacity-80 transition-colors disabled:opacity-50"
                      >
                        清空抽獎結果
                      </button>
                      
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch(`${API_BASE_URL}/api/winners?count=${count}&_=${Date.now()}`, {
                              headers: { 'Accept': 'application/json' },
                              cache: 'no-cache'
                            });
                            const data = await response.json();
                            console.log('API 回應:', data);
                            alert('檢查控制台以查看 API 回應');
                          } catch (err) {
                            console.error('API 測試出錯:', err);
                            alert('API 測試出錯:' + err.message);
                          }
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-opacity-80 transition-colors"
                      >
                        測試 API
                      </button>
                    </div>
                  ) : (
                    !showLoginForm ? (
                      <button 
                        onClick={() => setShowLoginForm(true)}
                        className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors mt-4 md:mt-0"
                      >
                        管理員登入 / Admin Login
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 mt-4 md:mt-0">
                        <input 
                          type="password" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                          placeholder="請輸入管理員密碼 / Enter password"
                          className="px-3 py-1 bg-white/10 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
                        />
                        <button 
                          onClick={handleLogin}
                          className="px-3 py-1 bg-secondary rounded hover:bg-opacity-80 transition-colors"
                        >
                          登入 / Login
                        </button>
                        <button 
                          onClick={() => {
                            setShowLoginForm(false);
                            setPassword('');
                          }}
                          className="px-3 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors"
                        >
                          取消 / Cancel
                        </button>
                      </div>
                    )
                  )}
                </div>
                
                <div className="text-center text-sm text-white/70 mb-6">
                  {winners.length > 0 && (
                    <p>本次共抽出 {winners.length} 名幸運得獎者 / Total of {winners.length} lucky winners</p>
                  )}
                </div>
                
                {loading ? (
                  <div className="flex justify-center py-20">
                    <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : error ? (
                  <div className="bg-red-500/20 text-center p-4 rounded-lg">
                    {error}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {winners.map((winner, index) => {
                        const prize = index < prizeList.length ? prizeList[index] : null;
                        return (
                          <motion.div
                            key={winner.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white/10 p-4 rounded-lg"
                          >
                            <div className="flex justify-between items-start">
                              <div className="font-bold truncate">{winner.user}</div>
                              {prize && (
                                <div className="bg-secondary/80 text-xs px-2 py-1 rounded-full text-white">
                                  {prize.name}
                                </div>
                              )}
                            </div>
                            <div className="text-sm opacity-70 mt-2 line-clamp-2">{winner.text}</div>
                            {prize && (
                              <div className="mt-3 bg-white/10 p-2 rounded text-sm">
                                <div className="font-bold text-secondary">{prize.name}</div>
                                <div>{prize.detail}</div>
                                {prize.value > 0 && (
                                  <div className="text-xs mt-1 opacity-70">
                                    價值 / Value: NT$ {prize.value.toLocaleString()}
                                  </div>
                                )}
                              </div>
                            )}
                            {isAdmin && followingUsers[winner.id] && (
                              <div className="mt-2 text-xs bg-green-500/20 px-2 py-1 rounded inline-block">已確認追蹤 / Verified</div>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/10 rounded-xl p-6 mb-8">
                <div className="flex flex-wrap items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">確認追蹤用戶 / Verify Following Users</h2>
                  
                  <div className="flex items-center gap-2 mt-4 md:mt-0">
                    <label>篩選 / Filter:</label>
                    <select 
                      value={filterHashtag}
                      onChange={(e) => setFilterHashtag(e.target.value)}
                      className="bg-white/20 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-secondary"
                    >
                      <option value="all">所有Hashtags / All Hashtags</option>
                      <option value="P">#P - 普及海洋守護 / Ocean Awareness</option>
                      <option value="S">#S - 聲浪共鳴傳唱 / Voice Resonance</option>
                      <option value="K">#K - 刻不容緩行動 / Urgent Action</option>
                    </select>
                    
                    <button 
                      onClick={toggleSelectAll}
                      className="px-3 py-1 bg-secondary rounded hover:bg-opacity-80 transition-colors"
                    >
                      {selectAll ? '取消全選 / Deselect All' : '全選 / Select All'}
                    </button>
                    
                    <button 
                      onClick={logDebugInfo}
                      className="px-3 py-1 bg-blue-500/30 rounded hover:bg-blue-500/50 transition-colors"
                    >
                      偵錯資訊 / Debug
                    </button>
                  </div>
                </div>
                
                <div className="mb-4 p-4 bg-white/5 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">追蹤確認說明 / Verification Instructions</h3>
                  <p className="text-sm opacity-80">
                    請檢查每位用戶是否追蹤 <a href="https://www.instagram.com/psk_skincare_makeup/" target="_blank" rel="noopener noreferrer" className="text-secondary underline">@psk_skincare_makeup</a> 帳號。
                    點擊用戶名稱查看其 Instagram 個人頁面，確認是否有追蹤後勾選「已追蹤」核取方塊。
                    <strong className="block mt-2">僅有勾選「已追蹤」且留言中包含 Hashtag 的用戶才會參與抽獎。</strong>
                  </p>
                  <p className="text-sm opacity-80 text-blue-200 mt-2">
                    Please check if each user follows the <a href="https://www.instagram.com/psk_skincare_makeup/" target="_blank" rel="noopener noreferrer" className="text-secondary underline">@psk_skincare_makeup</a> account.
                    Click on the username to view their Instagram profile and check if they are following, then tick the "Following" checkbox.
                    <strong className="block mt-1">Only users with the "Following" box checked and who have included a Hashtag in their comment will be eligible for the lucky draw.</strong>
                  </p>
                </div>
                
                <div className="text-center text-sm text-white/70 mb-4">
                  符合條件的留言: {filteredComments.length} 則 
                  | 已確認追蹤帳號: {Object.values(followingUsers).filter(Boolean).length} 人
                  <br />
                  <span className="text-blue-200">
                    Qualified comments: {filteredComments.length} 
                    | Verified following: {Object.values(followingUsers).filter(Boolean).length} users
                  </span>
                </div>
                
                {loading ? (
                  <div className="flex justify-center py-20">
                    <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : error ? (
                  <div className="bg-red-500/20 text-center p-4 rounded-lg">
                    {error}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredComments.map((comment) => (
                      <div key={comment.id} className="bg-white/10 p-4 rounded-lg flex items-start justify-between">
                        <div className="flex-1">
                          <a 
                            href={`https://www.instagram.com/${comment.username}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-bold hover:text-secondary"
                          >
                            {comment.user}
                          </a>
                          <div className="text-sm opacity-70 mt-2">{comment.text}</div>
                        </div>
                        <div className="ml-4 flex items-center">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={!!followingUsers[comment.id]} 
                              onChange={() => toggleFollowing(comment.id)}
                              className="w-4 h-4 accent-secondary"
                            />
                            <span>已追蹤 / Following</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => setActiveTab('winners')}
                    className="px-4 py-2 bg-secondary rounded-lg hover:bg-opacity-80 transition-colors"
                  >
                    返回抽獎結果 / Back to Results
                  </button>
                </div>
              </div>
            )}
            
            <div className="bg-white/10 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4">活動規則 / Event Rules</h2>
              <div className="space-y-4 text-sm opacity-80">
                <p className="text-xl font-bold text-secondary">🐳 PSK x 台灣鯨豚協會：海洋守護計畫 / PSK x Taiwan Cetacean Society: Ocean Protection Project 🐳</p>
                <p>
                  PSK 邀請您一同加入海洋保護行動，透過社群互動直接為鯨豚保育盡一份心力！每個小小的行動，都能為海洋生態帶來重大改變。
                </p>
                <p className="text-blue-200">
                  PSK invites you to join the ocean protection initiative. Through social media interaction, you can directly contribute to cetacean conservation! Every small action can bring significant changes to marine ecosystems.
                </p>
                
                <div>
                  <p className="font-bold text-lg text-secondary mb-2">📝 參與方式 / How to Participate</p>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>追蹤 PSK 的官方 Instagram 帳號 <span className="text-secondary">@psk_skincare_makeup</span></li>
                    <li>按讚本篇貼文，<strong>PSK 即為您捐出新台幣 1 元</strong>給台灣鯨豚協會</li>
                    <li>在貼文下方留言，分享您的「愛海宣言」或「對鯨豚與 PSK 的想法」</li>
                    <li>在留言中加入以下任一標籤，即可參加對應獎項抽獎：
                      <ul className="list-disc pl-5 mt-1">
                        <li><span className="text-secondary font-bold">#P</span> - 普及海洋守護</li>
                        <li><span className="text-secondary font-bold">#S</span> - 聲浪共鳴傳唱</li>
                        <li><span className="text-secondary font-bold">#K</span> - 刻不容緩行動</li>
                      </ul>
                    </li>
                  </ol>
                  <div className="mt-3 text-blue-200">
                    <ol className="list-decimal pl-5 space-y-2">
                      <li>Follow PSK's official Instagram account <span className="text-secondary">@psk_skincare_makeup</span></li>
                      <li>Like this post, and <strong>PSK will donate NT$1</strong> to the Taiwan Cetacean Society on your behalf</li>
                      <li>Comment below the post, share your "ocean protection pledge" or "thoughts about cetaceans and PSK"</li>
                      <li>Add one of the following hashtags in your comment to participate in the lucky draw:
                        <ul className="list-disc pl-5 mt-1">
                          <li><span className="text-secondary font-bold">#P</span> - Ocean Awareness</li>
                          <li><span className="text-secondary font-bold">#S</span> - Voice Resonance</li>
                          <li><span className="text-secondary font-bold">#K</span> - Urgent Action</li>
                        </ul>
                      </li>
                    </ol>
                  </div>
                  <p className="mt-2 italic">範例留言 / Example comments:</p>
                  <ul className="pl-5 italic text-secondary">
                    <li>「#P普及海洋守護 每天都希望海洋能更乾淨，鯨豚能自在遨遊！」</li>
                    <li>「#S聲浪共鳴傳唱 謝謝PSK支持海洋保育，讓美麗與永續共存！」</li>
                    <li>「#K刻不容緩行動 承諾減少一次性塑膠使用，為鯨豚創造更好的家！」</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-bold text-lg text-secondary mb-2">📋 活動須知 / Event Information</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>活動期間：2024年1月16日 12:30 至 8月22日 23:59</li>
                    <li>開獎日期：2024年8月23日（公布於 PSK 官方 Instagram 限時動態）</li>
                    <li>不限留言次數，每個帳號最多可獲得一個獎項</li>
                    <li>得獎者需於公告後7日內回覆 PSK 官方訊息，以利後續獎項發放</li>
                    <li>主辦單位保留活動最終解釋權及變更獎項之權利</li>
                  </ul>
                  <div className="mt-3 text-blue-200">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Event period: Jan 16, 2024 12:30 to Aug 22, 2024 23:59</li>
                      <li>Draw date: Aug 23, 2024 (to be announced on PSK's official Instagram story)</li>
                      <li>No limit on number of comments, but each account can win at most one prize</li>
                      <li>Winners must reply to PSK's official message within 7 days of announcement for prize delivery</li>
                      <li>The organizer reserves the right of final interpretation and prize changes</li>
                    </ul>
                  </div>
                </div>
                
                <div>
                  <p className="font-bold text-lg text-secondary mb-2">🎁 獎項內容 / Prizes</p>
                  <div className="space-y-3">
                    <div>
                      <p className="font-bold">🥇 PSK海洋探索大獎（1名）/ PSK Ocean Explorer Grand Prize (1 winner):</p>
                      <p className="pl-4">• 墾丁旅宿灣臥 (Wandering Walls) 海景頂級房住宿券一晚</p>
                      <p className="pl-4 text-blue-200">• One night stay at Kenting Wandering Walls premium sea view room</p>
                      <p className="pl-4">• PSK海洋友善保養禮盒（價值NT$3,600）</p>
                      <p className="pl-4 text-blue-200">• PSK ocean-friendly skincare gift box (value NT$3,600)</p>
                      <p className="pl-4">• 台灣鯨豚協會紀念品組合</p>
                      <p className="pl-4 text-blue-200">• Taiwan Cetacean Society souvenir set</p>
                    </div>
                    
                    <div>
                      <p className="font-bold">🏖️ 海洋守護獎（3名）/ Ocean Guardian Prize (3 winners):</p>
                      <p className="pl-4">• 環保海龜飲料杯套</p>
                      <p className="pl-4 text-blue-200">• Eco-friendly sea turtle cup sleeve</p>
                      <p className="pl-4">• PSK海洋系列保養組（價值NT$2,200）</p>
                      <p className="pl-4 text-blue-200">• PSK ocean series skincare set (value NT$2,200)</p>
                      <p className="pl-4">• 台灣鯨豚協會明信片組</p>
                      <p className="pl-4 text-blue-200">• Taiwan Cetacean Society postcard set</p>
                    </div>
                    
                    <div>
                      <p className="font-bold">🐳 鯨豚之友獎（2名）/ Cetacean Friend Prize (2 winners):</p>
                      <p className="pl-4">• ONE+ 虎鯨/鯨魚鑰匙圈</p>
                      <p className="pl-4 text-blue-200">• ONE+ orca/whale keychain</p>
                      <p className="pl-4">• PSK海洋深層保濕精華（價值NT$1,580）</p>
                      <p className="pl-4 text-blue-200">• PSK deep ocean moisturizing essence (value NT$1,580)</p>
                      <p className="pl-4">• 台灣鯨豚生態介紹手冊</p>
                      <p className="pl-4 text-blue-200">• Taiwan cetacean ecology guidebook</p>
                    </div>
                    
                    <div>
                      <p className="font-bold">💆🏻‍♀️ PSK美肌獎（12名）/ PSK Beauty Prize (12 winners):</p>
                      <p className="pl-4">• PSK超值漂漂禮包（內含熱銷明星商品）</p>
                      <p className="pl-4 text-blue-200">• PSK value gift pack (containing bestselling products)</p>
                      <p className="pl-4">• 海洋保育電子資源包</p>
                      <p className="pl-4 text-blue-200">• Marine conservation digital resource pack</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <p className="font-bold text-lg text-secondary mb-2">🌊 關於PSK與海洋保育 / About PSK and Ocean Conservation</p>
                  <p>
                    PSK 是創立於台灣、深耕50年的保養品牌，致力於從肌膚問題的根源出發，找出最有效、最溫和的解決方式。多年來與海洋萃取技術聞名全球的法國BIOTECH MARINE公司合作，強調回歸健康肌底、降低負擔，將PSK打造成一個倡導肌膚健康與永續海洋美學的保養品牌。
                  </p>
                  <p className="text-blue-200">
                    PSK is a skincare brand founded in Taiwan with 50 years of history, dedicated to addressing skin issues from their root causes to find the most effective and gentle solutions. Having collaborated with the globally renowned French company BIOTECH MARINE for many years, PSK emphasizes restoring healthy skin foundation and reducing burden, establishing itself as a skincare brand that advocates for both skin health and sustainable ocean aesthetics.
                  </p>
                  <p className="mt-2">
                    本次與台灣鯨豚協會合作，PSK承諾將依據貼文的按讚數量進行捐款，共同為台灣周邊海域的鯨豚保育工作盡一份心力。您的每一個互動，都是對海洋生態的實質支持！
                  </p>
                  <p className="text-blue-200">
                    In this collaboration with the Taiwan Cetacean Society, PSK pledges to make donations based on the number of likes on the post, jointly contributing to cetacean conservation efforts in the waters around Taiwan. Your every interaction is substantial support for marine ecosystems!
                  </p>
                </div>
                
                <p className="text-center font-bold text-secondary">
                  一起成為海洋守護戰士，讓愛與保護延續！
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <a href="/" className="text-secondary hover:underline">
              返回捐款儀表板
            </a>
          </div>
        </div>
      </main>
    </>
  );
} 