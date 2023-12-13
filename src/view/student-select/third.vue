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
    <div class="my-2">
      <a-checkbox class="col-span-3 flex items-center" v-model:checked="filterData.only_star" @change="init">
        仅展示收藏课程
      </a-checkbox>
    </div>
    <div class="my-4 font-[700]">限选学分: {{ limitNum === Infinity ? 4 : 2 }}</div>
    <!-- table -->
    <div class="mt-4">
      <a-table :columns="columns" :data-source="dataSource" :pagination="pagination" :loading="loading"
        @change="handleTableChange" :scroll="{ y: 380, x: 'max-content' }">
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">
            <span>{{ (index + 1) + 10 * (pagination.current - 1) }}</span>
          </template>
          <template v-if="column.key === 'course_id'">
            <a :href="record.link" target="_blank">
              <StarFilled class="text-yellow-400" v-if="record?.Star?.length" />
              {{ `[${record.course_id}] ${record.name}` }}
            </a>
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
          <template v-if="column.key === 'target_num'">
            <span>{{ calctTargetNum(record.target_num, record.selection_count, curStageInfo.stage) }}</span>
          </template>
          <template v-if="column.key === 'select_num'">
            <span>{{ getSelectedNum(record.selection_count, curStageInfo.stage) }}</span>
          </template>
          <template v-if="column.key === 'option'">
            <a-popconfirm title="是否确认选课? " @confirm="handleSelect(record)" v-if="isSelected(record) === null">
              <a-button type="link" 
                :disabled="calctTargetNum(record.target_num, record.selection_count, curStageInfo.stage) - getSelectedNum(record.selection_count, curStageInfo.stage) <= 0">选课</a-button>
            </a-popconfirm>
            <a-tag color="success" v-else-if="isSelected(record) === 1">选课成功</a-tag>
          </template>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTermStore, useUserStore } from '@/store/store';
import { FindCourseOption, courseRecord } from '@/utils/types';
import { computed, reactive, ref, toRefs } from 'vue';
import { course, select, unselect } from '@/api/service/select'
import { handleResponse, tokenHeader } from '@/utils';
import { calctTargetNum, getSelectedNum } from '@/utils/termInfo'
import { notification } from 'ant-design-vue';
import { Selection } from '@prisma/client';

const userStore = useUserStore()
const termStore = useTermStore()
const { userInfo } = toRefs(userStore)
const { termInfo, curStageInfo } = toRefs(termStore)

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
    key: 'score',
    width: 100,
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
    align: 'center',
    sorter: {
      compare: (a, b) => {
        const a_num = calctTargetNum(a.target_num, a.selection_count, curStageInfo.value.stage)
        const b_num = calctTargetNum(b.target_num, b.selection_count, curStageInfo.value.stage)
        return a_num - b_num
      }
    }
  },
  {
    title: '已选人数',
    key: 'select_num',
    width: 100,
    align: 'center',
    sorter: {
      compare: (a, b) => {
        return getSelectedNum(a.selection_count, curStageInfo.value.stage) - getSelectedNum(b.selection_count, curStageInfo.value.stage)
      }
    }
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
  // console.log('触发 change', pag);
  if (pag.current === pagination.current && pag.pageSize === pagination.pageSize) return
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  init()
}

/**筛选 */
const filterData = ref<{
  course_id?: string, name?: string, domain?: string, type?: string, only_star: boolean
}>({ only_star: false })

const handleReset = () => { filterData.value = { only_star: false } }

// 获取课程
const init = async () => {
  loading.value = true
  const option: FindCourseOption = {
    stage: curStageInfo.value.stage,
    academic_end: termInfo.value.academic_end,
    major_id: userInfo.value.class.major_id,
    enroll_year: userInfo.value.class.enroll_year,
    student_id: userInfo.value.id,
    only_star: filterData.value.only_star,
    ...filterData.value
  }
  const res = await course({
    query: { page: '' + pagination.current, limit: '' + pagination.pageSize, option: JSON.stringify(option) },
    headers: tokenHeader()
  })
  handleResponse(res, () => {
    console.log(res);
    dataSource.value = res.data.list
    loading.value = false
  }, () => {
    loading.value = false
  })
}
init()


// 限选
const limitNum = computed(() => {
  const { class: { enroll_year }, type } = userInfo.value
  const { academic_end } = termInfo.value
  // 专升本不限制
  if (type === 1) return Infinity

  const grade = academic_end - enroll_year
  if (grade <= 2) {
    return 2
  } else {
    return Infinity
  }
})

/* 选课 */
const submitLoading = ref(false)
const handleSelect = async (record) => {
  try {
    // 校验表单
    submitLoading.value = true
    // 选课需要的数据
    const course_id = record.id
    const student_id = userInfo.value.id
    const stage = curStageInfo.value.stage
    const will_num = record.will_num
    const cause = record.cause
    const res = await select(course_id, student_id, stage, will_num, cause, { headers: tokenHeader() })
    handleResponse(res, () => {
      init()
      submitLoading.value = false
      notification.success({ message: '选课', description: '操作成功' })
    })
  } catch (e) {
    submitLoading.value = false

  }
}

// /* 取消选课 */
// const handleCancelSelect = async (record) => {
//   const { id, Selection } = record
//   const student_id = userInfo.value.id
//   const stage = curStageInfo.value.stage
//   const status = Selection.find(s => s.stage === stage)?.status

//   const res = await unselect(id, student_id, stage, status, { headers: tokenHeader() })
//   handleResponse(res, () => {
//     init()
//     notification.success({ message: '取消选课', description: '取消选课成功' })
//   })
// }

/* 判断是否已选 */
const isSelected = (record) => {
  const selections: Selection[] = record?.Selection || []
  const success_record = selections.filter(s => s.status === 1)
  const wait_record = selections.filter(s => s.status === 0)
  if (success_record.length > 0) return 1
  if (wait_record.length > 0) return 0
  return null
}
</script>