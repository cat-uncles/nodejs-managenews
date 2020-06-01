function getCookie(name) {
    var r = document.cookie.match("\\b" + name + "=([^;]*)\\b");
    return r ? r[1] : undefined;
}


$(function () {
    $(".pic_info").submit(function (e) {
        e.preventDefault()

        //TODO 上传头像
        // 上传头像,表单提交和其他提交方式不一样
        
        // $(this) 是指 $(".pic_info")
        $(this).ajaxSubmit({ // ajaxSubmit的前面一定是 当前的 对象
            url: "/user/pic_info", // 需要提交的 url
            type: "POST", // 提交方式 get/post
            headers: {
                "X-CSRFToken": getCookie('csrf_token')
            },
            success: function (resp) { // resp 保存提交后返回的数据，一般为 json 数据
                // 此处可对 resp 作相关处理
                if (resp.errno == "0") {
                    $(".now_user_pic").attr("src", resp.data.avatar_url)
                    $(".user_center_pic>img", parent.document).attr("src", resp.data.avatar_url)
                    $(".user_login>img", parent.document).attr("src", resp.data.avatar_url)
                }else {
                    alert(resp.errmsg)
                }
            }
        })
        
    })
})


// ajaxSubmit
// ajaxSubmit(obj)方法是jQuery的一个插件jquery.form.js里面的方法，所以使用此方法需要先引入这个插件。（在html里面已经引入了）
// 通常情况下，我们直接通过form提交的话， 提交后当前页面跳转到form的action所指向的页面。然而，很多时候我们比不希望提交表单后页面跳转，那么，我们就可以使用ajaxSubmit(obj)来提交数据