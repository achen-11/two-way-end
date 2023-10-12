<template>
  <!-- 按钮 -->
  <div class="">
    <a-button type="primary" @click="">导出学生数据</a-button>
  </div>
  <!-- 筛选区 -->
  <div class="mt-4 grid md:grid-cols-12 gap-4">
    <a-input class="col-span-3" placeholder="学号" v-model:value="filterData.stu_id"></a-input>
    <a-input class="col-span-3" placeholder="姓名" v-model:value="filterData.name"></a-input>
    <a-input class="col-span-3" placeholder="专业" v-model:value="filterData.major"></a-input>
    <a-input class="col-span-3" placeholder="班级" v-model:value="filterData.class"></a-input>
    <a-input class="col-span-3" placeholder="是否延毕" v-model:value="filterData.is_delay"></a-input>
    <div class="col-span-3">
      <a-button type="primary" @click="init()">搜索</a-button>
      <a-button class="ml-2" @click="handleReset">重置</a-button>
    </div>
  </div>
  <!-- Table -->
  <div class="mt-4">
    <a-table :columns="columns" :data-source="dataSource" :pagination="pagination" :loading="loading"
      @change="handleTableChange" :scroll="{ y: 534, x: 'max-content' }">
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

        <template v-if="column.key === 'option'">
          <a-button type="link" primary @click="open(record)">编辑</a-button>
          <!-- <a-popconfirm title="是否确认删除该班级? " @confirm="handleDelete(record.id)">
            <a-button type="text" danger>删除</a-button>
          </a-popconfirm> -->
        </template>
      </template>
    </a-table>
  </div>
  <!-- Drawer -->
  <a-drawer v-model:open="drawerOpen" title="班级信息" placement="right" width="500">
    <a-form ref="formRef" :model="formData" :label-col="{ span: 5 }">
      <a-form-item label="学号" name="stu_id" required>
        <a-input v-model:value="formData.stu_id" :disabled="true" />
      </a-form-item>
      <a-form-item label="姓名" name="name" required>
        <a-input v-model:value="formData.name" :disabled="true" />
      </a-form-item>
      <a-form-item label="性别" name="sex" required>
        <a-radio-group v-model:value="formData.sex" :disabled="true">
          <a-radio :value="1">男</a-radio>
          <a-radio :value="0">女</a-radio>
        </a-radio-group>
      </a-form-item>
      <a-form-item label="身份证" name="id_card" required>
        <a-input v-model:value="formData.id_card" :disabled="true" />
      </a-form-item>
      <a-form-item label="专业" name="major_name" required>
        <a-input v-model:value="formData.class.major.name" :disabled="true" />
      </a-form-item>
      <a-form-item label="班级" name="class_name" required>
        <a-input v-model:value="formData.class.name" :disabled="true" />
      </a-form-item>
      <a-form-item label="是否延毕" name="is_delay" required>
        <a-radio-group v-model:value="formData.is_delay">
          <a-radio :value="true">是</a-radio>
          <a-radio :value="false">否</a-radio>
        </a-radio-group>
      </a-form-item>
      <a-form-item :wrapper-col="{ span: 14, offset: 5 }">
        <a-button class="mr-2" @click="drawerOpen = false">取消</a-button>
        <a-button type="primary" @click="handleSubmit">确认</a-button>
      </a-form-item>
    </a-form>
  </a-drawer>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { handleResponse, tokenHeader } from '@/utils';
import { notification } from 'ant-design-vue';
import { list as findByPage } from '@/api/service/student';

import {
  create as crudCreate, list as crudFind,
  update as crudUpdate, remove as crudRemove
} from '@/api/service/[module]/crud'

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
    title: '身份证',
    dataIndex: 'id_card',
    key: 'id_card',
    width: 200
  },
  {
    title: '班级',
    dataIndex: 'class_name',
    key: 'class_name',
    width: 200
  },
  {
    title: '是否延毕',
    dataIndex: 'is_delay',
    key: 'is_delay',
    width: 100
  },
  {
    title: '操作',
    key: 'option',
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
const filterData = ref({})
const init = async () => {
  loading.value = true
  try {
    const res = await findByPage({
      query: {
        page: pagination.current, limit: pagination.pageSize,
        option: JSON.stringify(filterData.value)
      },
      headers: tokenHeader
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
const handleTableChange = (pag) => {
  console.log('pag', pag);
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  init()
}

const handleReset = () => {
  filterData.value = {}
  init()
}
/**Drawer */
const formData = ref({})

const drawerOpen = ref(false)
const isEdit = ref(false)
const open = (item = null) => {
  if (item) {
    isEdit.value = true
    formData.value = { ...item }
    console.log(formData.value);
    formData.value.major_id = item.class.major_id
    formData.value.class_id = item.class.id
  } else {
    isEdit.value = false
    formData.value = {}
  }
  drawerOpen.value = true
}

const handleSubmit = async () => {
  const data = {
    id: formData.value.id,
    is_delay: formData.value.is_delay
  }
  try {
    const res = await crudUpdate(data, {
      headers: tokenHeader,
      params: { module: 'student'}
    })
    handleResponse(res, ()=>{
      drawerOpen.value = false
      init()
    })
  } catch(e) {
  }

}
</script>