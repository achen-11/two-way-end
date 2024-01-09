<template>
  <div>
    <!-- 筛选区 -->
    <div class="mt-4 grid md:grid-cols-12 gap-4">
      <a-input class="col-span-3" placeholder="学号" v-model:value="filterData.stu_id"></a-input>
      <a-input class="col-span-3" placeholder="姓名" v-model:value="filterData.name"></a-input>
      <a-input class="col-span-3" placeholder="专业" v-model:value="filterData.major"></a-input>
      <a-input class="col-span-3" placeholder="班级" v-model:value="filterData.class"></a-input>
      <div class="col-span-3">
        <a-button type="primary" @click="handleSearch">搜索</a-button>
        <a-button class="ml-2" @click="handleReset">重置</a-button>
      </div>
    </div>
    <!-- Table -->
    <div class="mt-4">
      <a-table :columns="columns" :data-source="dataSource" :pagination="pagination" :loading="loading"
        @change="handleTableChange" :scroll="{ y: 410, x: 'max-content' }">
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">
            <span>{{ (index + 1) + pagination.pageSize * (pagination.current - 1) }}</span>
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
            <a-button type="link" primary @click="open(record)">查看详情</a-button>
            <!-- <a-popconfirm title="是否确认删除该班级? " @confirm="handleDelete(record.id)">
            <a-button type="text" danger>删除</a-button>
          </a-popconfirm> -->
          </template>
        </template>
      </a-table>
    </div>
    <!-- Drawer -->
    <a-drawer v-model:open="drawerOpen" title="反选" width="400" placement="right" :maskClosable="false">
      <a-form ref="formRef" :model="formData" :label-col="{ span: 5 }" layout="horizontal">
        <a-form-item class="mb-2" label="学生姓名" name="course_time">
          <div class="border-b ">{{ formData.name }}</div>
        </a-form-item>
        <a-form-item class="mb-2" label="学号" name="course_time">
          <div class="border-b ">{{ formData.stu_id }}</div>
        </a-form-item>
        <a-form-item class="mb-2" label="性别" name="sex">
          <div class="border-b ">{{ formData.sex === 0 ? '女' : '男' }}</div>
        </a-form-item>
        <a-form-item class="mb-2" label="班级" name="class_name">
          <div class="border-b ">{{ formData?.class?.name }}</div>
        </a-form-item>
        <a-form-item class="mb-2" label="意向分" name="will_num" required>
          <a-slider v-model:value="formData.will_num" :min="0" :max="10" disabled />
        </a-form-item>
        <a-form-item class="mb-2" label="选课理由" name="cause" required>
          <a-textarea v-model:value="formData.cause" :auto-size="{ minRows: 4 }" disabled></a-textarea>
        </a-form-item>
        <a-form-item class="mb-2" label="选课轮次" name="cause" required>
          <div class="border-b ">{{ formData.stage }}</div>

        </a-form-item>
        <a-form-item class="mb-2" label="选课结果" name="status">
          <a-tag v-if="formData.status === 0" color="processing">等待反选</a-tag>
          <a-tag v-if="formData.status === 1" color="success">已同意</a-tag>
          <a-tag v-if="formData.status === 2" color="error">已拒绝</a-tag>
        </a-form-item>

      </a-form>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/store/store';
import { handleResponse, tokenHeader } from '@/utils';
import { reactive, ref, toRefs } from 'vue';
import { useRoute } from 'vue-router';
import { member as getMembers } from '@/api/service/course'


const route = useRoute()
const courseId = route.query.course_id

const userStore = useUserStore()
const { userInfo } = toRefs(userStore)

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

// 获取学生信息
const loading = ref(false)
const pagination = reactive({
  current: 1,
  total: 0,
  pageSize: 10,
})
const filterData = ref<{ stu_id?: string, name?: string, major?: string, class?: string }>({})
const init = async () => {
  loading.value = true
  try {
    const res = await getMembers({
      query: {
        page: '' + pagination.current, limit: '' + pagination.pageSize,
        option: JSON.stringify(filterData.value),
        teacher_id: '' + userInfo.value.id, course_id: '' + courseId
      },
      headers: tokenHeader()
    })
    handleResponse(res, () => {
      console.log('data', res.data);

      dataSource.value = res.data.list.map(i => { return { ...i, ...i.student } })
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
/* Drawer */
const drawerOpen = ref(false)
const formRef = ref()
const formData = ref<{
  name?: string,
  will_num?: number,
  status?: number,
  cause?: string,
  class?: { name: string },
  sex?: number,
  stu_id?: string,
  stage?:number
}>({})
const open = async (item?: {} | null) => {
  formData.value = { ...item }
  drawerOpen.value = true
}
/**处理搜索事件 */
const handleSearch = () => {
  pagination.current = 1
  init()
}
</script>