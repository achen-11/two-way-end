<template>
  <div>
    <!-- 筛选 -->
    <div class="mt-2 grid md:grid-cols-6 lg:grid-cols-12 gap-4 w-full">
      <a-input class="col-span-3" placeholder="课程 ID" v-model:value="filterData.course_id"></a-input>
      <a-input class="col-span-3" placeholder="课程名称" v-model:value="filterData.name"></a-input>
      <a-input class="col-span-3" placeholder="课程领域" v-model:value="filterData.domain"></a-input>
      <a-input class="col-span-3" placeholder="课程类型" v-model:value="filterData.type"></a-input>
      <div class="col-span-3">
        <a-button @click="handleReset">重置</a-button>
        <a-button class="ml-2" type="primary" @click="init()">搜索</a-button>
      </div>
    </div>
    <!-- table -->
    <div class="mt-4">
      <a-table :columns="columns" :data-source="dataSource" :pagination="pagination" :loading="loading"
        @change="handleTableChange" :scroll="{ y: 380, x: 'max-content' }">
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">
            <span>{{ (index + 1) + 10 * (pagination.current - 1) }}</span>
          </template>
          <template v-if="column.key === 'course_id'">
            <a :href="record.link" target="_blank">{{ `[${record.course_id}] ${record.name}` }}</a>
          </template>
          <template v-if="column.key === 'score'">
            <span>{{ record.score + ' / ' + record.hour }}</span>
          </template>
          <template v-if="column.key === 'week_num'">
            <span>{{ `[${record.week_num}] 周${record.course_time}` }}</span>
          </template>
          <template v-if="column.key === 'teachers'">
            <span>{{ record.CourseTeachers.map(i => i?.teacher?.name)?.join("、") }}</span>
          </template>
          <template v-if="column.key === 'star_num'">
            <span>{{ record.StarCount?.num || 0 }}</span>
          </template>
          <template v-if="column.key === 'option'">
            <!-- <a-button type="link" primary @click="open(record)">编辑</a-button> -->
            <a-popconfirm title="是否收藏该课程? " @confirm="handleStar(record.id)" v-if="!record?.Star?.length">
              <a-button type="link">收藏</a-button>
            </a-popconfirm>
            <a-popconfirm title="是否取消收藏该课程? " @confirm="handleCancelStar(record.id)" v-else>
              <a-button type="text" danger>取消收藏</a-button>
            </a-popconfirm>
          </template>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTermStore, useUserStore } from '@/store/store';
import { FindCourseOption } from '@/utils/types';
import { reactive, ref, toRefs } from 'vue';
import { course, star, unstar } from '@/api/service/select'
import { handleResponse, tokenHeader } from '@/utils';

const userStore = useUserStore()
const termStore = useTermStore()
const { userInfo } = toRefs(userStore)
const { termInfo } = toRefs(termStore)

/**表格配置 */
const columns = [
  {
    title: '序号',
    key: 'index'
  },
  {
    title: '课程 ID',
    dataIndex: 'course_id',
    key: 'course_id'
  },
  {
    title: '学分/学时',
    dataIndex: 'score',
    key: 'score'
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
    key: 'type',
    width: '100px'
  },
  {
    title: '授课教师',
    dataIndex: 'teachers',
    key: 'teachers',
  },
  {
    title: '限选人数',
    dataIndex: 'target_num',
    key: 'target_num',
    width: 100,
    align: 'center'
  },
  {
    title: '收藏人数',
    // dataIndex: 'star_num',
    key: 'star_num',
    width: 100,
    align: 'center'
  },

  {
    title: '操作',
    dataIndex: 'option',
    key: 'option',
    align: 'center',
    fixed: 'right',

  },


]
const dataSource = ref([])

// 获取数据
const loading = ref(false)
const pagination = reactive({
  current: 1,
  total: 0,
  pageSize: 10,
})
const handleTableChange = (pag) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  init()
}

/**筛选 */
const filterData = ref({ course_id: '', name: '', domain: '', type: '', term_id: null })
const handleReset = () => {
  filterData.value = { course_id: '', name: '', domain: '', type: '', term_id: null }
}

// 获取课程
const init = async () => {
  loading.value = true
  const option: FindCourseOption = {
    stage: 0,
    academic_end: termInfo.value.academic_end,
    major_id: userInfo.value.class.major_id,
    enroll_year: userInfo.value.class.enroll_year,
    student_id: userInfo.value.id,
    ...filterData.value
  }
  const res = await course({
    query: { page: '' + pagination.current, limit: '' + pagination.pageSize, option: JSON.stringify(option) },
    headers: tokenHeader()
  })
  handleResponse(res, () => {
    console.log(res);
    dataSource.value = res.data.list
    pagination.total = res.data.total
    loading.value = false
  }, () => {
    loading.value = false
  })
}
init()


const startLoading = ref(false)
// 收藏课程
const handleStar = async (course_id: number) => {
  if (startLoading.value === true) return
  startLoading.value = true
  const student_id = userInfo.value.id
  const res = await star(course_id, student_id, { headers: tokenHeader() })
  handleResponse(res, () => {
    init()
    startLoading.value = false
  }, () => { startLoading.value = false })
}
const handleCancelStar = async (course_id: number) => {
  if (startLoading.value === true) return
  startLoading.value = true
  const student_id = userInfo.value.id
  const res = await unstar(course_id, student_id, { headers: tokenHeader() })
  handleResponse(res, () => {
    init()
    startLoading.value = false
  }, () => { startLoading.value = false })
}
</script>