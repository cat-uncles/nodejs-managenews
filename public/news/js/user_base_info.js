function getCookie(name) {
    var r = document.cookie.match("\\b" + name + "=([^;]*)\\b");
    return r ? r[1] : undefined;
}

$(function () {

    $(".base_info").submit(function (e) {
        e.preventDefault() // 阻止默认提交行为，action 如果不写，就是直接提交到本地址 -- 就是ajax的地址

        var signature = $("#signature").val();
        var nick_name = $("#nick_name").val();
        // var gender = $(".gender").val()
        var gender = $(".base_info").find('input:radio:checked').val();

        // trim() 去除两边无用空白格 length == 0 ，说明没有输入内容
        if($.trim(signature).length == 0) {
            $('#signature').val('什么都没留下') // 能实时更新到前端 -- ajax的无刷新
        }
        
        if (!nick_name) {
            alert('请输入昵称')
            return
        }
        if (!gender) {
            alert('请选择性别')
        }

        // TODO 修改用户信息接口
        var params = {
            "signature": $.trim(signature),
            "nick_name": $.trim(nick_name),
            "gender": gender
        }

        
        
        
        $.ajax({
            url: "/user/base_info",
            type: "post",
            contentType: "application/json",
            headers: {
                "X-CSRFToken": getCookie("csrf_token")
            },
            data: JSON.stringify(params),
            success: function (resp) {
                if (resp.errno == "0") {
                    // 更新父窗口内容
                    $('.user_center_name', parent.document).html(params['nick_name']) // 通过指定名称  -->  更新父窗口的内容
                    $('#nick_name', parent.document).html(params['nick_name'])
                    $('.user_nav', parent.document).html(params['nick_name'])
                    $('.input_sub').blur()
                    alert(resp.errmsg)
                }else {
                    alert(resp.errmsg)
                }
            }
        })
        
    })
})