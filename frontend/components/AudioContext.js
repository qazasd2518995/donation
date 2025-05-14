import { createContext, useContext, useState, useEffect, useRef } from 'react';

const AudioContext = createContext();

export function AudioProvider({ children }) {
  const audioSrc = useRef("/music/theme_song_fa.wav");
  const audioRef = useRef(null);
  const [audioLoaded, setAudioLoaded] = useState(false);

  const [isPlaying, setIsPlaying] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('audioPlaying') === 'true';
  });

  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window === 'undefined') return true;
    const savedMuted = localStorage.getItem('audioMuted');
    return savedMuted !== null ? savedMuted === 'true' : true;
  });

  const [volume, setVolume] = useState(() => {
    if (typeof window === 'undefined') return 50;
    const savedVolume = localStorage.getItem('audioVolume');
    return savedVolume !== null ? parseInt(savedVolume, 10) : 50;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let audio = document.getElementById('global-audio-player');
    if (!audio) {
      audio = new Audio();
      audio.id = 'global-audio-player';
      audio.src = audioSrc.current;
      document.body.appendChild(audio);
    }
    audioRef.current = audio;
    audio.loop = true;
    audio.volume = volume / 100;
    audio.muted = isMuted;

    const localAudioRef = audioRef.current;

    const handleCanPlayThrough = () => {
      setAudioLoaded(true);
      // No longer auto-playing here based on isPlaying state directly,
      // let the new useEffect handle it once audioLoaded and isPlaying are true.
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    // Handle ended event for loop, though HTML5 audio loop attribute should handle it.
    // const handleEnded = () => localAudioRef.play(); 

    localAudioRef.addEventListener('canplaythrough', handleCanPlayThrough);
    localAudioRef.addEventListener('play', handlePlay);
    localAudioRef.addEventListener('pause', handlePause);
    // localAudioRef.addEventListener('ended', handleEnded);
    
    if (localAudioRef.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
      setAudioLoaded(true); // If already loaded, set state
    }

    return () => {
      localAudioRef.removeEventListener('canplaythrough', handleCanPlayThrough);
      localAudioRef.removeEventListener('play', handlePlay);
      localAudioRef.removeEventListener('pause', handlePause);
      // localAudioRef.removeEventListener('ended', handleEnded);
    };
  }, []); // Initial setup

  // Effect to control play/pause based on isPlaying and audioLoaded state
  useEffect(() => {
    if (audioRef.current && audioLoaded) {
      if (isPlaying) {
        audioRef.current.play().catch(error => {
          console.error('AudioContext: useEffect play failed', error);
          setIsPlaying(false); // Sync if play fails
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, audioLoaded]); // Re-run when isPlaying or audioLoaded changes

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('audioPlaying', isPlaying.toString());
    }
  }, [isPlaying]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('audioMuted', isMuted.toString());
    }
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('audioVolume', volume.toString());
    }
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const playAudioInternal = () => {
    if (audioRef.current && audioLoaded) {
      audioRef.current.play().catch(error => {
        console.error('AudioContext: playAudioInternal command failed', error);
        setIsPlaying(false); 
      });
    }
  };

  const pauseAudioInternal = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const togglePlay = () => {
    setIsPlaying(prev => !prev); // This will trigger the useEffect for play/pause
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const handleVolumeChange = (newVolume) => {
    const volumeValue = parseInt(newVolume, 10);
    setVolume(volumeValue);
    if (volumeValue > 0 && isMuted) {
      setIsMuted(false);
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
        audioLoaded 
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  return useContext(AudioContext);
} 