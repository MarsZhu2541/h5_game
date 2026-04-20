<template>
    <div class="app-page-content">
        <div class="page-hex-buff">
            <div class="synergy-list">
                <div class="synergy-list-head adventure-list">
                    <span>名称</span>
                    <span>描述</span>
                </div>
                <div class="synergy-list-body">
                    <div class="synergy-item" v-for="(adve, idx) in fruitList" :key="'fruit_' + idx">
                        <div class="synergy">
                            <div class="wand-pic" draggable="false"><img :src="adve.imageUrl"></div>
                            <span class="hex-name">{{ adve.title }}</span>
                        </div>
                        <div class="synergy-txt">
                            <p class="txt-p">{{ adve.desc }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'AdventureFruitPage',
    props: {
        fruitList: { type: Array, default: () => [] },
    },
}
</script>
