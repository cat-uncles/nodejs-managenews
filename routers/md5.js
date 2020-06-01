// 测试一下md5第三方包使用
// yarn add md5

const express = require("express");

// 引入md5
const md5 = require("md5"); // 不可逆 单向散列函数 明文一致 密文一致

const router = express.Router();

// 普通用法
router.get("/test_md5", (req, res) => {

  let testmd5Str = md5("hello") // 加密 5d41402abc4b2a76b9719d911017c592

  res.send(testmd5Str); // 返回到前端
})

// 加盐用法 -- 安全
router.get("/test_md5Pro", (req, res) => {

  // 双重md5 加盐 加密的处理方式
  let testmd5proStr = md5(md5("hello") + '%%%***&&^^$$@$))(*%$$HTHWJKjfdkfjg*^$(') // 加密 45b3ea1bd8afd55845e5c7626c81d9ad

  res.send(testmd5proStr); // 返回到前端
})

module.exports = router;