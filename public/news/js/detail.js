function getCookie(name) {
    var r = document.cookie.match("\\b" + name + "=([^;]*)\\b");
    return r ? r[1] : undefined;
}


$(function () {
    updateCommentCount()

    // 打开登录框
    $('.comment_form_logout').click(function () {
        $('.login_form_con').show();
    })

    // 收藏
    $(".collection").click(function () {

        //获取到新闻编号
        var news_id = $(".collection").attr('data-newid');
        var action = "collect"
        var params = {
            "news_id": news_id,
            "action": action // 因为收藏和取消收藏都是写在一个接口，作为一个区分使用
        }
        $.ajax({
            url: "/news_detail/news_collect",
            type: "post",
            contentType: "application/json",
            headers: {
                "X-CSRFToken": getCookie("csrf_token")
            },
            data: JSON.stringify(params),
            success: function (resp) {
                if (resp.errno == "0") {
                    // 收藏成功
                    // 隐藏收藏按钮
                    $(".collection").hide();
                    // 显示取消收藏按钮
                    $(".collected").show();
                } else if (resp.errno == "4101") {
                    $('.login_form_con').show();
                } else {
                    alert(resp.errmsg);
                }
            }
        })

    })

    // 取消收藏
    $(".collected").click(function () {

        var news_id = $(".collected").attr('data-newid');
        var action = "cancel_collect"
        var params = {
            "news_id": news_id,
            "action": action // 因为收藏和取消收藏都是写在一个接口，作为一个区分使用
        }
        $.ajax({
            url: "/news_detail/news_collect",
            type: "post",
            contentType: "application/json",
            headers: {
                "X-CSRFToken": getCookie("csrf_token")
            },
            data: JSON.stringify(params),
            success: function (resp) {
                if (resp.errno == "0") {
                    // 收藏成功
                    // 显示收藏按钮
                    $(".collection").show();
                    // 隐藏取消收藏按钮
                    $(".collected").hide();
                } else if (resp.errno == "4101") {
                    $('.login_form_con').show();
                } else {
                    alert(resp.errmsg);
                }
            }
        })

    })

    // 评论提交
    $(".comment_form").submit(function (e) { // 该事件只适用于表单元素 submit() 方法触发 submit 事件，或规定当发生 submit 事件时运行的函数
        e.preventDefault();
        // 获取当前标签中的,新闻编号,评论内容
        var news_id = $(this).attr('data-newsid')
        var news_comment = $(".comment_input").val();

        if (!news_comment) {
            alert('请输入评论内容');
            return
        }
        var params = {
            "news_id": news_id,
            "comment": news_comment
        };

        $.ajax({
            url: "/news_detail/news_comment",
            type: "post",
            contentType: "application/json",
            headers: {
                "X-CSRFToken": getCookie("csrf_token")
            },
            data: JSON.stringify(params),
            success: function (resp) {
                if (resp.errno == '0') { // ajax可以无刷新浏览器都可以新增显示的内容
                    var comment = resp.data
                    // 拼接内容
                    var comment_html = ''
                    comment_html += '<div class="comment_list">'
                    comment_html += '<div class="person_pic fl">'
                    if (comment.user.avatar_url) {
                        comment_html += '<img src="' + comment.user.avatar_url + '" alt="用户图标">'
                    } else {
                        comment_html += '<img src="/news//news/static/news/images/person01.png" alt="用户图标">'
                    }
                    comment_html += '</div>'
                    comment_html += '<div class="user_name fl">' + comment.user.nick_name + '</div>'
                    comment_html += '<div class="comment_text fl">'
                    comment_html += comment.content
                    comment_html += '</div>'
                    comment_html += '<div class="comment_time fl">' + comment.create_time + '</div>'

                    comment_html += '<a href="javascript:;" class="comment_up fr" data-commentid="' + comment.id + '" data-newsid="' + comment.news_id + '">赞</a>'
                    comment_html += '<a href="javascript:;" class="comment_reply fr">回复</a>'
                    comment_html += '<form class="reply_form fl" data-commentid="' + comment.id + '" data-newsid="' + news_id + '">'
                    comment_html += '<textarea class="reply_input"></textarea>'
                    comment_html += '<input type="button" value="回复" class="reply_sub fr">'
                    comment_html += '<input type="reset" name="" value="取消" class="reply_cancel fr">'
                    comment_html += '</form>'

                    comment_html += '</div>'
                    // 拼接到内容的前面
                    $(".comment_list_con").prepend(comment_html)
                    // 让comment_sub 失去焦点
                    $('.comment_sub').blur();
                    // 清空输入框内容
                    $(".comment_input").val("")

                    //更新评论数量
                    updateCommentCount();
                } else {
                    alert(resp.errmsg)
                }
            }
        })


    })

    // 这样理解:$(this)就是把原生JS this对象 封装成jquery对象,相当于原生JS this的加强版 最外层$(this)指向jQuery对象
    // $(selector).delegate(childSelector,event,data,function) 在这个function中，$(this)指向childSelectot
    /**
     * 首先要理解的是js中函数的this是指向调用这个函数的对象（当前被选中的对象），在jq里面，在一个对象上调用一个方法并引入一个匿名函数作为参数时，jq会将函数中的this指向到其触发的原生节点对象上，这里就比如a,input节点。然后$()是jq将原生节点对象包装为jq对象，使其能够使用各类的jq方法
     */

    // 给a,input标签添加了代理事件
    $('.comment_list_con').delegate('a,input', 'click', function () { // delegate() 指定的元素（属于被选元素的子元素）添加一个或多个事件处理程序，并规定当这些事件发生时运行的函数。

        // console.log($(this));
        
        //获取到点击标签的class属性, reply_sub
        var sHandler = $(this).prop('class'); // prop()  方法设置或返回被选元素的属性和值

        // console.log(sHandler); // 获取到被点击后的class属性

        // 判断方法就是通过获取到的sHandler这个class属性，如果被点击后class是有值的，那么肯定是 >= 0 ，而没有值的就肯定是 -1 从而实现 四个按钮 分别被点击 而又不互相 影响

        // console.log(sHandler.indexOf('comment_reply'));
        if (sHandler.indexOf('comment_reply') >= 0) { // 这是javascript里面的方法 indexOf() 返回字符串中指定字符串值的第一个匹配项。indexOf()方法是区分大小写的!知如果要检索的字符道串值没有出现，则该方法返回-1
            $(this).next().toggle(); // next() 获得匹配元素集合中每个元素紧邻的同胞元素。如果提供选择器，则取回匹配该选择器的下一个同胞元素
            // 这个元素的下一个同级元素 -- from 显示 与 隐藏
        }
        // console.log(sHandler.indexOf('reply_cancel'));
        if (sHandler.indexOf('reply_cancel') >= 0) {
            $(this).parent().toggle(); // parent() 获得当前匹配元素集合中每个元素的父元素，使用选择器进行筛选是可选的
            // 这个子元素的父元素 -- from 显示 与 隐藏
        }

        // 点赞处理
        if (sHandler.indexOf('comment_up') >= 0) {

            var $this = $(this); // 为了下面的也能拿到 a标签 这个对象
            var action = "add"
            if (sHandler.indexOf('has_comment_up') >= 0) {
                // 如果当前该评论已经是点赞状态，再次点击会进行到此代码块内，代表要取消点赞
                action = "remove"
            }
            //获取到当前点击的标签上面的, 评论编号, 新闻编号
            var comment_id = $(this).attr("data-commentid") // 就是新闻的id
            // var news_id = $(this).attr("data-newsid")
            var params = {
                "comment_id": comment_id,
                "action": action,
                // "news_id": news_id
            }

            $.ajax({
                url: "/news_detail/comment_like",
                type: "post",
                contentType: "application/json",
                headers: {
                    "X-CSRFToken": getCookie("csrf_token")
                },
                data: JSON.stringify(params),
                success: function (resp) {
                    if (resp.errno == "0") {

                        // 写这一块的原因：在没有刷新的情况下，解决样式，点赞数的问题

                        //获取到当前标签中的点赞数量
                        var like_count = $this.attr('data-likecount')

                        //增加安全性校验,如果获取不到data-likecount的值,那么默认设置成0
                        if (like_count == undefined) {
                            like_count = 0;
                        }

                        // 更新点赞按钮图标,并加1, 减1操作
                        if (action == "add") {
                            like_count = parseInt(like_count) + 1 // parseInt() 字符串 转 number
                            // 代表是点赞
                            $this.addClass('has_comment_up') // 加高亮
                        } else { // remove
                            like_count = parseInt(like_count) - 1
                            $this.removeClass('has_comment_up') // 移除高亮
                        }

                        // 更新点赞数据,重新赋值回去
                        $this.attr('data-likecount', like_count) // attr(属性, 属性值)
                        if (like_count == 0) {
                            $this.html("赞")
                        } else {
                            $this.html(like_count) // 注意 html 和 text 用法
                        }
                    } else if (resp.errno == "4101") {
                        $('.login_form_con').show();
                    } else {
                        alert(resp.errmsg)
                    }
                }
            })

        }

        // console.log(sHandler.indexOf('reply_sub'));

        // 评论回复
        if (sHandler.indexOf('reply_sub') >= 0) {

            var $this = $(this) // jq对象
            // reply_sub 这个的父元素
            var news_id = $this.parent().attr('data-newsid') // attr() 也是获取class属性
            var parent_id = $this.parent().attr('data-commentid') // 这里把该篇新闻的id获取后 赋给parent_id 使用
            var comment = $this.prev().val() // prev() 前一个元素 -- textarea 输入的内容

            if (!comment) { // 没输入内容，提示
                alert('请输入评论内容')
                return
            }
            var params = {
                "news_id": news_id,
                "comment": comment,
                "parent_id": parent_id
            }
            $.ajax({
                url: "/news_detail/news_comment",
                type: "post",
                contentType: "application/json",
                headers: {
                    "X-CSRFToken": getCookie("csrf_token")
                },
                data: JSON.stringify(params),
                success: function (resp) {
                    if (resp.errno == "0") {
                        var comment = resp.data
                        // 拼接内容
                        var comment_html = ""
                        comment_html += '<div class="comment_list">'
                        comment_html += '<div class="person_pic fl">'

                        // 前端这里也做了一个是否有头像的判断，但是后端也写了一个判断，两个相互不影响，或者注释其中一个也可以

                        if (comment.user.avatar_url) {
                            comment_html += '<img src="' + comment.user.avatar_url + '" alt="用户图标">'
                        } else {
                            comment_html += '<img src="/news//news/static/news/images/person01.png" alt="用户图标">'
                        }

                        comment_html += '</div>'
                        comment_html += '<div class="user_name fl">' + comment.user.nick_name + '</div>'
                        comment_html += '<div class="comment_text fl">'
                        comment_html += comment.content
                        comment_html += '</div>'
                        comment_html += '<div class="reply_text_con fl">'
                        comment_html += '<div class="user_name2">' + comment.parent.user.nick_name + '</div>'
                        comment_html += '<div class="reply_text">'
                        comment_html += comment.parent.content
                        comment_html += '</div>'
                        comment_html += '</div>'
                        comment_html += '<div class="comment_time fl">' + comment.create_time + '</div>'

                        comment_html += '<a href="javascript:;" class="comment_up fr" data-commentid="' + comment.id + '" data-newsid="' + comment.news_id + '">赞</a>'
                        comment_html += '<a href="javascript:;" class="comment_reply fr">回复</a>'
                        comment_html += '<form class="reply_form fl" data-commentid="' + comment.id + '" data-newsid="' + news_id + '">'
                        comment_html += '<textarea class="reply_input"></textarea>'
                        comment_html += '<input type="button" value="回复" class="reply_sub fr">'
                        comment_html += '<input type="reset" name="" value="取消" class="reply_cancel fr">'
                        comment_html += '</form>'

                        comment_html += '</div>'
                        $(".comment_list_con").prepend(comment_html)
                        // 请空输入框
                        $this.prev().val('')
                        // 关闭
                        $this.parent().hide()

                        //更新评论数量
                        updateCommentCount();
                    } else {
                        alert(resp.errmsg)
                    }
                }
            })

        }
    })

    // 关注当前新闻作者
    $(".focus").click(function () {
        
        var user_id = $(this).attr('data-userid') // 作者的id ，被关注这的id
        var params = {
            "action": "follow",
            "user_id": user_id
        }
        $.ajax({
            url: "/news_detail/followed_user",
            type: "post",
            contentType: "application/json",
            headers: {
                "X-CSRFToken": getCookie("csrf_token")
            },
            data: JSON.stringify(params),
            success: function (resp) {
                if (resp.errno == "0") {
                    // 关注成功
                    var count = parseInt($(".follows b").html()); // 拿到b标签的内容 -- 转 number
                    count++;
                    $(".follows b").html(count + "") // 强制转string类型
                    $(".focus").hide()
                    $(".focused").show()
                }else if (resp.errno == "4101"){
                    // 未登录，弹出登录框
                    $('.login_form_con').show(); 
                }else {
                    // 关注失败
                    alert(resp.errmsg)
                }
            }
        })
        
    })

    // 取消关注当前新闻作者
    $(".focused").click(function () {
        
        var user_id = $(this).attr('data-userid')
        var params = {
            "action": "unfollow",
            "user_id": user_id
        }
        $.ajax({
            url: "/news_detail/followed_user",
            type: "post",
            contentType: "application/json",
            headers: {
                "X-CSRFToken": getCookie("csrf_token")
            },
            data: JSON.stringify(params),
            success: function (resp) {
                if (resp.errno == "0") {
                    // 取消关注成功
                    var count = parseInt($(".follows b").html());
                    count--;
                    $(".follows b").html(count + "")
                    $(".focus").show()
                    $(".focused").hide()
                }else if (resp.errno == "4101"){
                    // 未登录，弹出登录框
                    $('.login_form_con').show();
                }else {
                    // 取消关注失败
                    alert(resp.errmsg)
                }
            }
        })
        
    })
})

// 更新评论条数
function updateCommentCount() {
    var length = $(".comment_list").length
    $(".comment_count").html(length + "条评论")
    $(".detail_about .comment").html(length)
}