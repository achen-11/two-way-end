<template>
  <div>
    <div class="">
      <a-button type="primary" class="mr-2" v-if="!dataSource.length" @click="handleCreate()">新增弹窗通知</a-button>
    </div>
    <div class="mt-4">
      <a-table :columns="columns" :data-source="dataSource" :pagination="pagination" :loading="loading"
        @change="handleTableChange" :scroll="{ y: 380, x: 'max-content' }">
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">
            <span>{{ (index + 1) + 10 * (pagination.current - 1) }}</span>
          </template>
          <template v-if="column.key === 'option'">
            <a-button type="link" class="px-0" primary @click="handlePreview()">预览</a-button>
            <a-button type="link" class="px-1" primary @click="handleEdit()">编辑</a-button>
            <a-popconfirm title="是否确认删除该通知? " @confirm="handleDelete(-1)">
              <a-button class="px-1" type="text" danger>删除</a-button>
            </a-popconfirm>
          </template>
        </template>
      </a-table>
    </div>
    <a-modal v-model:open="modalOpen" title="通知" :footer="null" width="600px">
      <div class="max-h-[400px] overflow-y-auto">
        <div v-html="formData.content"></div>
        <div class="flex justify-center">
          <a-button type="primary" class="min-w-[100px]" @click="handleOk()">确认</a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>
<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { detail as getAnnounceDetail } from '@/api/service/announce'
import { remove as deleteAnnounce } from '@/api/service/[module]/crud'
import { dateTimeFormat, handleResponse, tokenHeader } from '@/utils';
import { notification } from 'ant-design-vue';
const param = 'announce'

// 跳转到创建通知
const router = useRouter()
const handleCreate = () => {
  router.push('/announce/detail?id=-1')
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
const formData = computed(() => {
  return dataSource.value?.[0] || {}
})
const getAnnounceList = async () => {
  loading.value = true
  const res = await getAnnounceDetail({
    query: { id: '-1' },
    headers: tokenHeader()
  })
  handleResponse(res, () => {
    dataSource.value = res.data ? [res.data] : []
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
  handleResponse(res, () => {
    notification.success({ message: ' 弹窗通知公告', description: '通知删除成功' })
    getAnnounceList()
  })
}

/** 预览 & 编辑 */
const modalOpen = ref(false)
const handlePreview = () => {
  modalOpen.value = true
}
const handleEdit = () => {
  router.push('/announce/detail' + `?id=-1`)
}
const handleOk = () => {
  modalOpen.value = false
}

</script>