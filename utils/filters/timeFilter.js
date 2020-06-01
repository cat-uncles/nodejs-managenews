const template = require("art-template");

// art-template模板方式
template.defaults.imports.dateFormat= function(value){
  var d = new Date(value);  //2018-01-16T21:19:19.000Z
  var times=d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds(); 
  
  return times
}


// 函数方式
function dateFormat1(value){
  var d = new Date(value);  //2018-01-16T21:19:19.000Z
  var times=d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds(); 
  return times
}

module.exports = {
   dateFormat1
}