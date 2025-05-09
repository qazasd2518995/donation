import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // 使用環境變數中的MongoDB連接字符串
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.error('錯誤: 未設置 MONGODB_URI 環境變數');
      process.exit(1);
    }
    
    // 設置連接選項
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    
    // 連接到MongoDB
    await mongoose.connect(mongoURI, options);
    
    console.log('MongoDB 連接成功！');
    
    // 監聽連接錯誤
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB 連接錯誤:', err);
    });
    
    // 監聽連接斷開
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB 連接已斷開，嘗試重新連接...');
      setTimeout(connectDB, 5000); // 5秒後重試
    });
    
  } catch (err) {
    console.error('MongoDB 連接失敗:', err.message);
    // 非生產環境下顯示詳細錯誤
    if (process.env.NODE_ENV !== 'production') {
      console.error(err);
    }
    // 如果無法連接數據庫，則終止應用程序
    process.exit(1);
  }
};

export default connectDB; 