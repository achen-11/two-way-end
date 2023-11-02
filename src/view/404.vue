<template>
  <div class="h-[100vh] flex flex-col justify-center items-center">
    <a-result status="404" title="404" sub-title="该页面不存在">
      <template #extra>
        <a-button type="primary" @click="backHome">返回主页</a-button>
      </template>
    </a-result>
  </div>
</template>
<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter()
const backHome = () => {
  router.push('/')
}
</script>