// 入口文件
const express = require("express");

// ------------------抽取到config.js----------------------
// const path = require("path");

// const cookieParser = require("cookie-parser");
// const cookieSession = require("cookie-session");

// const bodyParser = require('body-parser');
// -------------------------------------------------------

const app = express();

// // -------------1.以函数的方式来进行调用----------------
// const appConfig = require("./config")

// appConfig(app);
// ------------------------------------------------------

// -----------2.以面向对象的方式(构造器)里抽取-------------
// const AppConfig = require("./config");

// new AppConfig(app);

// 由于要把app.listen也要实现抽取，那么就要实例化一个对象
const AppConfig = require("./config");

let appconfig = new AppConfig(app);

// ------------------------------------------------------

// // -----------3.以面向对象的方式(方法)里抽取------------
// const AppConfig = require("./config")

// let appConfig = new AppConfig(app);

// appConfig.run();
// ------------------------------------------------------

// ------------------抽取到config.js----------------------
// // 模板的设置
// // 1、修改模板引擎为html，导入express-art-template
// app.engine('html', require('express-art-template'));
// // 2、设置运行的模式为开发模式
// app.set('view options', {
//     debug: process.env.NODE_ENV !== 'development'
// });
// // 3、设置模板存放目录为views文件夹
// app.set('views', path.join(__dirname, 'views'));
// // 4、设置引擎后缀为html
// app.set('view engine', 'html');



// // 设置指定静态资源的文件夹
// app.use(express.static("public")); // public对应的就是前端的根目录 /



// // 获取post请求参数的配置
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());  



// // 注册cookie 和sesison
// app.use(cookieParser())
// app.use(cookieSession({
//     name:"my_session",
//     keys:["$%$&^%&THGFFDGHJHGE%%$Y&%^HGFF#$G%G$FF#F$#G%H^%H^%H%^"],
//     maxAge: 1000 * 60 * 60 * 24 * 2    // 2天
// }))
// -------------------------------------------------------


// // -------------根路径/的路由,抽取到ruter的index.js里面----------------
// app.get("/",(req,res) => {
//   // 测试express
//   // res.send("123");

//   // 测试设置cookie和session
//   res.cookie("name", "nodejs");
//   req.session["age"] = 11

//   // 测试静态资源
//   res.render("news/index");
// })
// app.get("/get_cookie", (req,res)=>{
//   // 测试获取cookie
//   res.send("cookie中name的值为："+req.cookies["name"]);
// })
// app.get("/get_session", (req,res)=>{
//   // 测试获取session
//   res.send("cookie中my_session中的age的值为："+req.session["age"]);
// })
// // ------------------------------------------------------------------


// ---------------把端口号抽取到config.js里面----------------
app.listen(appconfig.listenPort, () => {
  console.log(`端口号：${appconfig.listenPort}服务已经开启!`);
  
})
// ---------------------------------------------------------