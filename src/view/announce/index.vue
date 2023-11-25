<template>
  <div>
    <div class="">
      <a-button type="primary" @click="handleCreate()">新增通知</a-button>
    </div>
    <div class="mt-4">
      <a-table :columns="columns" :data-source="dataSource" :pagination="pagination" :loading="loading"
        @change="handleTableChange" :scroll="{ y: 380, x: 'max-content' }">
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">
            <span>{{ (index + 1) + 10 * (pagination.current - 1) }}</span>
          </template>
          <template v-if="column.key === 'status'">
            <a-tag color="green" v-if="record.status">已发布</a-tag>
            <a-tag color="red" v-if="!record.status">未发布</a-tag>
          </template>
          <template v-if="column.key === 'option'">
            <a-button type="link" class="px-0" primary @click="handlePreview(record)">预览</a-button>
            <a-button type="link" class="px-1" primary @click="handleEdit(record)">编辑</a-button>
            <a-popconfirm title="是否确认删除该通知? " @confirm="handleDelete(record.id)">
              <a-button  class="px-1" type="text" danger>删除</a-button>
            </a-popconfirm>
            <a-popconfirm title="是否确认发布该通知? " @confirm="handlePublish(record.id)" v-if="!record.status">
              <a-button class="px-0" type="link">发布</a-button>
            </a-popconfirm>
            <a-popconfirm title="是否确认取消发布该通知? " @confirm="cancelPublish(record.id)" v-if="record.status">
              <a-button class="px-0" type="text" danger>取消发布</a-button>
            </a-popconfirm>
          </template>
        </template>
      </a-table>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { list as findAnnounceList } from '@/api/service/announce'
import { update as updateAnnounce, remove as deleteAnnounce } from '@/api/service/[module]/crud'
import { handleResponse, tokenHeader } from '@/utils';
import { notification } from 'ant-design-vue';
const param = 'announce'

// 跳转到创建通知
const router = useRouter()
const handleCreate = () => {
  router.push('/announce/edit')
}

/**Table */
const columns = [
  {
    title: '序号',
    key: 'index',
    width: 60,
  },
  {
    title: '标题',
    dataIndex: 'title',
    key: 'title',
    minWidth: 200
  },
  {
    title: '部门',
    dataIndex: 'department',
    key: 'department'
  },
  {
    title: '点击量',
    dataIndex: 'click_num',
    key: 'click_num',
    minWidth: 100
  },
  {
    title: '发布状态',
    dataIndex: 'status',
    key: 'status'
  },
  {
    title: '操作',
    dataIndex: 'option',
    key: 'option',
    fixed: 'right',
    width: 150
  },
]
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const loading = ref(false)

const dataSource = ref([])
const getAnnounceList = async () => {
  loading.value = true
  const res = await findAnnounceList({
    query: { page: '' + pagination.current, limit: '' + pagination.pageSize },
    headers: tokenHeader()
  })
  handleResponse(res, () => {
    dataSource.value = res.data.list
    pagination.total = res.data.total
  })
  loading.value = false
}
getAnnounceList()

const handleTableChange = (pag) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  getAnnounceList()
}
/** 删除 */
const handleDelete = async (id) => {
  const res = await deleteAnnounce({
    query: { id },
    params: { module: param },
    headers: tokenHeader()
  })
  handleResponse(res, ()=>{
    notification.success({ message: '通知公告', description: '通知删除成功' })
    getAnnounceList()
  })
}
/** 发布 */
const handlePublish = async (id) => {
  const res = await updateAnnounce({ id, status: true, publish_time: new Date() }, {
    headers: tokenHeader(),
    params: { module: param }
  })
  handleResponse(res, () => {
    notification.success({ message: '通知状态更新', description: '通知发布成功' })
    getAnnounceList()
  })
}
/** 取消发布 */
const cancelPublish = async (id) => {
  const res = await updateAnnounce({ id, status: false }, {
    headers: tokenHeader(),
    params: { module: param }
  })
  handleResponse(res, () => {
    notification.success({ message: '通知状态更新', description: '通知取消发布成功' })
    getAnnounceList()
  })
}

/** 编辑 */
const handlePreview = (item) => {
  router.push('/announce/preview' + `?id=${item.id}`)
}
const handleEdit = (item) => {
  router.push('/announce/edit' + `?id=${item.id}`)
}

</script>