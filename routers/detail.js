const express = require("express");

const handleDB = require("../db/handleDB");

// 这里可以不用引入的，art-template是全局的
require("../utils/filters/timeFilter");

// 引入工具函数，需要用到里面其中的一个获取用户的状态函数
const common = require("../utils/common/common");

// 引入一个常量的文件
const constant = require("../utils/common/constant");

// 引入base64
const Base64 = require("js-base64").Base64;

const router = express.Router();

// <---------------------------------------------对应news_id展示的详情页------------------------------------------

router.get("/news_detail/:news_id", (req, res) => {

  (async function () {

    // --------------------------------------------------------------------------------------------

    // 由于该函数使用次数多，即可抽取出去到common.js封装使用

    // // 访问首页，处理右上角是否登录展示问题
    // // 判断是否登录

    // // 原理：首先无论你是登录还是注册的时候，其实已经把user_id通过session保存到浏览器里面的了，那么我们这里就是通过比较user_id来让它在html上显示

    // // 从session中获取user_id
    // let user_id = req.session["user_id"];
    // let result = []; // 初始化，且因为放在if{}里面是有作用域的，外面就拿不到这个参数了，所以要放在外面作为全局参数使用

    // // 判断是否有user_id
    // if (user_id) {
    //   // 从数据库中
    //   result = await handleDB(res, "info_user", "find", "数据库查询错误", `id = ${user_id}`)
    // }



    // 使用common.js封装好的
    let result = await common.getUser(req, res); // 处理右上角是否登录展示问题

    // --------------------------------------------------------------------------------------------



    // --------------------------------------------------------------------------------------------
    // 确保一些接口不登录就不能访问（应该放在user用户信息页使用）

    // 方法一：判断用户是不是[]，是的话，就是符合条件，进入该if-return；不是的话[{}]，就不符合条件，不进入该if，继续往下执行
    // if(!result[0]){
    //   res.send({errno: "4101"}); // 返回这个错误码告诉前端，由前端写一个弹出登录框
    //   return
    // }
    // 方法二：判断用户[]的长度，没有值[]的length就是0；有值[]的length就是大于0
    // if(result.length == 0 ) {
    //   res.send("没登陆不能访问");
    //   return
    // }
    // --------------------------------------------------------------------------------------------



    // --------------------------------------------------------------------------------------------
    // 展示首页右侧点击排行的效果
    // 查询数据 排序 取前6条

    // 排序查询的写法一：
    // 注意点：where 1 是可以省略不写的，它的含义是在这里where 1，1为真，也就是where后的条件为真，查询表中所有内容。而这里为什么要写呢？因为 这里"" 写字符串语句 就是相当于mysql里面的where后面的语句 那么 order by 是不能直接跟在where后面吧，所以要写一个 1 后面再跟上 order by clicks desc limit 6 完成这个查询需求
    let result2 = await handleDB(res, "info_news", "find", "数据库查询错误", "1 order by clicks desc limit 6")

    // 排序查询的写法二：
    // 通过自定义的sql写法去查询
    // let result3 = await handleDB(res, "info_news", "sql", "查询数据库出错", "select * from info_news order by clicks desc limit 6")
    // --------------------------------------------------------------------------------------------



    // --------------------------------------------------------------------------------------------
    // 对应的news_id详情页数据

    let { news_id } = req.params; // 获取到路径上的news_id

    let result3 = await handleDB(res, "info_news", "find", "数据库查询错误", "id = " + news_id)

    // 这里由于登录用户发布新闻时用了base64编码传到数据库的，所以这里想要展示数据，就要base64解码出来
    let basedecodeContent = Base64.decode(result3[0].content);
    // console.log(basedecodeContent); // 检查确实可以解码

    // 把想要展示的数据，base64解码出来再次赋值回 result3[0].content 上面
    result3[0].content = basedecodeContent
    
    // --------------------------------------------------------------------------------------------



    // --------------------------------------------------------------------------------------------
    // 确保  查询数据库  中有id为news_id这篇新闻，才可以继续往下操作 -- 这个是专本针对暴力访问，且确实可以访问得到的参数news_id的 没有这个news_id 才返回404
    if (!result3[0]) { // 如果没有这篇新闻，就返回404页面

      // 代码重复性高，抽取到common.js里面

      // let data = { // 右上角用户状态信息
      //   user_info: result[0] ? { // 三元表达式，如果result[0]是个空数组[]，那么就返回false；如果result[0]是个有参数的[{}]，那么就返回{参数}
      //     nick_name: result[0].nick_name,
      //     avatar_url: result[0].avatar_url
      //   } : false
      // }

      // res.render("news/404", data);



      // 使用common.js封装好的 -- 直接调用，就直接写就行了，不用接收，没有return过来参数，就不是promise对象，所以就更不用写await，async了
      common.abort404(req, res);

      return // 不会执行到下面的代码
    }

    // --------------------------------------------------------------------------------------------



    // --------------------------------------------------------------------------------------------
    // 详情页被点击后点击量加1

    // 点击量加1
    result3[0].clicks += 1; // 自己加1 -- 都是加1
    // let news_click = result3[0].clicks + 1; // 定个变量加1 -- 都是加1（这样写会慢更新 +1 不好）
    // 更新info_news表的clicks
    await handleDB(res, "info_news", "update", "数据库更新错误", `id = ${news_id}`, { clicks: result3[0].clicks })
    // --------------------------------------------------------------------------------------------



    // --------------------------------------------------------------------------------------------
    // 新闻按钮展示是否收藏

    // 获取登录用户的user_id -- 不需要用到这个数据
    // let user_id = req.session["user_id"];
    // 或者直接common.js通过封装好的,点语法，把user的id点出来
    // let user_id = result[0].id; -- 要写在if (result[0]) 里面



    // 登录的用户是不是已经收藏了这篇新闻，传一个布尔值给模板（定义一个是否收藏按钮显示的标识）
    let isCollected = false; // 默认是 false -- false就是没有收藏过

    // 判断用户是否有登录，不登陆不执行if代码（没登录肯定没有收藏）
    // 已经登录的用户，并且收藏的这篇新闻(查询数据库，查询一个表info_user_collection)
    if (result[0]) { // 如果已经登录

      let user_id = result[0].id; // 用户id

      // 查询是否有收藏过
      let result4 = await handleDB(res, "info_user_collection", "find", "数据库查询错误", `news_id = ${news_id} and user_id = ${user_id}`) // [{}] 或者 []

      // 有收藏
      if (result4[0]) {

        isCollected = true; // 收藏了这篇新闻就是true
      }
    }



    // --------------------------------------------------------------------------------------------



    // --------------------------------------------------------------------------------------------
    // 评论展示

    // 方式一： 通过for循环，链表查询获取数据 -- 对应的前端展示数据一
    // 查询和这篇新闻有关的评论，[{},{},...]，以创建时间降序排序
    let result5 = await handleDB(res, "info_comment", "find", "数据库查询错误", `news_id = ${news_id} order by create_time desc`)

    // 通过 for循环 给 result5（这个是查询出来的数据）是一个数组中每一个元素（每一条评论）进行处理，添加评论者的信息
    for (let i = 0; i < result5.length; i++) {
      // 查询数据库，查询 info_user 表 ，根据 result5[i]中的user_id属性来查询 -- 每一条评论找到对应的用户
      let result6 = await handleDB(res, "info_user", "find", "查询数据库错误", `id = ${result5[i].user_id}`)
      // [{}] 或者 []

      // 每一条评论 新增 对应用户的 头像 昵称
      result5[i].commenter = {
        nick_name: result6[0].nick_name, // 评论的昵称
        avatar_url: result6[0].avatar_url ? constant.QINIU_AVATAR_URL_PRE + result6[0].avatar_url : '/news/images/worm.jpg' // 评论的头像
      }


      //  如果有 parent_id 的话 就是有回复的
      if (result5[i].parent_id) {

        // 如果有父评论，查询父评论信息（info_comment），和父评论者的信息（info_user）
        // 这里因为在块级作用域内，而参数又想给外面的使用，那么就不用let，用var

        // 查询父评论信息 -- 主要是要拿到回复评论的内容
        var parentComment = await handleDB(res, "info_comment", "find", "数据库查询错误", `id = ${result5[i].parent_id}`)
        // [{}] 或者 []

        // 查询父评论者的信息 -- 主要是通过user_id找到对应的用户信息 nick_name
        var parentUserInfo = await handleDB(res, "info_user", "find", "数据库查询错误", `id = ${parentComment[0].user_id}`)
        // [{}] 或者 []

        // 每一条评论 新增 对应用户的 头像 昵称
        result5[i].parent = {
          user: {
            nick_name: parentUserInfo[0].nick_name // 回复的昵称
          },
          content: parentComment[0].content, // 评论（上一次回复）的内容
          avatar_url: parentUserInfo[0].avatar_url ? constant.QINIU_AVATAR_URL_PRE + result6[0].avatar_url : '/news/images/worm.jpg' // 回复的头像
        }

      }

    }

    // 方式二： inner join结合两个表直接显示数据的方式，链表查询获取数据 -- 对应的前端展示数据二
    // let result5 = await handleDB(res, "info_comment", "sql", "数据库查询错误", `select * from info_comment inner join info_user on info_comment.user_id = info_user.id order by info_comment.create_time desc`)
    // console.log(result5);
    // 剩下的步骤与方式一差不多


    // --------------------------------------------------------------------------------------------



    // --------------------------------------------------------------------------------------------
    // 点赞展示

    // 原理：把登录用户的点赞过的评论都全部查出来传给前端模块，结果是一个数组[{},{},{}...] => 组织成一个[id1，id2，id3，。。。]

    // 用来获取id组成的数组
    var user_like_comments_ids = []; // 放在if外面，是为了，没有用户登录，就不能高亮了，但登录用户有点赞过的，就会高亮

    // 判断是否有登录
    if (result[0]) {
      // 查询登录用户的点赞过的评论对象
      // info_commentResult可以告诉我们登录的用户点赞过的哪些评论
      let user_like_commentsResult = await handleDB(res, "info_comment_like", "find", "数据库查询错误", `user_id = ${result[0].id}`) // 查询条件？ user_id字段 = 登录用户的id

      // 遍历user_like_commentsResult每一个元素，取它的id，插入到user_like_comments_ids数组中
      user_like_commentsResult.forEach(element => {
        user_like_comments_ids.push(element.comment_id)
      });
    }

    // --------------------------------------------------------------------------------------------



    // --------------------------------------------------------------------------------------------
    // 查询 发布新闻的作者 的一些信息  result3查的是新闻，通过result3[0].user_id 就能找到 作者
    let result7 = await handleDB(res, "info_user", "find", "数据库查询错误", `id = ${result3[0].user_id}`)
    // [{}] 或者 []
    
    // 作者发布的新闻篇数
    let result8 = await handleDB(res, "info_news", "sql", "数据库查询错误", `select count(*) from info_news where user_id = ${result7[0].id}`)
    // [{ "count(*)": 800 }] 或者 []
    // console.log(result8[0]["count(*)"]);
    
    // 作者的粉丝数
    let result9 = await handleDB(res, "info_user_fans", "sql", "数据库查询错误", `select count(*) from info_user_fans where followed_id = ${result7[0].id}`)
    
    // 关注的展示 默认 false
    let isFollow = false; // 传到前端

    // 确保用户登录状态
    if(result[0]) {
      // 查询 info_user_fans 有没有关注到除自己外 作者
      let result10 = await handleDB(res, "info_user_fans", "find", "查询数据库错误", `follower_id = ${result[0].id} and followed_id = ${result7[0].id}`)
      // result[0].id 登录用户的id（主动关注）   result7[0].id 被关注的id

      // console.log(result);
      // console.log(result7);
      // console.log(result10);
      
      // 如果有被关注了，就会有数据
      if(result10[0]){
        // 把关注的展示 改为 true
        isFollow = true  // 传到前端
      }
    }

    // 当用户id == 作者id 不显示 关注按钮 -- 这是一种做法
    let isShowFollowBtn = result[0] ? (result[0].id == result7[0].id ? false : true) : true
    // 当用户result[0]没登陆时，就直接为true，都显示；当用户登陆后，用户id == 作者id 就是false ，否则就是true


    // --------------------------------------------------------------------------------------------



    // --------------------------------------------------------------------------------------------
    // 传到模板中去的 数据

    let data = {
      // 用户信息
      user_info: result[0] ? { // 三元表达式，如果result[0]是个空数组[]，那么就返回false；如果result[0]是个有参数的[{}]，那么就返回{参数}
        nick_name: result[0].nick_name,
        avatar_url: result[0].avatar_url ? constant.QINIU_AVATAR_URL_PRE + result[0].avatar_url : '/news/images/person01.png'
      } : false,
      // 首页右侧点击排行信息
      newsClick: result2,
      // 对应的news_id详情页数据
      result: result3[0],
      // 是否收藏按钮显示的标识
      isCollected: isCollected,
      // 评论的信息
      comment: result5,
      // 点赞需要用的id数组
      user_like_comments_ids,
      // 新闻作者的信息
      authorInfo: result7[0],
      // 新闻作者的信息 -- 头像
      authorInfoImg: result7[0].avatar_url ? constant.QINIU_AVATAR_URL_PRE +  result7[0].avatar_url : '/news/images/user_pic.png',
      // 新闻作者的发布新闻篇数
      authorNewsCount: result8[0]["count(*)"],
      // 作者的粉丝数
      authorFansCount: result9[0]["count(*)"],
      // 关注按钮的显示
      isFollow,
      // 控制当登录用户==作者的时候，关注按钮的展示
      isShowFollowBtn
    }

    res.render("news/detail", data);
    // --------------------------------------------------------------------------------------------



  })();

})
// ---------------------------------------------------------------------------------------------------------------->



// <----------------------------------对应news_id收藏与取消收藏----------------------------------------------------
router.post("/news_detail/news_collect", (req, res) => {

  (async function () {

    /**
     * 业务流程：
     * 1. 获取登录用户用户信息，没有获取到，就return
     * 2. 获取参数，判空
     * 3. 查询数据库 判断新闻是否存在 不存在就return（为了确保news_id是有的）
     * 4. 根据action的值来判断实现 操作数据库插入或者删除 收藏 或者 取消收藏 的功能
     * 5. 返回操作成功
     */



    // 1.第一步
    // 使用common.js封装好的
    let result = await common.getUser(req, res); // 获取用户是否登录状态

    // 判断用户是不是登录了？不登陆返回错误信息给前端，前端弹出登录窗口
    if (!result[0]) { // 未登录return
      res.send({ errno: '4101' }); // 4101未登录错误码
      return // 不执行下面的代码
    }



    // 2.第二步
    // 获取前端传过来的参数 详情页的news_id action收藏
    let { news_id, action } = req.body;

    // 这两个参数重要，需要判空
    if (!news_id || !action) {
      res.send({ errmsg: "参数错误1" })
      return
    }



    // 3.第三步
    // 查询这个新闻是否存在
    let result2 = await handleDB(res, "info_news", "find", "查询数据错误", `id = ${news_id}`)
    if (!result2[0]) {
      res.send({ errmsg: "参数错误2" })
      return
    }



    // 4.第四步
    // 当前用户的user_id
    let user_id = result[0].id;

    // 当前时间 -- 收藏时间 -- 这个数据库自动生成
    // let creaet_time = (new Date()).toLocaleString();


    // 点击了收藏
    if (action === 'collect') {
      // 插入数据库 -- 收藏
      await handleDB(res, "info_user_collection", "insert", "数据库插入错误", { user_id: user_id, news_id: news_id })

      // 收藏 info_news 字段 comments_count +1
      // 直接查询 info_news 表 如果有值，就 +1 ，没有值，就赋值 1 -- 拿到这个数据给 数据库 插入
      let comments_count = result2[0].comments_count ? result2[0].comments_count + 1 : 1
      await handleDB(res, "info_news", "update", "数据库插入错误", `id = ${result2[0].id}`, { comments_count: comments_count })

      res.send({ errno: '0', errmsg: '操作成功' })
      return
    }

    // 点击了取消收藏
    if (action == 'cancel_collect') {
      // 删除数据库 -- 取消收藏
      await handleDB(res, "info_user_collection", "delete", "数据库删除错误", `news_id = ${news_id} and user_id = ${user_id}`);

      // 取消收藏 info_news 字段 comments_count -1
      // 直接查询 info_news 表 如果有值，就 -1 ，没有值，就赋值 0 -- 拿到这个数据给 数据库 删除
      let comments_count = result2[0].comments_count ? result2[0].comments_count - 1 : 0
      await handleDB(res, "info_news", "update", "数据库插入错误", `id = ${result2[0].id}`, { comments_count: comments_count })

      res.send({ errno: '0', errmsg: '操作成功' })
      return
    }



    // 5.第五步
    // 如果用if(){}else{}后  就这里写res.json({errno:"0",errmsg:"操作成功"});
    // 但是我把第五步放在第四步里面写了res.send({ errno: '0', errmsg: '操作成功' })



  })();

})

// -------------------------------------------------------------------------------------------------------------->



// <----------------------------------对应news_id评论------------------------------------------------------------
router.post("/news_detail/news_comment", (req, res) => {

  /**
   * 需要传的参数？
   * 两种情况：
   * 一种是评论新闻 评论的内容 新闻的id
   * 一种是回复别人的评论 回复的内容 parent_id（针对的那条评论就是父评论）
   */

  (async function () {

    // 1. 获取登录用户的信息，获取不到的就return
    // 使用common.js封装好的
    let result = await common.getUser(req, res); // 获取用户是否登录状态

    // 判断用户是不是登录了？不登陆返回错误信息给前端，前端弹出登录窗口
    if (!result[0]) { // 未登录return
      res.send({ errno: '4101' }); // 4101未登录错误码
      return // 不执行下面的代码
    }



    // 2. 获取参数，判空（而默认parent_id = null）
    let { news_id, comment, parent_id = null } = req.body
    // parent_id 的由来：就是这篇新闻的id，但是有人在对应的评论中回复，那么此时的新闻id就是回复的parent_id，从此回复就能与评论相关联，然后这个回复也是一个评论，就会生成新的一个id，得以存进数据库

    // 这两个参数重要，需要判空
    if (!news_id || !comment) {
      res.send({ errmsg: "参数错误1" })
      return
    }



    // 3. 查询新闻，看看新闻是否存在
    let result2 = await handleDB(res, "info_news", "find", "查询数据错误", `id = ${news_id}`)
    if (!result2[0]) {
      res.send({ errmsg: "参数错误2" })
      return
    }



    // 4. 往数据库中插入数据（如果有传到parent_id，这个属性也要记得要插入）
    let parameter = {
      user_id: result[0].id,
      news_id: news_id,
      content: comment,
      create_time: new Date().toLocaleString() // 这里获取个时间（与数据库生成也是一样的）这样写是为了方便传参给下面的data使用
    }

    // 这里有个参数parent_id需要判断（因为回复需要用到这个parent_id）
    if (parent_id) { // 如果传了parent_id，就是新添加这个属性
      parameter.parent_id = parent_id

      // 如果有父评论，查询父评论信息（info_comment），和父评论者的信息（info_user）
      // 这里因为在块级作用域内，而参数又想给外面的使用，那么就不用let，用var

      // 查询父评论信息 -- 主要是要拿到回复评论的内容
      var parentComment = await handleDB(res, "info_comment", "find", "数据库查询错误", `id = ${parent_id}`)
      // [{}] 或者 []

      // 查询父评论者的信息 -- 主要是通过user_id找到对应的用户信息 nick_name
      var parentUserInfo = await handleDB(res, "info_user", "find", "数据库查询错误", `id = ${parentComment[0].user_id}`)
      // [{}] 或者 []


    }
    // 只有一个语句是可以简写
    // if (parent_id) parameter.parent_id = parent_id;

    let result3 = await handleDB(res, "info_comment", "insert", "数据库插入错误", parameter)



    // 5. 返回成功的响应（看前端需要什么）
    let data = {
      user: {
        nick_name: result[0].username, // 评论的昵称
        avatar_url: result[0].avatar_url ? constant.QINIU_AVATAR_URL_PRE + result[0].avatar_url : '/news/images/worm.jpg' // 评论的头像
      },
      content: comment, // 评论的内容
      news_id: news_id, // 评论的news_id
      id: result3.insertId, // 新评论插入的id
      create_time: parameter.create_time, // 直接拿上面的数据 评论的时间

      // 这是有 parent_id 才会传出去的数据，没有就是传 null
      parent: parent_id ? { // 通过三元表达式来判断传parent数据 如果有parent_id的，就证明有父评论的信息，就返回到前端去 如果没有就是返回null
        user: {
          nick_name: parentUserInfo[0].nick_name // 回复的昵称
        },
        content: parentComment[0].content // 回复的内容
      } : null

    }

    res.send({ errno: '0', errmsg: '操作成功', data })



  })();

})



// -------------------------------------------------------------------------------------------------------------->



// <----------------------------------对应news_id点赞------------------------------------------------------------
router.post("/news_detail/comment_like", (req, res) => {
  (async function () {
    /**
     * 参数：
     * 哪一个用户（登录用户，可以直接获取登录用户id） 点赞了哪一条评论 comment_id
     * 点赞和取消点赞 都是这个接口处理，所以还要有一个参数 action
     */


    // 1. 获取登录用户的信息

    // 使用common.js封装好的
    let result = await common.getUser(req, res); // 获取用户是否登录状态

    // 判断用户是不是登录了？不登陆返回错误信息给前端，前端弹出登录窗口
    if (!result[0]) { // 未登录return
      res.send({ errno: '4101' }); // 4101未登录错误码
      return // 不执行下面的代码
    }



    // 2. 获取参数，判空

    let { comment_id, action } = req.body

    // 这两个参数重要，需要判空
    if (!comment_id || !action) {
      res.send({ errmsg: "参数错误1" })
      return
    }




    // 3. 查询数据库，看看这条评论是否存在，不存在就返回return
    let result2 = await handleDB(res, "info_comment", "find", "数据库查询错误", `id = ${comment_id}`)
    // 因为 comment_id 就是对应 info_comment的字段 id 的

    // 不存在新闻就是返回错误
    if (!result2[0]) {
      res.send({ errmsg: "参数错误2" })
      return
    }

    // console.log(action);

    // 4. 根据action的值是add还是remove来确定要执行点赞还是取消点赞（infp_comment表中的 like_count + 1）
    //    （执行点赞：把哪一个用户点赞了哪条评论的信息，作为一条记录保存到数据库， info_comment_like表）
    //    （取消点赞：在info_comment_like表中删除这条记录）
    if (action === "add") {

      // 执行点赞 -- 插入这一条数据库 info_comment_like

      await handleDB(res, "info_comment_like", "insert", "数据库插入错误", {
        // comment_id: comment_id, // 两个参数名一样，可以简写
        comment_id,
        user_id: result[0].id // 登录用户的id
      })



      // 先保存点赞数量 -- 是看 info_comment 这个数据库的

      // var like_count = result2[0].like_count + 1 // 也可以，没有预防null

      var like_count = result2[0].like_count ? result2[0].like_count + 1 : 1;
      // 这里的三元表达式，因为刚开始数据库是null，预防第一次 null + 1，所以如果like_count已经是有值的了，那么就直接+1（这是第一次之后发生的 +1 了）；如果like_count没有值，那么就直接填上 1 （这肯定是第一次发生的 +1 了），这样才能做到预防数据库错误

    } else {

      // 执行取消点赞 -- 删除这一条数据库info_comment_like
      await handleDB(res, "info_comment_like", "delete", "数据库删除错误", `comment_id = ${comment_id} and user_id = ${result[0].id}`)
      // comment_id（评论的id） user_id（登录用户的id）



      // 先保存点赞数量 -- 是看 info_comment 这个数据库的

      // var like_count = result2[0].like_count - 1 // 也可以，没有预防null

      var like_count = result2[0].like_count ? result2[0].like_count - 1 : 0;
      // 这里的三元表达式，因为刚开始数据库是null，预防第一次 null - 1，所以如果like_count已经是有值的了，那么就直接-1（这是第一次之后发生的 -1 了）；如果like_count没有值（或者说like_count是 0 值，0的话就是undefined -> false -> 所以还是拿到判断后面的 0 ），那么就直接填上 0 （这肯定是第一次发生的 -1 了），这样才能做到预防数据库错误

    }

    // 因为无论添加还是删除，都要update，那么就直接写在这里，接收上面获取到的值放到这里更新就行了

    // 点赞数查询 -- 拿到上面的 like_count 更新到 info_comment 这个数据库  同名简写 like_count: like_count
    await handleDB(res, "info_comment", "update", "数据库更新错误", `id = ${comment_id}`, { like_count })
    // comment_id 就是对应 info_comment数据库的 id 找到对应的评论 更新like_count




    // 5. 返回操作成功
    res.send({ errno: '0', errmsg: '操作成功' })



  })();

})
// -------------------------------------------------------------------------------------------------------------->



// <----------------------------------作者关注与取消关注------------------------------------------------------------
router.post("/news_detail/followed_user", (req, res) => {

  (async function() {



    // 1. 判断登录用户，没有就return
    let result = await common.getUser(req, res);

    if(!result[0]) {
      res.send({errno: "4101", errmsg: "用户没有登录"})
      return
    }



    // 2. 获取参数，判空
    let { user_id, action } = req.body;
    // user_id是被关注者的id

    if(!user_id || !action){
      res.send({errmsg: '参数错误1'});
      return
    }



    // 当登录用户id == 新闻作者id 不能关注  -- 这是一种做法
    // if(user_id == result[0].id){
    //   res.send({errmsg: '不能关注自己'});
    //   return
    // }



    // 3. 查询数据库，判断被关注者用户是否存在，不存在就return（为了确保user_id是有的）
    let result2 = await handleDB(res, "info_user", "find", "数据库查询错误", `id = ${user_id}`)
    if(!result2[0]){
      res.send({errmsg: '参数错误2'});
      return
    }



    // 4. 根据action来控制数据库
    if(action === 'follow'){
      await handleDB(res, "info_user_fans", "insert", "数据库插入错误", {
        follower_id: result[0].id,
        followed_id: user_id
      })
    } else {
      await handleDB(res, "info_user_fans", "delete", "数据库删除错误", `follower_id = ${result[0].id} and followed_id = ${user_id}`)
    }



    // 5. 成功返回
    res.send({ errno: '0', errmsg: '操作成功' })



  })();

})



// -------------------------------------------------------------------------------------------------------------->




module.exports = router;


// 知识点：前端html代码上直接写路径参数的 -> infopath获取参数的方式 req.params