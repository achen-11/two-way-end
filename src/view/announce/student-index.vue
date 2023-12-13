<template>
  <a-typography-title :level="3">通知公告</a-typography-title>
  <div class="mt-2 min-h-[570px] min-w-[400px] overflow-x-auto">
    <div v-for="(item, index) in announceList" @click="handleDetail(item.id)"
      class="py-3 border-b px-2 flex items-center justify-between cursor-pointer hover:bg-neutral-100">
      <div> {{ item.title }} </div>
      <div class="text-neutral-500"> {{ dateTimeFormat(item.publish_time) }} </div>
    </div>
  </div>
  <div class="flex justify-end mt-2">
    <a-pagination v-model:current="pagination.current" :total="pagination.total" v-model:page-size="pagination.pageSize"
      show-less-items @change="handleChange" />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { list as findAnnounceList, detail as getAnnounceDetail } from '@/api/service/announce'
import { dateTimeFormat, handleResponse, tokenHeader } from '@/utils';
import { useRouter } from 'vue-router';

/** 分页获取通知 */
const announceList = ref([])
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const loading = ref(false)
const getAnnounceList = async () => {
  loading.value = true
  const res = await findAnnounceList({
    query: { page: '' + pagination.current, limit: '' + pagination.pageSize },
    headers: tokenHeader()
  })
  handleResponse(res, () => {
    announceList.value = res.data.list
    pagination.total = res.data.total
  })
  loading.value = false
}
getAnnounceList()
const handleChange = (page, pageSize) => {
  pagination.current = page
  pagination.pageSize = pageSize
  getAnnounceList()
}

/** 查看通知详情 */
const router = useRouter()
const handleDetail = (id: number) => {
  router.push('/announce/detail?id=' + id)
}

</script>