var currentCid = 1; // 当前分类 id
var cur_page = 1; // 当前页
var total_page = 1;  // 总页数
var is_data_querying = true;   // 是否正在向后台获取数据 -- 一个后台是否获取的标识


$(function () {

    //调用updateNewsData方法跟新数据
    updateNewsData()

    // 首页分类切换
    $('.menu li').click(function () {
        var clickCid = $(this).attr('data-cid')
        $('.menu li').each(function () { // 排他思想
            $(this).removeClass('active')
        })
        $(this).addClass('active')

        if (clickCid != currentCid) {
            // 记录当前分类id
            currentCid = clickCid

            // 重置分页参数
            cur_page = 1
            total_page = 1
            updateNewsData()
        }
    })

    //页面滚动加载相关
    $(window).scroll(function () { // scroll滚动

        // 浏览器窗口高度
        var showHeight = $(window).height();

        // 整个网页的高度
        var pageHeight = $(document).height();

        // 页面可以滚动的距离
        var canScrollHeight = pageHeight - showHeight;

        // 页面滚动了多少,这个是随着页面滚动实时变化的
        var nowScroll = $(document).scrollTop();

        if ((canScrollHeight - nowScroll) < 100) {
            // TODO 判断页数，去更新新闻数据


            if (!is_data_querying) {
                // 将`是否正在向后端查询新闻数据`的标志设置为真
                // 防止页面滚动时多次向服务器请求数据
                is_data_querying = true;
                // 判断是否还有`下一页`，如果有则继续 '请求获取' '下一页'内容
                if (cur_page < total_page) {
                    // 获取下一页的数据，所以需要当前页码+1
                    cur_page += 1

                    updateNewsData();
                } else {
                    is_data_querying = false;
                }
            }
        }
    })
})

function updateNewsData() {
    // TODO 更新新闻数据
    var params = {
        "page": cur_page,
        "cid": currentCid,
        'per_page': 5
    }
    //开始请求，将is_data_querying设置为true
    is_data_querying = true;

    // get请求，第一次打开网页就能展示5条数据 -- 后面只要触发这个方法，都会继续递增append展示5条数据
    $.get("/news_list", params, function (resp) { // 回调函数(返回的对象resp) -- 就是后端服务器会返回的数据，这里获取到，然后前端做响应的操作
        // 设置 `数据正在查询数据` 变量为 false，以便下次上拉加载


        if (resp) {

            // 先清空原有数据
            if (cur_page == 1) {
                // $(".list_con").html('') // <ul>标签清空
                // 清空所有节点 -- 排他思想
                $(".list_con").empty()
            }

            // 显示数据
            for (var i = 0; i < resp.newsList.length; i++) { // 把每一个遍历出来
                var news = resp.newsList[i]
                var content = '<li>'
                content += '<a href="/news_detail/' + news.id + '" class="news_pic fl"><img src="' + news.index_image_url + '?imageView2/1/w/170/h/170"></a>'
                content += '<a href="/news_detail/' + news.id + '" class="news_title fl">' + news.title + '</a>'
                content += '<a href="/news_detail/' + news.id + '" class="news_detail fl">' + news.digest + '</a>'
                content += '<div class="author_info fl">'
                content += '<div class="source fl">来源：' + news.source + '</div>'
                content += '<div class="time fl">' + dateFormat1(news.create_time) + '</div>'
                content += '</div>'
                content += '</li>'
                $(".list_con").append(content);

                // 修改当前js的获取数据的状态为flase，表示已经获取完数据了
                is_data_querying = false;
                // 根据后端返回的总页码和当前页码，重新设置
                total_page = resp.totalPage;
                cur_page = resp.currentPage;

            }
        } else {
            // 请求失败
            alert(resp.errmsg);
        }
    })

}



// 时间格式转换
function dateFormat1(value) {
    var d = new Date(value);  //2018-01-16T21:19:19.000Z
    var times = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
    return times
}

// 知识点：一般post请求，都是要ajax