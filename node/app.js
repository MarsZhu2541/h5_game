var express = require('express');
const axios = require('axios');
var PORT = 3000;
var app = express();

JobRankingUrl = "https://lol.sw.game.qq.com/lol/lwdcommact/a20200629api/A20200629api/mbrank?" +
    "time_type=1&tier_part=255&raceid=255&jobid=255&callback=TFTBigDataMainEffectRank"
heroRankingUrl = "https://lol.sw.game.qq.com/lol/lwdcommact/a20200629api/A20200629api/herorank?" +
    "time_type=1&tier_part=255&raceid=255&jobid=255&callback=TFTBigDataHeroesRank"
equipRankingUrl ="https://lol.sw.game.qq.com/lol/lwdcommact/a20210420api/a20210420api/equiprank?" +
    "callback=TFTBigDataEquipRank&time_type=1&tier_part=255"
app.get('/jobRanking', function (req, res) {
    axios.get(JobRankingUrl, {
        headers: {
            Referer: "https://lol.qq.com"
        }
    }).then(function (response) {
        // 处理成功情况

        var result = response.data.replace("(", "").replace(")", "").replace("TFTBigDataMainEffectRank", "");
        var data = JSON.parse(JSON.parse(result).data.result).main_buff_datas;
        // console.log(data);
        dataList = []
        data.split("#").forEach(d=>{
            splitData = d.split("_")
            dataDict = {}
            dataDict['feature'] = splitData[0]
            dataDict['onStage'] = splitData[1]
            dataDict['top4'] = splitData[2]
            dataDict['top1'] = splitData[3]
            dataList.push(dataDict)
        })
        // console.log(dataList);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(dataList);
    })
        .catch(function (error) {
            // 处理错误情况
            console.log(error);
        })
})


app.get('/heroRanking', function (req, res) {
    axios.get(heroRankingUrl, {
        headers: {
            Referer: "https://lol.qq.com"
        }
    }).then(function (response) {
        // 处理成功情况

        var result = response.data.replace("(", "").replace(")", "").replace("TFTBigDataHeroesRank", "");
        var data = JSON.parse(JSON.parse(result).data.result).championdatas;
        // console.log(data);
        dataList = []
        data.split("#").forEach(d=>{
            splitData = d.split("_")
            dataDict = {}
            //
            // dataDict = {'chessId': splitData[0], 'onStage': splitData[1], 'top4': splitData[2],
            //     'top1': splitData[3], 'rank': splitData[4]}
            dataDict['chessId'] = splitData[0]
            dataDict['value'] = splitData[3]
            dataList.push(dataDict)
        })
        console.log(dataList);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(dataList);
    })
        .catch(function (error) {
            // 处理错误情况
            console.log(error);
        })
})


app.get('/equipRanking', function (req, res) {
    axios.get(equipRankingUrl, {
        headers: {
            Referer: "https://lol.qq.com"
        }
    }).then(function (response) {
        // 处理成功情况

        var result = response.data.replace("(", "").replace(")", "").replace("TFTBigDataEquipRank", "");
        var data = JSON.parse(JSON.parse(result).data.result).itemdetails;
        // console.log(data);
        barData = {}
        name_list = []
        appearance_list = []
        top_4_list = []
        data.split("#").sort((a,b)=>{
            return  parseFloat(b.split("$")[1]) -  parseFloat(a.split("$")[1])
        }).forEach(d=>{
            nameAndRate = d.split("$")
            name_list.push(nameAndRate[0])
            appearance_list.push(parseFloat(nameAndRate[1]) *100)
            top_4_list.push(parseFloat(nameAndRate[2])*100)
            //     bar_dict = {'name':name_list,'appearance':appearance_list,'top_4':top_4_list}
        })
        barData.name =name_list
        barData.appearance =appearance_list
        barData.top_4 =top_4_list
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(barData);
    })
        .catch(function (error) {
            // 处理错误情况
            console.log(error);
        })
})

app.listen(PORT);
console.log('Running on http://localhost:' + PORT);
