// 依赖 index.2.2.2.js 中 initMainPage 完成后再执行（避免 $grid 未就绪）
window.initH5GameDefer = function () {
// 搜索功能
$('#submit').click(function name(params) {
    let $search = $('#search');
    let inp = $search.val().trim();
    if (inp) {
        $('.web-menu button').eq(0).addClass('active').siblings().removeClass('active');
        if ($('.bilibili_iframe').css('display') === 'block') {
            $('.bilibili_iframe').css('display', 'none');
            $('iframe').attr('src', '');
        }
        $('.web-list .web-grid').removeClass('filter_web');
        $('.web-list .web-grid').each(function () {
            if (($(this).find('.web-single h2').text() + $(this).find('.web-single p>span:first').text()).toUpperCase().search(inp.toUpperCase()) != -1 || $(this).find('.web-single').attr('data-content').split('<span')[0].toUpperCase().search(inp.toUpperCase()) != -1) {
                $(this).addClass('filter_web');
            }
        });
        window.$grid.isotope({
            filter: '.filter_web',
        });
        window.set_footer();
    }
});
$('#search').keydown((e) => {
    if (e.keyCode === 13) {
        $('#submit').click();
    }
});

// 首次获取点赞数（循环结束后只更新一次排序数据，减轻卡顿）
$.ajax({
    type: "POST",
    dataType: "text",
    url: 'https://lkszj.info/api/get_like_num',
    error: (res) => {
    },
    success: (res) => {
        like_num_dic = $.parseJSON(res);
        $('.web-list').find('.web-grid').each(function name(params) {
            let like_num_id = $(this).attr('id');
            let like_num = like_num_dic[like_num_id] ? like_num_dic[like_num_id] : 0;
            $(this).find('.like-num').text(like_num);
            let data_content = $(this).find('div').attr('data-content');
            data_content = data_content.replace('>0<', `>${like_num}<`);
            $(this).find('div').attr('data-content', data_content);
        });
        window.$grid.isotope('updateSortData', window.$grid.children());
    }
});

// 热度排序
localStorage.setItem('is_sort_like_num', 1);
$('#scroll-to-hot').click(function name(params) {
    if (localStorage.getItem('is_sort_like_num') == 1) {
        window.$grid.isotope({
            sortBy: 'like-num-sort',
            sortAscending: false,
        });
        localStorage.setItem('is_sort_like_num', 0);
    } else {
        window.$grid.isotope({
            sortBy: 'original-order',
            sortAscending: true,
        });
        localStorage.setItem('is_sort_like_num', 1);
    }
});

// 桌面端：使用 <a target="_blank"> 默认打开新标签，不再 window.open（避免弹窗拦截）
// web端点赞（阻止冒泡到链接跳转）
$('.web-list').on('click', '.web-grid-web a.web-card-link p > .iconfont', function (event) {
    event.preventDefault();
    event.stopPropagation();
    console.log('点赞');
    $(this).css('font-size', '20px');
    $(this).css('bottom', '-4px');
    $(this).css('right', '-4px');
    setTimeout(() => {
        $(this).css('font-size', '16px');
        $(this).css('bottom', '-2px');
        $(this).css('right', '-2px');
    }, 300);
    let $this = $(this).closest('.web-grid');
    let $web_grid_web_mya_div = $(this).closest('.services-inner-box');
    let web_grid = $this.attr('id');
    if (localStorage.getItem(web_grid) == 'like_flag') {
        console.log('已赞');
    } else {
        let like_num_after = parseInt($this.find('p>.like-num').text()) + 1;
        console.log(like_num_after);
        $this.find('p>.like-num').text(like_num_after);
        $('.popover-body span.like-num').text(like_num_after);
        $this.find('p>.like-num').addClass('like_flag');
        $this.find('p>.iconfont').addClass('like_flag');
        $('.popover-body span').addClass('like_flag');
        $('.popover-body span.like-num').text(like_num_after);
        let web_grid_web_mya_div = $web_grid_web_mya_div.attr('data-content');
        web_grid_web_mya_div = web_grid_web_mya_div.replace(/null/g, 'like_flag');
        let web_grid_history = web_grid_web_mya_div.split('</span>')[1].split('>')[1];
        web_grid_web_mya_div = web_grid_web_mya_div.replace(web_grid_history + '<', like_num_after + '<');
        $web_grid_web_mya_div.attr('data-content', web_grid_web_mya_div);
        localStorage.setItem(web_grid, 'like_flag');
        window.$grid.isotope('updateSortData', window.$grid.children());
        $.ajax({
            type: "POST",
            url: 'https://lkszj.info/api/set_like_num',
            data: {
                'web_grid': web_grid,
            },
            error: (res) => {
            },
            success: (res) => {
            }
        });
    }
});
// 移动端点赞
$('.phone-modal .hide-modal').click(function name(params) {
    let $this = $(this);
    let web_grid = $this.attr('web_grid');
    let $web_grid = $(`#${web_grid}`);
    console.log(web_grid);
    if (localStorage.getItem(web_grid) == 'like_flag') {
        console.log('已赞');
    } else {
        let like_num_after = parseInt($web_grid.find('p>.like-num').text()) + 1;
        $web_grid.find('p>.like-num').text(like_num_after);
        $web_grid.find('p>.like-num').addClass('like_flag');
        $web_grid.find('p>.iconfont').addClass('like_flag');
        $('.phone-modal').find('.iconfont').addClass('like_flag');
        $('.phone-modal').find('.like-num').addClass('like_flag');
        $('.phone-modal').find('.like-num').text(like_num_after);
        localStorage.setItem(web_grid, 'like_flag');
        window.$grid.isotope('updateSortData', window.$grid.children());
        $.ajax({
            type: "POST",
            url: 'https://lkszj.info/api/set_like_num',
            data: {
                'web_grid': web_grid,
            },
            error: (res) => {
            },
            success: (res) => {
            }
        });
    }
});

// bootstrap弹框配置（网站简介）
$('[data-toggle="popover"]').popover({
    container: 'body',
    content: '暂无简介',
    placement: 'top',
    trigger: 'hover',
});

// 免责声明
$('#Disclaimer .modal-body').html(`<p>*本网站由WUST-503工作室制作，展示的所有网站均为个人兴趣收集，不含任何商业推广成分，仅供交流学习。如有网站违反国家政策法规或链接已失效请联系(<a href="mailto:2541884980@qq.com">2541884980@qq.com</a>)，我们会尽快修改。<br>所有网站使用前请仔细查阅授权许可，部分网站的产出不可用于商业用途，如错误使用产生的相关后果均与本站无关。</p>`)
if (!localStorage.getItem('is_show_disclaimer')) {
    localStorage.setItem('is_show_disclaimer', 1);
}
if (localStorage.getItem('is_show_disclaimer') == 1) {
    setTimeout(() => {
        $('#Disclaimer').modal('show');
    }, 300);
}
$('#DisclaimerClose').click(() => {
    localStorage.setItem('is_show_disclaimer', 0);
});

// MD5 校验：全部异步，避免同步 XHR 阻塞主线程
setTimeout(() => {
    let local_web_list_md5 = localStorage.getItem('web_list_md5');
    $.ajax({
        type: "POST",
        url: 'https://lkszj.info/api/get_web_json_md5',
        error: function () { },
        success: function (new_md5) {
            if (local_web_list_md5 !== new_md5) {
                $.ajax({
                    type: "POST",
                    url: 'https://lkszj.info/api/get_web_json',
                    error: function () { },
                    success: function (res) {
                        localStorage.setItem('web_list', JSON.stringify(res));
                        localStorage.setItem('web_list_md5', new_md5);
                    }
                });
            }
        }
    });
}, 666);

};

if (window.__pendingH5GameDefer && window.$grid) {
    window.initH5GameDefer();
    window.__pendingH5GameDefer = false;
}
