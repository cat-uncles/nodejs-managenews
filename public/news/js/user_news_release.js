function getCookie(name) {
    var r = document.cookie.match("\\b" + name + "=([^;]*)\\b");
    return r ? r[1] : undefined;
}


$(function () {

    $(".release_form").submit(function (e) {
        e.preventDefault()

        // 发布新闻, ajaxSubmit属于表单提交
        
        $(this).ajaxSubmit({
            //是为了处理富文本(可以有颜色,大小)
            beforeSubmit: function (request) {
                // 这是由于beforeSubmit这个提交前回调函数的原因，它有三个形参(formData, jqForm, options),其中一个形参formData，是可以获取到from表单中的 输入表单标签，例如<input>,<textarea>，所以是可以获得一个具体的 标签数组[{标签1的所有内容},{标签2的所有内容}...{}]

                // console.log(request);
                
                // 在提交之前，对参数进行处理
                for(var i=0; i<request.length; i++) { // 将所有的标签遍历出来
                    var item = request[i]
                    if (item["name"] == "content") {
                        item["value"] = tinyMCE.activeEditor.getContent()
                        // 获取内容：tinymce.activeEditor.getContent() -- 这是tinymce富文本编辑器插件的功能 -- （这一步很重要，因为要把富文本的内容提交到数据库必须要写上）
                    }
                }

                // 由于ajaxSubmit，它是可以自动提交表单到后端的
                
            },
            url: "/user/news_release",
            type: "POST",
            headers: {
                "X-CSRFToken": getCookie('csrf_token')
            },
            success: function (resp) {
                if (resp.errno == "0") {
                    // 选中索引为6的左边单菜单 -- 跳转了到新闻列表
                    window.parent.fnChangeMenu(6)
                    // 滚动到顶部
                    window.parent.scrollTo(0, 0)

                    // window.parent说明 window.parent能获取一个框架的父窗口或父框架
                }else {
                    // $(".error_tip2").show();
                    alert(resp.errmsg)
                }
            }
        })
        
    })
})