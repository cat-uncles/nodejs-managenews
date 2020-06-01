// yarn add svg-captcha
var svgCaptcha = require('svg-captcha');

// 用类的方式更好扩展，所以推荐用class
class Captcha{


    getCode(){
        var captcha = svgCaptcha.create({ 
            inverse: false, // 翻转颜色 
            fontSize: 48, // 字体大小 
            noise: 2, // 噪声线条数 
            width: 100, // 宽度 
            height: 40, // 高度 
            size: 4,// 验证码长度
            ignoreChars: '0o1i', // 验证码字符中排除 0o1i
            color: true // 验证码的字符是否有颜色，默认没有，如果设定了背景，则默认有
        }); 
        return captcha
        // constructor()方式的话，也可以，但是constructor一般没有返回return，而这里通过函数方法的方式能得到一个值从而把这个值return返回出去，所以这里使用函数方法的方式
    }
    
}
 

// let captchaObj = new Captcha();
// let captcha = captchaObj.getCode();
// console.log(captcha.text)
// console.log(captcha.text.toLowerCase());
// console.log(String(captcha.data));    //将来要发送给客户端的数据


module.exports = Captcha