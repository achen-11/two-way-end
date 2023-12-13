<template>
  <a-config-provider :locale="locale">
    <div class="app">
      <router-view></router-view>
    </div>
    <a-modal v-model:open="modalOpen" title="通知" :footer="null" width="600px" centered>
      <div class="max-h-[400px] overflow-y-auto">
        <div v-html="modalContent.content"></div>
        <div class="flex justify-center">
          <a-button type="primary" class="min-w-[100px]" @click="handleOk()">确认</a-button>
        </div>
      </div>
    </a-modal>
  </a-config-provider>
</template>

<script setup lang="ts">
import zhCN from 'ant-design-vue/es/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { ref, toRefs, watch } from 'vue';
import { detail as getAnnounceDetail } from '@/api/service/announce'
import { handleResponse, tokenHeader } from './utils';
import { useUserStore } from './store/store';

dayjs.locale('zh-cn');


const locale = zhCN
/**弹窗通知公告 */
const userStore = useUserStore()
const { userInfo } = toRefs(userStore)
const modalOpen = ref(false)
const modalContent = ref<{ content: string }>({ content: '' })
const handleOk = () => {
  modalOpen.value = false
}
watch(userInfo, ()=>{
  showModal()
})

const showModal = async () => {
  const isFirst = localStorage.getItem('isFirst')
  console.log('userInfo.value.role', userInfo.value.role);
  
  if (userInfo.value.role === null || userInfo.value.role !== 'student') {
    return
  }
  // id存在则获取 id 内容
  if (isFirst && isFirst === 'false') {
    return
  }
  const res = await getAnnounceDetail({
    query: { id: '-1' },
    // headers: tokenHeader()
  })
  handleResponse(res, () => {
    // 显示弹窗
    modalContent.value = res.data
    modalOpen.value = true
    localStorage.setItem('isFirst', 'false')
  }, () => {
    // 异常处理
    modalOpen.value = false
    return
  })
}

</script>

<style>
.app {
  min-height: 100vh;
}
</style>
