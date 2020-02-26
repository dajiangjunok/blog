const express = require('express')
const router = require('./routes')
const bodyParser = require('body-parser')
const session = require('express-session')
const fileUpload = require('express-fileupload')

const app = express()

// 使用 express-fileupload 中间件
app.use(fileUpload());

app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'cat',
  resave: false,
  saveUninitialized: false
  // ,cookie: {
  //   secure: true
  // }
}))

app.use('/node_modules/', express.static('./node_modules'))
app.use('/public/', express.static('./public'))

app.engine('html', require('express-art-template'));

// 配置解析表单 POST 请求体插件（注意：一定要在 app.use(router) 之前 ）
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
  extended: false
}))
// parse application/json
app.use(bodyParser.json())

app.use(router)

app.listen(3000, () => {
  console.log('3000 is running...');
})