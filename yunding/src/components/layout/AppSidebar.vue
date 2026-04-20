<template>
    <aside class="main-sidebar">
        <section class="sidebar">
            <div class="user-panel">
                <div class="pull-left image">
                    <img :src="viteBase + 'static/img/yasuo.jpg'" class="img-circle" alt="User Image">
                </div>
                <div class="pull-left info">
                    <p>小小英雄-亚索</p>
                    <a href="#"><i class="fa fa-circle text-success"></i> 在线</a>
                </div>
            </div>

            <ul class="sidebar-menu">
                <li class="header">菜单</li>

                <li id="lineup">
                    <a href="#" @click.prevent="go('lineup', '阵容推荐')"><i class="fa fa-group"></i>
                        <span>阵容推荐</span></a>
                </li>

                <li id="simulator">
                    <a href="#" @click.prevent="go('simulator', '阵容模拟')"><i class="fa fa-gamepad"></i>
                        <span>阵容模拟</span></a>
                </li>

                <li id="jobranking">
                    <a href="#" @click.prevent="go('jobranking', '羁绊排行')"><i class="fa fa-pie-chart"></i>
                        <span>羁绊排行</span></a>
                </li>

                <li id="herocloud">
                    <a href="#" @click.prevent="go('herocloud', '英雄词云')"><i class="fa fa-skyatlas"></i>
                        <span>英雄词云</span></a>
                </li>

                <li id="equipranking">
                    <a href="#" @click.prevent="go('equipranking', '装备排行')"><i class="fa fa-area-chart"></i>
                        <span>装备排行</span></a>
                </li>

                <li id="hero">
                    <a href="#" @click.prevent="go('hero', '英雄大全')"><i class="fa fa-user"></i>
                        <span>英雄大全</span></a>
                </li>

                <li id="equip">
                    <a href="#" @click.prevent="go('equip', '装备大全')"><i class="fa fa-wrench"></i>
                        <span>装备大全</span></a>
                </li>

                <li id="hex">
                    <a href="#" @click.prevent="go('hex', '海克斯大全')"><i class="fa fa-gg"></i>
                        <span>海克斯大全</span></a>
                </li>

                <li id="job">
                    <a href="#" @click.prevent="go('job', '羁绊大全')"><i class="fa fa-chain"></i>
                        <span>羁绊大全</span></a>
                </li>

                <li id="adventure">
                    <a href="#" @click.prevent="go('adventure', '强化果实大全')"><i class="fa fa-magic"></i>
                        <span>强化果实大全</span></a>
                </li>
            </ul>
        </section>
    </aside>
</template>

<script>
export default {
    name: 'AppSidebar',
    props: {
        viteBase: { type: String, required: true },
    },
    emits: ['navigate'],
    methods: {
        go(id, title) {
            this.$emit('navigate', id, title)
        },
    },
}
</script>
