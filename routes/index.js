const express = require('express')
const User = require('../model').user
const Topic = require('../model').topic
const router = express.Router()
const path = require('path')
const md5 = require('blueimp-md5')
const moment = require('moment');
moment.locale('zh-cn');


// 访问首页---------------------------------
router.get('/', (req, res) => {

  // 判断传递过来的page 决定展示哪一页，如果是上一页，下一页则用session记录上次page值，下次递变
  if (req.query.page === undefined || req.query.page === 0) {
    req.query.page = 1
    req.session.page = 1
  } else if (req.query.page === 'next') {
    req.query.page = req.session.page + 1
    req.session.page++
  } else if (req.query.page === 'prev') {
    req.query.page = req.session.page - 1
    if (req.query.page === 0) {
      req.query.page = 1
      req.session.page = 1
    } else {
      req.session.page--
    }
  }

  Topic.find({
    page: req.query.page
  }, (err, data) => {
    if (err) {
      res.status(500).render('./404.html')
    }
    const created_time = []
    data = data.reverse()
    for (let i = 0; i < data.length; i++) {
      created_time.push(moment(data[i].created_time).format('YYYY-MM-DD HH:mm:ss'))
    }
    res.render('index.html', {
      user: req.session.user,
      topics: data,
      time: created_time
    })
  })

})
// 访问首页---------------------------------
// 访问登录界面------------------------------
router.get('/login', (req, res) => {

  res.render('login.html', {
    historyUser: req.session.historyUser
  })
})
// 访问登录界面------------------------------

// 开始登录---------------------------------
router.post('/login', (req, res) => {
  User.findOne({
    email: req.body.email,
    password: md5(md5(req.body.password))
  }, (err, user) => {
    if (req.body.checked && user) {
      req.session.historyUser = {
        email: user.email,
        checked: req.body.checked
      }

    } else if (!req.body.checked) {
      req.session.historyUser = null
    }

    if (err) res.status(500).json({
      err_code: 500,
      message: err.message
    })
    if (!user) {
      res.status(200).json({
        err_code: 0,
        message: 'email or password is invalid...'
      })
    } else {
      req.session.user = user

      res.status(200).json({
        err_code: 1,
        message: 'ok'
      })
    }
  })
})
// 开始登录---------------------------------
// 访问注册界面------------------------------
router.get('/register', (req, res) => {
  res.render('register.html')
})
// 访问注册界面------------------------------

// 开始注册---------------------------------
router.post('/register', (req, res) => {
  User.findOne({
    $or: [{
      email: req.body.email
    }, {
      nickname: req.body.nickname
    }]
  }, (err, user) => {
    if (err) {
      return res.status(500).json({
        err_code: 500,
        message: err.message
      })
    }
    if (user) {
      res.status(200).json({
        err_code: 0,
        message: 'Email or password is invalid.'
      })
    } else {
      req.body.password = md5(md5(req.body.password))

      new User(req.body).save((err, ret) => {
        // 利用session记录 登录数据
        req.session.user = ret
        // console.log(req.session.user);
        res.status(200).json({
          err_code: 1,
          message: 'ok'
        })
      })
    }
  })
})
// 开始注册---------------------------------

// 注销------------------------------------
router.get('/logout', (req, res) => {
  req.session.user = null
  req.session.historyUser = null
  req.session.topicID = null

  res.redirect('/')
})
// 注销------------------------------------

// 访问设置-------------------------------------
router.get('/settings/profile', (req, res) => {

  res.render('./settings/profile.html', {
    email: req.session.user.email,
    nickname: req.session.user.nickname,
    gender: req.session.user.gender,
    user: req.session.user,
    userPath: req.session.user.userPath,
    bio: req.session.user.bio,
    birthday: req.session.user.birthday
  })
})
// 访问设置-------------------------------------

// 提交更改头像-----------------------------------
router.post('/settings/profile/updateimg', (req, res) => {
  if (req.files === null) {
    return res.status(400).json({
      err_code: 0,
      msg: 'no file uploaded'
    })
  }
  // 否则 获取文件
  // file 由后文中 formData.append('file', file) 的第一个参数定义 可自定义为其他名称
  const file = req.files.file;
  // console.log(file);
  // 此时会传递两个图片过来，一个是canvas绘出的图，一个是上传的原图，因为客户端是通过hide去隐藏的因此这个也会传过来 
  if (file.name === 'blob') {
    // 移动文件到第一参数指定位置 若有错误 返回500
    const filename = req.session.user.email + '_user.jpg'
    file.mv(path.join(__dirname, `../public/uploads/${filename}`), err => {
      if (err) {
        return res.status(500).send('server is error...')
      }
      // 若无错误 返回一个 json 
      // 我们计划上传文件后 根据文件在服务器上的路径 显示上传后的文件
      // 在客户端中的 public 文件夹下创建 uploads 文件夹 用于保存上传的文件
      // console.log(req.body);
      User.findByIdAndUpdate(req.session.user._id, {
        userPath: `/public/uploads/${filename}`
      }, err => {
        if (err) {
          console.log('update error...');
        }
      })
      req.session.user.userPath = `/public/uploads/${filename}`
      res.status(200).json({
        err_code: 1,
        message: 'ok'
      })
    })
  } else {
    res.status(200).json({
      err_code: 2,
      message: 'ok'
    })
  }

})
//  基本信息设置-----------------------------------
router.post('/settings/profile', (req, res) => {
  req.body.gender = parseInt(req.body.gender)
  User.findByIdAndUpdate(req.session.user._id, req.body, err => {
    if (err) {
      res.status(500).json({
        err_code: 0,
        message: 'update is error...'
      })
    }

    User.findById(req.session.user._id, (err, user) => {
      req.session.user = user
      res.status(200).json({
        err_code: 1,
        message: 'ok'
      })
    })
  })

})

// 账户信息设置界面-------------------------------------
router.get('/settings/admin', (req, res) => {

  res.render('settings/admin.html', {
    user: req.session.user,
    admin: true
  })
})

// 账户信息密码更改界面------------------------------------
router.post('/settings/admin', (req, res) => {
  // 判断老密码是否输入正确
  req.body.now_password = md5(md5(req.body.now_password))
  req.body.new_password = md5(md5(req.body.new_password))
  req.body.notarize_password = md5(md5(req.body.notarize_password))

  if (req.body.now_password !== req.session.user.password) {
    res.json({
      err_code: 0,
      message: 'Old password is wrong...'
    })
  } else {
    if (req.body.new_password !== req.body.notarize_password) {
      res.json({
        err_code: 1,
        message: 'The passwords do not match...'
      })
    } else {
      User.findByIdAndUpdate(req.session.user._id, {
        password: req.body.new_password
      }, err => {
        if (err) {
          res.status(500).json({
            err_code: 500,
            message: 'Server is error...'
          })
        }
        req.session.user = null
        res.json({
          err_code: 2,
          message: 'ok'
        })
      })
    }
  }

})

router.get('/settings/delete', (req, res) => {
  User.findByIdAndDelete(req.session.user._id, err => {
    if (err) {
      res.status(500).json({
        err_code: 500,
        message: 'server is error...'
      })
    }
    req.session.user = null
    res.status(200).json({
      err_code: 1,
      message: 'ok'
    })
  })
})



// 发表博文
router.post('/topics/new', (req, res) => {
  if (!req.session.user) {
    res.status(200).json({
      err_code: 0,
      message: 'not login...'
    })
  }
  // 确定当前数据是第几条，每14条数据为一个page
  Topic.find((err, data) => {
    const page = Math.floor((data.length + 1) / 15) + 1

    new Topic({
      email: req.session.user.email,
      nickname: req.session.user.nickname,
      userPath: req.session.user.userPath,
      category: req.body.category,
      title: req.body.title,
      content: req.body.content,
      page
    }).save((err, data) => {
      if (err) {
        res.status(500).json({
          err_code: 500,
          message: 'server is error...'
        })
      }
      res.status(200).json({
        err_code: 1,
        message: 'ok'
      })
    })
  })

})

// 进入博文编辑页面------------------------------------------------------------
router.get('/topics/new', (req, res) => {
  res.render('./topics/new.html', {
    user: req.session.user
  })
})

// 进入博文具体页面
router.get('/topics/show', (req, res) => {
  const id = req.query.id.replace(/"/g, '')
  // 记录点进的博文
  req.session.topicID = id
  Topic.findById(id, (err, data) => {
    if (err) {
      res.status(500).send('server is error...')
    }

    res.render('./topics/show.html', {
      data,
      user: req.session.user
    })
  })
})

router.post('/topics/show/comment', (req, res) => {
  if (req.session.user === undefined || req.session.user === null) {
    res.status(200).json({
      err_code: 0,
      message: 'not login...'
    })
  } else {
    // console.log(req.body);
    // console.log(req.session.topicID);
    // 通过session中的的topicID 从数据库中找到对应的博客文章，然后将评论内容存入当中，然后将这个 评论的内容返回到客户端，进行客户端渲染
    // 首次请求博客文章的时候，查找响应评论内容，进行模板渲染，在 /topics/show 中进行。这里只做保存并返回保存的数据至客户端

    // 1.按照id查出该博文原有的 评论  将其保存到一个变量，然后将新添加的评论添加到这个数组的最前面
    // 2.通过id查找并更新这个博文的评论
    Topic.findById(req.session.topicID, (err, data) => {
      if (err) {
        res.status(500).json({
          err_code: 500,
          message: 'server is error...'
        })
      }
      const new_comments = data.comments
      new_comments.unshift({
        nickname: req.session.user.nickname,
        comment: req.body.comment
      })
      Topic.findByIdAndUpdate(req.session.topicID, {
        comments: new_comments
      }, err => {
        if (err) {
          res.status(500).json({
            err_code: 500,
            message: 'server is error...'
          })
        }
        res.status(200).json({
          err_code: 1,
          message: 'ok',
          data: {
            comment: req.body.comment,
            nickname: req.session.user.nickname
          }
        })
      })
    })
  }
})

module.exports = router