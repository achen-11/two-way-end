<template>
  <div class="flex justify-center items-center text-white text-xl pt-4">选课系统</div>
  <a-menu v-model:selectedKeys="selectedKeys" theme="dark" mode="inline" :items="items">
  </a-menu>
</template>

<script setup lang="ts">
import { VueElement, computed, reactive, ref } from 'vue';
import { UserOutlined, VideoCameraOutlined, UploadOutlined } from '@ant-design/icons-vue';
import { useRouterStore } from '@/store/store';
import { ItemType } from 'ant-design-vue';
import { RouteRecordRaw } from 'vue-router';

const routerStore = useRouterStore()

const items = computed(() => {
  function generateRouter(routes: RouteRecordRaw[], isSub?:Boolean) {
    const res = [];
    routes.forEach(route => {
      if (route.meta.hidden) return // 隐藏
      if (!route.children && !isSub) return
      if (route.children?.length === 1) {
        // 一级路由
        const { meta, path } = route.children[0];
        if (meta.hidden) return
        const item = {
          label: meta?.title || '',
          key: path,
          icon: meta?.icon,
        }
        res.push(item);
      } else if (route.children?.length >= 2) {
        // 多级路由
        const { meta, children, path } = route;
        const item = {
          label: meta?.title || '',
          key: path,
          icon: meta?.icon,
          children: generateRouter(children, true)
        }
        res.push(item);
      } else if (isSub) {
        const { meta, children, path } = route;
        const item = {
          label: meta?.title || '',
          key: path,
          icon: meta?.icon,
          children: null
        }
        if (children) {
          item.children = generateRouter(children, true)
        }
        res.push(item)
      }

    });
    
    return res;
  }
  // 获取RootRouter
  
  const res = generateRouter(routerStore.routers)
  console.log(res);
  return res
})

const selectedKeys = ref<string[]>(['/']);
</script>