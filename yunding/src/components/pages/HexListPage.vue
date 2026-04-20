<template>
    <div class="app-main">
        <div class="app-page-content">
            <div class="page-thesea">
                <div class="synergy-list">
                    <div class="synergy-list-head">
                        <span>名称</span>
                        <span>描述</span>
                    </div>
                    <div class="synergy-list-body">
                        <div class="synergy-item" v-for="hex in hexValues" :key="'hex_' + hex.hexId">
                            <div class="synergy">
                                <div class="component-hex">
                                    <div class="component-pic">
                                        <img :src="hex.imgUrl">
                                    </div>
                                </div>
                                <span class="sea-name">{{ hex.name }}</span>
                            </div>
                            <div class="synergy-txt">
                                <p class="txt-p">{{ hex.description }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'HexListPage',
    props: {
        hexMap: { type: Object, default: () => ({}) },
    },
    computed: {
        hexValues() {
            return Object.values(this.hexMap || {})
        },
    },
}
</script>
