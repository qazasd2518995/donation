import Head from 'next/head';
import DonationDashboard from '../components/DonationDashboard';

export default function Home() {
  return (
    <>
      <Head>
        <title>捐款儀表板 | Taiwan Cetacean Society</title>
        <meta name="description" content="每一個按讚都將轉為實質捐款，幫助中華鯨豚協會推動海洋保育工作。" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main>
        <DonationDashboard />
      </main>
    </>
  );
} 