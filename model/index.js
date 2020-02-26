const mongoose = require('mongoose')


mongoose.set('useFindAndModify', false)
// 0.连接数据库
mongoose.connect('mongodb://localhost/blog', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
// 1.创建表结构
const Schema = mongoose.Schema

// 2.设计表结构
const userSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  nickname: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  userPath: {
    type: String,
    default: '/public/img/avatar-default.png'
  },
  gender: {
    // 0代表神秘，1代表男，2代表女
    type: Number,
    enmu: [0, 1, 2],
    default: 0
  },
  created_time: {
    type: Date,
    default: Date.now
  },
  last_modified_time: {
    type: Date,
    default: Date.now
  },
  bio: {
    type: String,
    default: ''
  },
  birthday: {
    type: String,
    default: ''
  },
  status: {
    type: Number,
    // 0 没有权限限制
    // 1 不可以评论
    // 2 不可以登录
    enum: [0, 1, 2],
    default: 1
  }
})

const topicSchema = new Schema({
  page: {
    type: Number,
    default: 0
  },
  email: {
    type: String,
  },
  nickname: {
    type: String,

  },
  userPath: {
    type: String,
    default: '/public/img/avatar-default.png'
  },
  created_time: {
    type: Date,
    default: Date.now
  },
  last_modified_time: {
    type: Date,
    default: Date.now
  },
  category: {
    type: String
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  comments: {
    type: Array,
    default: []
  }
})

exports.user = mongoose.model('User', userSchema)
exports.topic = mongoose.model('Topic', topicSchema)