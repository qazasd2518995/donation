import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from './LanguageContext';
import { useTranslation } from './Translation';

// 通過環境變數獲取API基礎URL
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:10000';

export default function DonationDashboard() {
  const { language } = useLanguage();
  const { t } = useTranslation('home');
  const [likes, setLikes] = useState(0);
  const [prevLikes, setPrevLikes] = useState(0);
  const [commenters, setCommenters] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [totalDonation, setTotalDonation] = useState(0);
  const [prevTotalDonation, setPrevTotalDonation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statisticDate, setStatisticDate] = useState("");
  const [showNewLikeAnimation, setShowNewLikeAnimation] = useState(false);
  const [playSound, setPlaySound] = useState(false);
  const soundRef = useRef(null);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    const now = new Date();
    setStatisticDate(`${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`);
    loadDashboardData();
    const intervalId = setInterval(() => loadDashboardData(), 30000);
    return () => clearInterval(intervalId);
  }, []);
  
  useEffect(() => {
    if (!loading && prevLikes > 0 && likes > prevLikes) {
      setShowNewLikeAnimation(true);
      setPlaySound(true);
      const animationTimeout = setTimeout(() => {
        setShowNewLikeAnimation(false);
      }, 2000);
      return () => clearTimeout(animationTimeout);
    }
  }, [likes, prevLikes, loading]);
  
  useEffect(() => {
    if (playSound && soundRef.current) {
      try {
        soundRef.current.currentTime = 0;
        const playPromise = soundRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            console.log('播放音效被瀏覽器阻止或檔案問題:', e);
          });
        }
      } catch (e) {
        console.log('播放音效失敗:', e);
      }
      setPlaySound(false);
    }
  }, [playSound]);
  
  async function loadDashboardData(retryCount = 0) {
    try {
      setLoading(true);
      
      const [likesResponse, commentsApiResponse, dailyDonationsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/likes`, { cache: 'no-cache' }),
        fetch(`${API_BASE_URL}/api/comments`, { cache: 'no-cache' }),
        fetch(`${API_BASE_URL}/api/daily-donations`, { cache: 'no-cache' })
      ]);

      if (!likesResponse.ok) {
        throw new Error(`HTTP error! Likes status: ${likesResponse.status}`);
      }
      const likesData = await likesResponse.json();
      console.log('成功獲取按讚數據:', likesData);
      setPrevLikes(likes);
      setLikes(likesData.count);

      if (!commentsApiResponse.ok) {
        throw new Error(`HTTP error! Comments status: ${commentsApiResponse.status}`);
      }
      const commentsData = await commentsApiResponse.json();
      console.log('成功獲取留言數據:', commentsData);
      if (commentsData.data && Array.isArray(commentsData.data)) {
        const uniqueCommenters = [];
        const seenUserIds = new Set();
        commentsData.data.forEach(comment => {
          if (comment.from && comment.from.id && comment.username) {
            if (!seenUserIds.has(comment.from.id)) {
              uniqueCommenters.push({
                id: comment.from.id,      
                username: comment.username 
              });
              seenUserIds.add(comment.from.id);
            }
          }
        });
        setCommenters(uniqueCommenters);
      } else {
        console.warn('留言數據格式不正確或為空，應為 { data: [...] }');
        setCommenters([]);
      }
      
      if (!dailyDonationsResponse.ok) {
        throw new Error(`HTTP error! Daily Donations status: ${dailyDonationsResponse.status}`);
      }
      const dailyDataResult = await dailyDonationsResponse.json();
      console.log('成功獲取每日捐款數據:', dailyDataResult);
      if (dailyDataResult.data && dailyDataResult.data.length > 0) {
        setDailyData(dailyDataResult.data);
        setPrevTotalDonation(totalDonation);
        setTotalDonation(dailyDataResult.data[dailyDataResult.data.length - 1].amount);
      } else {
        console.warn('每日捐款數據格式不正確或為空');
      }
      
      setError(null);
      
    } catch (error) {
      console.error('API請求失敗:', error);
      if (retryCount < 3) {
        console.log(`重試中... (${retryCount + 1}/3)`);
        setTimeout(() => loadDashboardData(retryCount + 1), 2000 * (retryCount + 1));
      } else {
        setError(`${t('errorLoading')}: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }
  
  const generateBubbles = (count) => {
    const bubbles = [];
    const maxBubbles = Math.min(count, 100);
    for (let i = 0; i < maxBubbles; i++) {
      const size = Math.random() * 16 + 8;
      const x = Math.random() * 90 + 5;
      const y = Math.random() * 70 + 10;
      const delay = Math.random() * 10;
      const duration = Math.random() * 15 + 10;
      bubbles.push(
        <motion.div
          key={`bubble-${i}`}
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

  const generateFishes = (commenterList) => {
    const fishes = [];
    const fishShapes = [
      "M0,0 C3,2 5,2 8,0 C5,-2 3,-2 0,0 Z",
      "M0,0 C2,3 6,3 8,0 C6,-3 2,-3 0,0 M8,0 L10,3 M8,0 L10,-3",
      "M0,0 Q4,4 8,0 Q4,-4 0,0 M8,0 L11,2 L10,0 L11,-2 Z",
      "M0,0 Q2,2 5,2 Q8,2 8,0 Q8,-2 5,-2 Q2,-2 0,0 M8,0 L10,1 L11,0 L10,-1 Z",
      "M0,0 Q3,3 6,3 T10,0 Q7,-3 0,0 M10,0 L12,2 M10,0 L12,-2",
    ];
    const fishColors = [
      "#FFB6C1", "#ADD8E6", "#90EE90", "#FFA07A", "#FFFACD",
      "#E6E6FA", "#F0E68C", "#87CEFA", "#DDA0DD", "#B0E0E6",
    ];
    
    const maxFishes = Math.min(commenterList.length, 100);
    
    for (let i = 0; i < maxFishes; i++) {
      const commenter = commenterList[i];
      const size = Math.random() * 25 + 20; 
      const x = Math.random() * 80 + 5; 
      const y = Math.random() * 60 + 10; 
      const delay = Math.random() * 10;
      const duration = Math.random() * 25 + 20; 
      const direction = Math.random() > 0.5 ? 1 : -1;
      const shapeIndex = Math.floor(Math.random() * fishShapes.length);
      const colorIndex = Math.floor(Math.random() * fishColors.length);
      const eyeColor = "#000";
      
      fishes.push(
        <motion.div
          key={`fish-${commenter.id || i}`}
          className="absolute group cursor-default"
          style={{
            width: `${size * 1.5}px`,
            height: `${size}px`,
            left: `${x}%`,
            top: `${y}%`,
            zIndex: 20, 
          }}
          animate={{
            x: [0, direction * (Math.random() * 30 + 20), 0],
            y: [0, (Math.random() * -20 - 5), (Math.random() * 10 + 5), (Math.random() * -10 - 5), 0],
          }}
          transition={{
            duration: duration,
            delay: delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <svg 
            width={size} 
            height={size / 1.8} 
            viewBox="0 0 12 6" 
            preserveAspectRatio="xMidYMid meet"
            style={{ transform: `scaleX(${direction})`, position: 'relative', zIndex: 1 }}
          >
            <path
              d={fishShapes[shapeIndex]}
              fill={fishColors[colorIndex]}
              stroke="#ffffff"
              strokeWidth="0.15"
            />
            <circle cx={direction > 0 ? 2.5 : 7.5} cy="0" r="0.7" fill={eyeColor} />
            <circle cx={direction > 0 ? 2.5 : 7.5} cy="0" r="0.25" fill="#ffffff" />
          </svg>
          <div 
            className="absolute text-center w-full mt-0.5" 
            style={{
              fontSize: `${Math.max(8, size / 4)}px`,
              color: 'white',
              textShadow: '0px 0px 2px rgba(0,0,0,0.7)',
              transform: `translateY(${size / 2 + 2}px) scaleX(${direction})`,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: `${size * 1.5}px`,
              zIndex: 2, 
            }}
          >
            @{commenter.username}
          </div>
        </motion.div>
      );
    }
    
    return fishes;
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-primary text-white relative overflow-hidden">
      {/* 背景裝飾 */}
      <div className="absolute inset-0 wave-background opacity-10 z-0"></div>
      
      {/* 隱藏的音效元素 */}
      <audio ref={soundRef} src="/music/like_sound.mp3" preload="auto" />
      
      {/* 新按讚動畫 */}
      <AnimatePresence>
        {showNewLikeAnimation && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="flex flex-col items-center"
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, y: -50, opacity: 0 }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              <motion.div 
                className="text-8xl mb-4"
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.6, repeat: 1 }}
              >
                ❤️
              </motion.div>
              <motion.div 
                className="bg-secondary/80 backdrop-blur-md px-6 py-3 rounded-full text-white text-xl font-bold"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.5, repeat: 1 }}
              >
                {t('newLikeMessage')}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
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
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-wider mb-2 text-center break-normal hyphens-auto px-2 whitespace-pre-line">
          {t('title')}
        </h1>
        <h2 className="text-xl md:text-2xl font-medium tracking-wide mb-6 text-center text-blue-200 break-normal px-2">
          {t('subtitle')}
        </h2>
        
        <div className="text-center mb-8">
          <p className="mb-2 text-lg">{t('donationFormula')} {t('donationTarget')}</p>
          <p className="mb-8 text-xl font-semibold">
            {language === 'zh' ? '台灣鯨豚協會' : 'Taiwan Cetacean Society'}
          </p>
        </div>
        
        <div className="w-full max-w-xl mx-auto">
          {/* 總金額顯示 */}
          <div className="bg-white/10 p-6 rounded-lg shadow-lg mb-8">
            <div className="flex flex-col items-center">
              <h2 className="text-lg opacity-80 mb-2">{t('totalDonations')}</h2>
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
              {totalDonation > prevTotalDonation && prevTotalDonation > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-green-300 mt-1 font-medium"
                >
                  +NT$ {(totalDonation - prevTotalDonation).toLocaleString()} <span className="animate-pulse">⬆️</span>
                </motion.div>
              )}
              <p className="mt-2 text-sm opacity-70">{t('statisticsTime')}: {statisticDate}</p>
            </div>
          </div>
          
          {/* 互動式鯨魚計數器 - 取代原有的折線圖 */}
          <div className="bg-white/10 p-4 rounded-lg shadow-lg mb-8">
            <h2 className="text-xl font-semibold mb-4 text-center">{t('oceanCounter')}</h2>
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
                
                {/* 小魚群 - 使用 isClient 條件渲染 */}
                {isClient && !loading && commenters.length > 0 && generateFishes(commenters)}
                
                {/* 氣泡群 - 使用 isClient 條件渲染 */}
                {isClient && generateBubbles(likes < 10 ? likes * 2 : Math.min(commenters.length * 2, 30))}
                
                {/* 讚數/留言者數顯示 */}
                <div className="absolute bottom-2 right-2 bg-white/20 px-3 py-1 rounded-full text-sm">
                  {commenters.length > 0 ? 
                    <span>{t('contributorsMessage', { count: commenters.length })}</span> : 
                    <span>{t('moreFishMessage')}</span>
                  }
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
            <h2 className="text-2xl font-bold mb-4">{t('aboutSection')}</h2>
            <div className="space-y-4">
              <div>
                <p className="mb-1">
                  {t('aboutContent')}
                </p>
              </div>
              
              <div>
                <p className="mb-1">
                  {t('donationInfo')}
                </p>
              </div>
              
              <div>
                <p className="mb-1">
                  {t('drawInfo')}
                </p>
              </div>
            </div>
          </div>
          
          {/* 底部資訊 */}
          <div className="mt-8 text-center text-sm text-white/70">
            <div className="mb-4">
              <Link href="/winners" className="text-white hover:text-secondary transition-colors text-base font-semibold bg-white/20 px-4 py-2 rounded-full">
                {t('viewRules')}
              </Link>
            </div>
            <p>{t('copyright')}</p>
            <p>{t('updateFrequency')}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 