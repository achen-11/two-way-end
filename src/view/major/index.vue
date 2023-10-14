<template>
  <!-- 按钮 -->
  <div class="">
    <a-button type="primary" @click="open()">新增专业</a-button>
  </div>
  <!-- Table -->
  <div class="mt-4">
    <a-table :columns="columns" :data-source="dataSource" :pagination="pagination" :loading="loading"
      @change="handleTableChange" :scroll="{y: 495}">
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'index'">
          <span>{{ (index + 1) + 10 * (pagination.current - 1) }}</span>
        </template>
        <template v-if="column.key === 'option'">
          <a-button type="link" primary @click="open(record)">编辑</a-button>
          <a-popconfirm title="是否确认删除该专业? " @confirm="handleDelete(record.id)">
            <a-button type="text" danger>删除</a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>
    <!-- Drawer -->
    <a-drawer v-model:open="drawerOpen" title="专业信息" placement="right" width="500">
      <a-form ref="formRef" :model="formData" :label-col="labelCol">
        <a-form-item label="专业ID" name="id" required>
          <a-input v-model:value="formData.id" :disabled="isEdit" />
        </a-form-item>
        <a-form-item label="专业名称" name="name" required>
          <a-input v-model:value="formData.name" />
        </a-form-item>
        <a-form-item label="所属学院" name="college" required>
          <a-select v-model:value="formData.college">
            <a-select-option value="人文学院">人文学院</a-select-option>
            <a-select-option value="商务与管理学院">商务与管理学院</a-select-option>
            <a-select-option value="信息与智能机电学院">信息与智能机电学院</a-select-option>
            <a-select-option value="环境与公共健康学院">环境与公共健康学院</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item :wrapper-col="{ span: 14, offset: 5 }">
          <a-button class="mr-2" @click="drawerOpen = false">取消</a-button>
          <a-button type="primary" @click="handleSubmit">确认</a-button>
        </a-form-item>
      </a-form>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { handleResponse, tokenHeader } from '@/utils';
import { notification } from 'ant-design-vue';
import { Major } from '@/utils/types'
import { 
  list as findByPage, create as addMajor, 
  update as updateMajor, remove as deleteMajorById
 } from '@/api/service/[module]/crud'

const columns = [
  {
    title: '序号',
    // dataIndex: 'id',
    key: 'index'
  },
  {
    title: '专业ID',
    dataIndex: 'id',
    key: 'id'
  },
  {
    title: '专业名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '所属学院',
    dataIndex: 'college',
    key: 'college',
  },
  {
    title: '操作',
    key: 'option',
  },
]

const dataSource = ref([])

const pagination = reactive({
  current: 1,
  total: 0,
})

const loading = ref(false)
// 初始化
const init = async (page = 1) => {
  loading.value = true
  pagination.current = page
  const res = await findByPage({
    params: { module: 'major' },
    query: { page: '' + page, limit: '' + 10 },
    headers: tokenHeader
  })
  handleResponse(res, () => {
    dataSource.value = res.data.list
    pagination.total = res.data.total
  })
  loading.value = false
}
init()
// 处理分页
const handleTableChange = (pag: { pageSize: number, current: number }, filters, sorter) => {
  init(pag.current)
}

// Drawer
const drawerOpen = ref(false)
// 表单
const formRef = ref()
const formData = ref({
  id: 0,
  name: '',
  college: '信息与智能机电学院',
})
const isEdit = ref(false)
const open = (item = null) => {
  if (item) {
    isEdit.value = true
    formData.value = { ...item }
  } else {
    isEdit.value = false
    formData.value = { id: 0, name: '', college: '', }
  }
  drawerOpen.value = true
}

const labelCol = { span: 5 }

const handleSubmit = async () => {
  // 触发校验
  console.log(formData.value);
  try {
    await formRef.value.validate()
    // 发送请求
    // 新增 or 编辑
    let res = null
    if (isEdit.value) {
      // 编辑
      res = await updateMajor(formData.value as Major, {
        headers: tokenHeader,
        params: { module: 'major' }
      })
    } else {
      // 新增
      res = await addMajor(formData.value as Major, {
        headers: tokenHeader,
        params: { module: 'major' }
      })
    }
    handleResponse(res, () => {
      notification.success({ message: '专业管理', description: '操作成功!' })
      drawerOpen.value = false
      init()
    })
  } catch (e) {
    notification.error({ message: '选课信息异常', description: e })
  }
}

const handleDelete = async (id: string) => {
  const res = await deleteMajorById({
    headers: tokenHeader,
    query: { id },
    params: { module: 'major'}
  })
  handleResponse(res, () => {
    notification.success({ message: '专业管理', description: '删除成功!' })
    init()
  })
}

</script>