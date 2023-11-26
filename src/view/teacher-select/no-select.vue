<template>
  <div class="flex flex-col justify-center items-center h-[580px]">
    <div>
      <span class="text-red-500">非反选时间!</span>
    </div>
    <div class="mt-2 text-neutral-500">{{ description }}</div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  description: String
})

</script>