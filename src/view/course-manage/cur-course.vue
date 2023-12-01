<template>
  <!-- Loading -->
  <div v-if="termLoading" class="h-full flex justify-center items-center">
    <a-spin :spinning="termLoading">
    </a-spin>
  </div>
  <!-- Content -->
  <template v-else>
    <div class="">
      <!-- 按钮 -->
      <a-button class="" type="primary" @click="open()">添加课程</a-button>
      <a-button class="ml-2" type="primary" @click="modalOpen = true">导出课程数据</a-button>
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
            <span>{{ `[${record.week_num}] ${record.course_time}` }}</span>
          </template>
          <template v-if="column.key === 'teachers'">
            <span>{{ record.CourseTeachers.map(i => i?.teacher?.name)?.join("、") }}</span>
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
    <a-drawer v-model:open="drawerOpen" title="班级信息" placement="right" width="500">
      <a-form ref="formRef" :model="formData" :label-col="{ span: 5 }">
        <a-form-item label="课程ID" name="course_id" required>
          <a-input v-model:value="formData.course_id" />
        </a-form-item>
        <a-form-item label="课程名称" name="name" required>
          <a-input v-model:value="formData.name" />
        </a-form-item>
        <a-form-item label="课程链接" name="link">
          <a-input v-model:value="formData.link" />
        </a-form-item>
        <a-form-item label="学分" name="score" required>
          <a-input-number :min="0" v-model:value="formData.score" />
        </a-form-item>
        <a-form-item label="学时" name="hour" required>
          <a-input-number :min="0" v-model:value="formData.hour" />
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
        <a-form-item label="课程类型" name="type">
          <a-input v-model:value="formData.type" />
        </a-form-item>
        <a-form-item label="授课教师" name="teachers" required>
          <a-select mode="multiple" v-model:value="formData.teachers" :options="teacherOption"
            :filter-option="filterOption" show-search>
          </a-select>
        </a-form-item>
        <a-form-item label="授课地址" name="address" required>
          <a-input v-model:value="formData.address" />
        </a-form-item>
        <a-form-item label="限选人数" name="target_num" required>
          <a-input-number v-model:value="formData.target_num" :min="0" />
        </a-form-item>
        <a-divider></a-divider>
        <div class="my-2 flex items-center">
          <span class="mr-1">专业限制(勾中表示不可选): </span>
          <a-tooltip>
            <template #title>勾选表示该专业的学生不可选修该门课程</template>
            <QuestionCircleOutlined />
          </a-tooltip>
        </div>
        <a-form-item label="" name="major_limits">
          <a-select mode="multiple" v-model:value="formData.major_limits" :options="majorOption"
            :filter-option="filterOption" show-search>
          </a-select>
        </a-form-item>
        <a-divider></a-divider>
        <div class="my-2 flex items-center">
          <span class="mr-1">年级限制(勾中表示不可选)</span>
          <a-tooltip>
            <template #title>勾选表示该阶段, 该年级的学生不可选修该门课程</template>
            <QuestionCircleOutlined />
          </a-tooltip>
        </div>
        <a-form-item label="展示阶段" name="grade_limits_exhibit">
          <a-checkbox-group v-model:value="formData.grade_limits_exhibit" :options="gradeOption" />
        </a-form-item>
        <a-form-item label="第一阶段" name="grade_limits_first">
          <a-checkbox-group v-model:value="formData.grade_limits_first" :options="gradeOption" />
        </a-form-item>
        <a-form-item label="第二阶段" name="grade_limits_second">
          <a-checkbox-group v-model:value="formData.grade_limits_second" :options="gradeOption" />
        </a-form-item>
        <a-form-item label="第三阶段" name="grade_limits_third">
          <a-checkbox-group v-model:value="formData.grade_limits_third" :options="gradeOption" />
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
</template>
<script setup lang="ts">
import { getCurTermInfo } from '@/api/service/termInfo';
import { downloadExcel, formatCourse, handleResponse, tokenHeader } from '@/utils';
import { notification } from 'ant-design-vue';
import { reactive, ref } from 'vue';
import { list as courseFind, create as addCourse, update as updateCourse, remove as deleteCourse } from '@/api/service/course'
import { list as curdFind } from '@/api/service/[module]/crud';
import {
  QuestionCircleOutlined
} from '@ant-design/icons-vue';

const param = { module: 'course' }

/**获取所有历史数据 */
const termId = ref('')
const termLoading = ref(false)
const getCurTerm = async () => {
  termLoading.value = true
  try {
    const res = await getCurTermInfo()
    handleResponse(res, () => {
      if (!res.data) {
        notification.error({ message: '获取选课信息', description: '没有正在进行中的选课!' })
        termLoading.value = false
        return
      }
      termId.value = res.data.id
    })
    await init()
    termLoading.value = false
  } catch (e) {
    notification.error({ message: '当前选课信息', description: e.message })
    termLoading.value = false
  }

}
getCurTerm()

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
/**获取所有教师数据 */
const teacherOption = ref([])
const getAllTeacher = async () => {
  const res = await curdFind({
    query: { page: '' + 1, limit: '999' },
    headers: tokenHeader(),
    params: { module: 'teacher' }
  })
  handleResponse(res, () => {
    teacherOption.value = res.data.list.map(i => { return { label: i.name, value: i.id } })
  })
}
getAllTeacher()
/**年级限制 */
const gradeOption = ref([{ label: '大一', value: 1 }, { label: '大二', value: 2 }, { label: '大三', value: 3 }, { label: '大四', value: 4 },])
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
    title: '授课教师',
    dataIndex: 'teachers',
    key: 'teachers'
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
  if (!termId.value) return loading.value = false
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
      dataSource.value = res.data.list?.map(r => formatCourse(r))
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
const filterData = ref({ course_id: '', name: '', domain: '', type: '', term_id: null })
const handleReset = () => {
  filterData.value = { course_id: '', name: '', domain: '', type: '', term_id: null }
}
/**Drawer */
const isEdit = ref(false)
const formData = ref({
  id: null, course_id: '', name: '', domain: '', type: '', link: '', week_num: '', score: 0, hour: 0,
  prop: '', address: '', course_time: '', target_num: 0, major_limits: [], teachers: [],
  grade_limits_exhibit: [], grade_limits_first: [], grade_limits_second: [], grade_limits_third: [],
})

const drawerOpen = ref(false)
const open = (item = null) => {
  if (item) {
    isEdit.value = true
    formData.value = { ...item }
    console.log(formData.value);
  } else {
    isEdit.value = false
    formData.value = {
      id: null,
      course_id: '', name: '', domain: '', type: '', link: '', week_num: '', score: 0, hour: 0,
      prop: '', address: '', course_time: '', target_num: 0, major_limits: [], teachers: [],
      grade_limits_exhibit: [], grade_limits_first: [], grade_limits_second: [], grade_limits_third: [],
    }
    // formData.value = {
    //   id: 101,
    //   course_id: "40Ha047b",
    //   name: "辩论修养",
    //   link: "http://mooc1.chaoxing.com/course/223338229.html",
    //   week_num: "1-9",
    //   score: 2,
    //   hour: 32,
    //   prop: "网络课程",
    //   domain: "人文领域",
    //   type: "",
    //   address: "在线网络课程",
    //   course_time: "六[1-2节]",
    //   target_num: 200,
    //   major_limits: [],
    //   teachers: [],
    //   grade_limits_exhibit: [], grade_limits_first: [], grade_limits_second: [], grade_limits_third: [],
    // }
  }
  drawerOpen.value = true
}

// 新增 & 编辑
const formRef = ref()
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    if (isEdit.value) {
      // 编辑
      const res = await updateCourse({ ...formData.value }, { headers: tokenHeader() })
      console.log(formData.value);

      if (res.code === 200) {
        drawerOpen.value = false
        init()
      }
    } else {
      // 新增
      console.log(formData.value);
      const res = await addCourse({ ...formData.value, term_id: termId.value }, { headers: tokenHeader() })
      if (res.code === 200) {
        drawerOpen.value = false
        init()
      } else {
        notification.error({ message: '添加课程异常', description: res.message })
      }
    }
  } catch(e) {

  }
}

// 删除课程
const handleDelete = async (id) => {
  const res = await deleteCourse({
    headers: tokenHeader(),
    query: { id }
  })
  handleResponse(res, () => {
    notification.success({ message: '删除成功' })
    init()
  })
}

/**导出数据 */
const modalOpen = ref(false)
const downloadOption = ref('all')

const handleExport = async () => {
  const data = { page: 1, limit: 1000000, option: { term_id: '' } }
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
    headers: { ...tokenHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ args: [data.page, data.limit, data.option] })
  }).then(res => res.arrayBuffer())
  downloadExcel(arrayBuffer, '课程数据.xlsx')
}
</script>