/**
 * JavaScript 提供两个方法来处理 Base64 编码和解码操作：btoa 方法将字符串或二进制值转化为 Base64 编码，atob 方法将Base64 编码转化为原来的编码。需要说明的是，在进行使用这些方法进行编码和解码的时候需要考虑到非 ASCII 码字符的情况，若是非 ASCII 码字符那么需要插入浏览器转码的操作。
 */

//  运行在浏览器上测试

// function base64Encode(str) {
//   return window.btoa(unescape(encodeURIComponent(str)));
// }

// base64Encode('man');

// function base64Decode(str) {
//   return decodeURIComponent(escape(window.atob(str)));
// }

// base64Decode('TNFU');


// Encode 编码
// Decode 解码



// 或者使用[第三方包](https://github.com/dankogai/js-base64)，里面封装了对应编码和解码的方法。

// yarn add js-base64

// const Base64 = require("js-base64").Base64;
// Base64.encode('hello');      // aGVsbG8=
// Base64.decode('aGVsbG8=');  // hello



// 测试一下base64第三方包使用

const express = require("express");

// 引入base64
const Base64 = require("js-base64").Base64;

const router = express.Router();

router.get("/test_base64", (req, res) => {

  let baseencodeStr = Base64.encode('hello'); // 编码 aGVsbG8=

  let basedecodeStr = Base64.decode('aGVsbG8='); // 解码 hello

  let data = {
    baseencodeStr,
    basedecodeStr
  }

  res.send(data); // 返回到前端
})

module.exports = router;