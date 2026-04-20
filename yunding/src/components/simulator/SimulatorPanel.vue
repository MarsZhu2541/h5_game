<template>
    <div class="app-main">
        <div class="page-simulator">
            <div class="simulator-left">
                <div class="simulator-left-box">
                    <div class="switch-data-types"><a href="javascript:" class="on">英雄</a><a
                            href="javascript:" class="">装备</a></div>
                    <i class="c-line"></i>
                    <div class="filter-chess-wrap">
                        <div class="chess-list">
                            <div class="chess-section" v-for="(group, groupKey) in filterChampionGroups"
                                 :key="'group_'+groupKey">
                                <div :class="hero.chessPriceClass" draggable="true" v-for="hero in group"
                                     :key="'hero_' + hero.chessId">
                                    <div draggable="false" class="champion-pic">
                                        <img :src="'//game.gtimg.cn/images/lol/act/img/tft/champions/'+hero.name"
                                             draggable="false">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="filter-equipment-wrap" v-show="dataTypeVal === 'equipment'">
                        <input type="text" ref="equipmentSearch" placeholder="搜索您需要的内容"
                               @search-handler="searchEquipment">
                        <div class="switch-type-box">
                            <a href="javascript:;" v-for="item in equipTypeTab" :key="'equip_type' + item.value"
                               :class="{'on': item.value === equipTypeTabVal}"
                               @click="switchEquipType(item.value)">{{ item.name }}</a>
                        </div>
                        <div class="equipment-list">
                            <div v-for="item in filterEquipmentList" :key="item.equipId"
                                 :equipment-data="item" :is-respond-event="true"
                                 :draggable="true"
                                 @dragstart="onDragEquipmentEvent(item)"
                                 @dragend="onDragEnd">

                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="simulator-center">
                <div class="simulator-content">
                    <div class="content-head">
                        <div class="content-title">阵容站位</div>
                        <div class="population">人口数：0/9</div>
                    </div>
                    <div class="content-feature">
                        <div class="c-wrapper">
                            <div class="switch-box">
                                <div class="switch-title">弈子更替</div>
                                <div class="switch-bar checked"></div>
                            </div>
                            <div class="head-btn-box"><a href="javascript:"
                                                         class="btn-reset">重置棋盘</a></div>
                        </div>
                    </div>
                    <div class="simulator-board">
                        <div class="slot-wrap" v-for="item in boardData" :key="'location1_' + item.index">
                            <div class="slot-champion"
                                 :class="{ 'highlight': item.index === dropOverIndex, 'exchange': dropOverIndex >= 0 && item.index !== dropOverIndex && item.chessId && !isChessReplacement, 'exchange-on': item.index === dropOverIndex && item.chessId && !isChessReplacement }"
                                 :draggable="item.chessId !== null"
                                 @dragstart="onDragBoardItemEvent(item.index, $event)"
                                 @drop="onDropToBoardEvent(item.index)"
                                 @dragenter="onDragEnter(item.index)"
                                 @dragend="onDragEnd" @dragover="allowDrop($event)">
                                <div class="slot-img" :class="item.dataChess && 'price-' + item.dataChess.price"
                                     v-if="item.chessId"
                                     @click="onClickBoardItemEvent(item.index)">
                                    <i :ref="'slotDragImg' + item.index" class="bg-img"
                                       :style="'background-image: url(' + item.set_avatar_path + ')'"></i>
                                </div>
                                <div class="slot-replace-chess"
                                     :class="transferData.champion && 'price-' + transferData.champion.price"
                                     v-if="dropOverIndex >= 0 && isChessReplacement && item.$typeChess === 'hero' && transferData.from === undefined && transferData.type === 'chess'">
                                    <i class="bg-img"
                                       :style="'background-image: url(' + transferData.champion.set_avatar_path + ')'"
                                       v-if="item.index === dropOverIndex && item.chessId && transferData.champion && isChessReplacement && item.$typeChess === 'hero'"></i>
                                    <i class="bg-img" v-else></i>
                                </div>
                                <div class="slot-replace-chess"
                                     :class="item.replaceStageChess && 'price-' + item.replaceStageChess.price"
                                     v-if="item.replaceStageChess">
                                    <i class="bg-img"
                                       :style="'background-image: url(' + item.replaceStageChess.set_avatar_path + ')'"></i>
                                </div>
                                <div class="icon-goop"
                                     v-if="item.goopTagList && item.goopTagList.length > 0"></div>
                                <div class="slot-champion-stars" :class="'star-' + item.star"
                                     v-if="item.$typeChess === 'hero'">
                                    <i class="icon-champion-star" v-if="item.star >= 1"></i>
                                    <i class="icon-champion-star" v-if="item.star >= 2"></i>
                                    <i class="icon-champion-star" v-if="item.star >= 3"></i>
                                </div>
                                <div class="slot-icons">
                                    <div class="icon-carry" v-if="item.isCarryChampion"></div>
                                    <div class="icon-vanguard" v-if="item.vanguard"></div>
                                </div>
                            </div>
                            <template v-if="item.$typeChess === 'hero'">
                                <div class="slot-equipments">
                                    <div class="equipment"
                                         @click="showEquipmentTooltipForFinalBoard(item.index)">
                                        <img :src="item.listCatchEquip[0]['imagePath']"
                                             v-if="item.listCatchEquip.length > 0"
                                             @click.stop="removeEquipmentForFinalBoard(0, item.index)">
                                        <span v-else>+</span>
                                    </div>
                                    <div class="equipment"
                                         @click="showEquipmentTooltipForFinalBoard(item.index)">
                                        <img :src="item.listCatchEquip[1]['imagePath']"
                                             v-if="item.listCatchEquip.length > 1"
                                             @click.stop="removeEquipmentForFinalBoard(1, item.index)">
                                        <span v-else>+</span>
                                    </div>
                                    <div class="equipment"
                                         @click="showEquipmentTooltipForFinalBoard(item.index)">
                                        <img :src="item.listCatchEquip[2]['imagePath']"
                                             v-if="item.listCatchEquip.length > 2"
                                             @click.stop="removeEquipmentForFinalBoard(2, item.index)">
                                        <span v-else>+</span>
                                    </div>
                                </div>
                            </template>
                        </div>
                    </div>
                    <div class="simulator-synergy">
                        <component-synergy :synergy-data="synergy" :is-vanguard="synergy.isVanguard"
                                           v-for="(synergy, synergyIndex) in synergyList"
                                           :key="synergyIndex"></component-synergy>
                        <div class="simulator-delete-area" @drop="onDropToDelete"
                             @dragenter="onDragEnterDeleteArea"
                             @dragover="allowDrop($event)"
                             v-if="dropOverIndex !== undefined && transferData.from !== undefined"></div>
                    </div>
                </div>
            </div>
            <div class="simulator-right">
                <div class="simulator-right-box">
                    <div class="box-head">
                        <div class="box-title">装备分析</div>
                        <div class="box-desc"><span class="sign">*</span>佩戴装备涉及转职装备，将合并统计羁绊数量
                        </div>
                    </div>
                    <div class="upload-equipment-priority"><p class="upload-equipment-first-title">抢装顺序<i
                            class="icon-req"></i></p>
                        <div class="upload-equipment-list"><a href="javascript:" class="btn-plus">+</a>
                            <div class="icon-lineup-arrow-right"></div>
                            <a href="javascript:" class="btn-plus">+</a>
                            <div class="icon-lineup-arrow-right"></div>
                            <a href="javascript:" class="btn-plus">+</a>
                            <div class="icon-lineup-arrow-right"></div>
                            <a href="javascript:" class="btn-plus">+</a>
                            <div class="icon-lineup-arrow-right"></div>
                            <a href="javascript:" class="btn-plus">+</a></div>
                    </div>
                    <div class="upload-equipment-carry"><p class="upload-equipment-title">主C装备<i
                            class="icon-req"></i></p>
                        <div class="carry-champion"><a href="javascript:" class="btn-plus">+</a></div>
                    </div>
                    <div class="upload-equipment-other">
                        <div class="other-equip-list"></div>
                    </div>
                </div>
                <div class="simulator-right-box">
                    <div class="box-head">
                        <div class="box-title">强化符文<i class="icon-req"></i></div>
                        <div class="box-desc"><span class="sign">*</span>强化符文中涉及羁绊加成的，将合并统计羁绊数量
                        </div>
                    </div>
                    <div class="hex-wrapper">
                        <ul class="upload-hex-list">
                            <li>
                                <div class="upload-hex-title">优先</div>
                                <div class="upload-hex-wrap"><a href="javascript:;" class="btn-plus">+</a></div>
                                <div class="upload-hex-wrap"><a href="javascript:;" class="btn-plus">+</a></div>
                                <div class="upload-hex-wrap"><a href="javascript:;" class="btn-plus">+</a></div>
                            </li>
                            <li>
                                <div class="upload-hex-title">次选</div>
                                <div class="upload-hex-wrap"><a href="javascript:;" class="btn-plus">+</a></div>
                                <div class="upload-hex-wrap"><a href="javascript:;" class="btn-plus">+</a></div>
                                <div class="upload-hex-wrap"><a href="javascript:;" class="btn-plus">+</a></div>
                                <div class="upload-hex-wrap"><a href="javascript:;" class="btn-plus">+</a></div>
                                <div class="upload-hex-wrap"><a href="javascript:;" class="btn-plus">+</a></div>
                            </li>
                        </ul>
                    </div>
                </div>
                <div class="simulator-right-box">
                    <div class="box-head">
                        <div class="box-title">优先三星<i class="icon-req"></i></div>
                    </div>
                    <ul class="upload-champion-list">
                        <li><a href="javascript:" class="btn-plus">+</a></li>
                        <li><a href="javascript:" class="btn-plus">+</a></li>
                        <li><a href="javascript:" class="btn-plus">+</a></li>
                    </ul>
                </div>
                <div class="simulator-right-box">
                    <div class="box-head">
                        <div class="box-title">备选英雄</div>
                        <a href="javascript:" class="btn-add">新增</a></div>
                    <ul class="upload-replace-list">
                        <li>
                            <div class="alternative-item">
                                <div class="alternative-left"><a href="javascript:" class="btn-plus">+</a></div>
                                <div class="icon-lineup-arrow-right"></div>
                                <div class="alternative-right"><a href="javascript:" class="btn-plus">+</a>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
                <div class="simulator-right-box">
                    <div class="box-head">
                        <div class="box-title">开局可玩条件</div>
                    </div>
                    <div class="playable-cond-wrap">
                        <div class="playable-cond-title">强化</div>
                        <div class="item-wrap"><a href="javascript:;" class="btn-plus">+</a></div>
                        <div class="item-wrap"><a href="javascript:;" class="btn-plus">+</a></div>
                        <div class="item-wrap"><a href="javascript:;" class="btn-plus">+</a></div>
                    </div>
                    <div class="playable-cond-wrap">
                        <div class="playable-cond-title">装备</div>
                        <div class="equip-wrap"><a href="javascript:" class="btn-plus">+</a></div>
                        <div class="equip-wrap"><a href="javascript:" class="btn-plus">+</a></div>
                        <div class="equip-wrap"><a href="javascript:" class="btn-plus">+</a></div>
                    </div>
                    <div class="playable-cond-wrap">
                        <div class="playable-cond-title">弈子</div>
                        <div class="item-wrap"><a href="javascript:;" class="btn-plus">+</a></div>
                        <div class="item-wrap"><a href="javascript:;" class="btn-plus">+</a></div>
                        <div class="item-wrap"><a href="javascript:;" class="btn-plus">+</a></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'SimulatorPanel',
    props: {
        boardData: { type: Array, required: true },
        filterChampionGroups: { type: Array, default: () => [] },
    },
    data() {
        return {
            dataTypeVal: 'hero',
            equipTypeTab: [{ name: '基础', value: 'base' }],
            equipTypeTabVal: 'base',
            filterEquipmentList: [],
            synergyList: [],
            transferData: {},
            dropOverIndex: -1,
            isChessReplacement: false,
        }
    },
    methods: {
        searchEquipment() {},
        switchEquipType() {},
        onDragEquipmentEvent() {},
        onDragEnd() {},
        onDragBoardItemEvent() {},
        onDropToBoardEvent() {},
        onDragEnter() {},
        allowDrop(e) {
            if (e && e.preventDefault) e.preventDefault()
        },
        onClickBoardItemEvent() {},
        onDragEnterDeleteArea() {},
        onDropToDelete() {},
        showEquipmentTooltipForFinalBoard() {},
        removeEquipmentForFinalBoard() {},
    },
}
</script>
