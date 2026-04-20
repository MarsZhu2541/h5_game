<template>
    <div id="appMain" class="app-main">
        <div class="app-page-content">
            <div class="page-thesea">
                <div class="synergy-list">
                    <div class="synergy-list-head">
                        <span>名称</span>
                        <span>描述</span>
                    </div>
                    <div class="synergy-list-body">
                        <div class="synergy-item" v-for="equip in equipValues"
                             :key="'eq_' + equip.equipId"
                             @click="$emit('show-equip-msg', equip.equipId)">
                            <div class="synergy">
                                <div class="component-hex">
                                    <img :src="equip.imagePath">
                                </div>
                                <span class="sea-name">{{ equip.name }}</span>
                            </div>
                            <div class="synergy-txt">
                                <p class="txt-p">{{ equip.effect }}</p>
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
    name: 'EquipListPage',
    props: {
        equipMap: { type: Object, default: () => ({}) },
    },
    emits: ['show-equip-msg'],
    computed: {
        equipValues() {
            return Object.values(this.equipMap || {})
        },
    },
}
</script>
