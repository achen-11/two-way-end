<template>
  <!-- 按钮 -->
  <div class="">
    <a-button type="primary" @click="open()">新增班级</a-button>
  </div>
  <!-- Table -->
  <div class="mt-4">
    <a-table :columns="columns" :data-source="dataSource" :pagination="pagination" :loading="loading"
      @change="handleTableChange" :scroll="{ y: 495 }">
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'index'">
          <span>{{ (index + 1) + 10 * (pagination.current - 1) }}</span>
        </template>
        <template v-if="column.key === 'major'">
          <span>{{ record.major.name }}</span>
        </template>
        <template v-if="column.key === 'option'">
          <a-button type="link" primary @click="open(record)">编辑</a-button>
          <a-popconfirm title="是否确认删除该班级? " @confirm="handleDelete(record.id)">
            <a-button type="text" danger>删除</a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>
    <!-- Drawer -->
    <a-drawer v-model:open="drawerOpen" title="班级信息" placement="right" width="500">
      <a-form ref="formRef" :model="formData" :label-col="labelCol">
        <a-form-item label="班级名称" name="name" required>
          <a-input v-model:value="formData.name" />
        </a-form-item>
        <a-form-item label="专业" name="major_id" required>
          <a-select v-model:value="formData.major_id" :options="majorOption" :filter-option="filterOption" show-search>
          </a-select>
        </a-form-item>
        <a-form-item label="入学年份" name="enroll_year" required>
          <a-date-picker v-model:value="formData.enroll_year" picker="year" />
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
import { list as findByPage } from '@/api/service/class'
import {
  create as addClass, list as curdFind,
  update as updateClass, remove as deleteMajorById
} from '@/api/service/[module]/crud'
import dayjs from 'dayjs';

// crud 的 params
const params = { module: 'class' }

const columns = [
  {
    title: '序号',
    // dataIndex: 'id',
    key: 'index'
  },
  {
    title: '班级名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '专业',
    dataIndex: 'major',
    key: 'major',
  },
  {
    title: '入学年份',
    dataIndex: 'enroll_year',
    key: 'enroll_year',
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
  id: null,
  name: '',
  major_id: '',
  major: null,
  enroll_year: dayjs(),
})
const isEdit = ref(false)

// 显示弹窗
const open = (item = null) => {
  if (item) {
    isEdit.value = true
    formData.value = { ...item }
    formData.value.enroll_year = dayjs(formData.value.enroll_year, 'YYYY')
  } else {
    isEdit.value = false
    formData.value = { id: null, name: '', major_id: '', major: null, enroll_year: dayjs(), }
  }
  drawerOpen.value = true
}
// 获取 major 数据
const majorOption = ref([])
const getAllMajor = async () => {
  const res = await curdFind({
    query: { page: '' + 1, limit: '999' },
    headers: tokenHeader,
    params: { module: 'major' }
  })
  handleResponse(res, () => {
    majorOption.value = res.data.list.map(i => { return { label: i.name, value: i.id } })
  })
}
getAllMajor()

const filterOption = (input: string, option: any) => {
  return option.label.includes(input)
};

const labelCol = { span: 5 }

// 新增 & 更新
const handleSubmit = async () => {
  // 触发校验
  console.log(formData.value);
  try {
    await formRef.value.validate()
    // 发送请求
    // 新增 or 编辑
    let res = null
    const data = {
      id: formData.value.id,
      name: formData.value.name,
      major_id: formData.value.major_id,
      enroll_year: dayjs(formData.value.enroll_year).format('YYYY')
    }
    if (isEdit.value) {
      // 编辑
      res = await updateClass(data, {
        headers: tokenHeader,
        params
      })
    } else {
      // 新增
      delete data.id
      res = await addClass(data, {
        headers: tokenHeader,
        params
      })
    }
    handleResponse(res, () => {
      notification.success({ message: '班级管理', description: '操作成功!' })
      drawerOpen.value = false
      init()
    })
  } catch (e) {
    notification.error({ message: '班级管理异常', description: e })
  }
}

const handleDelete = async (id: string) => {
  const res = await deleteMajorById({
    headers: tokenHeader,
    query: { id },
    params
  })
  handleResponse(res, () => {
    notification.success({ message: '班级管理', description: '删除成功!' })
    init()
  })
}

</script>