import mongoose from 'mongoose';

const likeRecordSchema = new mongoose.Schema({
  count: {
    type: Number,
    required: true
  },
  newLikes: {
    type: Number,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  postId: {
    type: String,
    required: true
  }
}, { timestamps: true });

// 按日期和貼文ID建立索引
likeRecordSchema.index({ date: 1, postId: 1 });

const LikeRecord = mongoose.model('LikeRecord', likeRecordSchema);

export default LikeRecord; 