// 获取用户的状态信息
const handleDB = require("../db/handleDb.js");

async function getUser(req, res) {
  let user_id = req.session["user_id"];
  let result1 = [];
  if(user_id) {
    result1 = await handleDB(res, "info_user", "find", "数据库查询错误", `id=${user_id}`);
  }
  return result1;
}

module.exports = {
  getUser
}