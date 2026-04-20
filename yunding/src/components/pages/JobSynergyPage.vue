<template>
    <div class="app-page-content">
        <div class="page-synergy">
            <div class="synergy-list">
                <div class="synergy-list-head">
                    <span>特质</span><span>羁绊</span><span>协同英雄</span>
                </div>
                <div class="synergy-list-body" v-for="(map, midx) in mapList" :key="'map_' + midx">
                    <div class="synergy-item" v-for="job in mapValues(map)" :key="jobKey(job)">
                        <div class="synergy">
                            <span class="synergy-icon">
                                <img :src="job.imagePath">
                            </span>
                            {{ job.name }}
                        </div>
                        <div class="synergy-txt">
                            <p class="txt-p">
                                {{ job.introduce }}
                            </p>
                            <p class="txt-p2" v-for="(value, key, i) in job.level" :key="'lvl_' + key">
                                <span
                                    :class="'txt-level level-'+i">{{ key }}</span>
                                {{ value }}
                            </p>
                        </div>
                        <div class="synergy-champion-list">
                            <div :class="'component-champion cost'+hero.price"
                                 v-for="(hero, hidx) in heroesForJob(job)"
                                 :key="'h_' + hidx">
                                <div draggable="false" class="champion-pic" @click="$emit('show-hero-msg', hero.id)">
                                    <img :src="hero.picUrl" draggable="false">
                                </div>
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
    name: 'JobSynergyPage',
    props: {
        jobMap: { type: Object, default: () => ({}) },
        raceMap: { type: Object, default: () => ({}) },
        getHeroesByJobId: { type: Function, required: true },
    },
    emits: ['show-hero-msg'],
    computed: {
        mapList() {
            return [this.jobMap, this.raceMap]
        },
    },
    methods: {
        mapValues(map) {
            return Object.values(map || {})
        },
        jobKey(job) {
            return (job.jobId != null ? 'j' : 'r') + (job.jobId || job.raceId)
        },
        heroesForJob(job) {
            const id = job.jobId != null ? job.jobId : job.raceId
            const list = this.getHeroesByJobId(id)
            return Array.isArray(list) ? list : []
        },
    },
}
</script>
