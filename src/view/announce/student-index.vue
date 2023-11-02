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

  <a-modal v-model:open="modalOpen" title="通知" :footer="null" width="600px">
    <div class="max-h-[400px] overflow-y-auto">
      <div v-html="modalContent.content"></div>
      <div class="flex justify-center">
        <a-button type="primary" class="min-w-[100px]" @click="handleOk()">确认</a-button>
      </div>
    </div>
  </a-modal>
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

/**弹窗通知公告 */
const modalOpen = ref(false)
const modalContent = ref<{content: string}>({content: ''})
const handleOk = () => {
  modalOpen.value = false
}
const showModal = async () => {
  const isFirst = localStorage.getItem('isFirst')
  // id存在则获取 id 内容
  if (isFirst && isFirst==='false') {
    return
  }
  const res = await getAnnounceDetail({
    query: { id: '-1' },
    headers: tokenHeader()
  })
  handleResponse(res, () => {
    // 显示弹窗
    modalContent.value = res.data
    modalOpen.value = true
    localStorage.setItem('isFirst', 'false')
  }, ()=>{
    // 异常处理
    modalOpen.value = false
    return
  })
}
showModal()


</script>