<template>
  <div>
    <!-- 筛选区 -->
    <div class="mt-4 grid md:grid-cols-12 gap-4">
      <a-input class="col-span-3" placeholder="学号" v-model:value="filterData.stu_id"></a-input>
      <a-input class="col-span-3" placeholder="姓名" v-model:value="filterData.name"></a-input>
      <a-input class="col-span-3" placeholder="专业" v-model:value="filterData.major"></a-input>
      <a-input class="col-span-3" placeholder="班级" v-model:value="filterData.class"></a-input>
      <a-select class="col-span-3" placeholder="选课情况" v-model:value="filterData.status" allow-clear>
        <a-select-option :value="0">待处理</a-select-option>
        <a-select-option :value="1">已同意</a-select-option>
        <a-select-option :value="2">已拒绝</a-select-option>
      </a-select>
      <div class="col-span-3">
        <a-button type="primary" @click="init()">搜索</a-button>
        <a-button class="ml-2" @click="handleReset">重置</a-button>
      </div>
    </div>
    <!-- 批量操作 -->
    <div class="mt-4 flex justify-between items-center">

      <div>
        <span>轮次: {{ curStageInfo.stage }}</span>
        <span class="ml-4">限选人数: {{ courseInfo?.target_num }}</span>
        <span class="ml-4">已选人数: {{ successNum }}</span>
        <span class="ml-4">可选人数: {{ availableNum }}</span>
        <span class="ml-4">待处理人数: {{ waitNum }}</span>
      </div>
      <div>
        <a-button v-if="!selectMode" type="primary" danger @click="selectMode = 2">批量拒绝</a-button>
        <a-button v-if="!selectMode" class="ml-2" type="primary" @click="selectMode = 1">批量同意</a-button>
        <a-button v-if="selectMode" class="ml-4" @click="cacelMutil">取消</a-button>
        <a-button v-if="selectMode === 2" class="ml-4" type="primary" danger :loading="loading"
          @click="mutilReverse(2)">拒绝</a-button>
        <a-button v-if="selectMode === 1" class="ml-4" type="primary" :loading="loading"
          @click="mutilReverse(1)">同意</a-button>
      </div>
    </div>
    <!-- Table -->
    <div class="mt-4">
      <a-table :columns="columns" :data-source="dataSource" :pagination="pagination" :loading="loading"
        @change="handleTableChange" :scroll="{ y: 410, x: 'max-content' }" :row-selection="selectMode && rowSelection"
        row-key="id">
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">
            <span>{{ (index + 1) + 10 * (pagination.current - 1) }}</span>
          </template>
          <template v-if="column.key === 'sex'">
            <span>{{ record.sex === 1 ? '男' : '女' }}</span>
          </template>
          <template v-if="column.key === 'class_name'">
            <span>{{ record.class.name }}</span>
          </template>
          <template v-if="column.key === 'is_delay'">
            <span>{{ record.is_delay ? '是' : '否' }}</span>
          </template>
          <template v-if="column.key === 'status'">
              <a-tag v-if="record.status === 0" color="processing">等待反选</a-tag>
              <a-tag v-if="record.status === 1" color="success">选课成功</a-tag>
              <a-tag v-if="record.status === 2" color="error">已拒绝</a-tag>
            </template>
          <template v-if="column.key === 'option'">
            <a-button type="link" primary @click="open(record)">查看详情</a-button>
            <a-popconfirm title="是否同意该学生选修课程? " @confirm="handleReverse(record, 1)">
              <a-button type="link" :disabled="record.status !== 0">同意</a-button>
            </a-popconfirm>
            <a-popconfirm title="是否拒绝该学生选修课程? " @confirm="handleReverse(record, 2)">
              <a-button type="text" danger :disabled="record.status !== 0">拒绝</a-button>
            </a-popconfirm>
          </template>
        </template>
      </a-table>
    </div>
    <!-- Drawer -->
    <a-drawer v-model:open="drawerOpen" title="反选" width="400" placement="right" :maskClosable="false">
      <a-form ref="formRef" :model="formData" :label-col="{ span: 5 }" layout="horizontal">
        <a-form-item class="mb-2" label="学生姓名" name="course_time">
          <div class="border-b ">{{ formData.name }}</div>
        </a-form-item>
        <a-form-item class="mb-2" label="学号" name="course_time">
          <div class="border-b ">{{ formData.stu_id }}</div>
        </a-form-item>
        <a-form-item class="mb-2" label="性别" name="sex">
          <div class="border-b ">{{ formData.sex === 0 ? '女' : '男' }}</div>
        </a-form-item>
        <a-form-item class="mb-2" label="班级" name="class_name">
          <div class="border-b ">{{ formData?.class?.name }}</div>
        </a-form-item>
        <a-form-item class="mb-2" label="意向分" name="will_num" required>
          <a-slider v-model:value="formData.will_num" :min="0" :max="10" disabled />
        </a-form-item>
        <a-form-item class="mb-2" label="选课理由" name="cause" required>
          <a-textarea v-model:value="formData.cause" :auto-size="{ minRows: 4 }" disabled></a-textarea>
        </a-form-item>
        <a-form-item class="mb-2" label="轮次" name="status" required>
          <div class="border-b ">{{ formData.stage }}</div>
        </a-form-item>
        <a-form-item class="mb-2" label="选课结果" name="status">
          <a-tag v-if="formData.status === 0" color="processing">等待反选</a-tag>
          <a-tag v-if="formData.status === 1" color="success">已同意</a-tag>
          <a-tag v-if="formData.status === 2" color="error">已拒绝</a-tag>
        </a-form-item>

      </a-form>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { useTermStore, useUserStore } from '@/store/store';
import { handleResponse, tokenHeader } from '@/utils';
import { computed, reactive, ref, toRefs } from 'vue';
import { useRoute } from 'vue-router';
import { student as getMembers, reverse as reverseStu } from '@/api/service/select'
import { notification } from 'ant-design-vue';
import { detail as findDetail } from '@/api/service/course'


const route = useRoute()
const courseId = +route.query.course_id

const userStore = useUserStore()
const { userInfo } = toRefs(userStore)

const termStore = useTermStore()
const { curStageInfo } = toRefs(termStore)
/**初始化 */
if (userInfo.value.role === 'teacher') {
  termStore.setTeacherTermInfo()
}


/* 获取课程信息 */
const courseInfo = ref()
const getCourseInfo = async () => {
  const res = await findDetail({
    query: { course_id: '' + courseId, teacher_id: '' + userInfo.value.id },
    headers: tokenHeader()
  })
  handleResponse(res, () => {
    courseInfo.value = res.data
  })
}
/* 计算选课情况 限选 已选 可选 */
const successNum = computed(() => {
  const { first_success_num = 0, second_success_num = 0, third_success_num = 0 } = courseInfo.value?.selection_count || {}
  return (first_success_num + second_success_num + third_success_num) || 0
})
const availableNum = computed(() => {
  const oriAvailableNum = (courseInfo.value?.target_num - successNum.value) || 0
  if (selectMode.value === 1) {
    return oriAvailableNum - selectionRows.value.length
  }
  return oriAvailableNum
})
const waitNum = ref(0)

/**表格定义 */
const params = { module: 'student' }
const columns = [
  {
    title: '序号',
    // dataIndex: 'id',
    key: 'index',
    width: 60
  },

  {
    title: '学号',
    dataIndex: 'stu_id',
    key: 'stu_id',
  },
  {
    title: '姓名',
    dataIndex: 'name',
    key: 'name',

  },
  {
    title: '性别',
    dataIndex: 'sex',
    key: 'sex',
    width: 60
  },
  {
    title: '班级',
    dataIndex: 'class_name',
    key: 'class_name',
    width: 200
  },
  {
    title: '意向分',
    dataIndex: 'will_num',
    key: 'will_num',
    width: 100,
    align: 'center',
    sorter: {
      compare: (a, b) => a.will_num - b.will_num
    }
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 80
  },
  {
    title: '操作',
    key: 'option',
    fixed: 'right',
    align: 'center'

  },
]
const dataSource = ref([])

// 获取学生信息
const loading = ref(false)
const pagination = reactive({
  current: 1,
  total: 0,
  pageSize: 10,
})
const filterData = ref<{ stu_id?: string, name?: string, major?: string, class?: string, status?: number }>({
  status: 0
})
const getStudentList = async () => {
  loading.value = true
  try {
    const res = await getMembers({
      query: {
        page: '' + pagination.current, limit: '' + pagination.pageSize,
        teacher_id: '' + userInfo.value.id, course_id: '' + courseId,
        stage: '' + curStageInfo.value.stage,
        option: JSON.stringify(filterData.value)
      },
      headers: tokenHeader()
    })
    handleResponse(res, () => {
      dataSource.value = res.data.list?.map((r) => { return { ...r, ...r?.student, selection_id: r.id } })
      pagination.total = res.data.total
      waitNum.value = res.data.wait_num
    })
    loading.value = false
  } catch (e) {
    loading.value = false
  }
}
const init = async () => {
  await getCourseInfo()
  await getStudentList()
  selectMode.value = null
  selectionRows.value = []
  rowSelection.selectedRowKeys = []
}
init()
const handleTableChange = (pag) => {
  console.log('pag', pag);
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  init()
}

const handleReset = () => {
  filterData.value = {}
  pagination.current = 1
  init()
}

const selectionRows = ref([])
/* 批量操作 */
const selectMode = ref(null) // 批量操作类型 1-同意 2-拒绝
const studentIsSelect = (record) => {
  if (selectMode.value === 1) {
    // 同意
    if (record.status === 1) return true
    // 如果可选为 0, 那么其他未选中的 就要变为不可选
    if (availableNum.value === 0 && !selectionRows.value.find(s => s.id === record.id)) return true
  } else {
    // 拒绝
    return record.status === 2
  }
}
const rowSelection = reactive({
  selectedRowKeys: [],
  hideDefaultSelections: true,
  getCheckboxProps: (record) => ({
    disabled: studentIsSelect(record),
  }),
  onChange: (selectedRowKeys: (string | number)[], selectedRows: []) => {
    console.log(`selectedRowKeys: ${selectedRowKeys}`)
    console.log('selectedRows: ', selectedRows);
    if (selectMode.value === 1) {
      rowSelection.selectedRowKeys = selectedRowKeys.splice(0, availableNum.value)
      selectionRows.value = selectedRows.splice(0, availableNum.value)
    } else {
      rowSelection.selectedRowKeys = selectedRowKeys
      selectionRows.value = selectedRows
    }
  },
  onSelectAll: (selected: boolean, selectedRows: [], changeRows: []) => {
    // 拒绝不用处理
    if (selectMode.value === 2) return
    // 同意 (最多选到 available_num)
    let newSelectedRows = [];
    const available_num = availableNum.value
    if (selected) {
      newSelectedRows = changeRows.splice(0, available_num) // 数组截断
      rowSelection.selectedRowKeys = newSelectedRows.map(row => row.id);
    } else {
      rowSelection.selectedRowKeys = []
      selectionRows.value = []
    }
  },
});
// 取消批量选择
const cacelMutil = () => {
  selectMode.value = null
  rowSelection.selectedRowKeys = []
  selectionRows.value = []
}

// 单人反选
const handleReverse = async (record, status: number) => {
  if (availableNum.value === 0 && status === 1) {
    return notification.error({ message: '反选', description: '选课人数已达上限' })
  }
  loading.value = true
  const res = await reverseStu(courseId, [{ id: record.selection_id, status: record.status }], status, curStageInfo.value.stage, {
    headers: tokenHeader()
  })
  handleResponse(res, () => {
    notification.success({ message: '反选学生', description: '操作成功' })
    loading.value = false
    init()
  }, () => {
    notification.error({ message: '反选学生', description: res.message })
    loading.value = false
  })
}
// 批量反选
const mutilReverse = async (status: number) => {
  loading.value = true
  const records = selectionRows.value.map(row => {
    return { id: row.selection_id, status: row.status }
  })
  const res = await reverseStu(courseId, records, status, curStageInfo.value.stage, {
    headers: tokenHeader()
  })
  handleResponse(res, () => {
    notification.success({ message: '反选学生', description: '操作成功' })
    loading.value = false
    selectMode.value = null
    selectionRows.value = []
    rowSelection.selectedRowKeys = []
    init()
  }, () => {
    notification.error({ message: '反选学生', description: res.message })
    loading.value = false
  })
}

/* Drawer */
const drawerOpen = ref(false)
const formRef = ref()
const formData = ref<{
  name?: string,
  will_num?: number,
  status?: number,
  cause?: string,
  class?: { name: string },
  sex?: number,
  stu_id?: string,
  stage?: number
}>({})
const open = async (item?: {} | null) => {
  formData.value = { ...item }
  drawerOpen.value = true
}
</script>