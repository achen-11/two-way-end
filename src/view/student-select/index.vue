<template>
  <div>
    <a-spin :spinning="loading">
      <!-- 选课信息 -->
      <h3 class="text-center text-xl">双向选课</h3>
      <div class="flex flex-wrap justify-center items-center">
        <div class="mr-3 mt-2">
          学年学期: <span class="font-[600]">{{ termInfo.academic_start }}-{{ termInfo.academic_end }}第{{ termInfo.semester
            === 1
            ? '一' : '二' }}学期</span>
        </div>
        <div class="mr-3 mt-2">
          轮次: <span class="font-[600]">{{ curStageInfo.title }}</span>
        </div>
        <div class="mt-2">
          时间区段: <span class="font-[600]">
            {{ dateTimeFormat(curStageInfo.timeRange?.[0], 'YY-MM-DD HH:mm:ss') }} ~ {{
              dateTimeFormat(curStageInfo.timeRange?.[1], 'YY-MM-DD HH:mm:ss') }}
          </span>
        </div>
      </div>
      <!-- 选课内容 -->
      <Exhibit v-if="curStageInfo.stage === 0"></Exhibit>
      <First v-else-if="curStageInfo.stage === 1 || curStageInfo.stage === 2"></First>
      <Third v-else-if="curStageInfo.stage === 3"></Third>
      <no-select :description="curStageInfo.description" v-else="curStageInfo.stage === -999"></no-select>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { dateTimeFormat } from '@/utils';
import { useTermStore } from '@/store/store'
import { ref, toRefs } from 'vue';
import { notification } from 'ant-design-vue';
import noSelect from './no-select.vue'
import Exhibit from './exhibit.vue';
import First from './first.vue';
import Third from './third.vue';

// 获取当前选课信息
const termStore = useTermStore()
const { termInfo, curStageInfo } = toRefs(termStore)

const loading = ref(false)
const init = async () => {
  loading.value = true
  try {
    await termStore.setTermInfo()
    console.log('termInfo;;', termInfo.value);
    console.log(curStageInfo);
    loading.value = false
  } catch (e) {
    notification.error({ message: '双向选课', description: '获取课程数据异常' })
    loading.value = false
  }
}
init()
// 判断当前选课阶段

</script>