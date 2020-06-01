// ---------------------------------------------------------------------------------
// 1. 引入art-template
const template = require("art-template");

// 2. 过滤器函数
/**
 * 格式：
 * template.defaults.imports.过滤器名称 = function(value){
 *  return 过滤后的数据
 * }
 */

template.defaults.imports.classNameFilter = function (value) {    //value接收html中“|”前面的值 $index
  if (value === 0) {
    return "first"
  } else if (value === 1) {
    return "second"
  } else if (value === 2) {
    return "third"
  } else {
    return ""
  }
};

// 过滤器是 挂载 在模板art-template上面
// 这里不用写 导出 是因为，这里的东西是给html页面用的，不是给js使用的

// 3. 在模板中使用过滤器函数 {{ 数据 | 过滤器名称 }}
// 由于是直接使用的，不用定义一个常量来接收它，直接引入调用里面的filter方法
// 因为是在index.html上使用，那么就在index.js里面引入：require("../utils/filters/filters");  --  不引入也可以的

// 知识点：在这里写的过滤器都是直接添加到art-template这个里面了。直接为全局，可以不用单独引入require("../utils/filters/filters");






// 另外一种方法：其实也可以通过前端的方式来解决，伪类的方式，在index.css上面改

// 还有第三种方法：在前端html代码写 <span class="{{ $index == 0 ? "first" : $index == 1 ? "second" : $index == 2 ? "third" : "" }}"></span>
// ---------------------------------------------------------------------------------





// ---------------------------------------------------------------------------------
// 这是另一个过滤器了，一般所有的过滤器都写在这个文件里面统一管理，也可以分开写

// dateFormat 时间格式转换过滤器
// const template = require("art-template");

// template.defaults.imports.dateFormat= function(value){
//   var d = new Date(value);  //2018-01-16T21:19:19.000Z
//   var times=d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds(); 

//   return times
// }
// ---------------------------------------------------------------------------------



// ----------------------------------------------------------------------------
// 这是一个状态过滤器

// 文字过滤
template.defaults.imports.statusFilter = function (value) {
  if (value === 0) {
    return "已通过"
  } else if (value === 1) {
    return "审核中"
  } else if (value === 2) {
    return "未通过"
  }
}



// 样式过滤
template.defaults.imports.statusClassFilter = function (value) {
  if (value === 0) {
    return "pass"
  } else if (value === 1) {
    return "review"
  } else if (value === 2) {
    return "nopass"
  }
}

// ----------------------------------------------------------------------------