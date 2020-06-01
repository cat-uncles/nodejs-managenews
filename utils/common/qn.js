// 引入第三方包 qiniu
const qiniu_sdk = require('qiniu')

// 该配置文件的内容是可以参考第三方服务器（七牛）里面的 SDK文档 https://developer.qiniu.com/kodo/sdk/3828/node-js-v6

// const { qiniu } = require('../../../config/')
qiniu_sdk.conf.ACCESS_KEY = 'q3mcaHZe6V4vG5XtAUBP1368VVrDLcdlJIRpDhS5'; // 这就是在 第三方服务器（七牛）AK码
qiniu_sdk.conf.SECRET_KEY = 'KfecHwFTh9jOXHNqdszh5a2vw_3iDjvSAS6zUPs1'; // 这就是在 第三方服务器（七牛）SK码
 
// 要上传的空间
const bucket = "inews02" // 这就是在 第三方服务器（七牛）上传的空间，一定要对应
 
// 文件前缀
const prefix = 'image/avatar/' // 这就是在 第三方服务器（七牛）里面生成的文件前缀
 
// 生成上传文件的 token -- 认为你是安全的，就是防止跨域的一个方法
const token = (bucket, key) => {
    
    const policy = new qiniu_sdk.rs.PutPolicy({ isPrefixalScope: 1, scope: bucket + ':' + key })
 
 
    return policy.uploadToken()
}
 
const config = new qiniu_sdk.conf.Config()
 
async function upload_file(file_name, file_path){
    // 保存到七牛的地址
    const file_save_path = prefix + file_name
 
    // 七牛上传的token
    const up_token = token(bucket, file_save_path)
 
    const extra = new qiniu_sdk.form_up.PutExtra()
 
    const formUploader = new qiniu_sdk.form_up.FormUploader(config)
 
    // 上传文件
    let ret = await new Promise((resolve, reject)=>{

        // 这里就是上传到第三方服务器（七牛）的方法
        formUploader.putFile(up_token, file_save_path, file_path, extra, (err, data) => {
            if (!err) {
                // 上传成功， 处理返回值
                resolve(data);
            } else {
                // 上传失败， 处理返回代码
                reject(data);
            }
        });    
    }) 
    return ret
}

// 外面引入该文件后 使用的方法 
// upload_file(上传后的名字，上传的图片路径)   //上传的图片相对路径, 从项目文件夹出发
// upload_file('01.jpg', './01.jpg')  

// 直接抛出 上传到第三方服务器（七牛）的方法
module.exports = upload_file