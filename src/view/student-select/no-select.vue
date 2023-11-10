<template>
  <div class="flex flex-col justify-center items-center h-[580px]">
    <div>
      <span class="text-red-500">非选课时间!</span>
      <router-link to="/announce-stu" style="color: #409eff; margin-left: 10px">查看选课指南</router-link>
    </div>
    <div class="mt-2 text-neutral-500">{{ description }}</div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  description: String
})

</script>