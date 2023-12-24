<template>
  <!-- Table -->
  <div class="mt-4">
    <a-table :columns="columns" :data-source="dataSource" :loading="loading" :scroll="{ y: 380, x: 'max-content' }">
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'index'">
          {{ index + 1 }}
        </template>
        <template v-if="column.key === 'course_id'">
          <a :href="record.link" target="_blank" v-if="!record?.link || record.link !== '#'" class="underline">
            {{ `[${record.course_id}]` }}
          </a>
          <span v-else>
            {{ `[${record.course_id}]` }}
          </span>
          {{ record.name }}
        </template>
        <template v-if="column.key === 'score'">
          <span>{{ record.score + ' / ' + record.hour }}</span>
        </template>
        <template v-if="column.key === 'week_num'">
          <span>{{ `[${record.week_num}] ${record.course_time}` }}</span>
        </template>
        <template v-if="column.key === 'teachers'">
          <span>{{ record.CourseTeachers.map(i => i?.teacher?.name)?.join("、") }}</span>
        </template>
        <template v-if="column.key === 'option'">
          <a-button type="link" @click="viewStudent(record)">反选</a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, toRefs } from 'vue'
import { course as getCourse } from '@/api/service/teacher'
import { getAllTermInfo } from '@/api/service/termInfo'
import { handleResponse, tokenHeader } from '@/utils';
import { notification } from 'ant-design-vue';
import { useTermStore, useUserStore } from '@/store/store';
import { courseRecord } from '@/utils/types';
import { useRouter } from 'vue-router';
import { registerCoordinateSystem } from 'echarts';

const userStore = useUserStore()
const { userInfo } = toRefs(userStore)

/**获取当前termid */
const termStore = useTermStore()

const { termInfo } = toRefs(termStore)


/**Table 配置项 */
const columns = [
  {
    title: '序号',
    key: 'index',
    align: 'center',
    width: 60
  },
  {
    title: '课程 ID',
    dataIndex: 'course_id',
    key: 'course_id'
  },
  {
    title: '学分/学时',
    dataIndex: 'score',
    key: 'score',
    width: 120,
    align: 'center'
  },
  {
    title: '授课时间',
    dataIndex: 'week_num',
    key: 'week_num'
  },
  {
    title: '课程领域',
    dataIndex: 'domain',
    key: 'domain'
  },
  {
    title: '课程类型',
    dataIndex: 'type',
    key: 'type'
  },
  {
    title: '授课教师',
    dataIndex: 'teachers',
    key: 'teachers',
    width: 180,
  },
  {
    title: '限选人数',
    dataIndex: 'target_num',
    key: 'target_num',
    width: 100
  },
  {
    title: '操作',
    dataIndex: 'option',
    key: 'option',
    fixed: 'right',
    align: 'center'
  },


]
const loading = ref(false)
const dataSource = ref([])

// 获取教师课程信息
const init = async () => {
  const res = await getCourse({
    query: { term_id: '' + termInfo.value.id, teacher_id: '' + userInfo.value.id },
    headers: tokenHeader()
  })
  handleResponse(res, () => {
    console.log(res.data);
    dataSource.value = res.data
  })
}
init()


const router = useRouter()
const viewStudent = (record) => {
  router.push({ path: '/two-way/teacher-select', query: { course_id: record.id } })
}

</script>