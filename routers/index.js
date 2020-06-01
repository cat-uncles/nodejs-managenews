const express = require("express");

// 要引入才能用数据库
const handleDB = require("../db/handleDB");

// 为什么写在这，因为需要用的html模板是哪个对应的接口渲染的就是在这个js里面，那么就是引入在这里
// 由于是直接使用的，不用定义一个常量来接收它，直接引入调用里面的filter方法
require("../utils/filters/filters");

// 引入一个常量的文件
const constant = require("../utils/common/constant");

const router = express.Router();

// 一个router对象(一个路径)对应一个静态html页面

// app要改成router
// 要使用这router对象的话，就要统一在config.js文件中引用并且注册，不用到app.js引入注册了
/**
 * const indexRouter = require("./routers/index")
 * 
 * this.app.use(indexRouter);
 */


// // 测试代码
// router.get("/", (req, res) => {
//   // 测试express
//   // res.send("123");

//   // 测试设置cookie和session
//   res.cookie("name", "nodejs");
//   req.session["age"] = 11

//   // 测试静态资源
//   res.render("news/index");
// })

// router.get("/get_cookie", (req, res) => {
//   // 测试获取cookie
//   res.send("cookie中name的值为：" + req.cookies["name"]);
// })
// router.get("/get_session", (req, res) => {
//   // 测试获取session
//   res.send("cookie中my_session中的age的值为：" + req.session["age"]);
// })

// router.get("/get_data", (req, res) => {

//   // 测试数据库

//   // async+await+Promise将异步实现同步化
//   (async function () {
//     // 知识点：自执行函数，箭头函数，都是没有作用域的，所以可以直接传res了

//     let result = await handleDB(res, "info_category", "find", "数据库查询错误");

//     res.send(result);

//   })(); // 自执行

// })



// <-----------------------------------index.html展示数据------------------------------------------

// index.html首页一打开，就要展示数据的请求

router.get("/", (req, res) => {

  (async function () {

    // --------------------------------------------------------------------------------------------
    // 访问首页，处理右上角是否登录展示问题
    // 判断是否登录

    // 原理：首先无论你是登录还是注册的时候，其实已经把user_id通过session保存到浏览器里面的了，那么我们这里就是通过比较user_id来让它在html上显示

    // 从session中获取user_id
    let user_id = req.session["user_id"];
    let result = []; // 初始化，且因为放在if{}里面是有作用域的，外面就拿不到这个参数了，所以要放在外面作为全局参数使用

    // 判断是否有user_id
    if (user_id) {
      // 从数据库中
      result = await handleDB(res, "info_user", "find", "数据库查询错误", `id = ${user_id}`)
    }
    // --------------------------------------------------------------------------------------------




    // --------------------------------------------------------------------------------------------
    // 展示首页头部分类信息
    // 查询数据库，查看分类信息？ 查表info_category 

    let result2 = await handleDB(res, "info_category", "find", "数据库查询错误", ["name"])
    // result2输出肯定是这样的数据：[{name:最新},{name:xxx}, ...]
    // --------------------------------------------------------------------------------------------




    // --------------------------------------------------------------------------------------------
    // 展示首页右侧点击排行的效果
    // 查询数据 排序 取前6条

    // 排序查询的写法一：
    // 注意点：where 1 是可以省略不写的，它的含义是在这里where 1，1为真，也就是where后的条件为真，查询表中所有内容。而这里为什么要写呢？因为 这里"" 写字符串语句 就是相当于mysql里面的where后面的语句 那么 order by 是不能直接跟在where后面吧，所以要写一个 1 后面再跟上 order by clicks desc limit 6 完成这个查询需求
    let result3 = await handleDB(res, "info_news", "find", "数据库查询错误", "1 order by clicks desc limit 6")

    // 排序查询的写法二：
    // 通过自定义的sql写法去查询
    // let result3 = await handleDB(res, "info_news", "sql", "查询数据库出错", "select * from info_news order by clicks desc limit 6")
    // --------------------------------------------------------------------------------------------



    // 可以把数据传递到模板中去
    // 自定义起个形参接收参数
    let data = {
      // 用户信息
      user_info: result[0] ? { // 三元表达式，如果result[0]是个空数组[]，那么就返回false；如果result[0]是个有参数的[{}]，那么就返回{参数}
        nick_name: result[0].nick_name,
        avatar_url: result[0].avatar_url ? constant.QINIU_AVATAR_URL_PRE + result[0].avatar_url : '/news/images/person01.png'
      } : false,
      // 首页头部分类信息
      category: result2,
      // 首页右侧点击排行信息
      newsClick: result3, // [{},{}]
    }

    res.render("news/index", data) // 返回静态模板，响应data数据

  })();

})
// -------------------------------------------------------------------------------------------->



// <---------------------------------------------退出------------------------------------------

// 点击退出按钮的请求

// 为什么这里要用post？因为前端ajax是post请求的，所以这里后端要写post
router.post("/passport/logout", (req, res) => {

  // 退出登录操作
  // 退出登录实际就是删除session的user_id

  delete req.session["user_id"]; // 这里只是针对user_id的session删除了，其他没删
  res.json({ errno: "0", errmsg: "退出登录成功" })

})
// -------------------------------------------------------------------------------------------->



// <---------------------------------------------index.html下拉加载-----------------------------

// 下拉加载

router.get("/news_list", (req, res) => {

  (async function () {



    // 参数分析
    // 1.获取参数，判空（这里不用写判空，只要给默认值就行了。因为这是打开网站就要看到信息，那么无论前端有没有值传过来，我就给默认值给你，获取数据给前端展示）

    // cid(新闻分类id)  page(当前页数)  per_page(每页条数)

    // 解构-默认写法（因为是get请求，预防直接输入地址时不填参数 就是相当于不传参数 导致查询失败，因此这里默认参数的值 就能预防查询错误了）
    let { cid = 1, page = 1, per_page = 5 } = req.query;



    // 2.查询数据库，根据以上3个参数，获取前端需要的这些数据

    // 最新的分类就是 1 查询 全部；而其他的分类就是对应的分类了，可以直接通过 对应的 2 3 4 5 6 就可以查询 对应的分类了
    // 三元表达式的方法
    let category_id = cid == 1 ? "1" : `category_id = ${cid}`;
    // 这样的话就可以得到两种情况
    // 如果cid为1的话 where 1 order by create_time desc
    // 如果cid不是1的话 where category_id = ${cid} order by create_time desc

    // 每一栏分页查询一页多少条数目的数据 limit 分页查询 where可选 number当前页数 count每页条数
    let result = await handleDB(res, "info_news", "limit", "数据库查询错误", { where: category_id + " order by create_time desc", number: page, count: per_page })
    // 返回的结果是一个数组：[{},{},...{}]

    // 每一栏总条数
    let result2 = await handleDB(res, "info_news", "sql", "数据库查询错误", "select count(*) from info_news where " + category_id)

    // 求总页数的公式：总页数 = 总条数/每页有多少条数据
    // 每一栏总页数
    let result3 = Math.ceil(Number(result2[0]["count(*)"]) / per_page); // 预防有余数 用Math.ceil() 向上取值

    console.log(result3);



    // 3.把查询道德新闻数据结果返回到前端

    // 这里的数据要转换成Number类型，因为通过req.query获取带的参数类型实际上是字符串string类型，而前端需要的是number类型才能进行加减运算赋值，所以接口返回的数据必须是Number类型的
    let data = {
      currentPage: Number(page), // 需要转换成number类型 第几页
      totalPage: result3, // 总页数
      newsList: result // 数据
    }

    res.send(data) // 接口数据

  })();
})
// -------------------------------------------------------------------------------------------->


// 知识点：handleDB查询，如果写了 模板语法 `` ，就不用写 "" 了。
// 知识点：通过req.query获取带的参数类型实际上是字符串string类型
// 知识点：mysql里面用到的命令语句的每一个单词要注意有空格符间开（特别在拼接命令的时候需要注意）
// 知识点：mysql里面的命令中 where 1 是查询全部，可以省略没写。
// 知识点：get请求拿参数的方式query
// 知识点：post请求拿参数的方式body（需要引入body-parser）-> const bodyParser = require('body-parser'); 同时还要app.use()
// 知识点：分页查询都是一般通过 get 请求（都是通过前端代码触发page，per_page传到后端）

module.exports = router;