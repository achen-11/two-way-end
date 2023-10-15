<template>
  <div class="">
    <a-button type="primary" @click="open()">新增教师</a-button>
  </div>
  <!-- 筛选区 -->
  <div class="mt-4 grid md:grid-cols-12 gap-4">
    <a-input class="col-span-3" placeholder="工号" v-model:value="filterData.teacher_id"></a-input>
    <a-input class="col-span-3" placeholder="姓名" v-model:value="filterData.name"></a-input>
    <div class="col-span-3">
      <a-button type="primary" @click="init()">搜索</a-button>
      <a-button class="ml-2" @click="handleReset">重置</a-button>
    </div>
  </div>
  <!-- Table -->
  <div class="mt-4">
    <a-table :columns="columns" :data-source="dataSource" :pagination="pagination" :loading="loading"
      @change="handleTableChange" :scroll="{ y: 410, x: 'max-content' }">
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'index'">
          <span>{{ (index + 1) + 10 * (pagination.current - 1) }}</span>
        </template>
        <template v-if="column.key === 'option'">
          <a-button type="link" primary @click="open(record)">编辑</a-button>
          <a-popconfirm title="是否确认删除该班级? " @confirm="handleDelete(record.id)">
            <a-button type="text" danger>删除</a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>
  </div>
  <!-- Drawer -->
  <a-drawer v-model:open="drawerOpen" title="专业信息" placement="right" width="500">
    <a-form ref="formRef" :model="formData" :label-col="{ span: 5 }">
      <a-form-item label="教师工号" name="teacher_id" required>
        <a-input v-model:value="formData.teacher_id" :disabled="isEdit" />
      </a-form-item>
      <a-form-item label="姓名" name="name" required>
        <a-input v-model:value="formData.name" />
      </a-form-item>
      <a-form-item :wrapper-col="{ span: 14, offset: 5 }">
        <a-button class="mr-2" @click="drawerOpen = false">取消</a-button>
        <a-button type="primary" @click="handleSubmit">确认</a-button>
      </a-form-item>
    </a-form>
  </a-drawer>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { list as crudFind, update as crudUpdate } from '@/api/service/[module]/crud'
import { create as teacherCreate, remove as teacherDelete } from '@/api/service/teacher'
import { tokenHeader, handleResponse } from "@/utils";
import { notification } from "ant-design-vue";
const params = { module: 'teacher' }
/**初始化数据 */
const filterData = ref({ teacher_id: null, name: null })
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const columns = [
  {
    title: '序号',
    key: 'index'
  },
  {
    title: '工号',
    dataIndex: 'teacher_id',
    key: 'teacher_id'
  },
  {
    title: '姓名',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '操作',
    key: 'option',
    fixed: 'right',
  },
]
const dataSource = ref()
const loading = ref(false)
// 获取数据
const init = async () => {
  loading.value = true
  try {
    const res = await crudFind({
      headers: tokenHeader(),
      params,
      query: {
        page: '' + pagination.current,
        limit: '' + pagination.pageSize,
        where: JSON.stringify({ ...filterData.value })
      }
    })
    handleResponse(res, () => {
      dataSource.value = res.data.list
      pagination.total = res.data.total
    })
    loading.value = false
  } catch (e) {
    loading.value = false
  }
}
init()
// 表格变化
const handleTableChange = (pag) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  init()
}

// 重置筛选数据
const handleReset = () => {
  filterData.value = { teacher_id: null, name: null }
  pagination.current = 1
  init()
}

/**Drawer */
const drawerOpen = ref(false)
const isEdit = ref(false)
const formData = ref<{ id?: number, name: string, teacher_id?: string }>({
  name: ''
})
const open = async (item?: { id?: number, name: string, teacher_id?: string } | null) => {
  if (!item) {
    // 新增
    isEdit.value = false
    formData.value = { name: '' }
    drawerOpen.value = true
  } else {
    // 编辑
    isEdit.value = true
    formData.value = item
    drawerOpen.value = true
  }
}
const handleSubmit = async () => {
  if (isEdit.value && formData.value.id) {
    const res = await crudUpdate({
      id: formData.value.id,
      name: formData.value.name,
      teacher_id: formData.value.teacher_id
    }, { headers: tokenHeader(), params, })
    handleResponse(res, () => {
      drawerOpen.value = false
      init()
      notification.success({message: '教师信息管理', description: '更新成功'})
    })
  } else if (!isEdit.value) {
    const res = await teacherCreate(formData.value.teacher_id, formData.value.name, { headers: tokenHeader() })
    handleResponse(res, () => {
      drawerOpen.value = false
      init()
      notification.success({message: '教师信息管理', description: '新增成功'})
    })
  }
}
const handleDelete = async (id: number) => {
  const res = await teacherDelete({ headers: tokenHeader(), query: {id: ''+id} })
  handleResponse(res, () => {
    init()
    notification.success({message: '教师信息管理', description: '删除成功'})
  })
}
</script>