import '../styles/globals.css';
import { LanguageProvider } from '../components/LanguageContext';
import { AudioProvider } from '../components/AudioContext';
import AudioControls from '../components/AudioControls';

function MyApp({ Component, pageProps }) {
  return (
    <LanguageProvider>
      <AudioProvider>
        <Component {...pageProps} />
        <AudioControls />
      </AudioProvider>
    </LanguageProvider>
  );
}

export default MyApp; 