<template>
  <!-- 按钮 -->
  <div class="">
    <a-button type="primary" @click="open()">新增班级</a-button>
    <a-button class="ml-2" type="primary" @click="handleImportOpen">导入数据</a-button>
  </div>
  <!-- Table -->
  <div class="mt-4">
    <a-table :columns="columns" :data-source="dataSource" :pagination="pagination" :loading="loading"
      @change="handleTableChange" :scroll="{ y: 495 }">
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'index'">
          <span>{{ (index + 1) + pagination.pageSize * (pagination.current - 1) }}</span>
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
    <!-- Upload Modal -->
    <a-modal v-model:open="importOpen" title="导入数据" @ok="handleUpload" centered
      :okButtonProps="{ disabled: !fileList.length }">
      <a-button type="primary" class="my-4" @click="downloadTemplate">下载导入模板</a-button>
      <a-upload-dragger class="my-2" v-model:fileList="fileList" name="file" :max-count="1" :before-upload="beforeUpload"
        @remove="handleRemove">
        <p class="ant-upload-drag-icon">
          <inbox-outlined></inbox-outlined>
        </p>
        <p class="text-sm text-neutral-500">点击或拖动文件至此区域上传</p>
      </a-upload-dragger>
      <div v-if="uploadInfo?.length" class="mt-2">
        <div class="text-black">导入日志:</div>
        <div class="max-h-[400px] overflow-y-auto mt-2 border text-red-400 rounded-md p-2" v-html="uploadInfo"></div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { downloadExcel, handleResponse, tokenHeader } from '@/utils';
import { UploadProps, notification } from 'ant-design-vue';
import { list as findByPage } from '@/api/service/class'
import {
  create as addClass, list as curdFind,
  update as updateClass, remove as deleteMajorById
} from '@/api/service/[module]/crud'
import dayjs from 'dayjs';
import { InboxOutlined } from '@ant-design/icons-vue';


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
  pageSize: 10,
  total: 0,
})

const loading = ref(false)
// 初始化
const init = async (page = 1) => {
  loading.value = true
  pagination.current = page
  const res = await findByPage({
    query: {
      page: '' + pagination.current,
      limit: '' + pagination.pageSize,
    },
    headers: tokenHeader()
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
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
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
    headers: tokenHeader(),
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
        headers: tokenHeader(),
        params
      })
    } else {
      // 新增
      delete data.id
      res = await addClass(data, {
        headers: tokenHeader(),
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
    headers: tokenHeader(),
    query: { id },
    params
  })
  handleResponse(res, () => {
    notification.success({ message: '班级管理', description: '删除成功!' })
    init()
  }, () => {
    notification.error({ message: '班级管理', description: '存在关联数据, 删除失败!' })
  })
}

/**导入数据 */
const importOpen = ref(false)
const handleImportOpen = () => {
  importOpen.value = true
  fileList.value = []
}
// 下载导入模板
const downloadTemplate = async () => {
  const buffer = await fetch('/api/class/download', { method: 'post' }).then(res => res.arrayBuffer())
  downloadExcel(buffer, '班级数据模板.xlsx')
}

const fileList = ref([]);

const handleRemove: UploadProps['onRemove'] = file => {
  const index = fileList.value.indexOf(file);
  const newFileList = fileList.value.slice();
  newFileList.splice(index, 1);
  fileList.value = newFileList;
};

const beforeUpload: UploadProps['beforeUpload'] = file => {
  fileList.value = [...(fileList.value || []), file];
  return false;
};

const uploadInfo = ref(null)
const handleUpload = async () => {

  console.log(fileList.value[0]);
  const formData = new FormData();
  formData.append('file', fileList.value[0].originFileObj);

  fetch('/api/upload/class', {
    method: 'POST',
    headers: { ...tokenHeader() },
    body: formData,
  })
    .then((res) => res.json())
    .then((res) => {
      console.log('ress', res);
      uploadInfo.value = ''
      if (res.code === 400) {
        // 异常日志
        uploadInfo.value = `<div class="text-red-400">${res.data.join('</br>')}</div>`
      } else if (res.code === 200) {
        if (res.data?.warningRows.length) {
          // 警告日志
          uploadInfo.value += `<div class="text-yellow-500">${res.data.warningRows.join('</br>')}</div>`
        }
        if (res.data?.importRows) {
          // 成功日志
          uploadInfo.value += `
          <div class="text-black">
            ${res.data.importRows.map(i => i.name + '导入成功').join('</br>')}
            <div>成功导入数据: ${res.data.importRows.length}条</div>
          </div>`
        }
      }
      init()
    });
}

</script>