import Head from 'next/head';
import DonationDashboard from '../components/DonationDashboard';
import AudioPlayer from '../components/AudioPlayer';
import LanguageToggle from '../components/LanguageToggle';
import { useLanguage } from '../components/LanguageContext';
import { useTranslation } from '../components/Translation';

export default function Home() {
  const { language } = useLanguage();
  const { t } = useTranslation('home');
  
  return (
    <>
      <Head>
        <title>{t('title')}</title>
        <meta name="description" content={`${t('title')} - ${t('subtitle')}`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main>
        <LanguageToggle />
        <DonationDashboard />
        <AudioPlayer src="/music/theme_song_fa.wav" autoPlay={true} muted={true} />
      </main>
    </>
  );
} 