<template>
  <!-- Loading -->
  <div v-if="termLoading" class="h-full flex justify-center items-center">
    <a-spin :spinning="termLoading">
    </a-spin>
  </div>
  <!-- Content -->
  <template v-else>
    <div class="">
      <!-- 学年学期 -->
      <a-select class="w-[200px]" v-model:value="termId" :options="termOption">
      </a-select>
    </div>
    <!-- 筛选 -->
    <div class="mt-2 grid grid-cols-12 gap-4">
      <a-input class="col-span-3" placeholder="课程 ID" v-model:value="filterData.course_id"></a-input>
      <a-input class="col-span-3" placeholder="课程名称" v-model:value="filterData.name"></a-input>
      <a-input class="col-span-3" placeholder="课程领域" v-model:value="filterData.domain"></a-input>
      <a-input class="col-span-3" placeholder="课程类型" v-model:value="filterData.type"></a-input>
      <div class="col-span-12">
        <a-button @click="handleReset">重置</a-button>
        <a-button class="ml-2" type="primary" @click="init()">搜索</a-button>
        <a-button class="ml-2" type="primary" @click="modalOpen = true">导出课程数据</a-button>
      </div>
    </div>
    <!-- Table -->
    <div class="mt-4">
      <a-table :columns="columns" :data-source="dataSource" :pagination="pagination" :loading="loading"
        @change="handleTableChange" :scroll="{ y: 380, x: 'max-content' }">
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">
            <span>{{ (index + 1) + 10 * (pagination.current - 1) }}</span>
          </template>
          <template v-if="column.key === 'course_id'">
            <a :href="record.link" target="_blank">{{ `[${record.course_id}] ${record.name}` }}</a>
          </template>
          <template v-if="column.key === 'score'">
            <span>{{ record.score + ' / ' + record.hour }}</span>
          </template>
          <template v-if="column.key === 'week_num'">
            <span>{{ `[${record.week_num}] ${record.hour}` }}</span>
          </template>
          <template v-if="column.key === 'option'">
            <a-button type="link" primary @click="open(record)">查看</a-button>
          </template>
        </template>
      </a-table>
    </div>
    <!-- Drawer -->
    <a-drawer v-model:open="drawerOpen" title="班级信息" placement="right" width="500">
      <a-form ref="formRef" :model="formData" :label-col="{ span: 5 }" :disabled="true">
        <a-form-item label="课程ID" name="course_id" required>
          <a-input v-model:value="formData.course_id" />
        </a-form-item>
        <a-form-item label="课程名称" name="name" required>
          <a-input v-model:value="formData.name" />
        </a-form-item>
        <a-form-item label="课程链接" name="link" required>
          <a-input v-model:value="formData.link" />
        </a-form-item>
        <a-form-item label="学分" name="score" required>
          <a-input v-model:value="formData.score" />
        </a-form-item>
        <a-form-item label="学时" name="hour" required>
          <a-input v-model:value="formData.hour" />
        </a-form-item>
        <a-form-item label="周次" name="week_num" required>
          <a-input v-model:value="formData.week_num" />
        </a-form-item>
        <a-form-item label="授课时间" name="course_time" required>
          <a-input v-model:value="formData.course_time" />
        </a-form-item>
        <a-form-item label="课程领域" name="domain" required>
          <a-input v-model:value="formData.domain" />
        </a-form-item>
        <a-form-item label="课程性质" name="prop" required>
          <a-input v-model:value="formData.prop" />
        </a-form-item>
        <a-form-item label="课程类型" name="type" required>
          <a-input v-model:value="formData.type" />
        </a-form-item>
        <a-form-item label="授课地址" name="address" required>
          <a-input v-model:value="formData.address" />
        </a-form-item>
        <a-form-item label="限选人数" name="target_num" required>
          <a-input v-model:value="formData.target_num" />
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
</template>
<script setup lang="ts">
import { getHistoryTermInfo } from '@/api/service/termInfo';
import { downloadExcel, handleResponse, tokenHeader } from '@/utils';
import { notification } from 'ant-design-vue';
import { reactive, ref } from 'vue';
import { list as courseFind } from '@/api/service/course'

const param = { module: 'course' }

/**获取所有历史数据 */
const termId = ref('')
const termLoading = ref(false)
const termOption = ref([])
const getAllHistoryTerm = async () => {
  termLoading.value = true
  try {
    const res = await getHistoryTermInfo({
      query: { page: '' + 1, limit: '' + 9999 }
    })
    handleResponse(res, () => {
      termOption.value = res.data.list.map((t) => {
        return {
          label: `${t.academic_start}-${t.academic_end} 第${t.semester === 1 ? '一' : '二'}学期`,
          value: t.id
        }
      })
      termId.value = termOption.value[0].value
    })
    await init()
    termLoading.value = false
  } catch (e) {
    notification.error({ message: '历史课程信息', description: e.message })
    termLoading.value = false
  }

}
getAllHistoryTerm()

/**Table 配置项 */
const columns = [
  {
    title: '序号',
    key: 'index'
  },
  {
    title: '课程 ID',
    dataIndex: 'course_id',
    key: 'course_id'
  },
  {
    title: '学分/学时',
    dataIndex: 'score',
    key: 'score'
  },
  {
    title: '授课时间',
    dataIndex: 'week_num',
    key: 'week_num'
  },
  {
    title: '课程领域',
    dataIndex: 'domain',
    key: 'domain'
  },
  {
    title: '课程类型',
    dataIndex: 'type',
    key: 'type'
  },
  {
    title: '授课地点',
    dataIndex: 'address',
    key: 'address'
  },
  {
    title: '限选人数',
    dataIndex: 'target_num',
    key: 'target_num',
    fixed: 'right',

  },
  {
    title: '操作',
    dataIndex: 'option',
    key: 'option',
    fixed: 'right',

  },


]
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const loading = ref(false)


/**根据 termInfo 获取课程数据 */
const dataSource = ref([])
const init = async () => {
  loading.value = true
  try {
    const res = await courseFind({
      headers: tokenHeader(),
      query: {
        page: '' + pagination.current,
        limit: '' + pagination.pageSize,
        option: JSON.stringify({
          ...filterData.value,
          term_id: termId.value,
        })
      }
    })
    handleResponse(res, () => {
      dataSource.value = res.data.list
      pagination.total = res.data.total
    })
    loading.value = false
  } catch (e) {
    loading.value = false
    notification.error({ message: '课程信息异常', description: e.message })
  }

}
// 表格变化
const handleTableChange = (pag) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  init()
}

/**筛选 */
const filterData = ref({ course_id: '', name: '', domain: '', type: '', term_id: null})
const handleReset = () => {
  filterData.value = { course_id: '', name: '', domain: '', type: '', term_id: null}
}
/**Drawer */
const formData = ref({
  course_id: '', name: '', domain: '', type: '', link: '', week_num: '', score: '', hour: '',
  prop: '', address: '', course_time: '', target_num: '',
})

const drawerOpen = ref(false)
const open = (item = null) => {
  if (item) {
    formData.value = { ...item }
    console.log(formData.value);
  }
  drawerOpen.value = true
}

/**导出数据 */
const modalOpen = ref(false)
const downloadOption = ref('all')

const handleExport = async () => {
  const data = {page: 1, limit: 1000000, option: {term_id: ''}}
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
  data.option.term_id = termId.value
  const arrayBuffer = await fetch('/api/course/excel', {
    method: 'post',
    headers: {...tokenHeader(),'Content-Type': 'application/json'},
    body: JSON.stringify({ args: [data.page, data.limit, data.option] })
  }).then(res => res.arrayBuffer())
  downloadExcel(arrayBuffer, '课程数据.xlsx')
}
</script>