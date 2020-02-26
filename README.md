### blog项目整体思路

#### 大纲：

* 前后端混合渲染，使用  art-template 模板引擎进行开发
* 用MongoDB 数据库进行数据存储
  * 使用mongoose 包快速操作MongoDB数据库
* 使用 node 进行后台搭建
* 使用 express框架进行快速开发
* 使用session 记录登录等 状态



#### 步骤一：

* 创建目录结构   
  * model 【存放数据库操作，连接数据库，设计表结构等】
  * public 【存放静态资源，包括css,js,img】
  * router 【存放路由资源】
  * views   【存放页面资源，模板等】
  * app.js  【入口文件】
* 初始化项目
  * npm init -y 初始化安装包结构
  * git init    初始化git 仓库

#### 步骤二：

* 搭建好服务器   利用 express

  * ```js
    const app = express()
    app.listen(3000, () => {
      console.log('3000 is running...');
    })
    ```

* 开放静态资源

  * ```js
    app.use('/node_modules/', express.static('./node_modules'))
    app.use('/public/', express.static('./public'))
    ```

* 导入art-template

  * ```js
    npm i art-template express-art-template --save
    // 导入
    app.engine('html', require('express-art-template'));
    ```

* 路由操作

* 账号密码安全，使用md5对密码进行加密

  * ```js
    const md5 = require('blueimp-md5')
    ```

* 保存登录状态，使用session模块

  * ```js
    const session = require('express-session')
    app.set('trust proxy', 1) // trust first proxy
    app.use(session({
      secret: 'cat',
      resave: false,
      saveUninitialized: false
      // ,cookie: {
      //   secure: true
      // }
    }))
    ```

#### 遇到的一些难点：

**个人头像上传，展示，保存到后台。**

* 首先我们需要使用到  fileUpload 中间件

  * ```js
    // 配置-----------
    const fileUpload = require('express-fileupload')
    // 使用 express-fileupload 中间件
    app.use(fileUpload());
    ```

  * ```js
    // 使用-------------------
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
    ```

* 客服端需要使用到封装的函数

  * ```js
    // 压缩图片----------------------------------------------------------------------------------
      function submitPic() {
        var fileObj = document.getElementById('upload').files[0];
        var form = new FormData();
        form.delete('file')
        //上传图片大于1M进行压缩
        // if (fileObj.size / 1024 > 1025) {
        photoCompress(fileObj, {
          quality: 0.2
        }, function (base64Codes) {
          var bl = convertBase64UrlToBlob(base64Codes);
          form.append("file", bl); // 文件对象
    
          //上传
          $('#updataPic').off()
          $('#updataPic').on('click', (ev) => {
            ev = ev || event
            ev.preventDefault()
            $.ajax({
              url: '/settings/profile/updateimg',
              type: 'post',
              data: form, // 上传formdata封装的数据
              dataType: 'json',
              cache: false, // 不缓存
              processData: false, // jQuery不要去处理发送的数据
              contentType: false, // jQuery不要去设置Content-Type请求头
              success: function (data) { //成功回调
                if (data.err_code === 1) {
                  alert('头像上传成功...')
                } else if (ata.err_code === 0) {
                  alert('上传失败')
                } else if (data.err_code === 2) {}
              }
            })
          })
        })
        // } else {
        //   form.append("file", fileObj);
        //   //上传
        //   $.ajax({})
        // }
      }
      /**
       * @param file: 上传的图片
       * @param objCompressed：压缩后的图片规格
       * @param objDiv：容器或回调函数
       */
      function photoCompress(file, objCompressed, objDiv) {
        var ready = new FileReader();
        ready.readAsDataURL(file);
        ready.onload = function () {
          var fileResult = this.result;
          canvasDataURL(fileResult, objCompressed, objDiv)
        }
      }
    
      function canvasDataURL(path, objCompressed, callback) {
        var img = new Image();
        img.src = path;
        img.onload = function () {
          var that = this;
          //默认压缩后图片规格
          var quality = 0.5;
          // var w = that.width;
          var w = 150;
          // var h = that.height;
          var h = 150;
          var scale = w / h;
    
          //实际要求
          w = objCompressed.width || w;
          h = objCompressed.height || (w / scale);
          if (objCompressed.quality && objCompressed.quality > 0 && objCompressed.quality <= 1) {
            quality = objCompressed.quality;
          }
          //生成canvas
    
          var canvas = document.createElement('canvas');
    
          $('canvas').remove()
          $('#preview').after(canvas)
          $('#preview').hide()
          // document.querySelector('#canvas').appendChild(canvas)
          var ctx = canvas.getContext('2d');
          // 创建属性节点
          var anw = document.createAttribute("width");
          anw.nodeValue = w;
          var anh = document.createAttribute("height");
          anh.nodeValue = h;
          canvas.setAttributeNode(anw);
          canvas.setAttributeNode(anh);
          ctx.drawImage(that, 0, 0, w, h);
    
          var base64 = canvas.toDataURL('image/jpeg', quality);
          // 回调函数返回base64的值
          callback(base64);
        }
      }
    
      function convertBase64UrlToBlob(urlData) {
        var arr = urlData.split(','),
          mime = arr[0].match(/:(.*?);/)[1],
          bstr = atob(arr[1]),
          n = bstr.length,
          u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], {
          type: mime
        });
      }
    ```

  * 此处我将原本图片 标签隐藏，将压缩的canvas 图片便签添加到页面中显示

  * 给上传按钮添加了点击事件，由于防止多次监听，每次监听的时候，解绑上次事件监听

  

**MongoDB中保存的数据，create_time 是Date 对象   Date.now()，渲染到页面时候改为正常显示**.

* 通过  moment  中间件进行处理

  * ```js
    const moment = require('moment');
    moment.locale('zh-cn');
    
    moment(created_time).format('YYYY-MM-DD HH:mm:ss') //得到的是转换过的时间字符
    ```

    

