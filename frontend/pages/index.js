import Head from 'next/head';
import DonationDashboard from '../components/DonationDashboard';
import AudioPlayer from '../components/AudioPlayer';

export default function Home() {
  return (
    <>
      <Head>
        <title>PSK x 台灣鯨豚協會 | 海洋守護計畫 - Ocean Protection Project</title>
        <meta name="description" content="每一個按讚都將轉為實質捐款，幫助台灣鯨豚協會推動海洋保育工作。參與抽獎還有機會贏得精美獎品！Each like will be converted into a real donation to help the Taiwan Cetacean Society promote marine conservation. Join the lucky draw for a chance to win amazing prizes!" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main>
        <DonationDashboard />
        <AudioPlayer src="/music/theme_song_fa.wav" autoPlay={true} />
      </main>
    </>
  );
} 