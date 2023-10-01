<template>
  <a-config-provider :locale="locale">
    <div class="app">
      <router-view></router-view>
    </div>
  </a-config-provider>
</template>

<script setup lang="ts">
import zhCN from 'ant-design-vue/es/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
dayjs.locale('zh-cn');


const locale = zhCN

</script>


<style>
.app {
  min-height: 100vh;
}
</style>
