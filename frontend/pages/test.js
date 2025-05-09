import { useState, useEffect } from 'react';

export default function TestPage() {
  const [data, setData] = useState({ status: '載入中...' });
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // 測試健康檢查端點
        const response = await fetch('http://localhost:10000/health', {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          mode: 'cors',
          credentials: 'omit'
        });
        
        console.log('API回應狀態:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          setData(result);
          setError(null);
        } else {
          setError(`API請求失敗，狀態碼: ${response.status}`);
        }
      } catch (err) {
        console.error('API請求錯誤:', err);
        setError(`無法連接到API: ${err.message}`);
      }
    }
    
    fetchData();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>API連接測試頁面</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>健康檢查端點</h2>
        <p>URL: http://localhost:10000/health</p>
        <div>
          <strong>回應:</strong> {error ? (
            <span style={{ color: 'red' }}>{error}</span>
          ) : (
            <pre>{JSON.stringify(data, null, 2)}</pre>
          )}
        </div>
      </div>
      
      <div>
        <p>
          <strong>前端地址:</strong> {typeof window !== 'undefined' ? window.location.href : '未知'}
        </p>
        <p>
          <strong>後端地址:</strong> http://localhost:10000
        </p>
      </div>
    </div>
  );
} 