// --------------------------------CSRF跨站请求伪造防护--session的方法----------------------
// 生成一个随机数
function getRandomString(n) {
  var str = "";
  while (str.length < n) {
    str += Math.random().toString(36).substr(2);
  }
  return str.substr(str.length - n)
}


// 钩子函数 CSRF跨站请求伪造防护 函数 post请求都要防护
// 作用就是颁发一个csrf_token认证
function csrfProtect(req, res, next) {
  console.log("-------------------------------------csrfProtect")
  let method = req.method
  if (method == "GET") {
    let csrf_token = getRandomString(48); // 48位的随机数 -- 因此每一次都可以不同
    res.cookie('csrf_token', csrf_token);
    next() //执行跳转到下一个函数执行，即app.use(beforeReq,router)中的下一个
  } else if (method == "POST") {
    // 判断响应头中的x-csrftoken值，和cookies中的csrf_token进行对比
    console.log(req.headers["x-csrftoken"]);
    console.log(req.cookies["csrf_token"]);
    // 这样就能达到防护的作用了。因为跨站请求伪造浏览器默认请求的，没法写请求头，而可以写请求头的ajax的话，又跨域，无法请求。

    if ((req.headers["x-csrftoken"] === req.cookies["csrf_token"]) && req.headers["x-csrftoken"]) {
      console.log("csrf验证通过！");
      next()
    } else {
      res.json({ errmsg: "csrf验证不通过!！" }); // 返回响应给前端
      return
    }
  }
}


// 这块请求防护，在前端的ajax上面也要写上对应的请求头header
// headers:{'X-CSRFToken':getCookie('csrf_token')},
/**
 * 前端获取csrf_token的方法
 * function getCookie(name) {
    var r = document.cookie.match("\\b" + name + "=([^;]*)\\b");
    return r ? r[1] : undefined;
  }
 */

// ---------------------------------------------------------------------------------------------



// -------------------------------------获取用户的状态信息---------------------------------------
const handleDB = require("../../db/handleDB");
// 由于有await 所以要写上async ; 需要用到handleDb 所以要引入handleDb ; req 和 res 是形参 需要传进来

// 获取用户的状态信息
async function getUser(req, res) {
  let user_id = req.session["user_id"];
  let result = [];
  if (user_id) {
    result = await handleDB(res, "info_user", "find", "数据库查询错误", `id=${user_id}`);
  }
  return result; // 返回的是一个promise对象 外面使用时一定要前加await [{}]或者[]
}

// ---------------------------------------------------------------------------------------------



// -----------------获取登录用户的信息，一定可以获取到，如果没有登录就重定向------------------------
async function getUserInfo(req, res){
  let userInfo = await getUser(req, res);
  if(!userInfo[0]){
      // 没有登录，就重定向到首页
      res.redirect("/");
  }
  return userInfo
}

// ---------------------------------------------------------------------------------------------



// ----------------------------------直接抛出404页面---------------------------------------------
// 引入一个常量
const constant = require("../common/constant")

async function abort404(req, res) {

  // 使用common.js封装好的
  let result = await getUser(req, res); // 处理右上角是否登录展示问题


  let data = { // 右上角用户状态信息
    user_info: result[0] ? { // 三元表达式，如果result[0]是个空数组[]，那么就返回false；如果result[0]是个有参数的[{}]，那么就返回{参数}
      nick_name: result[0].nick_name,
      avatar_url: result[0].avatar_url ? constant.QINIU_AVATAR_URL_PRE + result[0].avatar_url : '/news/images/user_pic.png'
    } : false
  }
  res.render("news/404", data);
  // 这是可以直接调用的了，没有参数是需要返回return的，所以不是promise对象了
}

// ---------------------------------------------------------------------------------------------



// 导出
module.exports = { // 对象的写法，使用的话use(common.csrfProtect)这样了
  csrfProtect,
  getUser,
  getUserInfo,
  abort404
}



 // 一般所有的公共函数都写在这个文件里面统一管理，也可以分开写