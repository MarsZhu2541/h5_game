function createEquipRanking() {

    // axios({
    //     method: 'jsonp',
    //     headers:{'Referer': "https://lol.qq.com/"}
    // }).then(res => {
    //     console.log(res.data)
    // }).catch(error => {
    //     console.log(error)
    // })


    // WARNING: For GET requests, body is set to null by browsers.

    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function() {
        if(this.readyState === 4) {
            console.log(this.responseText);
        }
    });

    xhr.open("GET", "http://lol.sw.game.qq.com/lol/lwdcommact/a20210420api/a20210420api/equiprank?callback=TFTBigDataEquipRank&time_type=1&tier_part=255");
    xhr.setRequestHeader("Referer", "https://lol.qq.com");

    xhr.send();

    // window.ApiManager.getEquipRank(1, 255).then(res => {
    //     var result = _.get(res, '0');
    //     console.log(result)
    //     var option = {
    //         tooltip: {},
    //         legend: {
    //             data: ['登场率', '前4率']
    //         },
    //         toolbox: {
    //             feature: {
    //                 dataView: {show: true, readOnly: false},
    //                 magicType: {show: true, type: ['line', 'bar']},
    //                 restore: {show: true},
    //                 saveAsImage: {show: true}
    //             }
    //         },
    //         xAxis: [
    //             {
    //                 data: result['name']
    //             }
    //         ],
    //         yAxis: [
    //             {
    //                 name: '登场率',
    //                 min: 0,
    //                 max: 100,
    //                 interval: 25,
    //                 axisLabel: {
    //                     formatter: '{value}%'
    //                 }
    //             },
    //             {
    //                 name: '前4率',
    //                 min: 0,
    //                 max: 100,
    //                 interval: 25,
    //                 axisLabel: {
    //                     formatter: '{value}%'
    //                 }
    //             }
    //         ],
    //         series: [
    //             {
    //                 name: '登场率',
    //                 type: 'bar',
    //                 yAxisIndex: 0,
    //                 data: result['appearance'],
    //             },
    //             {
    //                 name: '前4率',
    //                 type: 'bar',
    //                 yAxisIndex: 0,
    //                 data: result['top_4'],
    //             },
    //         ]
    //     };
    //     //通过id获得div对象
    //     var myChart = echarts.init(document.getElementById('equipline'));
    //     //使用制定的配置项和数据显示图表
    //     myChart.setOption(option);
    //     myChart.resize({height: "600px"})
    //
    // }).catch(err => {
    //     console.log(err)
    // })

}
