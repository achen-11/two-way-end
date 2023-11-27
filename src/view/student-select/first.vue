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
    <div class="my-4 font-[700]">限选门数: {{ limitNum === Infinity ? '无限制' : limitNum }}</div>
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
          <template v-if="column.key === 'target_num'">
            <span>{{ calctTargetNum(record.target_num, record.selection_count, curStageInfo.stage) }}</span>
          </template>
          <template v-if="column.key === 'select_num'">
            <span>{{ getSelectedNum(record.selection_count, curStageInfo.stage) }}</span>
          </template>
          <template v-if="column.key === 'option'">
            <a-button type="link" @click="open(record)" v-if="isSelected(record) === null">选课</a-button>
            <!-- <a-button type="link" primary @click="open(record)">编辑</a-button> -->
            <a-popconfirm title="是否确认取消选课? " @confirm="handleCancelSelect(record)" v-else-if="isSelected(record) === 0">
              <a-button type="text" danger>取消选课</a-button>
            </a-popconfirm>
            <a-tag color="success" v-else-if="isSelected(record) === 1">选课成功</a-tag>
          </template>
        </template>
      </a-table>
    </div>
  </div>
  <!-- Drawer -->
  <a-drawer v-model:open="drawerOpen" title="选课" width="400" placement="right" :maskClosable="false">
    <a-form ref="formRef" :model="formData" :label-col="{ span: 5 }" layout="horizontal">
      <a-form-item class="mb-2" label="课程" name="course_id" required>
        <a class="border-b pb-1" :href="formData.link" target="_blank">{{ `[${formData.course_id}] ${formData.name}`
        }}</a>
      </a-form-item>
      <a-form-item class="mb-2" label="授课教师" name="teachers">
        <div class="border-b pb-1">{{ formData.CourseTeachers.map(i => i?.teacher?.name)?.join("、") }}</div>
      </a-form-item>
      <a-form-item class="mb-2" label="学分/学时" name="score">
        <div class="border-b pb-1">{{ formData.score }} / {{ formData.hour }}</div>
      </a-form-item>
      <a-form-item class="mb-2" label="授课时间" name="course_time">
        <div class="border-b pb-1">{{ `[${formData.week_num}] 周${formData.course_time}` }}</div>
      </a-form-item>
      <a-form-item class="mb-2" label="课程领域" name="domain">
        <div class="border-b pb-1">{{ formData.domain }}</div>
      </a-form-item>
      <a-form-item class="mb-2" label="课程类型" name="type">
        <div class="border-b pb-1">{{ formData.type || '--' }}</div>
      </a-form-item>
      <a-form-item class="mb-2" label="意向分" name="will_num" required>
        <a-slider v-model:value="formData.will_num" :min="0" :max="10" />
      </a-form-item>
      <a-form-item class="mb-2" label="选课理由" name="cause" required>
        <a-textarea v-model:value="formData.cause" :auto-size="{ minRows: 4 }"></a-textarea>
      </a-form-item>

      <a-form-item class="mb-0" :wrapper-col="{ span: 14, offset: 5 }">
        <a-button class="mr-2" @click="drawerOpen = false">取消</a-button>
        <a-button type="primary" @click="handleSelect">确认</a-button>
      </a-form-item>
    </a-form>
  </a-drawer>
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
    align: 'center'
  },
  {
    title: '已选人数',
    key: 'select_num',
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
    stage: curStageInfo.value.stage,
    academic_end: termInfo.value.academic_end,
    major_id: userInfo.value.class.major_id,
    enroll_year: userInfo.value.class.enroll_year,
    student_id: userInfo.value.id
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

/** Drawer */
const drawerOpen = ref(false)
const formRef = ref()
const submitLoading = ref(false)
const formData = ref<courseRecord>({})
const open = async (item?: { id?: number, name: string, teacher_id?: string } | null) => {
  formData.value = { ...item, will_num: 1, cause: '' }
  drawerOpen.value = true
}

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
const handleSelect = async () => {
  try {
    // 校验表单
    submitLoading.value = true
    await formRef.value.validate()
    // 选课需要的数据
    const course_id = formData.value.id
    const student_id = userInfo.value.id
    const stage = curStageInfo.value.stage
    const will_num = formData.value.will_num
    const cause = formData.value.cause
    const res = await select(course_id, student_id, stage, will_num, cause, { headers: tokenHeader() })
    handleResponse(res, () => {
      init()
      drawerOpen.value = false
      submitLoading.value = false
      notification.success({ message: '选课', description: '操作成功' })
    })
  } catch (e) {
    submitLoading.value = false

  }
}
/* 取消选课 */
const handleCancelSelect = async (record) => {
  const { id, Selection } = record
  const student_id = userInfo.value.id
  const stage = curStageInfo.value.stage
  const status = Selection.find(s => s.stage === stage)?.status

  const res = await unselect(id, student_id, stage, status, { headers: tokenHeader() })
  handleResponse(res, () => {
    init()
    notification.success({ message: '取消选课', description: '取消选课成功' })
  })
}

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