<template>
<div class="wrapper">
    <AppMainHeader :vite-base="viteBase" />
    <AppSidebar :vite-base="viteBase" @navigate="changeContent" />
    <div class="content-wrapper">
        <section class="content-header">
            <h2 class="page-title">
                {{ pageTitle }}
            </h2>
        </section>
        <section class="content">
            <el-dialog v-model="dialogVisible" :title="dialogTitle">
                <span> {{ dialogContent }}</span>
                <template #footer>
                    <span class="dialog-footer">
                        <el-button type="primary" @click="dialogVisible = false">好的 我会了</el-button>
                    </span>
                </template>
            </el-dialog>

            <LineupPanel
                v-if="sideBarTag === 'lineup'"
                :lineup-fetch-loading="lineupFetchLoading"
                :lineup-enriching="lineupEnriching"
                :lineup-list="lineupList"
                @show-info="showInfo"
                @show-equip-msg="showEquipMsg"
            />

            <JobRankingChartHost v-if="sideBarTag === 'jobranking'" />
            <SimulatorPanel
                v-if="sideBarTag === 'simulator'"
                :board-data="boardData"
                :filter-champion-groups="getFilterChampionList()"
            />
            <HeroCloudChartHost v-if="sideBarTag === 'herocloud'" />
            <EquipRankingChartHost v-if="sideBarTag === 'equipranking'" />

            <HeroListPage
                v-if="sideBarTag === 'hero'"
                :sorted-heroes="sortedHeroes"
                :get-job-and-races="getJobAndRaces"
                @show-info="showInfo"
            />

            <EquipListPage
                v-if="sideBarTag === 'equip'"
                :equip-map="equipMap"
                @show-equip-msg="showEquipMsg"
            />

            <HexListPage v-if="sideBarTag === 'hex'" :hex-map="hexMap" />

            <JobSynergyPage
                v-if="sideBarTag === 'job'"
                :job-map="jobMap"
                :race-map="raceMap"
                :get-heroes-by-job-id="getHeroesByJobId"
                @show-hero-msg="showHeroMsg"
            />

            <AdventureFruitPage v-if="sideBarTag === 'adventure'" :fruit-list="fruitList" />
        </section>
    </div>
    <AppMainFooter />
</div>
</template>
<script>
import axios from 'axios'
import { createEquipRanking, createHeroRanking, createJobRanking } from './createEcharts.js'
import AppMainHeader from './components/layout/AppMainHeader.vue'
import AppSidebar from './components/layout/AppSidebar.vue'
import AppMainFooter from './components/layout/AppMainFooter.vue'
import LineupPanel from './components/lineup/LineupPanel.vue'
import JobRankingChartHost from './components/charts/JobRankingChartHost.vue'
import HeroCloudChartHost from './components/charts/HeroCloudChartHost.vue'
import EquipRankingChartHost from './components/charts/EquipRankingChartHost.vue'
import SimulatorPanel from './components/simulator/SimulatorPanel.vue'
import HeroListPage from './components/pages/HeroListPage.vue'
import EquipListPage from './components/pages/EquipListPage.vue'
import HexListPage from './components/pages/HexListPage.vue'
import JobSynergyPage from './components/pages/JobSynergyPage.vue'
import AdventureFruitPage from './components/pages/AdventureFruitPage.vue'

export default {
    components: {
        AppMainHeader,
        AppSidebar,
        AppMainFooter,
        LineupPanel,
        JobRankingChartHost,
        HeroCloudChartHost,
        EquipRankingChartHost,
        SimulatorPanel,
        HeroListPage,
        EquipListPage,
        HexListPage,
        JobSynergyPage,
        AdventureFruitPage,
    },
    data() {
        return {
            cacheTime: 0,
            viteBase: import.meta.env.BASE_URL,
            pageTitle: "阵容推荐",
            lineupList: [],
            sideBarTag: "lineup",
            lineupUrl: "https://game.gtimg.cn/images/lol/act/tftzlkauto/json/lineupJson/s17/6/lineup_detail_total.json?v=9870297",
            chessUrl: "https://game.gtimg.cn/images/lol/act/img/tft/js/16.8-2026.S17/chess.js",
            hexUrl: "https://game.gtimg.cn/images/lol/act/img/tft/js/16.8-2026.S17/hex.js",
            equipUrl: "https://game.gtimg.cn/images/lol/act/img/tft/js/16.8-2026.S17/equip.js",
            jobUrl: "https://game.gtimg.cn/images/lol/act/img/tft/js/16.8-2026.S17/job.js",
            raceUrl: "https://game.gtimg.cn/images/lol/act/img/tft/js/16.8-2026.S17/race.js",
            fruitUrl: "https://game.gtimg.cn/images/lol/act/img/tft/js/16.8-2026.S17/fruit.js",
            adventureUrl: "https://game.gtimg.cn/images/lol/act/img/tft/js/14.15-2024.S12/adventure.js",
            heroImageUrlPrefix: "https://game.gtimg.cn/images/lol/act/img/tft/champions/",
            heroMapImageUrlPrefix: "https://game.gtimg.cn/images/lol/tftstore/s17/624x318/",
            goopUrl: "https://game.gtimg.cn/images/lol/act/img/tft/js/goop.js",
            nodeJsURL: "http://139.196.93.191:8000/",
            dialogVisible: false,
            dialogContent: "",
            chessMap: {},
            englishNameIndexEquipMap: {},
            jobIndexForChessMap: {},
            hexMap: {},
            equipMap: {},
            jobMap: {},
            raceMap: {},
            adventureList: [],
            goopList: [],
            fruitList: [],
            sortedHeroes: [],
            dialogTitle: "",
            boardData: [],
            lineupFetchLoading: false,
            lineupEnriching: false,
            dictionariesLoaded: false,
            _enrichLineupPromise: null,
        }
    },
    async mounted() {

        if (localStorage.getItem("lineuplist") == null || new Date().valueOf() - parseInt(localStorage.getItem("timeLoadLineuplist")) > this.cacheTime) {
            console.log("no cache")
            await this.getLineupList()
        } else {
            console.log("use cache")
            this.lineupList = JSON.parse(localStorage.getItem("lineuplist"))
            if (this.sideBarTag === "lineup") {
                await this.ensureLineupEnriched()
            }
        }

        this.setSidebarActive("lineup");
        this.boardData = this.getResetBoardData();

    },
    methods: {
        async getLineupList() {
            this.lineupFetchLoading = true
            try {
                const res = await axios.get(this.lineupUrl)
                await this.handleData(res.data)
            } catch (err) {
                console.log('错误' + err)
            } finally {
                this.lineupFetchLoading = false
            }
        },

        async handleData(data) {
            const lineup_list = data["lineup_list"]
            lineup_list.sort(this.compareByQuality)
            lineup_list.sort(this.compareBySortID)
            const nextList = []
            for (const idx in lineup_list) {
                const lineup = lineup_list[idx]
                const lineUpDetail = JSON.parse(lineup['detail'].replace(/\n/g, "\\n").replace(/\r/g, "\\r"))
                lineUpDetail.quality = lineup.quality
                nextList.push(lineUpDetail)
            }
            this.lineupList = nextList
            if (this.sideBarTag === "lineup") {
                await this.ensureLineupEnriched()
            }
        },
        async ensureDictionaries() {
            if (this.dictionariesLoaded) return
            await this.fetchData()
            this.dictionariesLoaded = true
        },
        async ensureLineupEnriched() {
            if (!this.lineupList.length) return
            const first = this.lineupList[0]
            if (first && first.info) return
            if (this._enrichLineupPromise) return this._enrichLineupPromise
            this.lineupEnriching = true
            this._enrichLineupPromise = this.addCustomData()
                .catch((e) => {
                    console.log(e)
                    throw e
                })
                .finally(() => {
                    this.lineupEnriching = false
                    this._enrichLineupPromise = null
                })
            return this._enrichLineupPromise
        },
        async getJobMap() {
            let rawData = {}
            const jobMap = {}
            await axios.get(this.jobUrl)
                .then(res => {
                    rawData = res.data.data
                })
                .catch(err => {
                    console.log('错误' + err)
                })
            for (const i in rawData) {
                jobMap[rawData[i].jobId] = rawData[i]
            }
            return jobMap

        },
        async getRaceMap() {
            let rawData = {}
            const raceMap = {}
            await axios.get(this.raceUrl)
                .then(res => {
                    rawData = res.data.data
                })
                .catch(err => {
                    console.log('错误' + err)
                })
            for (const i in rawData) {
                raceMap[rawData[i].raceId] = rawData[i]
            }
            return raceMap

        },
        async getGoopList() {
            let rawData = {}
            const goopList = []
            await axios.get(this.goopUrl)
                .then(res => {
                    rawData = res.data.data
                })
                .catch(err => {
                    console.log('错误' + err)
                })
            for (const i in rawData) {
                goopList.push({
                    title: rawData[i].title,
                    desc: rawData[i].desc
                })
            }
            return goopList

        },
        async getAdventureList() {
            let rawData = {}
            const list = []
            await axios.get(this.adventureUrl)
                .then(res => {
                    rawData = res.data.data
                })
                .catch(err => {
                    console.log('错误' + err)
                })
            for (const i in rawData) {
                list.push(rawData[i])
            }
            return list.sort(this.compareByPrice)

        },
        async getFruitList() {
            let rawData = {}
            const list = []
            await axios.get(this.fruitUrl)
                .then(res => {
                    rawData = res.data.data
                })
                .catch(err => {
                    console.log('错误' + err)
                })
            for (const i in rawData) {
                list.push(rawData[i])
            }
            return list

        },
        async getChessMap() {
            let rawData = {}
            const chessMap = {}
            await axios.get(this.chessUrl)
                .then(res => {
                    rawData = res.data.data
                })
                .catch(err => {
                    console.log('错误' + err)
                })
            for (const ci in rawData) {
                const chess = rawData[ci]
                chess.picPath = this.heroMapImageUrlPrefix + chess.TFTID + ".png"
                chessMap[chess['chessId']] = chess

                const jobIds = chess.jobIds.split(',')
                const raceIds = chess.raceIds.split(',')
                for (const ji in jobIds) {
                    const hero = {}
                    hero.picUrl = this.heroImageUrlPrefix + chess.name
                    hero.id = chess.chessId
                    hero.price = chess.price
                    if (!this.jobIndexForChessMap[jobIds[ji]]) this.jobIndexForChessMap[jobIds[ji]] = []
                    this.jobIndexForChessMap[jobIds[ji]].push(hero)
                }
                for (const ri in raceIds) {
                    const hero = {}
                    hero.picUrl = this.heroImageUrlPrefix + chess.name
                    hero.id = chess.chessId
                    hero.price = chess.price
                    if (!this.jobIndexForChessMap[raceIds[ri]]) this.jobIndexForChessMap[raceIds[ri]] = []
                    this.jobIndexForChessMap[raceIds[ri]].push(hero)
                }
            }
            this.sortedHeroes = Object.values(chessMap).filter(c => c.price > 0).sort((a, b) => a.price - b.price)
            console.log(chessMap)
            return chessMap
        },
        async getHexMap() {
            let rawData = {}
            const hexMap = {}
            await axios.get(this.hexUrl)
                .then(res => {
                    rawData = res.data.data
                })
                .catch(err => {
                    console.log('错误' + err)
                })
            for (const i in rawData) {
                hexMap[rawData[i].hexId] = rawData[i]
            }
            return hexMap

        },
        async getEquipMap() {
            let rawData = {}
            const equipMap = {}
            const that = this
            await axios.get(this.equipUrl)
                .then(res => {
                    rawData = res.data.data
                })
                .catch(err => {
                    console.log('错误' + err)
                })
            for (const i in rawData) {
                equipMap[rawData[i].equipId] = rawData[i]
                that.englishNameIndexEquipMap[rawData[i].englishName] = rawData[i].name
            }
            return equipMap

        },
        showEquipMsg(equipId) {
            const equip = this.equipMap[equipId]
            try {
                this.showInfo(equip.name + " 合成公式", equip.formula.split(",").map(id => this.equipMap[id].name).join(" + "))
            } catch (e) {
                this.showInfo(equip.name + " 合成公式", "这个装备合不了哟  ʅ(‾◡◝)ʃ ")
            }
        },
        async fetchData() {
            const [hexMap, equipMap, jobMap, raceMap, chessMap, fruitList] = await Promise.all([
                this.getHexMap(),
                this.getEquipMap(),
                this.getJobMap(),
                this.getRaceMap(),
                this.getChessMap(),
                this.getFruitList()
            ]);

            this.hexMap = hexMap;
            this.equipMap = equipMap;
            this.jobMap = jobMap;
            this.raceMap = raceMap;
            this.chessMap = chessMap;
            this.fruitList = fruitList;

        },
        async addCustomData() {
            await this.ensureDictionaries()
            const lineupList = this.lineupList

            const chessMap = this.chessMap
            const equipMap = this.equipMap
            const hexMap = this.hexMap

            for (const idx in lineupList) {
                const lineup = lineupList[idx]

                let orderStr = lineup.equipment_order
                if (orderStr) {
                    let orderArr = lineup.equipment_order.split(',')
                    while (orderStr[orderStr.length - 1] == ',') {
                        orderStr = orderStr.substr(0, orderStr.length - 1)
                        orderArr.pop()
                    }
                    for (const h in orderArr) {
                        orderStr = orderStr.replace(orderArr[h], equipMap[parseInt(orderArr[h])].name)
                    }
                    orderStr = orderStr.replaceAll(',', '>')
                }

                lineup.info = "阵容强度： " + lineup.quality
                    + "D牌节奏： " + lineup.d_time
                    + "早期玩法： " + lineup.early_info
                    + "抢装顺序： " + orderStr
                    + "克制阵容： " + lineup.enemy_info
                    + "装备推荐： " + lineup.equipment_info
                    + "海克斯推荐： " + lineup.hex_info
                    + "站位推荐： " + lineup.location_info;

                const level_3_heros = lineup['level_3_heros']
                const positions = lineup["hero_location"]
                for (const j in positions) {
                    const position = positions[j]

                    let hero_id
                    if (position['hero_id'] == undefined || position['hero_id'] == "") {
                        hero_id = parseInt(position['chess_id'])
                    } else {
                        hero_id = parseInt(position['hero_id'])
                    }
                    const hero = chessMap[hero_id]
                    if (!(hero == undefined)) {

                        position['price'] = hero.price
                        if (!position['is_carry_hero'] == "") {
                            lineup['bgImagePath'] = this.heroMapImageUrlPrefix + hero.name.toString().replace('jpg', 'png')
                        }
                        position['name'] = hero.title + " " + hero.displayName
                        position['skillDetail'] = hero.skillDetail
                        position['is_3_star'] = level_3_heros.includes(hero_id)
                        position['hero_image'] = this.heroImageUrlPrefix + hero.name
                        position['price'] = hero.price
                        position['chessPriceClass'] = "component-champion cost" + hero.price + " champion-main"
                        position['equip_list'] = []
                        position.equipment_id = position.equipment_id.split(',')
                        for (const k in position.equipment_id) {
                            const equipID = position.equipment_id[k]
                            if (!(equipMap[equipID] == undefined)) {
                                const equip = {}
                                const equipQuery = equipMap[equipID]
                                equip.imagePath = equipQuery.imagePath
                                equip.id = equipID
                                position['equip_list'].push(equip)
                            }

                        }
                    }
                }
                positions.sort(this.compareHeroByIs3Star)
                positions.sort(this.compareHeroByEquip)
                const hexIDList = lineup.hexbuff.recomm.split(",")
                lineup.hexbuff.recomm = []
                for (const hi in hexIDList) {
                    const hexID = hexIDList[hi]
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
            const jobAndRaces = []
            for (const i in raceIds) {
                const race = this.raceMap[raceIds[i]]
                if (race) jobAndRaces.push({ name: race.name, imagePath: race.imagePath, introduce: race.introduce })
            }
            for (const i in jobIds) {
                const job = this.jobMap[jobIds[i]]
                if (job) jobAndRaces.push({ name: job.name, imagePath: job.imagePath, introduce: job.introduce })
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
            const qualityMap = { "S": 0, "A": 1, "B": 2, "C": 3, "": 100 }
            const a_tag = qualityMap[a.quality]
            const b_tag = qualityMap[b.quality]
            if (a_tag < b_tag) {
                return -1;
            } else if (a_tag > b_tag) {
                return 1;
            }
            return 0;
        },
        compareBySortID(a, b) {
            const aID = a.sortID
            const bID = b.sortID
            if (aID == bID && aID == 0) {
                return 0
            } else if (aID == 0) {
                return 1;
            } else if (bID == 0) {
                return -1;
            }

            if (aID < bID) {
                return 1;
            } else if (aID > bID) {
                return -1;
            }
            return 0;
        },
        compareByPrice(a, b) {
            const aPrice = a.price
            const bPrice = b.price
            if (aPrice == bPrice && aPrice == "") {
                return -1
            } else if (aPrice == "") {
                return -1;
            } else if (bPrice == "") {
                return 1;
            }
            return aPrice - bPrice;
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

            liObj = $("#" + tagUri);
            if (liObj.length > 0) {
                liObj.parent().parent().addClass("active");
                liObj.addClass("active");
            }
        },
        changeContent(id, title) {
            this.setSidebarActive(id);
            this.sideBarTag = id
            this.pageTitle = title
            const that = this
            this.$nextTick(() => {
                void (async () => {
                    try {
                        if (id === "lineup") {
                            await that.ensureLineupEnriched()
                        } else {
                            await that.ensureDictionaries()
                        }
                    } catch (e) {
                        console.log(e)
                    }
                    if (id == "equipranking") {
                        axios.get(that.nodeJsURL + "equipRanking")
                            .then(res => {
                                const data = res.data
                                data.name = data.name.slice(0, 10).map(name => that.englishNameIndexEquipMap[name])
                                data.appearance = data.appearance.slice(0, 10)
                                data.top_4 = data.top_4.slice(0, 10)
                                createEquipRanking(data)
                            })
                            .catch(err => {
                                console.log('错误' + err)
                            })
                    } else if (id == "jobranking") {
                        axios.get(that.nodeJsURL + "jobRanking")
                            .then(res => {
                                res.data.forEach(item => {
                                    console.log(item)

                                    const jobList = []
                                    item.feature.split(";").forEach(feature => {
                                        const fAndn = feature.split(",")
                                        const jobId = fAndn[0]
                                        const jobQuery = that.jobMap[jobId] ? that.jobMap[jobId] : that.raceMap[jobId]
                                        const job = {}
                                        job.name = jobQuery.name
                                        job.imagePath = jobQuery.imagePath
                                        job.num = fAndn[1]
                                        jobList.push(job)
                                    })
                                    item.feature = jobList
                                })
                                createJobRanking(res.data)
                            })
                            .catch(err => {
                                console.log('错误' + err)
                            })

                    } else if (id == "herocloud") {
                        axios.get(that.nodeJsURL + "heroRanking")
                            .then(res => {
                                res.data.forEach(item => {
                                    console.log(item)
                                    item.name = that.chessMap[item.chessId].displayName
                                })
                                createHeroRanking(res.data)
                            })
                            .catch(err => {
                                console.log('错误' + err)
                            })
                    }
                })()
            })

        },
        getHeroesByJobId(jobId) {
            try {
                return this.jobIndexForChessMap[jobId].sort((a, b) => a.price - b.price)
            } catch (e) {
                console.log("getHeroesByJobId error:" + this.jobIndexForChessMap[jobId])
            }

        },
        getFilterChampionList() {
            const filterChampionList = []
            for (let i = 0; i < 10; i++) {
                filterChampionList[i] = []
            }
            Object.values(this.chessMap).forEach((hero) => {
                if (hero.price > 0) {
                    hero.chessPriceClass = "component-champion cost" + hero.price
                    filterChampionList[hero.price].push(hero)
                }
            });
            return filterChampionList.slice(1);

        },
        getResetBoardData: function () {
            var tmpList = [];
            for (var i = 0; i < 28; i++) {
                tmpList.push({
                    index: i,
                    chessId: null,
                    dataChess: null,
                    set_avatar_path: null,
                    star: 1,
                    listCatchEquip: [],
                    equipMainAndBackup: { main: new Array(2), backup: new Array(3) },
                    isCarryChampion: false,
                    $typeChess: null,
                    replaceStageChess: null
                });
            }
            return tmpList;
        },
        showMessage(type, msg) {
            this.$message({
                message: msg, type: type,
            })
        },
        showHeroMsg(heroId) {
            const hero = this.chessMap[heroId]
            this.showInfo(hero.title + ' ' + hero.displayName, hero.skillDetail)
        }

    }
}
</script>
