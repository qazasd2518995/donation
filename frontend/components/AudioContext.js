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
    if (typeof window === 'undefined') return true; // Default to muted if no window
    const savedMuted = localStorage.getItem('audioMuted');
    return savedMuted !== null ? savedMuted === 'true' : true; // Default to muted
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

    const localAudioRef = audioRef.current; // Capture for use in cleanup and event handlers

    const handleCanPlayThrough = () => {
      setAudioLoaded(true);
      if (isPlaying && localAudioRef.paused) {
        localAudioRef.play().catch(error => {
          console.error('AudioContext: Play on canplaythrough failed', error);
          setIsPlaying(false); // Sync state if play fails
        });
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    localAudioRef.addEventListener('canplaythrough', handleCanPlayThrough);
    localAudioRef.addEventListener('play', handlePlay);
    localAudioRef.addEventListener('pause', handlePause);
    
    // If audio is already loaded enough to play, trigger a manual check
    if (localAudioRef.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
      handleCanPlayThrough();
    }

    return () => {
      localAudioRef.removeEventListener('canplaythrough', handleCanPlayThrough);
      localAudioRef.removeEventListener('play', handlePlay);
      localAudioRef.removeEventListener('pause', handlePause);
      // Note: Do not remove the audio element itself from the DOM here, as it's global
    };
  }, []); // Runs once on mount

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

  const playAudio = () => {
    if (audioRef.current && audioLoaded) {
      audioRef.current.play().catch(error => {
        console.error('AudioContext: playAudio command failed', error);
        setIsPlaying(false); // Fallback if promise rejects and no 'pause' event fires
      });
    } else if (audioRef.current && !audioLoaded) {
      // If not loaded, set isPlaying to true, hoping canplaythrough will pick it up
      // This might be too optimistic, but aligns with user intent to play
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
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
        // Expose playAudio and pauseAudio if direct control is needed elsewhere, though typically via togglePlay
        playAudio,
        pauseAudio,
        audioLoaded // expose audioLoaded if UI needs to react to it
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  return useContext(AudioContext);
} 