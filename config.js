// app.js抽取出来的配置文件

// app.js配置的三种方式：1.函数 2.类,构造器 3.类,构造器+方法

// 引入文件
// 引入express框架
const express = require("express");

// 引入path路径读取
const path = require("path");

// 引入cookie和session获取
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");

// 引入post获取
const bodyParser = require('body-parser');

// 引入cref防护
const common = require("./utils/common/common");

// 引入keys
const keys = require("./keys");


// 注意：项目中需要添加配置，或者引入了第三方包，需要注册到app下，需要添加代码是添加在config.js中class的constructor里面




// 引入router里面的各种路由对象
const indexRouter = require("./routers/index");
const passportRouter = require("./routers/passport");
const detailRouter = require("./routers/detail");
const profileRouter = require("./routers/profile");

// 作为测试的接口
const testRouter = require("./routers/test");

const testbase64Router = require("./routers/base64"); // 测试base64，与本项目无关
const testmd5Router = require("./routers/md5"); // 测试md5，与本项目无关
const testRESTfulRouter = require("./routers/RESTful"); // 测试RESTful风格接口，与本项目无关


// // 1.函数 --------------------------------------------------------------
// /**
//  * -- 导出对应的接收
//  * const appConfig = require("./config")
//    appConfig(app);
//  */

// // function appConfig(){}
// let appConfig = app => {

//   // 模板的设置
//   // 1、修改模板引擎为html，导入express-art-template
//   app.engine('html', require('express-art-template'));
//   // 2、设置运行的模式为开发模式
//   app.set('view options', {
//     debug: process.env.NODE_ENV !== 'development'
//   });
//   // 3、设置模板存放目录为views文件夹
//   app.set('views', path.join(__dirname, 'views'));
//   // 4、设置引擎后缀为html
//   app.set('view engine', 'html');



//   // 设置指定静态资源的文件夹
//   app.use(express.static("public")); // public对应的就是前端的根目录 /



//   // 获取post请求参数的配置
//   app.use(bodyParser.urlencoded({ extended: false }));
//   app.use(bodyParser.json());



//   // 注册cookie 和sesison
//   app.use(cookieParser())
//   app.use(cookieSession({
//     name: "my_session",
//     keys: ["$%$&^%&THGFFDGHJHGE%%$Y&%^HGFF#$G%G$FF#F$#G%H^%H^%H%^"],
//     maxAge: 1000 * 60 * 60 * 24 * 2    // 2天
//   }))

// }

// module.exports = appConfig; // 导出一个函数
// // ---------------------------------------------------------------------



// 2.类,构造器(以面向对象的方式里抽取)---------优点：可扩展性(方法，属性)------
/**
 * -- 导出对应的接收
 * const AppConfig = require("./config");
   new AppConfig(app);
 */
class AppConfig {

  // constructor什么时候执行？ 创建对象就执行
  // 那为什么放在constructor里面？ 因为在app.js里面的时候，app.use()等这些注册的都是app一创建就执行，那么constructor的原理也是同样，当类AppConfig一创建(实例化)也是执行constructor里面的代码。
  // 看成创建对象的时候执行的代码
  constructor(app) {

    this.app = app // 这里是考虑到代码的扩展性
    this.listenPort = 3000 // 这是app.listen抽取出来的端口号



    // 模板的设置
    // 1、修改模板引擎为html，导入express-art-template
    this.app.engine('html', require('express-art-template'));
    // 2、设置运行的模式为开发模式
    this.app.set('view options', {
      debug: process.env.NODE_ENV !== 'development'
    });
    // 3、设置模板存放目录为views文件夹
    this.app.set('views', path.join(__dirname, 'views'));
    // 4、设置引擎后缀为html
    this.app.set('view engine', 'html');



    // 设置指定静态资源的文件夹
    this.app.use(express.static("public")); // public对应的就是前端的根目录 /



    // 获取post请求参数的配置
    this.app.use(bodyParser.urlencoded({ extended: false }));
    this.app.use(bodyParser.json());



    // 注册cookie 和sesison
    this.app.use(cookieParser())
    this.app.use(cookieSession({
      name: "my_session",
      keys: [keys.session_key], // 给session加密
      maxAge: 1000 * 60 * 60 * 24 * 2    // 2天(1000为1毫秒 单位)
    }))



    // 注册路由到app下 这里可以加cref防护钩子函数
    this.app.use(common.csrfProtect, indexRouter);
    this.app.use(common.csrfProtect, passportRouter);
    this.app.use(common.csrfProtect, detailRouter);
    this.app.use(common.csrfProtect, profileRouter);
    
    // 作为测试的接口
    this.app.use(common.csrfProtect, testRouter);

    this.app.use(testbase64Router); // 测试base64，与本项目无关
    this.app.use(testmd5Router); // 测试md5，与本项目无关
    this.app.use(testRESTfulRouter); // 测试RESTful风格接口，与本项目无关



    // 这里是针对没有的路由返回的404页面
    this.app.use((req, res) => { // 这里的返回404页面，原理是上面的路由都找不到（意思就是根本就没有这个路径的写法），就执行这一个返回404

      // 代码重复性高，抽取到common.js里面

      // (async function () { // 有await就要写async

      //   // 使用common.js封装好的
      //   let result = await common.getUser(req, res); // 处理右上角是否登录展示问题

      //   let data = { // 右上角用户状态信息
      //     user_info: result[0] ? { // 三元表达式，如果result[0]是个空数组[]，那么就返回false；如果result[0]是个有参数的[{}]，那么就返回{参数}
      //       nick_name: result[0].nick_name,
      //       avatar_url: result[0].avatar_url
      //     } : false
      //   }

      //   res.render("news/404", data);

      // })();

      // 使用common.js封装好的 -- 直接调用，就直接写就行了，不用接收，没有return过来参数，就不是promise对象，所以就更不用写await，async了
      common.abort404(req, res);

    })



  }

  // run(){ // 这里就是代码的扩展性用途了
  //   this.app
  // }

}

module.exports = AppConfig; // 导出一个类
// ---------------------------------------------------------------------



// // 3.类,构造器+方法(以面向对象的方式里抽取)---------优点：可扩展性(方法，属性)--
// /**
//  * -- 导出对应的接收
//  * 
//  */
// class AppConfig {


//   // constructor什么时候执行？ 创建对象就执行
//   // 那为什么放在constructor里面？ 因为在app.js里面的时候，app.use()等这些注册的都是app一创建就执行，那么constructor的原理也是同样，当类AppConfig一创建(实例化)也是执行constructor里面的代码。
//   // 看成创建对象的时候执行的代码
//   constructor(app) {

//     this.app = app

//   }

//   run() {

//     // 模板的设置
//     // 1、修改模板引擎为html，导入express-art-template
//     this.app.engine('html', require('express-art-template'));
//     // 2、设置运行的模式为开发模式
//     this.app.set('view options', {
//       debug: process.env.NODE_ENV !== 'development'
//     });
//     // 3、设置模板存放目录为views文件夹
//     this.app.set('views', path.join(__dirname, 'views'));
//     // 4、设置引擎后缀为html
//     this.app.set('view engine', 'html');



//     // 设置指定静态资源的文件夹
//     this.app.use(express.static("public")); // public对应的就是前端的根目录 /



//     // 获取post请求参数的配置
//     this.app.use(bodyParser.urlencoded({ extended: false }));
//     this.app.use(bodyParser.json());



//     // 注册cookie 和sesison
//     this.app.use(cookieParser())
//     this.app.use(cookieSession({
//       name: "my_session",
//       keys: ["$%$&^%&THGFFDGHJHGE%%$Y&%^HGFF#$G%G$FF#F$#G%H^%H^%H%^"],
//       maxAge: 1000 * 60 * 60 * 24 * 2    // 2天
//     }))

//   }

// }

// module.exports = AppConfig; // 导出一个类
// // ---------------------------------------------------------------------


// 知识点：
// 为什么用面向对象胜过于函数呢？
// 因为面向对象更好体现扩展性，可以后期添加属性，方法。
// 当然有些地方也可以直接用函数的，例如后期不需要扩展，只是一个简单的功能。
// 例如：csrf跨站请求伪造防护，过滤器 等