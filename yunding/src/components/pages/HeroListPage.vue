<template>
    <div class="page-champion">
        <div class="champion-list">
            <div class="champion-item-big" v-for="(hero, idx) in sortedHeroes" :key="'hero_' + idx"
                 @click="$emit('show-info', hero.title + ' ' + hero.displayName, hero.skillDetail)">
                <div class="champion-item-pic" :style="{'background-image': 'url('+hero.picPath+')'}">
                    <div class="blur-img" :style="{'background-image': 'url('+hero.picPaths+')'}"></div>
                    <div class="race-job-wrap">
                        <div class="race-job" v-for="(job, jidx) in getJobAndRaces(hero.jobIds, hero.raceIds)"
                             :key="'rj_' + jidx">
                            <span class="race-job-icon" @click.stop="$emit('show-info', job.name, job.introduce)">
                                <img :src="job.imagePath" class="icon-img">
                            </span>
                            <span class="race-job-name"
                                  @click.stop="$emit('show-info', job.name, job.introduce)">{{ job.name }}</span>
                        </div>
                    </div>
                </div>
                <div class="champion-item-info">
                    <span class="name">{{ hero.title }}  {{ hero.displayName }}</span>
                    <span class="price">
                        <i class="icon-price"></i>
                        {{ hero.price }} 金币
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'HeroListPage',
    props: {
        sortedHeroes: { type: Array, default: () => [] },
        getJobAndRaces: { type: Function, required: true },
    },
    emits: ['show-info'],
}
</script>
