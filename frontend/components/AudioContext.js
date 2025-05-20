import { createContext, useContext, useState, useEffect, useRef } from 'react';

const AudioContext = createContext();

export function AudioProvider({ children }) {
  const audioSrc = useRef("/music/theme_song_fa.mp3");
  const audioRef = useRef(null);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  // isPlaying 初始固定為 false，避免 SSR 和客戶端 hydrate 時的不一致
  const [isPlaying, setIsPlaying] = useState(false);

  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window === 'undefined') return true;
    const savedMuted = localStorage.getItem('audioMuted');
    return savedMuted !== null ? savedMuted === 'true' : true; // 默認為靜音
  });

  const [volume, setVolume] = useState(() => {
    if (typeof window === 'undefined') return 50;
    const savedVolume = localStorage.getItem('audioVolume');
    return savedVolume !== null ? parseInt(savedVolume, 10) : 50;
  });

  // 檢測設備類型
  const [isIOS, setIsIOS] = useState(false);

  // 在客戶端檢測設備類型
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);
    
    // 如果是iOS設備，初始化靜音狀態
    if (isIOSDevice) {
      console.log('檢測到iOS設備，需要直接用戶交互才能播放音頻');
    }
  }, []);

  // 加強用戶交互檢測，特別針對移動設備
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const markUserInteracted = () => {
      console.log('檢測到用戶交互，嘗試啟用音頻播放');
      setUserInteracted(true);
      
      // 如果存儲的状態是播放且當前未播放，嘗試播放
      const shouldPlay = localStorage.getItem('audioPlaying') === 'true' || !isMuted;
      if (shouldPlay && !isPlaying && audioRef.current) {
        // 特別處理iOS設備
        if (isIOS) {
          // iOS設備需要在用戶交互事件處理函數中直接調用play()
          const unlockAudio = () => {
            audioRef.current.play().then(() => {
              // 成功開始播放後，可以暫停（如果用戶設置為靜音）
              if (isMuted) {
                audioRef.current.pause();
              } else {
                setIsPlaying(true);
              }
            }).catch(error => {
              console.error('iOS設備解鎖音頻失敗:', error);
            });
          };
          unlockAudio();
        } else {
          setIsPlaying(true);
        }
      }
    };
    
    // 增加更多可能的用戶交互事件
    const events = ['click', 'touchstart', 'touchend', 'pointerdown', 'keydown'];
    events.forEach(event => {
      window.addEventListener(event, markUserInteracted, { once: true });
    });
    
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, markUserInteracted);
      });
    };
  }, [isIOS, isMuted, isPlaying]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let audio = document.getElementById('global-audio-player');
    if (!audio) {
      audio = new Audio();
      audio.id = 'global-audio-player';
      audio.src = audioSrc.current;
      audio.preload = 'auto'; // 確保預加載
      
      if (isIOS) {
        // iOS優化: 設置為靜音，等用戶交互後再取消靜音
        audio.muted = true;
        audio.playsInline = true; // iOS需要
      }
      
      document.body.appendChild(audio);
    }
    audioRef.current = audio;
    audio.loop = true;
    audio.volume = volume / 100;
    audio.muted = isMuted;

    const localAudioRef = audioRef.current;

    const handleCanPlayThrough = () => {
      setAudioLoaded(true);
      // 當音訊載入後，如果 localStorage 曾記錄為播放狀態，則更新 isPlaying 狀態
      // 但不在此處直接播放，交由 useEffect([isPlaying, audioLoaded]) 處理
      const savedPlaying = localStorage.getItem('audioPlaying') === 'true';
      if (savedPlaying && !isPlaying && userInteracted) { 
        setIsPlaying(true);
      }
    };

    const handleAudioPlayEvent = () => setIsPlaying(true);
    const handleAudioPauseEvent = () => setIsPlaying(false);

    localAudioRef.addEventListener('canplaythrough', handleCanPlayThrough);
    localAudioRef.addEventListener('play', handleAudioPlayEvent);
    localAudioRef.addEventListener('pause', handleAudioPauseEvent);
    
    if (localAudioRef.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
      setAudioLoaded(true);
      const savedPlayingOnLoad = localStorage.getItem('audioPlaying') === 'true';
      if (savedPlayingOnLoad && !isPlaying && userInteracted && !isMuted) {
         setIsPlaying(true);
      }
    }

    return () => {
      localAudioRef.removeEventListener('canplaythrough', handleCanPlayThrough);
      localAudioRef.removeEventListener('play', handleAudioPlayEvent);
      localAudioRef.removeEventListener('pause', handleAudioPauseEvent);
    };
  }, [userInteracted, isIOS]); 

  // 主動控制播放和暫停的 useEffect
  useEffect(() => {
    if (audioRef.current && audioLoaded) {
      if (isPlaying) {
        // 只有在用戶交互後才嘗試播放
        if (userInteracted) {
          // 在iOS上，我們需要先解鎖音頻
          const playPromise = audioRef.current.play();
          
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.error('AudioContext: useEffect play failed', error);
              // 如果播放失敗，將 isPlaying 同步回 false
              setIsPlaying(false);
              
              // 特別處理iOS設備
              if (isIOS && error.name === 'NotAllowedError') {
                console.log('iOS需要用戶交互才能播放音頻，請點擊頁面任意位置');
                
                // 嘗試再次檢測和啟用音頻播放
                const unlockAudioAgain = () => {
                  audioRef.current.play().then(() => {
                    setIsPlaying(true);
                  }).catch(e => {
                    console.error('再次嘗試播放失敗:', e);
                  });
                  
                  document.removeEventListener('touchstart', unlockAudioAgain);
                  document.removeEventListener('click', unlockAudioAgain);
                };
                
                document.addEventListener('touchstart', unlockAudioAgain, { once: true });
                document.addEventListener('click', unlockAudioAgain, { once: true });
              }
            });
          }
        } else {
          // 用戶尚未交互，待用戶交互後會自動嘗試播放
          console.log('等待用戶交互後再播放音頻');
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, audioLoaded, userInteracted, isIOS]);

  // 保存 isPlaying 狀態到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('audioPlaying', isPlaying.toString());
    }
  }, [isPlaying]);

  // 更新和保存 isMuted 狀態
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('audioMuted', isMuted.toString());
    }
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // 更新和保存 volume 狀態
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('audioVolume', volume.toString());
    }
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const togglePlay = () => {
    // 使用者手動控制播放，標記已交互
    setUserInteracted(true);
    
    // 如果音訊未載入，點擊播放按鈕時，我們希望它載入完成後播放
    if (!audioLoaded && audioRef.current && !isPlaying) {
      audioRef.current.load(); // 確保開始載入
    }
    
    // 特別處理iOS設備
    if (isIOS && !isPlaying) {
      // 直接嘗試播放
      const unlockAndPlay = () => {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(e => {
          console.error('iOS播放失敗:', e);
        });
      };
      unlockAndPlay();
    } else {
      setIsPlaying(prevIsPlaying => !prevIsPlaying);
    }
  };

  const toggleMute = () => {
    // 使用者手動控制靜音，標記已交互
    setUserInteracted(true);
    
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    // 如果取消靜音並且音樂是應該播放的（來自 localStorage 或用戶之前的操作），則確保 isPlaying 為 true
    if (!newMutedState && (localStorage.getItem('audioPlaying') === 'true' || !isPlaying)) {
      // 特別處理iOS設備
      if (isIOS) {
        const unmute = () => {
          audioRef.current.muted = false;
          audioRef.current.play().then(() => {
            setIsPlaying(true);
          }).catch(e => {
            console.error('取消靜音並播放失敗:', e);
          });
        };
        unmute();
      } else {
        setIsPlaying(true);
      }
    }
  };

  const handleVolumeChange = (newVolume) => {
    // 使用者手動控制音量，標記已交互
    setUserInteracted(true);
    
    const volumeValue = parseInt(newVolume, 10);
    setVolume(volumeValue);
    if (volumeValue > 0 && isMuted) {
      setIsMuted(false);
      // 如果音量調大且存儲的狀態是播放，則確保 isPlaying 為 true
      if (localStorage.getItem('audioPlaying') === 'true' || !isPlaying) {
        if (isIOS) {
          const playAfterVolumeChange = () => {
            audioRef.current.play().then(() => {
              setIsPlaying(true);
            }).catch(e => {
              console.error('調整音量後播放失敗:', e);
            });
          };
          playAfterVolumeChange();
        } else {
          setIsPlaying(true);
        }
      }
    }
    if (volumeValue === 0 && !isMuted) {
      setIsMuted(true);
    }
  };
  
  return (
    <AudioContext.Provider 
      value={{
        isPlaying,
        volume,
        isMuted,
        togglePlay,
        toggleMute,
        handleVolumeChange,
        audioLoaded,
        userInteracted,
        isIOS
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  return useContext(AudioContext);
} 