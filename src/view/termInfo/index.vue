<template>
  <div class="grid md:grid-cols-12 gap-4">
    <a-button type="primary" @click="open()" class="ml-2 md:ml-0 col-span-2">新增选课</a-button>
    <a-button type="primary" class="ml-2 col-span-3" @click="autoSelect(1)">第一轮选课自动补选</a-button>
    <a-button type="primary" class="ml-2 col-span-3" @click="autoSelect(2)">第二轮选课自动补选</a-button>
    <a-button type="primary" class="ml-2 col-span-3" @click="autoCalibrate" :loading="calibrateLoading">课程计数校准</a-button>
  </div>
  <div class="">
    <h3 class="my-4">当前选课</h3>
    <a-table :dataSource="curDataSource" :columns="columns" :pagination="false" :scroll="{ y: 410, x: 'max-content' }">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'academic'">
          {{ record.academic_start }} - {{ record.academic_end }} 第{{ record.semester === 1 ? '一' : '二' }}学期
        </template>
        <template v-if="column.key === 'exhibitStage'">
          {{ dateTimeFormat(record.exhibit_stage_start) }} ~ {{ dateTimeFormat(record.exhibit_stage_end) }}
        </template>
        <template v-if="column.key === 'firstStage'">
          {{ dateTimeFormat(record.first_stage_start) }} ~ {{ dateTimeFormat(record.first_stage_end) }}

        </template>
        <template v-if="column.key === 'secondStage'">
          {{ dateTimeFormat(record.second_stage_start) }} ~ {{ dateTimeFormat(record.second_stage_end) }}
        </template>
        <template v-if="column.key === 'thirdStage'">
          {{ dateTimeFormat(record.third_stage_start) }} ~ {{ dateTimeFormat(record.third_stage_end) }}
        </template>
        <template v-if="column.key === 'option'">
          <a-button type="link" primary @click="open(record)">编辑</a-button>
          <a-popconfirm title="是否确认结束当前选课? " @confirm="endTrem(record.id)">
            <a-button type="text" danger>结束选课</a-button>
          </a-popconfirm>
        </template>

      </template>
    </a-table>
  </div>
  <div class="mt-4">
    <h3 class="my-4">历史选课</h3>
    <a-table :dataSource="dataSource" :columns="columns" :pagination="pagination" :scroll="{ y: 410, x: 'max-content' }"
      :loading="historyLoading" @change="handleTableChange">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'academic'">
          {{ record.academic_start }} - {{ record.academic_end }} 第{{ record.semester === 1 ? '一' : '二' }}学期
        </template>
        <template v-if="column.key === 'exhibitStage'">
          {{ dateTimeFormat(record.exhibit_stage_start) }} ~ {{ dateTimeFormat(record.exhibit_stage_end) }}
        </template>
        <template v-if="column.key === 'firstStage'">
          {{ dateTimeFormat(record.first_stage_start) }} ~ {{ dateTimeFormat(record.first_stage_end) }}

        </template>
        <template v-if="column.key === 'secondStage'">
          {{ dateTimeFormat(record.second_stage_start) }} ~ {{ dateTimeFormat(record.second_stage_end) }}
        </template>
        <template v-if="column.key === 'thirdStage'">
          {{ dateTimeFormat(record.third_stage_start) }} ~ {{ dateTimeFormat(record.third_stage_end) }}
        </template>
        <template v-if="column.key === 'option'">
          <a-button type="link" primary @click="open(record, true)">查看</a-button>
          <a-popconfirm title="是否确认删除该选课信息? " @confirm="showDeleteModal(record.id)">
            <a-button type="text" danger>删除</a-button>
          </a-popconfirm>
        </template>

      </template>
    </a-table>
  </div>
  <a-drawer v-model:open="drawerOpen" :title="title" placement="right" width="500">
    <a-form ref="formRef" :model="formData" :label-col="labelCol" :disabled="drawerDisabled">
      <a-form-item label="学年" name="academic" required>
        <a-range-picker v-model:value="formData.academic" picker="year" />
      </a-form-item>
      <a-form-item label="学期" name="semester" required>
        <a-radio-group v-model:value="formData.semester">
          <a-radio :value="1">第一学期</a-radio>
          <a-radio :value="2">第二学期</a-radio>
        </a-radio-group>
      </a-form-item>
      <a-form-item label="展示阶段" name="exhibitStage" required>
        <a-range-picker v-model:value="formData.exhibitStage" show-time />
      </a-form-item>
      <a-form-item label="第一阶段" name="firstStage" required>
        <a-range-picker v-model:value="formData.firstStage" show-time />
      </a-form-item>
      <a-form-item label="第二阶段" name="secondStage" required>
        <a-range-picker v-model:value="formData.secondStage" show-time />
      </a-form-item>
      <a-form-item label="第三阶段" name="thirdStage" required>
        <a-range-picker v-model:value="formData.thirdStage" show-time />
      </a-form-item>
      <a-form-item :wrapper-col="{ span: 14, offset: 5 }">
        <a-button class="mr-2" @click="drawerOpen = false">取消</a-button>
        <a-button type="primary" @click="handleSubmit">确认</a-button>
      </a-form-item>


    </a-form>
  </a-drawer>
  <a-modal v-model:open="deleteModal" title="二次确认" @ok="deleteTerm" :okButtonProps="{ disabled: !isDelete }">
    <div>确认后, 该学期的<span class="font-[700]">课程数据\选课数据</span>都会被删除, 且不可恢复, 
      如果确认删除, 请输入"<span class="text-red-400 font-[700]">确认删除</span>"后进行删除操作!</div>
    <a-input class="mt-2" v-model:value="deleteValue"></a-input>
  </a-modal>
</template>
<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';
import { dateTimeFormat, handleResponse, tokenHeader } from '@/utils'
import { getCurTermInfo, getHistoryTermInfo, addTremInfo, endCurTermById, deleteTermById, updateTremInfo } from '@/api/service/termInfo'
import { notification } from 'ant-design-vue';
import { auto as autoSelectStu } from '@/api/service/select'
import dayjs from 'dayjs';
import { calibrate } from '@/api/service/course';

// 当前
const curDataSource = ref([])
const columns = [
  {
    title: '学年学期',
    dataIndex: 'academic',
    key: 'academic',
  },
  {
    title: '展示阶段',
    dataIndex: 'exhibitStage',
    key: 'exhibitStage',
  },
  {
    title: '第一轮选课',
    dataIndex: 'firstStage',
    key: 'firstStage',
  },
  {
    title: '第二轮选课',
    dataIndex: 'secondStage',
    key: 'secondStage',
  },
  {
    title: '第三轮选课',
    dataIndex: 'thirdStage',
    key: 'thirdStage',
  },
  {
    title: '操作',
    dataIndex: '',
    key: 'option',
    fixed: 'right'
  }
]

// 历史
const dataSource = ref([])
const pagination = {
  current: 1,
  pageSize: 10,
  total: 0,
}
const historyLoading = ref(false)
// 初始化
const init = async () => {
  const curRes = await getCurTermInfo()
  if (curRes.code === 200 && curRes.data) {
    curDataSource.value = [curRes.data]
  } else {
    curDataSource.value = []
  }
  historyLoading.value = true
  const historyRes = await getHistoryTermInfo({
    query: { page: '' + pagination.current, limit: '' + pagination.pageSize }
  })
  historyLoading.value = false
  handleResponse(historyRes, () => {
    dataSource.value = historyRes.data.list
    pagination.total = historyRes.data.total
  })

}
init()
const handleTableChange = (pag) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  init()
}

// 新增 & 编辑 表单
const drawerOpen = ref(false)
const title = ref('新增选课')
const drawerDisabled = ref(false)
const open = (item = null, isDisabled = false) => {

  drawerDisabled.value = isDisabled
  if (item) {
    // 查看
    drawerOpen.value = true
    title.value = '查看选课信息'
    formData.value = {
      id: item.id,
      academic: [dayjs().year(item.academic_start), dayjs().year(item.academic_end)],
      semester: item.semester,
      exhibitStage: [dayjs(item.exhibit_stage_start), dayjs(item.exhibit_stage_end)],
      firstStage: [dayjs(item.first_stage_start), dayjs(item.first_stage_end)],
      secondStage: [dayjs(item.second_stage_start), dayjs(item.second_stage_end)],
      thirdStage: [dayjs(item.third_stage_start), dayjs(item.third_stage_end)]
    }
  } else {
    if (curDataSource.value.length === 1) {
      notification.warn({
        message: '新增选课⚠️',
        description: '当前存在进行中的选课，请结束后新增！',
        duration: 2
      })
      return
    }
    drawerOpen.value = true
    title.value = '新增选课'
    formData.value = { // 初始值
      id: null, academic: [], semester: null, exhibitStage: null,
      firstStage: null, secondStage: null, thirdStage: null,
    }
  }
}
const formData = ref({
  id: null,
  academic: [],
  semester: null,
  exhibitStage: null,
  firstStage: null,
  secondStage: null,
  thirdStage: null,
})
const labelCol = { span: 5 }
const formRef = ref()
// 添加选课
const handleSubmit = async () => {
  // 触发校验
  console.log(formData.value);
  try {
    await formRef.value.validate()
    // 发送请求
    // 新增 or 编辑
    let res = null
    if (formData.value.id) {
      // 编辑
      res = await updateTremInfo(formData.value, {
        headers: tokenHeader()
      })
    } else {
      // 新增
      res = await addTremInfo(formData.value, {
        headers: tokenHeader()
      })
    }
    if (res.code === 401) {
      notification.error({ message: '选课信息异常', description: res.message })
    }
    if (res.code === 200) {
      notification.success({ message: '选课信息', description: '操作成功!' })
      drawerOpen.value = false
      init()
    }
  } catch (e) {
    notification.error({ message: '选课信息异常', description: e })
  }
}

// 结束选课
const endTrem = async (id: number) => {
  console.log(id);
  const res = await endCurTermById(id, {
    headers: tokenHeader()
  })
  handleResponse(res, async () => {
    notification.success({ message: '结束选课', description: '当前选课已结束' })
    await init()
  })

}



// 自动补选
const autoSelect = async (stage: number) => {
  const res = await autoSelectStu(stage, {
    headers: tokenHeader()
  })
  handleResponse(res, () => {
    notification.success({ message: '自动补选', description: '自动补选已发起' })
  })
}

/* 删除选课信息 二次确认 */
const deleteModal = ref(false)
const deleteValue = ref()
const deleteId = ref()
const isDelete = computed(() => {
  return deleteValue.value === '确认删除'
})

// 
const showDeleteModal = (id: number) => {
  deleteModal.value = true
  deleteValue.value = ''
  deleteId.value = id
}

// 删除选课
const deleteTerm = async () => {
  const res = await deleteTermById({
    query: { id: '' + deleteId.value },
    headers: tokenHeader()
  })
  handleResponse(res, () => {
    notification.success({ message: '删除选课', description: '删除选课信息成功' })
    deleteModal.value = false
    init()
  })
}

// 课程统计数据校准
const calibrateLoading = ref(false)
const autoCalibrate = async () => {
  calibrateLoading.value = true
  const res = await calibrate({
    headers: tokenHeader()
  })
  handleResponse(res, ()=>{
    console.log(res);
    calibrateLoading.value = false
  }, ()=>{
    calibrateLoading.value = false
  })
}
</script>