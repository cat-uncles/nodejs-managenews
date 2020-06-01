// 前后端分离的推荐写法

// RESTful风格接口
// get post put delete
const express = require("express");

const handleDB = require("../db/handleDB");

const router = express.Router();

// 路径名称要有语义 category 就是 分类的id
router.get("/category", (req, res) => {

  (async function(){
    let result = await handleDB(res, "info_category", "find", "查询数据库错误", ["name"]);

    // 简单的返回
    // res.send(result);
    // 返回的数据：[{"name":"最新"},{"name":"股市"},{"name":"债市"},{"name":"商品"},{"name":"外汇"},{"name":"公司"}]

    // 详细的返回
    res.send({ // send或者json 作为接口使用，只返回数据，不考虑前端渲染
      status: "0", // 状态码
      reason: "新闻分类的请求", // 说明标题
      data: result // 请求的数据
    })

  })();

})

module.exports = router;