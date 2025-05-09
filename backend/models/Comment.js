import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  ts: {
    type: Number,
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// 為text字段添加索引以便於搜索hashtag
commentSchema.index({ text: 'text' });

const Comment = mongoose.model('Comment', commentSchema);

export default Comment; 