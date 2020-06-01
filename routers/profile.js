const express = require("express");

const handleDB = require("../db/handleDB");

const md5 = require("md5");

const keys = require("../keys");

// 引入工具函数，需要用到里面其中的一个获取用户的状态函数
const common = require("../utils/common/common");

// 时间过滤器
require("../utils/filters/filters");



// 上传本地服务器
// 引入 multer 就是为了 上传 图片 到本地服务器
const multer = require('multer');
// 上传 图片 到本地服务器 保存的路径 会自动生成文件夹 upload/avatar
const upload = multer({ dest: 'public/news/upload/avatar' })  // 上传头像存放的地址	（直接从项目根目录开始找）
//（这个前端代码也要做好准备，需要用上 FileReader() 来上传图片到后端来，具体代码看前端）



// 上传到第三方服务器（七牛）
// 引入 qiniu 封装好的配置文件 就是为了 上传 图片 到第三方服务器（七牛）
const upload_file = require("../utils/common/qn");

// 引入一个常量的文件
const constant = require("../utils/common/constant");

// 引入base64
const Base64 = require("js-base64").Base64;
// 遇到一些上传问题的都可以通过base64来编码解码来解决



const router = express.Router();



// <----------------------------用户基本资料父页面--------------------------------------------------

router.get("/profile", (req, res) => {

  (async function () {

    let result = await common.getUser(req, res);

    // 这是个人信息页面 -- 如果没有登录的 就直接重定向到 首页
    if (!result[0]) {
      // 没有登录，重定向到首页
      res.redirect('/')
      return
    }


    let data = {
      // 用户信息
      user_info: { // 这里一定是用户登录的了，用户不登陆就直接重定向了
        nick_name: result[0].nick_name,
        // avatar_url这样写是为了防止用户没有上传自定义图片时，可以默认使用系统自带的图片'/news/images/user_pic.png'
        avatar_url: result[0].avatar_url ? constant.QINIU_AVATAR_URL_PRE + result[0].avatar_url : '/news/images/user_pic.png'
      },
    }

    res.render("news/user", data) // 渲染到模板上
  })();

})

// ------------------------------------------------------------------------------------------------------>



// <------------------------------------基本资料详细子页面-------------------------------------------------

router.all("/user/base_info", (req, res) => {

  // 展示基本信息页面get请求，以及处理基本信息的post提交

  (async function () {

    let result = await common.getUser(req, res);

    // 这是个人信息页面 -- 如果没有登录的 就直接重定向到 首页
    if (!result[0]) {
      // 没有登录，重定向到首页
      res.redirect('/')
      return
    }
    // get和post都可公用的登录用户判断


    // 请求get
    if (req.method === "GET") {

      let data = {
        // 基本信息
        nick_name: result[0].nick_name ? result[0].nick_name : '昵称',
        signature: result[0].signature ? result[0].signature : '什么都没留下',
        gender: result[0].gender ? result[0].gender : 'MAN' // 根据当时设计数据库表的时候 默认 MAN
      }


      res.render("news/user_base_info", data)
      return
    }



    // 请求post
    if (req.method === "POST") {

      // 1. 登录用户 -- 最开始就写了，不登录直接重定向

      // 2. 参数
      let { signature, nick_name, gender } = req.body;

      if (signature.length == 0) {
        signature = '什么都没留下'
      }
      if (nick_name.length == 0) {
        nick_name = '昵称'
      }

      // 3. 查询数据库 用户是否存在
      let result2 = await handleDB(res, "info_user", "find", "数据库查询错误", `id = ${result[0].id}`)

      if (!result2[0]) {
        res.send({ errmsg: '错误参数1' })
        return
      }

      // 4. 操作数据库 update
      await handleDB(res, "info_user", "update", "数据库更新错误", `id = ${result[0].id}`, { nick_name, signature, gender })

      // 这个数据库也要更新 source 作者名称
      await handleDB(res, "info_news", "update", "数据库更新错误", `user_id = ${result[0].id}`, { source: nick_name })

      // 5. 返回成功
      res.send({ errno: '0', errmsg: '操作成功' })
      return
    }


  })();

})

// ------------------------------------------------------------------------------------------------------------>



// <------------------------------------头像设置详细子页面-------------------------------------------------

// 放在一起写不好，要分开写（因为post要写上upload.single('avatar')）

// 展示修改头像页面
router.get("/user/pic_info", (req, res) => {

  (async function () {

    let result = await common.getUser(req, res);

    // 这是个人信息页面 -- 如果没有登录的 就直接重定向到 首页
    if (!result[0]) {
      // 没有登录，重定向到首页
      res.redirect('/')
      return
    }
    // get和post都可公用的登录用户判断

    // console.log(constant.QINIU_AVATAR_URL_PRE + result[0].avatar_url);


    let data = {
      // 头像信息
      avatar_url: result[0].avatar_url ? constant.QINIU_AVATAR_URL_PRE + result[0].avatar_url : '/news/images/user_pic.png'
    }

    res.render("news/user_pic_info", data)

  })();

})

// 提交头像接口（执行这个接口，先执行调用upload.single('avatar')，再执行(req, res) => {}）
router.post("/user/pic_info", upload.single('avatar'), (req, res) => { // avatar 为 file表单 的 name 属性  --  name 对应的就是html代码的 name  <input type="file" name="avatar" class="input_file"  id="upload_file" onchange="changepic(this)">

  (async function () {

    let result = await common.getUser(req, res);

    // 这是个人信息页面 -- 如果没有登录的 就直接重定向到 首页
    if (!result[0]) {
      // 没有登录，重定向到首页
      res.redirect('/')
      return
    }
    // get和post都可公用的登录用户判断


    /*
      七牛业务流程：

      1、接收上传图片的对象req.file
      2、上传图片到七牛云服务器
      3、把七牛云返回的对象的key属性保存到数据库
      4、返回上传成功

    */

    // 功能：上传图片到本地服务器，使用前，第一步，要先yarn add multer
    // 第二步要在router.post里面写上 upload.single('avatar')    upload.single接收图片的方法    avatar保存的地方文件夹    （在ajax提交请求，就能接收到了）

    // console.log("请求了/user/pic_info");

    // 第三步，获得接收到的结果 req.file 存到本地服务器 是一个 二进制 的文件
    var file = req.file; // 提交之后通过req.file获取本次提交的信息对象

    // console.log(file);  // 获取本次上传本地服务器图片的一些信息
    /**
     * { fieldname: 'avatar',  // 现存放的文件夹（上传到本地服务器）
         originalname: '01.jpg',  // 原文件名称
         encoding: '7bit', // 编码方式
         mimetype: 'image/jpeg', // 图片类型 -- 上传的图片格式跟第三方服务器（七牛）的支持有关
         destination: 'public/news/upload/avatar', // 现存放的文件地址（上传到本地服务器）
         filename: 'f63dbb3f49b1fa58d68254e834560422',  // 现文件名称（上传到本地服务器）
         path:
         'public\\news\\upload\\avatar\\f63dbb3f49b1fa58d68254e834560422', // 现存放该文件的文件路径（上传到本地服务器）
         size: 101444  // 文件大小
        }
     */



    // 这是上传到第三方服务器（七牛）的方法（使用前：记得先yarn add qiniu 再使用，而qiniu还要写一些配置文件 qn.js ，也要引入进来先）
    // upload_file 在 qn.js 抛出是一个 promise对象 ，因为要用到这个值，所以就要写 await 来接收， 那么也要写 async 来包住写
    // upload_file( 上传后（在七牛管理平台的）的名字, 上传后的图片路径/二进制图片的名字 )   // 上传的图片相对路径, 从项目文件夹出发
    // let retObj = await upload_file('02.gif', './02.gif') // 例子写法
    // console.log(retObj);  // 获取本次上传第三方服务器（七牛）图片的一些信息
    /*
      { 
        hash: 'FoFxbAYRxF8N_EL6nf40nva4_AQm',
        key: 'image/avatar/02.png'  // （上传之后（在七牛管理平台的）的名称）需要保存到本地数据库
      }
    */

    try {
      // 上传图片到第三方服务器（七牛）
      var retObj = await upload_file(file.originalname, `${file.destination}/${file.filename}`)
      // retObj 是返回的 信息
      console.log(retObj) // 作用：检测是否上传成功
    } catch (error) {
      console.log(error);
      res.send({ errmsg: '上传七牛第三方服务器失败' })
      return
    }

    // 更新数据到数据库
    // 七牛云返回的对象的key属性保存到本地数据库
    await handleDB(res, "info_user", "update", "数据库修改数据失败", `id = ${result[0].id}`, {
      avatar_url: file.originalname
    })
    // QINIU_AVATAR_URL_PRE  -->   前缀： http://qb30ruxlm.bkt.clouddn.com/image/avatar/


    // 返回上传成功
    let data = {
      avatar_url: constant.QINIU_AVATAR_URL_PRE + file.originalname
    }

    res.send({ errno: "0", errmsg: "上传成功", data })


    // 上传到七牛第三方服务器后，本地服务器的图片已经可以删的了，也可以做保存备份，那就要用到 fs 模块了

  })();



})

// ------------------------------------------------------------------------------------------------------------>


// <------------------------------------------我的关注子页面----------------------------------------------------

router.all("/news/followed_user", (req, res) => {

  (async function () {

    /**
     * 思路：
     * （这里是多人遍历，不是单人获取）
     * 1. 先获取到登录用户，判断，不存在就重定向
     * 2. 在get请求里面，要展示数据，由于mysql设计表的特殊性（几个表都要连起来）
     * 2.1 先整理好分页数据，page 和 totalPage 和 numberPages（需要通过 登录用户的id 去查询info_user_fans 找出被关注者的数量 / 一页展示6条）
     * 2.2 根据limit分页（一页展示6条）的要求去查询 对应的 被关注者id（用户id） 的数组
     * 2.3 声明一个 被关注者 的数组 方便接收 遍历出来的数据
     * 2.4 通过遍历 for of 循环 将对应的 被关注者id（用户id） 的数组 去查询info_user 所有被关者的所有信息，且每一条数据都push到 被关注者 的数组 里面
     * 2.5 此时这个 被关注者 的数组 已经可以抛出到前端使用了
     * 3. 由于还有其他的表数据也需要遍历出来，所以想到一个方法，就是把所有的遍历属性都push到 被关注者 的数组 里面
     * 3.1 定义一个 被关注者发布的总篇数 数组 方便接收 遍历出来的数据
     * 3.2 通过遍历 for of 循环 将对应的 被关注者id（用户id） 的数组 去查询info_news 找出被关注者发布的总篇数，且每一条数据都push到 被关注者发布的总篇数 的数组 里面
     * 3.3 根据数组结构的特殊性，再次for循环一次，把 被关注者发布的总篇数 的数组 里面的数据 都 点语法 赋值 到 被关注者 的数组 里面
     * 3.4 完成一个数据的整合，其他的数据都如同3.的方法开始
     * 4. 步骤如3.的方法...
     * 5. 完成一个完整的数据数组 已经完美可以抛出到前端使用了
     */

    let result = await common.getUser(req, res);

    // 这是个人信息页面 -- 如果没有登录的 就直接重定向到 首页
    if (!result[0]) {
      // 没有登录，重定向到首页
      res.redirect('/')
      return
    }
    // get和post都可公用的登录用户判断



    // get请求
    if (req.method === "GET") {

      // 默认页数page = 1 这个从前端传过来的
      let { page = 1 } = req.query;

      // 赋值，等会给data传出去
      let currentPage = page;

      // 每页条数
      let numberPages = 6; // 如果前端传值过来，就改这里

      // 总页数 = 总条数 / 每页多少条   ceil向上取整
      // 总条数  counts   登录用户关注了多少个用户，查收藏表 info_user_fans
      let counts = await handleDB(res, "info_user_fans", "sql", "数据库查询错误", `select count(*) from info_user_fans where follower_id = ${result[0].id}`)
      // [{"counts(*)": 50}]   

      let totalPage = Math.ceil(counts[0]["count(*)"] / numberPages)



      // 查 info_user_fans 表 中 follower_id 字段 -- 查出 所有关注的作者id  （但是加了limit，就是一页只查6个被关注者了）
      let result2 = await handleDB(res, "info_user_fans", "find", "数据库查询错误", `follower_id = ${result[0].id} limit ${(currentPage - 1) * numberPages}, ${numberPages}`)



      // 被关注者 数组
      var authorCommentResult = [];
      // 被关注者发布的总篇数 数组
      var newsCount = [];
      // 被关注者粉丝 数组
      var authorfans = [];

      // 通过for of 循环 查找 被关注者
      for (var element of result2) {
        // forEach在这里没用，不能处理异步代码，因此使用 for of

        // console.log(element.followed_id); // 每一个被关注者的id

        // 查被关注者
        var result3 = await handleDB(res, "info_user", "find", "数据库查询错误", `id = ${element.followed_id}`)

        // 被关注者发布的总篇数
        let result4 = await handleDB(res, "info_news", "sql", "数据库查询错误", `select count(*) from info_news where user_id = ${result3[0].id}`)

        // 被关注者粉丝数
        let result5 = await handleDB(res, "info_user_fans", "sql", "数据库查询错误", `select count(*) from info_user_fans where followed_id = ${result3[0].id}`)

        // 被关注者都放到这里来
        authorCommentResult.push(result3)

        // 被关注者发布的总篇数都放在这里来
        newsCount.push(result4)

        // 被关注者粉丝数都放到这里来
        authorfans.push(result5)

      }

      // 检查是否拿到值
      // console.log(authorCommentResult);
      // console.log(newsCount);
      // console.log(authorfans);

      // 把所有的信息都放在 authorCommentResult 里面
      for (var i = 0; i < authorCommentResult.length; i++) {
        // 给每一个被关注者的头像（图片）加上前缀 http://qb30ruxlm.bkt.clouddn.com/image/avatar/
        authorCommentResult[i][0].avatar_url = authorCommentResult[i][0].avatar_url ? constant.QINIU_AVATAR_URL_PRE + authorCommentResult[i][0].avatar_url : '/news/images/person01.png'
        // 给每一个被关注者加上文章数
        authorCommentResult[i][0].newsCount = newsCount[i][0]['count(*)'];
        // 给每一个被关注者加上粉丝数
        authorCommentResult[i][0].authorfans = authorfans[i][0]['count(*)'];
      }

      // 检查是否拿到值
      // console.log(authorCommentResult);


      let data = {
        currentPage,
        totalPage,
        authorCommentResult: authorCommentResult,
      }

      res.render("news/user_follow", data)
      return
    }

    // post请求
    if (req.method === "POST") {

      // 取消关注

      // 获取参数，判空
      let { user_id, action } = req.body

      if (!user_id || !action) {
        res.send({ errmsg: '错误参数1' })
        return
      }

      // 查询数据库是不是有此被关注者
      let authorResult = await handleDB(res, "info_user", "find", "数据库查询错误", `id = ${user_id}`)

      if (!authorResult[0]) {
        res.send({ errmsg: '参数错误2' });
        return
      }

      // 如果是 unfollow 执行
      if (action === 'unfollow') {
        // 更新数据库，delete
        await handleDB(res, "info_user_fans", "delete", "数据库删除错误", `followed_id = ${user_id} and follower_id = ${result[0].id}`)
      }
      

      // 成功返回
      res.send({ errno: '0', errmsg: '操作成功' })
      return
    }

  })();
})

// --------------------------------------------------------------------------------------------------------->



// <-----------------------------------------------密码修改子页面-----------------------------------------------

router.all("/user/pass_info", (req, res) => {

  (async function () {

    /* 
      业务流程：
      1、获取参数(旧密码，新密码)
      2、校验两次新密码是否一致
      3、校验旧密码是否正确
      4、修改用户表里面的password_hash
      5、返回修改成功
    */

    let result = await common.getUser(req, res);

    // 这是个人信息页面 -- 如果没有登录的 就直接重定向到 首页
    if (!result[0]) {
      // 没有登录，重定向到首页
      res.redirect('/')
      return
    }
    // get和post都可公用的登录用户判断



    if (req.method === 'GET') {

      res.render("news/user_pass_info")
      return
    }

    if (req.method === 'POST') {

      // 获取参数 判空
      let { old_password, new_password, new_password2 } = req.body;

      if (!old_password || !new_password || !new_password2) {
        res.send({ errmsg: '错误参数1' })
        return
      }

      console.log(result[0].id);


      // 查询数据库是不是有此用户
      let userResult = await handleDB(res, "info_user", "find", "数据库查询错误", `id = ${result[0].id}`)

      if (!userResult[0]) {
        res.send({ errmsg: '错误参数2' })
        return
      }

      // 判断新密码是否一致（不需要查数据库）
      if (!(new_password == new_password2)) {
        res.send({ errmsg: "新密码两次输入不一样" })
        return
      }

      // 判断旧密码与数据库是否一致（需要查数据库 -- 占资源）
      if (!(userResult[0].password_hash == md5(md5(old_password) + keys.password_salt))) {
        res.send({ errmsg: '原始密码错误' })
        return
      }

      // 更新到数据库
      await handleDB(res, "info_user", "update", "数据库更新错误", `id = ${userResult[0].id}`, {
        password_hash: md5(md5(new_password) + keys.password_salt)
      })

      // 退出登录
      delete req.session["user_id"]; // 这里只是针对user_id的session删除了，其他没删


      // 返回成功
      res.send({ errno: '0', errmsg: '操作成功' })
      return
    }

  })();

})

// --------------------------------------------------------------------------------------------------------->



// <---------------------------------------我的收藏子页面-----------------------------------------------

router.all("/news/collection_user", (req, res) => {

  (async function () {

    let result = await common.getUser(req, res)
    // 这是个人信息页面 -- 如果没有登录的 就直接重定向到 首页
    if (!result[0]) {
      // 没有登录，重定向到首页
      res.redirect('/')
      return
    }
    // get和post都可公用的登录用户判断

    if (req.method === "GET") {


      // 默认页数page = 1 这个从前端传过来的
      let { page = 1 } = req.query;

      // 赋值，等会给data传出去
      let currentPage = page;

      // 总页数 = 总条数 / 每页多少条   ceil向上取整
      // 总条数  counts   登录用户收藏了多少条新闻，查收藏表 info_user_collection
      let counts = await handleDB(res, "info_user_collection", "sql", "数据库查询错误", `select count(*) from info_user_collection where user_id = ${result[0].id}`)
      // [{"counts(*)": 50}]

      let totalPage = Math.ceil(counts[0]["count(*)"] / 10)

      // console.log(totalPage);

      // 最终要查询的表示info_news表(标题和创建时间字段),   要查询的是登录的用户收藏过的新闻 
      //  1、先查询到登录用户收藏过的新闻的id(分页查询出来)  limit (第几页的数据-1)*每页多少条,每页多少条
      let collectionNewsIdList = await handleDB(res, "info_user_collection", "find", "数据库查询错误2", `user_id = ${result[0].id} order by create_time desc limit ${(currentPage - 1) * 10},10`);
      // 这里是在find的情况下用limit。所以要用上limit的计算公式

      // console.log(collectionNewsIdList);   // id数组

      // 定义一个数组，准备获取该用户所有的收藏的详细信息
      let collectionNewsList = []

      // 遍历这个id数组，拿着里面每一个元素的news_id属性去查询info_news表
      // 把查询的每一个结果push到collectionNewsList
      for (var i = 0; i < collectionNewsIdList.length; i++) {
        // collectionNewsIdList[i] 表示id数组的每一个元素   collectionNewsIdList[i].news_id
        let ret = await handleDB(res, "info_news", "sql", "数据库查询出错3",
          `select title,create_time,id from info_news where id=${collectionNewsIdList[i].news_id}`
        )  // [{title:"新闻标题", create_time:"xxxxxxx"}]

        collectionNewsList.push(ret[0]) // ret[0]这样写更好地把数据传给前端[{},{},{}...{}]
      }

      // console.log(collectionNewsList);



      // 传过去的数据一般都是json，string格式
      let data = {
        currentPage,
        totalPage,
        collectionList: collectionNewsList
        // collectionList: collectionList
      }

      res.render("news/user_collection", data)
      return



    } else if (req.method === "POST") {

      let { action, news_id } = req.body;


      let result2 = await handleDB(res, "info_news", "find", "查询数据错误", `id = ${news_id}`)

      if (action == 'cancel_collect') {

        await handleDB(res, "info_user_collection", "delete", "数据库删除错误", `news_id = ${news_id} and user_id = ${result[0].id}`);

        // 取消收藏 info_news 字段 comments_count -1
        // 直接查询 info_news 表 如果有值，就 -1 ，没有值，就赋值 0 -- 拿到这个数据给 数据库 删除
        let comments_count = result2[0].comments_count ? result2[0].comments_count - 1 : 0
        await handleDB(res, "info_news", "update", "数据库更新错误", `id = ${result2[0].id}`, { comments_count: comments_count })
      }

      res.send({ errmsg: "操作成功", errno: '0' })
      return
    }

  })();

})

// --------------------------------------------------------------------------------------------------->



// <---------------------------------------新闻发布子页面-----------------------------------------------

router.get("/user/news_release", (req, res) => {
  (async function () {

    res.render("news/user_news_release");
  })();
})

router.post("/user/news_release", upload.single('index_image'), (req, res) => {
  (async function () {

    // 使用封装好的 获取登录用户信息 且判断是否登录，不登录就重定向
    let userInfo = await common.getUserInfo(req, res);
    // console.log(userInfo);

    // 获取参数，判空
    let { title, category_id, digest, index_image, content } = req.body;
    // let title = req.body.title;
    // console.log(req.body);

    // console.log(content); // 登录用户发布新闻时传过来的原始数据content

    // 原始数据base64编码（因为不编码，传不进去数据库）
    let baseencodeContent = Base64.encode(content);

    // console.log(baseencodeContent); // 检查编码成功没，成功，就直接交给下面 插入数据库 使用了
    
    /**
     * [Object: null prototype] {
        title: '',
        category_id: '2',
        digest: '',
        index_image: '',
        content: '' }
     */
    if (!title || !category_id || !digest || !content) {
      res.send({ errmsg: "缺少必填项" })
      return
    }




    // 图片这个都不用通过解构的参数获取了，直接通过 upload.single('index_image') 就已经获取到图片了
    var file = req.file;
    // console.log(file);


    try {
      // 上传图片到第三方服务器（七牛）
      var retObj = await upload_file(file.originalname, `${file.destination}/${file.filename}`)
      // retObj 是返回的 信息
      console.log(retObj) // 作用：检测是否上传成功
    } catch (error) {
      console.log(error, '上传七牛第三方服务器失败');
      res.send({ errmsg: '图片没有上传成功' })
      return
    }



    // insert 数据库插入（包括图片） 默认状态 status: 0 
    await handleDB(res, "info_news", "insert", "数据库插入错误", { title, source: userInfo[0].nick_name, digest, content: baseencodeContent, category_id, user_id: userInfo[0].id, index_image_url: constant.QINIU_AVATAR_URL_PRE + file.originalname, status: 1 })

    // insert 不传图片测试用的
    // await handleDB(res, "info_news", "insert", "数据库插入错误", { title, source: userInfo[0].nick_name, digest, content: baseencodeContent, category_id, user_id: userInfo[0].id })

    // 成功返回
    res.send({ errno: 0, errmsg: "操作成功" })
  })();
})

// --------------------------------------------------------------------------------------------------->



// <---------------------------------------我的列表子页面-----------------------------------------------

router.get("/user/user_newslist", (req, res) => {
  (async function () {

    let { page = 1 } = req.query;

    // 页数
    let currentPage = page;

    // 使用封装好的 获取登录用户信息 且判断是否登录，不登录就重定向
    let userInfo = await common.getUserInfo(req, res);

    // 登录用户发表的所有文章 （但加了分页，一页10条）
    let result = await handleDB(res, "info_news", "find", "数据库查询错误", `user_id = ${userInfo[0].id} order by create_time desc limit ${(currentPage - 1) * 10},10`)

    // 总登录用户发表新闻数
    let counts = await handleDB(res, "info_news", "sql", "数据库查询错误", `select count(*) from info_news where user_id = ${userInfo[0].id}`)

    // 总页数
    let totalPage = Math.ceil(counts[0]['count(*)'] / 10)

    let data = {
      currentPage,
      totalPage,
      newsList: result
    }

    res.render("news/user_news_list", data);
  })();
})

// --------------------------------------------------------------------------------------------------->


module.exports = router