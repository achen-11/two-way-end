<template>
  <div class="flex justify-center items-center text-white text-xl pt-4">选课系统</div>
  <a-menu v-model:selectedKeys="selectedKeys" v-model:openKeys="openKeys" theme="dark" mode="inline" :items="items"
    @click="handleChange">
  </a-menu>
</template>

<script setup lang="ts">
import { VueElement, computed, reactive, ref } from 'vue';
import { useRouterStore } from '@/store/store';
import { RouteRecordRaw } from 'vue-router';
import router from '@/router';

const routerStore = useRouterStore()

const items = computed(() => {
  function generateRouter(routes: RouteRecordRaw[], isSub?: Boolean) {
    const res = [];
    routes.forEach(route => {
      if (route.meta.hidden) return // 隐藏
      if (!route.children && !isSub) return // 没有子路由, pass
      if (route.children?.length === 1) {
        // 有子路由, 且数量为1, 则为一级路由
        const { meta, path } = route.children[0];
        if (meta.hidden) return
        const item = {
          label: meta?.title || '',
          key: path,
          icon: meta?.icon,
        }
        res.push(item);
      } else if (route.children?.length >= 2) {
        // 有子路由, 且数量大于1, 则为多级路由
        const { meta, children, path } = route;
        const item = {
          label: meta?.title || '',
          key: path,
          icon: meta?.icon,
          // 生成sub-menus
          children: generateRouter(children, true)
        }
        // openKeys.value.push(path) // 默认全部展开
        res.push(item);
      } else if (isSub) {
        // 处理sub-menu
        const { meta, children, path } = route;
        const item = {
          label: meta?.title || '',
          key: path,
          icon: meta?.icon,
          children: null
        }
        // 子路由还有children, 则为三级+ 路由
        if (children) {
          item.children = generateRouter(children, true)
        }
        res.push(item)
      }

    });

    return res;
  }

  // 生成menu
  const res = generateRouter(routerStore.routers)
  console.log('menus', res);
  return res
})

const selectedKeys = ref<string[]>([location.hash.slice(1) || '/']);
const getCurTopPath = () => {
  const path = location.hash.slice(1) || '/';  // 使用正则表达式匹配路径
  const match = path.match(/\/([^\/]+)\/[^\/]+$/);

  if (match && match[1]) {
    return `/${match[1]}`;
  }

  return null; // 如果匹配失败返回null
}
const openKeys = ref<string[]>([getCurTopPath()])
// 切换菜单(页面跳转)
const handleChange = (item) => {
  const { key } = item
  router.push(key)

}
</script>