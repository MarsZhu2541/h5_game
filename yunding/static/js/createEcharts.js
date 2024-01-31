

function createEquipRanking(result) {

    var option = {
        tooltip: {},
        legend: {
            data: ['登场率', '前4率']
        },
        toolbox: {
            feature: {
                dataView: {show: true, readOnly: false},
                magicType: {show: true, type: ['line', 'bar']},
                restore: {show: true},
                saveAsImage: {show: true}
            }
        },
        xAxis: [
            {
                data: result['name']
            }
        ],
        yAxis: [
            {
                name: '登场率',
                min: 0,
                max: 100,
                interval: 25,
                axisLabel: {
                    formatter: '{value}%'
                }
            },
            {
                name: '前4率',
                min: 0,
                max: 100,
                interval: 25,
                axisLabel: {
                    formatter: '{value}%'
                }
            }
        ],
        series: [
            {
                name: '登场率',
                type: 'bar',
                yAxisIndex: 0,
                data: result['appearance'],
            },
            {
                name: '前4率',
                type: 'bar',
                yAxisIndex: 0,
                data: result['top_4'],
            },
        ]
    };

    //通过id获得div对象
    var myChart = echarts.init(document.getElementById('equipline'));
    //使用制定的配置项和数据显示图表
    myChart.setOption(option);
}

function createHeroRanking(result) {
    var option = {
        title: {
            text: '英雄登顶率排名'
        },
        series: [{
            type: 'wordCloud',
            sizeRange: [15, 45],//data中的值将映射到的文本大小范围，默认为最小12px，最大60px
            rotationRange: [-45, 45],//文本旋转范围[-90,90]
            rotationStep: 45,//旋转步长
            gridSize: 8,//每个词的间距
            shape: 'circle',//词云形状，默认circle，可选参数cardioid,diamond,triangle-forward,triangle,star
            width: '100%',
            height: '100%',
            textStyle: {
                normal: {
                    //随机颜色
                    color: function () {
                        return 'rgb(' + [
                            Math.round(Math.random() * 160),
                            Math.round(Math.random() * 160),
                            Math.round(Math.random() * 160)
                        ].join(',') + ')';
                    }
                }
            },
            data: result
        }]
    };
    var myChart = echarts3.init(document.getElementById('cy'));
    myChart.setOption(option);

}

function createJobRanking(result) {

    var num = 10
    var name_list = []
    var data_object_list = []
    for (var i = 0; i < result.length; i++) {
        var name = ''
        result[i].feature.forEach(function (val2) {
            name = name + val2.num + val2.name
        })
        name_list.push(name)
        data_object_list.push({value: result[i].onStage, name: name})
        num = num - 1
        if (num == 0) break
    }
    var option = {
        title: {
            text: '羁绊排名'
        },
        //提示条
        tooltip: {
            //{a}（系列名称），{b}(数据项名称)，{c}（数值），{d}（百分比）
            formatter: "{a} <br/> {b} : {c} ({d}%)"
        },
        //图例，说明
        legend: {
            orient: 'vertical',
            x: 'right',
            data: name_list
        },
        series: [{
            name: '羁绊排名',
            type: 'pie',
            radius: '60%',
            data: data_object_list
        }]
    };

    //通过id获得div对象
    var myChart = echarts.init(document.getElementById('pie'));
    //使用制定的配置项和数据显示图表
    myChart.setOption(option);
}




