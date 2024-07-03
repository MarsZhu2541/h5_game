const App = {
    data() {
        return {
            cacheTime: 0,
            pageTitle: "阵容推荐",
            lineupList: [],
            sideBarTag: "lineup",
            lineupUrl: "https://game.gtimg.cn/images/lol/act/tftzlkauto/json/lineupJson/s11/6/lineup_detail_total.json?v=9555531",
            chessUrl: "https://game.gtimg.cn/images/lol/act/img/tft/js/chess.js",
            hexUrl: "https://game.gtimg.cn/images/lol/act/img/tft/js/hex.js",
            equipUrl: "https://game.gtimg.cn/images/lol/act/img/tft/js/14.12-2024.S11-2/equip-2.js",
            jobUrl: "https://game.gtimg.cn/images/lol/act/img/tft/js/job.js",
            raceUrl: "https://game.gtimg.cn/images/lol/act/img/tft/js/race.js",
            adventureUrl: "https://game.gtimg.cn/images/lol/act/img/tft/js/adventure.js",
            bgImageUrlPrefix: "https://game.gtimg.cn/images/lol/tftstore/s11/624x318/",
            heroImageUrlPrefix: "https://game.gtimg.cn/images/lol/act/img/tft/champions/",
            heroMapImageUrlPrefix : "https://game.gtimg.cn/images/lol/tftstore/s11/624x318/",
            dialogVisible: false,
            dialogContent: "",
            chessMap: {},
            englishNameIndexEquipMap: {},
            jobIndexForChessMap: {},
            hexMap: {},
            equipMap: {},
            jobMap: {},
            raceMap: {},
            adventureMap: {},
            sortedHeroes: [],
            dialogTitle: "",
        }
    },
    mounted() {

        if (localStorage.getItem("lineuplist") == null || new Date().valueOf() - parseInt(localStorage.getItem("timeLoadLineuplist")) > this.cacheTime) {
            console.log("no cache")
            this.getLineupList()
        } else {
            console.log("use cache")
            this.lineupList = JSON.parse(localStorage.getItem("lineuplist"))
        }

        // 激活导航位置
        this.setSidebarActive("lineup");
    },
    methods: {
        getLineupList() {
            let that = this

            axios.get(this.lineupUrl)
                .then(res => {
                    that.handleData(res.data)
                })
                .catch(err => {
                    console.log('错误' + err)
                })
        },

        handleData(data) {
            let that = this
            let lineupList = this.lineupList
            let lineup_list = data["lineup_list"]
            lineup_list.sort(this.compareByQuality)
            // console.log(lineup_list)
            lineup_list.sort(this.compareBySortID)
            for (i in lineup_list) {
                lineup = lineup_list[i]
                // console.log(lineup.sortID)

                lineUpDetail = JSON.parse(lineup['detail'].replace(/\n/g, "\\n").replace(/\r/g, "\\r"))
                lineUpDetail.quality = lineup.quality
                lineupList.push(lineUpDetail)
                // console.log(lineUpDetail.line_name+" "+lineup.channel+" "+lineup.quality+" "+lineup.sortID)
            }
            that.addCustomData()
        },
        async getJobMap() {
            rawData = {}
            jobMap = {}
            await axios.get(this.jobUrl)
                .then(res => {
                    rawData = res.data.data
                })
                .catch(err => {
                    console.log('错误' + err)
                })
            for (i in rawData) {
                jobMap[rawData[i].jobId] = rawData[i]
            }
            console.log(jobMap)
            return jobMap

        },
        async getRaceMap() {
            rawData = {}
            raceMap = {}
            await axios.get(this.raceUrl)
                .then(res => {
                    rawData = res.data.data
                })
                .catch(err => {
                    console.log('错误' + err)
                })
            for (i in rawData) {
                // console.log(rawData[i])
                raceMap[rawData[i].raceId] = rawData[i]
            }
            // console.log(raceMap)
            return raceMap

        },
        async getAdventureMap() {
            rawData = {}
            adventureMap = {}
            await axios.get(this.adventureUrl)
                .then(res => {
                    rawData = res.data.data
                })
                .catch(err => {
                    console.log('错误' + err)
                })
            for (i in rawData) {
                // console.log(rawData[i])
                adventureMap[rawData[i].id] = rawData[i]
            }
            // console.log(raceMap)
            return adventureMap

        },
        async getChessMap() {
            rawData = {}
            chessMap = {}
            await axios.get(this.chessUrl)
                .then(res => {
                    rawData = res.data.data
                })
                .catch(err => {
                    console.log('错误' + err)
                })
            for (i in rawData) {
                chess = rawData[i]
                chess.picPath = this.heroMapImageUrlPrefix + chess.TFTID + ".jpg"
                chessMap[chess['chessId']] = chess

                jobIds = chess.jobIds.split(',')
                raceIds = chess.raceIds.split(',')
                for (i in jobIds) {
                    hero = {}
                    hero.picUrl = this.heroImageUrlPrefix + chess.name
                    hero.id = chess.chessId
                    hero.price = chess.price
                    if (!this.jobIndexForChessMap[jobIds[i]]) this.jobIndexForChessMap[jobIds[i]] = []
                    this.jobIndexForChessMap[jobIds[i]].push(hero)
                }
                for (i in raceIds) {
                    hero = {}
                    hero.picUrl = this.heroImageUrlPrefix + chess.name
                    hero.id = chess.chessId
                    hero.price = chess.price
                    if (!this.jobIndexForChessMap[raceIds[i]]) this.jobIndexForChessMap[raceIds[i]] = []
                    this.jobIndexForChessMap[raceIds[i]].push(hero)
                }
            }
            this.sortedHeroes = Object.values(chessMap).filter(c => c.price > 0).sort((a, b) => a.price - b.price)
            return chessMap
        },
        async getHexMap() {
            rawData = {}
            hexMap = {}
            await axios.get(this.hexUrl)
                .then(res => {
                    rawData = res.data.data
                })
                .catch(err => {
                    console.log('错误' + err)
                })
            for (i in rawData) {
                // console.log(rawData[i])
                hexMap[rawData[i].hexId] = rawData[i]
            }
            // console.log(hexMap)
            return hexMap

        },
        async getEquipMap() {
            rawData = {}
            equipMap = {}
            that = this
            await axios.get(this.equipUrl)
                .then(res => {
                    rawData = res.data.data
                })
                .catch(err => {
                    console.log('错误' + err)
                })
            for (i in rawData) {
                equipMap[rawData[i].equipId] = rawData[i]
                that.englishNameIndexEquipMap[rawData[i].englishName] = rawData[i].name
            }
            // console.log(equipMap)
            return equipMap

        },
        showEquipMsg(equipId){
            equip = this.equipMap[equipId]
            try {
                this.showInfo(equip.name+" 合成公式", equip.formula.split(",").map(id=> this.equipMap[id].name).join(" + "))
            }catch (e){
                this.showInfo(equip.name+" 合成公式", "这个装备合不了哟  ʅ(‾◡◝)ʃ ")
            }
        },
        async fetchData() {
            const [hexMap, equipMap, jobMap, raceMap, chessMap, adventureMap] = await Promise.all([
                this.getHexMap(),
                this.getEquipMap(),
                this.getJobMap(),
                this.getRaceMap(),
                this.getChessMap(),
                this.getAdventureMap()
            ]);

            this.hexMap = hexMap;
            this.equipMap = equipMap;
            this.jobMap = jobMap;
            this.raceMap = raceMap;
            this.chessMap = chessMap;
            this.adventureMap = adventureMap;
        },
        async addCustomData() {
            let lineupList = this.lineupList
            await this.fetchData();

            // console.log(equipMap)

            for (i in lineupList) {
                lineup = lineupList[i]
                //enhance lineup info

                orderStr = lineup.equipment_order
                orderArr = lineup.equipment_order.split(',')
                while (orderStr[orderStr.length - 1] == ',') {
                    orderStr = orderStr.substr(0, orderStr.length - 1)
                    orderArr.pop()
                }
                for (h in orderArr) {
                    orderStr = orderStr.replace(orderArr[h], equipMap[parseInt(orderArr[h])].name)
                }
                orderStr = orderStr.replaceAll(',', '>')

                lineup.info = "阵容强度： " + lineup.quality + "\n"
                    + "D牌节奏： " + lineup.d_time + "\n"
                    + "早期玩法： " + lineup.early_info + "\n"
                    + "抢装顺序： " + orderStr + "\n\n"
                    + "克制阵容： " + lineup.enemy_info + "\n\n"
                    + "装备推荐： " + lineup.equipment_info + "\n\n"
                    + "海克斯推荐： " + lineup.hex_info + "\n"
                    + "站位推荐： " + lineup.location_info + "\n";

                //enhance hero data
                level_3_heros = lineup['level_3_heros']
                positions = lineup["hero_location"]
                for (j in positions) {
                    position = positions[j]


                    if (position['hero_id'] == undefined || position['hero_id'] == "") {
                        hero_id = parseInt(position['chess_id'])
                    } else {
                        hero_id = parseInt(position['hero_id'])
                    }
                    hero = chessMap[hero_id]
                    if (!(hero == undefined)) {

                        position['price'] = hero.price
                        if (!position['is_carry_hero'] == "") {
                            lineup['bgImagePath'] = this.bgImageUrlPrefix + hero.name.toString().replace('png', 'jpg')
                        }
                        position['name'] = hero.title + " " + hero.displayName
                        position['skillDetail'] = hero.skillDetail
                        position['is_3_star'] = level_3_heros.includes(hero_id)
                        position['hero_image'] = this.heroImageUrlPrefix + hero.name
                        position['price'] = hero.price
                        position['chessPriceClass'] = "component-champion cost" + hero.price + " champion-main"
                        position['equip_list'] = []
                        position.equipment_id = position.equipment_id.split(',')
                        for (k in position.equipment_id) {
                            equipID = position.equipment_id[k]
                            if (!(equipMap[equipID] == undefined)) {
                                equip = {}
                                equipQuery =equipMap[equipID]
                                equip.imagePath = equipQuery.imagePath
                                equip.id = equipID
                                position['equip_list'].push(equip)
                            }

                        }
                    }
                }
                positions.sort(this.compareHeroByIs3Star)
                positions.sort(this.compareHeroByEquip)
                //enhance hex data
                hexIDList = lineup.hexbuff.recomm.split(",")
                // console.log(hexIDList)
                // console.log(hexMap) {id: '19744', hexId: '91002', type: '1', name: '纯天然 I', imgUrl: 'https://game.gtimg.cn/images/lol/act/img/tft/hex/20230612190353HEX6486fb99bca06.png', …}
                lineup.hexbuff.recomm = []
                for (i in hexIDList) {
                    hexID = hexIDList[i]
                    if (!(hexMap[hexID] == undefined)) {
                        lineup.hexbuff.recomm.push(hexMap[hexID])
                    }
                }
            }

            localStorage.setItem("timeLoadLineuplist", new Date().valueOf().toString())
            localStorage.setItem("lineuplist", JSON.stringify(this.lineupList))
        },
        getJobAndRaces(jobIds, raceIds) {
            jobIds = jobIds.split(",")
            raceIds = raceIds.split(",")
            jobAndRaces = []
            for (i in raceIds) {
                race = this.raceMap[raceIds[i]]
                if (race) jobAndRaces.push({name: race.name, imagePath: race.imagePath, introduce: race.introduce})
            }
            for (i in jobIds) {
                job = this.jobMap[jobIds[i]]
                if (job) jobAndRaces.push({name: job.name, imagePath: job.imagePath, introduce: job.introduce})
            }
            return jobAndRaces
        },
        showInfo(title, info) {
            this.dialogTitle = title
            this.dialogContent = info
            this.dialogVisible = true
        },
        compareByQuality(a, b) {
            if (a.quality == "" || a.quality == "0") {
                a.quality = "C"
            }
            if (b.quality == "" || b.quality == "0") {
                b.quality = "C"
            }
            qualityMap = {"S": 0, "A": 1, "B": 2, "C": 3, "": 100}
            a_tag = qualityMap[a.quality]
            b_tag = qualityMap[b.quality]
            if (a_tag < b_tag) {
                return -1;
            } else if (a_tag > b_tag) {
                return 1;
            }
            return 0;
        },
        compareBySortID(a, b) {
            aID = a.sortID
            bID = b.sortID
            if (aID == aID && aID == 0) {
                return 0
            } else if (aID == 0) {
                return 1;
            } else if (aID == 0) {
                return -1;
            }

            if (aID < bID) {
                return 1;
            } else if (aID > bID) {
                return -1;
            }
            return 0;
        },
        compareHeroByEquip(a, b) {
            if (a.equip_list == undefined) {
                a.equip_list = []
            }
            if (b.equip_list == undefined) {
                b.equip_list = []
            }
            return b.equip_list.length - a.equip_list.length
        },
        compareHeroByIs3Star(a, b) {

            if (a.is_3_star && !b.is_3_star) {
                return -1;
            } else if (b.is_3_star && !a.is_3_star) {
                return 1;
            } else {
                if (a.is_carry_hero && !(b.is_carry_hero)) {
                    return -1;
                } else if (b.is_carry_hero && !(a.is_carry_hero)) {
                    return 1;
                }
            }
        },
        setSidebarActive(tagUri) {
            var liObj = $("#" + this.sideBarTag);
            if (liObj.length > 0) {
                liObj.parent().parent().removeClass("active");
                liObj.removeClass("active");
            }

            var liObj = $("#" + tagUri);
            if (liObj.length > 0) {
                liObj.parent().parent().addClass("active");
                liObj.addClass("active");
            }
        },
        changeContent(id, title) {
            this.setSidebarActive(id);
            this.sideBarTag = id
            this.pageTitle = title

            this.$nextTick(() => {
                if (id == "equipranking") {
                    that = this
                    axios.get("http://139.196.93.191:8000/equipRanking")
                        .then(res => {
                            data = res.data
                            // data.name.map(function (item) {
                            //     return that.englishNameIndexEquipMap[item];
                            // })
                            newNames = []
                            data.name = data.name.slice(0, 10).map(name => that.englishNameIndexEquipMap[name])
                            data.appearance = data.appearance.slice(0, 10)
                            data.top_4 = data.top_4.slice(0, 10)
                            // console.log(data)
                            createEquipRanking(data)
                        })
                        .catch(err => {
                            console.log('错误' + err)
                        })
                } else if (id == "jobranking") {
                    axios.get("http://139.196.93.191:8000/jobRanking")
                        .then(res => {
                            res.data.forEach(item => {
                                job = {}
                                jobList = []
                                item.feature.split(";").forEach(feature => {
                                    fAndn = feature.split(",")
                                    jobId = fAndn[0]
                                    jobQuery = jobMap[jobId] ? jobMap[jobId] : raceMap[jobId]
                                    job.name = jobQuery.name
                                    job.imagePath = jobQuery.imagePath
                                    job.num = fAndn[1]
                                    jobList.push(job)
                                })
                                item.feature = jobList
                            })
                            // console.log(res.data)
                            createJobRanking(res.data)
                        })
                        .catch(err => {
                            console.log('错误' + err)
                        })

                } else if (id == "herocloud") {
                    axios.get("http://139.196.93.191:8000/heroRanking")
                        .then(res => {
                            res.data.forEach(item => {
                                item.name = chessMap[item.chessId].displayName
                            })
                            // console.log(res.data)
                            createHeroRanking(res.data)
                        })
                        .catch(err => {
                            console.log('错误' + err)
                        })
                }
            })

        },
        getHeroesByJobId(jobId) {
            try {
                return this.jobIndexForChessMap[jobId].sort((a, b) => a.price - b.price)
            }catch (e){
                console.log("getHeroesByJobId error:" + this.jobIndexForChessMap[jobId])
            }

        },
        showMessage(type, msg) {
            this.$message({
                message: msg, type: type,
            })
        },
        showHeroMsg(heroId) {
            hero = this.chessMap[heroId]
            this.showInfo(hero.title + ' ' + hero.displayName, hero.skillDetail)
        }

    }
}

const app = Vue.createApp(App);
app.use(ElementPlus);
app.mount("#app");
