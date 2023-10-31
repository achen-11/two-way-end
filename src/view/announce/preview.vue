<template>
  <div class="">
    <div class="text-xl font-800 text-center">{{ formData.title }}</div>
    <div class="flex justify-center flex-wrap mt-3 text-neutral-500">
      <div class="mx-1">{{ formData.department }}</div>
      <div class="mx-1">浏览量: {{ formData.click_num }}</div>
      <div class="mx-1">发布时间: {{ dateTimeFormat(formData.publish_time )}}</div>
    </div>
    <a-divider></a-divider>
    <div v-html="formData.content"></div>
  </div>
</template>

<script setup lang="ts">
import { detail as getAnnounceDetail } from '@/api/service/announce'
import { dateTimeFormat, handleResponse, tokenHeader } from '@/utils';
import { notification } from 'ant-design-vue';
import { ref } from 'vue';
import { useRoute } from 'vue-router';


const route = useRoute()

const formData = ref({
  title: '',
  content: '',
  department: '',
  publish_time: '',
  click_num: 0
})

const init = async () => {
  const id = route.query?.id
  if (id) {
    // id存在则获取 id 内容
    const res = await getAnnounceDetail({
      query: { id: '' + id },
      headers: tokenHeader()
    })
    handleResponse(res, () => {
      formData.value = res.data
    })
  } else {
    notification.error({message: '通知公告预览', description: 'id 参数缺失, 请返回列表重试'})
  }
}
init()
</script>