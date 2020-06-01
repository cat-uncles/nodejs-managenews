// 专本做测试用的接口

const express = require("express");

// 要引入才能用数据库
const handleDB = require("../db/handleDB");

const router = express.Router();



// 该接口是测试给用户添加收藏新闻的test
router.get("/create_collections", (req, res)=>{
    (async function(){
        for(let i=210;i<256;i++){
            let a = await handleDB(res, "info_user_collection", "insert", "数据库插入出错", {
                user_id:12,
                news_id:i
            })
        }
    })();
})
//备注：需要多次重启服务器，因为会有卡顿报错，一般重启两次服务器就能成功收藏了



module.exports = router;