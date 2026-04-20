<template>
    <div>
        <div v-if="lineupFetchLoading" class="lineup-panel-loading">正在加载阵容列表…</div>
        <div v-else-if="lineupList.length && !lineupList[0].info && lineupEnriching" class="lineup-panel-loading">
            正在加载英雄、装备与海克斯数据…
        </div>
        <div class="lineup-list" v-else-if="lineupList.length && lineupList[0].info">
            <div class="lineup-item" v-for="(lineuplist, idx) in lineupList" :key="'lineup_' + idx">
                <div class="lineup-info" :title="lineuplist.info"
                     @click="$emit('show-info', lineuplist.line_name, lineuplist.info)">
                    <div class="lineup-champion-bg"
                         :style="{'background-image': 'url('+lineuplist.bgImagePath+')'}"></div>
                    <div class="lineup-name">
                        {{ lineuplist.line_name }}
                    </div>
                    <div class="lineup-quality" v-if="lineuplist.quality"><span>{{ lineuplist.quality }}</span>
                    </div>
                    <div class="lineup-hex">
                        <div class="component-hex" v-for="(hex, hidx) in lineuplist.hexbuff.recomm" :key="'hex_' + hidx">
                            <div class="component-pic" :title="hex.name+': '+hex.description"
                                 @click.stop="$emit('show-info', hex.name, hex.description)">
                                <img :src="hex.imgUrl">
                            </div>
                        </div>
                    </div>
                    <div class="lineup-champions">
                        <div class="swiper-container">
                            <div class="swiper-wrapper">
                                <div class="champion-wrap swiper-slide" style="width: 85.4444px;"
                                     v-for="(chess, cidx) in lineuplist.hero_location" :key="'chess_' + cidx">
                                    <div :class="chess.chessPriceClass">
                                        <div draggable="false" class="champion-pic" :title="chess.name"
                                             @click.stop="$emit('show-info', chess.name, chess.skillDetail)">

                                            <img :src="chess.hero_image"
                                                 draggable="false">
                                        </div>
                                        <div class="icon-carry" v-if="chess.is_carry_hero"></div>
                                        <div class="champion-stars star-3" v-if="chess.is_3_star">
                                            <i class="icon-champion-star"></i>
                                            <i class="icon-champion-star"></i>
                                            <i class="icon-champion-star"></i>
                                        </div>
                                    </div>
                                    <div class="equipment-list" v-if="chess.equip_list">
                                        <div class="component-equipment" v-for="(equip, eqidx) in chess.equip_list"
                                             :key="'eq_' + eqidx"
                                             @click.stop="$emit('show-equip-msg', equip.id)">
                                            <img :src="equip.imagePath">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <a href="#" class="lineup-link"></a>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'LineupPanel',
    props: {
        lineupFetchLoading: { type: Boolean, default: false },
        lineupEnriching: { type: Boolean, default: false },
        lineupList: { type: Array, default: () => [] },
    },
    emits: ['show-info', 'show-equip-msg'],
}
</script>

<style scoped>
.lineup-panel-loading {
    padding: 48px 24px;
    text-align: center;
    color: #666;
    font-size: 15px;
}
</style>
