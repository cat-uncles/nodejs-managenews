function getCookie(name) {
    var r = document.cookie.match("\\b" + name + "=([^;]*)\\b");
    return r ? r[1] : undefined;
}

// 这种ajax 就是与post有关，而get一点联系都没有的。后端是不用经过这个js文件的
$(function () {

    $(".collections").click(function () {
        // TODO 取消收藏当前新闻
        var news_id = $(".collections").attr('data-newid');
        var params = {
            "action": "cancel_collect",
            "news_id": news_id
        }
        
        $.ajax({
            url: "/news/collection_user",
            type: "post",
            contentType: "application/json",
            headers: {
                "X-CSRFToken": getCookie("csrf_token")
            },
            data: JSON.stringify(params),
            success: function (resp) {
                if (resp.errno == "0") {
                    
                    window.location.reload()
                }else if (resp.errno == "4101"){
                    // 未登录，弹出登录框
                    $('.login_form_con').show();
                }else {
                    // 取消收藏失败
                    alert(resp.errmsg)
                }
            }
        })
        

    })
})