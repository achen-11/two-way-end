<template>
  <a-layout style="height: 100vh;">
    <a-layout-sider breakpoint="lg" collapsed-width="0" @collapse="onCollapse" @breakpoint="onBreakpoint">
      <Menu></Menu>
    </a-layout-sider>
    <a-layout>
      <Header></Header>
      <a-layout-content :style="{ margin: '24px 16px 0' }">
        <div :style="{
          padding: route.name !== 'index' ? '24px 18px' : '',
          background: '#fff', minHeight: '360px', height: '100%', overflowY: 'auto'
        }">
          <router-view></router-view>
        </div>
      </a-layout-content>
      <div style="text-align: center" class="py-2 text-neutral-400">
        Ant Design ©2018 Created by Ant UED
      </div>
    </a-layout>
  </a-layout>
</template>
<script lang="ts" setup>
import { ref } from 'vue';
import Header from './header.vue';
import Menu from './menu.vue';
import { useRoute } from 'vue-router';
const onCollapse = (collapsed: boolean, type: string) => {
  // console.log(collapsed, type);
};

const onBreakpoint = (broken: boolean) => {
  // console.log(broken);
};
const route = useRoute()
console.log(route);

</script>
<style scoped>
#components-layout-demo-responsive .logo {
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  margin: 16px;
}

.site-layout-sub-header-background {
  background: #fff;
}

.site-layout-background {
  background: #fff;
}

[data-theme='dark'] .site-layout-sub-header-background {
  background: #141414;
}
</style>
