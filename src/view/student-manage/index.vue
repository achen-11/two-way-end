<template>
  <!-- 按钮 -->
  <div class="">
    <a-button type="primary" @click="open()">新增学生</a-button>
    <a-button class="ml-2" type="primary" @click="modalOpen = true">导出学生数据</a-button>
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
      @change="handleTableChange" :scroll="{ y: 410, x: 'max-content' }">
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
        <template v-if="column.key === 'id_card'">
          <span>{{ record.id_card.substring(0, 4) + '********' + record.id_card.substring(12) }}</span>
        </template>
        <template v-if="column.key === 'is_delay'">
          <span>{{ record.is_delay ? '是' : '否' }}</span>
        </template>

        <template v-if="column.key === 'option'">
          <a-button type="link" primary @click="open(record)">编辑</a-button>
          <a-popconfirm title="是否确认重置该学生密码? " @confirm="handleResetPwd(record)">
            <a-button type="text" danger>重置密码</a-button>
          </a-popconfirm>
          <a-popconfirm title="此操作将删除该学生的账号, 选课等相关信息, 是否确认删除 " @confirm="handleDelete(record)">
            <a-button type="text" danger>删除</a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>
  </div>
  <!-- Drawer -->
  <a-drawer v-model:open="drawerOpen" title="班级信息" placement="right" width="500">
    <a-form ref="formRef" :model="formData" :label-col="{ span: 5 }">
      <a-form-item label="学号" name="stu_id" required>
        <a-input v-model:value="formData.stu_id" :disabled="isEdit" />
      </a-form-item>
      <a-form-item label="姓名" name="name" required>
        <a-input v-model:value="formData.name" />
      </a-form-item>
      <a-form-item label="性别" name="sex" required>
        <a-radio-group v-model:value="formData.sex">
          <a-radio :value="1">男</a-radio>
          <a-radio :value="0">女</a-radio>
        </a-radio-group>
      </a-form-item>
      <a-form-item label="身份证" name="id_card" required>
        <a-input v-model:value="formData.id_card" />
      </a-form-item>
      <a-form-item label="学生类型" name="type" required>
        <a-radio-group v-model:value="formData.type">
          <a-radio :value="0">本科</a-radio>
          <a-radio :value="1">专升本</a-radio>
        </a-radio-group>
      </a-form-item>
      <a-form-item label="专业" name="major_id" required>
        <a-select v-model:value="formData.major_id" :options="majorOption" :filter-option="filterOption" show-search
          @change="formData.class_id = null">
        </a-select>
      </a-form-item>
      <a-form-item label="班级" name="class_id" required>
        <a-select v-model:value="formData.class_id" :options="classOption" :filter-option="filterOption" show-search
          :disabled="!formData.major_id">
        </a-select>
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
  <!-- DownLoad Modal -->
  <a-modal v-model:open="modalOpen" title="导出数据" @ok="handleExport" centered>
    <a-radio-group v-model:value="downloadOption">
      <a-radio value="all">导出所有数据</a-radio>
      <a-radio value="cur-page">导出当前页</a-radio>
      <a-radio value="cur-all">导出当前筛选的所有数据</a-radio>
    </a-radio-group>
  </a-modal>
</template>

<script setup lang="ts">
/* 导入 */
import { computed, reactive, ref, watch } from 'vue'
import { downloadExcel, handleResponse, tokenHeader } from '@/utils';
import {
  list as findByPage, excel as exportExcel, remove as deleteStudent,
  update as updateStudent, create as createStudent
} from '@/api/service/student';
import { reset as resetPassword } from '@/api/service/account';
import { findByMajor } from '@/api/service/class'
import {
  update as crudUpdate, remove as crudRemove, list as curdFind
} from '@/api/service/[module]/crud'
import { notification } from 'ant-design-vue';

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
const filterData = ref<{
  stu_id?: string,
  name?: string,
  major?: string,
  class?: string,
  is_delay?: string,
}>({})
const init = async () => {
  loading.value = true
  try {
    const res = await findByPage({
      query: {
        page: '' + pagination.current, limit: '' + pagination.pageSize,
        option: JSON.stringify(filterData.value)
      },
      headers: tokenHeader()
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
  pagination.current = 1
  init()
}
/**Drawer */
const formData = ref<{
  major_id?: number,
  class_id?: number,
  id?: number,
  is_delay?: boolean,
  stu_id?: string,
  name?: string,
  sex?: number,
  id_card?: string,
  type?: number,
  class?: {
    name: string
    major: { name: string }
  }
}>({})

const drawerOpen = ref(false)
const isEdit = ref(false)
const formRef = ref()
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

// 更新数据

const handleSubmit = async () => {
  const data = {
    id: formData.value.id,
    stu_id: formData.value.stu_id,
    name: formData.value.name,
    sex: formData.value.sex,
    id_card: formData.value.id_card,
    class_id: formData.value.class_id,
    is_delay: formData.value.is_delay,
    type: formData.value.type,
  }
  try {
    await formRef.value.validate()
    let res
    if (isEdit.value) {
      res = await updateStudent(data, {
        headers: tokenHeader(),
      })
    } else {
      res = await createStudent(data, {
        headers: tokenHeader()
      })
    }
    handleResponse(res, () => {
      drawerOpen.value = false
      notification.success({ message: '学生信息管理', description: '操作成功!' })
      init()
    })
  } catch (e) {
    console.log('异常');
    
  }

}

/**导出数据 */
const modalOpen = ref(false)
const downloadOption = ref('all')

const handleExport = async () => {
  const data: { page?: number, limit?: number, option?: {} } = {}
  switch (downloadOption.value) {
    case 'all':
      data.page = 1
      data.limit = 1000000
      break;
    case 'cur-page':
      data.page = pagination.current
      data.limit = pagination.pageSize
      data.option = filterData.value
      break;
    case 'cur-all':
      data.page = 1
      data.limit = 1000000
      data.option = filterData.value
  }
  const arrayBuffer = await fetch('/api/student/excel', {
    method: 'post',
    headers: { ...tokenHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ args: [data.page, data.limit, data.option] })
  }).then(res => res.arrayBuffer())
  downloadExcel(arrayBuffer, '学生数据.xlsx')
}

/**重置密码 */
const handleResetPwd = async (record) => {
  try {
    const { stu_id, id_card } = record
    const res = await resetPassword(stu_id, id_card)
    handleResponse(res, () => {
      notification.success({ message: '重置密码', description: res.data })
    })
  } catch (e) {

  }
}

/**新增学生 */

/**获取所有专业数据 */
const majorOption = ref([])
const filterOption = (input: string, option: any) => {
  return option.label.includes(input)
};
const getAllMajor = async () => {
  const res = await curdFind({
    query: { page: '' + 1, limit: '999' },
    headers: tokenHeader(),
    params: { module: 'major' }
  })
  handleResponse(res, () => {
    majorOption.value = res.data.list.map(i => { return { label: i.name, value: i.id } })
  })
}
getAllMajor()

// 根据专业获取班级
const getClassByMajorId = async () => {
  if (formData.value.major_id) {
    const res = await findByMajor({
      query: { major_id: '' + formData.value.major_id },
      headers: tokenHeader()
    })
    return res.data.map(i => { return { label: i.name, value: i.id } })
  } else {
    return []
  }
}
const classOption = ref([])
watch(() => formData.value.major_id, async () => {
  classOption.value = await getClassByMajorId()
})

// 删除学生
const handleDelete = async (record) => {
  const res = await deleteStudent(record.id, {
    headers: tokenHeader()
  })
  handleResponse(res, () => {
    init()
  })
  return
}
</script>