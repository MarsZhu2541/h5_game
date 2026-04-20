import * as echarts from 'echarts'
import 'echarts-wordcloud'

export function createEquipRanking(result) {
    const option = {
        tooltip: {},
        legend: {
            data: ['登场率', '前4率']
        },
        toolbox: {
            feature: {
                dataView: { show: true, readOnly: false },
                magicType: { show: true, type: ['line', 'bar'] },
                restore: { show: true },
                saveAsImage: { show: true }
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
    }

    const el = document.getElementById('equipline')
    if (!el) return
    const myChart = echarts.init(el)
    myChart.setOption(option)
}

export function createHeroRanking(result) {
    const option = {
        title: {
            text: '英雄登顶率排名'
        },
        series: [{
            type: 'wordCloud',
            sizeRange: [15, 45],
            rotationRange: [-45, 45],
            rotationStep: 45,
            gridSize: 8,
            shape: 'circle',
            width: '100%',
            height: '100%',
            textStyle: {
                color: function () {
                    return 'rgb(' + [
                        Math.round(Math.random() * 160),
                        Math.round(Math.random() * 160),
                        Math.round(Math.random() * 160)
                    ].join(',') + ')'
                }
            },
            data: result
        }]
    }
    const el = document.getElementById('cy')
    if (!el) return
    const myChart = echarts.init(el)
    myChart.setOption(option)
}

export function createJobRanking(result) {
    let num = 10
    const name_list = []
    const data_object_list = []
    for (let i = 0; i < result.length; i++) {
        let name = ''
        result[i].feature.forEach(function (val2) {
            name = name + val2.num + val2.name
        })
        name_list.push(name)
        data_object_list.push({ value: result[i].onStage, name: name })
        num = num - 1
        if (num === 0) break
    }
    const option = {
        title: {
            text: '羁绊排名'
        },
        tooltip: {
            formatter: "{a} <br/> {b} : {c} ({d}%)"
        },
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
    }

    const el = document.getElementById('pie')
    if (!el) return
    const myChart = echarts.init(el)
    myChart.setOption(option)
}
