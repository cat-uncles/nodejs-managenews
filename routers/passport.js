// 验证码，注册，登录

const express = require("express");

// 引入验证码工具
const Captcha = require("../utils/captcha");

// 要引入才能用数据库
const handleDB = require("../db/handleDB");

// 引入md5
const md5 = require("md5");

// 引入key值
const keys = require("../keys");

// 引入路由
const router = express.Router();



// <---------------------------------------------验证码------------------------------------------

// 验证码自动生成的请求

// 路径 /passport/image_code 对应前端的 <img src="路径" alt="" /> 由于前端需要的是一张图片，是需要的是一个路径，返回给前端是一个接口
// 由于前端路径加了一个随机数或者时间戳，那么这里要变成动态路由，就可以了
router.get("/passport/image_code/:float", (req, res) => {

  // 实例化一个类对象
  let captchaObj = new Captcha();
  let captcha = captchaObj.getCode(); // 实例化类对象里面的一个调用方法

  // captcha.text // 文字
  // captcha.data // 图片

  // 应该有一个浏览器对应的独立空间来保存这个验证码文本
  // 保存图片验证码文本到session中
  req.session["ImageCode"] = captcha.text;
  console.log(req.session);

  // <img src="路径" alt="" /> 所以要加setHeader
  // 配合img标签的src属性请求来展示验证码图片的时候，需要设置响应头
  res.setHeader('Content-Type', 'image/svg+xml');

  // 返回一个svg图片
  res.send(captcha.data);

})
// -------------------------------------------------------------------------------------------->



// <---------------------------------------------注册--------------------------------------------

// 点击注册按钮的请求

router.post("/passport/register", (req, res) => {
  // 分析注册功能需要做的事情，必须严谨

  (async function () { // async 放在最外面的原因是，let 是有块级作用域的，例如 let result 这里要想给下面的其他函数，判断使用，就要在同一个块级内才能互相调用（虽然自执行函数和箭头函数没有作用域）

    //1、获取post参数，判空

    let { username, image_code, password, agree } = req.body
    // (不能用&&，因为要4个都为false才能return，不符合逻辑)应该为如果四个中有一个是空的(false)，就要return
    if (!username || !image_code || !password || !agree) { // 缺少必须要传的参数
      res.send({ errmsg: "缺少必传参数" })
      return
    }



    //2、验证用户输入的图片验证码是否正确，不正确就return

    // 原理：session会为每一个浏览器都有一个独立的存储空间，每个浏览器都是不一样的参数，所以把参数传到session就能更好地实现一对一了（很多浏览器同时访问）；这样就可以避免后端传参无法一对一的独立空间了

    // 拿着用户填写的image_code和session中的req.session["ImageCode"]进行对比
    if (image_code.toLowerCase() !== req.session["ImageCode"].toLowerCase()) {
      res.send({ errmsg: "验证码填写错误" })
      return
    }
    // js的方法 toLowerCase() 转换成小写

    // if(image_code.toLowerCase() === req.session["ImageCode"].toLowerCase()){
    //   res.send({errmsg:"验证码填写正确"})
    // }



    //3、查询数据库，看看用户名是不是被注册了

    // "${username}" 是因为数据库mysql中命令都是字符串的，所以要加""
    let result = await handleDB(res, "info_user", "find", "数据库查询错误", `username = "${username}"`)
    // 有这个用户 result是一个数组 [{字段名1: 值1}]
    // 没有的话 result是一个空数组 []
    console.log(result);



    //4、如果已经存在，返回用户名已经被注册，并return

    // 判断存在的方法一：
    // if(result.length > 0) {
    //   res.send({errmsg:"用户名已经被注册"})
    //   return
    // }

    // 判断存在的方法二：
    if (result[0]) { // 注意数据库有值的话，是返回 [{字段名: 值}]，没有值是返回 [] 所以就是判断result[0]的第一个元素{}是不是存在就可以判断出是不是存在了
      res.send({ errmsg: "用户名已经被注册" })
      return
    }

    // 也有其他的判断存在方法...



    //5、不存在，就在数据库中新增加一条记录

    // 根据数据库mysql里面的字段名赋值相对应的参数
    let result2 = await handleDB(res, "info_user", "insert", "数据库插入数据错误", {
      username: username,
      // password_hash: password, // 此时的密码还没加密，只是单单传值到数据库
      password_hash: md5(md5(password) + keys.password_salt), // 这里开始加密 双重md5加盐的方式
      nick_name: username,
      last_login: (new Date()).toLocaleString() // 最后一次登陆时间

    })

    // result2.insertId 插入mysql数据的时候，自动生成的这个id值（打印下result2就知道了）
    // console.log(new Date()); // 当前时间
    // console.log((new Date()).toLocaleString()); // 本地时间把 Date 对象转换为字符串(有格式的字符串)



    //6、保持用户的登录状态

    // 保存到session里面，作为你当前账号的登录状态
    req.session["user_id"] = result2.insertId



    //7、返回注册成功给前端

    res.send({ errno: "0", errmsg: "注册成功" })



    // 如果注册账号时，会发生账号插入失败，那么我们可以直接在原有的handleDB里面直接改console.log(errmsg: errMsg),同步于前端代码，这样就可以不止后端知道错误原因，也可以让前端知道错误的原因








    // 知识点：res.send(返回可以是字符串，也可以是对象{});res.json(返回可以是对象{});都是返回给前端的响应
    // 知识点：只要涉及到数据库，都是要async+await+Promise
    // 知识点：注册的第2步和第3步能不能换位置写呢？可以是可以，但是根据服务器CPU资源占用的角度上来说，不需用到查询数据库 比 需要用到数据库 更省服务器CPU资源，因为查询数据库就是线上要与其他的服务器联系获取数据，一般需要用到数据库的都是放在后面



    // 知识点：一般做验证的，可以用session，cookie；或者可以使用jwt_token。
    // 什么时验证？就是前后端传的一个认证码，确认两个码是一样的，才通过验证，做到防护作用
    // session，cookie：只能在浏览器上使用
    // token：可以在任意端（pc的应用，android的app，ios的app等）使用（企业常用）

    

    // 后端尽量返回的是数据接口，而不是控制浏览器窗口跳转，控制浏览器，前端刷新重新加载页面
    // 后端接口：把各种if判断false都return，后面都是true的了
    // 经验：前端代码submit一般就是和from一起使用

  })();

})
// --------------------------------------------------------------------------------------------->



// <------------------------------------------登录----------------------------------------------

// 点击登录按钮的请求

router.post("/passport/login", (req, res) => {

  (async function () {

    //  1、获取参数,判空 

    let { username, password } = req.body

    if (!username || !password) {
      res.send({ errmsg: "缺少输入参数" })
      return
    }



    //  2、查询数据库,验证手机号码是不是已经注册了

    let result = await handleDB(res, "info_user", "find", "数据库查询错误", `username = "${username}"`)



    //  3、如果没有注册，则返回用户名未注册，登录失败 return

    if (!result[0]) {
      res.send({ errmsg: "用户名不存在，登录失败" })
      return
    }



    //  4、校验密码是否正确,如果不正确 就return

    // console.log(result);
    // console.log(result[0]);
    // console.log(result[0].password_hash);
    // console.log(password);

    // if (result[0]["password_hash"] !== password) // 没加密的时候
    if (result[0]["password_hash"] !== md5(md5(password) + keys.password_salt)) { // 此密码此时已经md5加密了（明文一致，密文也会一致）
      res.send({ errmsg: "输入密码错误" })
      return
    }



    //  5、保持用户的登录状态

    req.session["user_id"] = result[0].id

    //设置 最后一次登录时间 last_login字段
    //本质是在修改字段
    await handleDB(res, "info_user", "update", "数据库修改出错", `id=${result[0].id}`, { last_login: new Date().toLocaleString() })


    //  6、返回登录成功

    res.send({ errno: "0", errmsg: "登录成功" })

  })();

})
// -------------------------------------------------------------------------------------------->

























// ------------------------------------这是jwt_token的简单使用，与本项目无关--------------------------------------



const jwt = require("jsonwebtoken");

// --- jwt_token一定时间内会变化
router.get("/passport/token", (req, res) => {

  // 生成jwt_token   --   jwt.sign(载荷（要传的数据），盐，过期时间（单位是秒）) expiresIn: 60 * 60 * 2 一般都是两个小时
  const token = jwt.sign({id: 1, username: 'jwt'},keys.jwt_salt, {expiresIn: 20});

  // 规范接口 -- json数据(带tokon)
  res.send({
    errmsg: "success",
    errno: "0",
    reason: "登录请求",
    result: {
      token,
    }
  })

})

// 验证jwt_token
router.get("/passport/transfer", (req,res) => {

  // 由于在测试练习写的，手动抓取这个token（直接到网页复制粘贴过来）
  // 通过方式来获取token
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJqd3QiLCJpYXQiOjE1OTA2NDc4MTIsImV4cCI6MTU5MDY0NzgzMn0.nXhOmffYTpL4sCn4Mqhifoyl_88dB0Toy0XQSq1aNIk"
  try{
      var userData = jwt.verify(token, keys.jwt_salt);   //jwt.verify验证 获取token中的数据(用户信息)
  }catch(e){
      console.log("无效的jwt_token")
      res.send("无效的jwt_token")
      return
  }

  // 验证成功后的流程 -- 简约版测试 -- 转账业务
  console.log("正在执行转账业务")
  res.send("正在执行转账业务")
})
// -----------------------------------------------------------------------------------------------------------------


module.exports = router;