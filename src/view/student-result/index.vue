<template>
  <a-spin :spinning="termLoading">
    <div class="">
      <!-- 学年学期 -->
      <a-select class="w-[200px]" v-model:value="termId" :options="termOption" @change="init()">
      </a-select>
      <!-- Table -->
      <div class="mt-4">
        <a-table :columns="columns" :data-source="dataSource" :loading="loading" :scroll="{ y: 380, x: 'max-content' }">
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'index'">
              {{ index + 1 }}
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
            <template v-if="column.key === 'status'">
              <a-tag v-if="record.status === 0" color="processing">等待反选</a-tag>
              <a-tag v-if="record.status === 1" color="success">选课成功</a-tag>
              <a-tag v-if="record.status === 2" color="error">已拒绝</a-tag>
            </template>
            <template v-if="column.key === 'option'">
              <a-button type="link" primary @click="open(record)">查看详情</a-button>
            </template>
          </template>
        </a-table>
      </div>
      <!-- Drawer -->
      <a-drawer v-model:open="drawerOpen" title="选课信息" width="400" placement="right" :maskClosable="false">
        <a-form ref="formRef" :model="formData" :label-col="{ span: 5 }" layout="horizontal">
          <a-form-item class="mb-2" label="课程" name="course_id" required>
            <a class="border-b pb-1" :href="formData.link" target="_blank">{{ `[${formData.course_id}] ${formData.name}`
            }}</a>
          </a-form-item>
          <a-form-item class="mb-2" label="授课教师" name="teachers">
            <div class="border-b pb-1">{{ formData.CourseTeachers.map(i => i?.teacher?.name)?.join("、") }}</div>
          </a-form-item>
          <a-form-item class="mb-2" label="学分/学时" name="score">
            <div class="border-b pb-1">{{ formData.score }} / {{ formData.hour }}</div>
          </a-form-item>
          <a-form-item class="mb-2" label="授课时间" name="course_time">
            <div class="border-b pb-1">{{ `[${formData.week_num}] 周${formData.course_time}` }}</div>
          </a-form-item>
          <a-form-item class="mb-2" label="课程领域" name="domain">
            <div class="border-b pb-1">{{ formData.domain }}</div>
          </a-form-item>
          <a-form-item class="mb-2" label="课程类型" name="type">
            <div class="border-b pb-1">{{ formData.type || '--' }}</div>
          </a-form-item>
          <a-form-item class="mb-2" label="意向分" name="will_num" required>
            <a-slider v-model:value="formData.will_num" :min="0" :max="10" disabled />
          </a-form-item>
          <a-form-item class="mb-2" label="选课理由" name="cause" required>
            <a-textarea v-model:value="formData.cause" :auto-size="{ minRows: 4 }" disabled></a-textarea>
          </a-form-item>
          <a-form-item class="mb-2" label="选课轮次" name="stage" required>
            {{ formData.stage }}
          </a-form-item>
          <a-form-item class="mb-2" label="选课结果" name="status">
              <a-tag v-if="formData.status === 0" color="processing">等待反选</a-tag>
              <a-tag v-if="formData.status === 1" color="success">选课成功</a-tag>
              <a-tag v-if="formData.status === 2" color="error">已拒绝</a-tag>
          </a-form-item>

        </a-form>
      </a-drawer>
    </div>
  </a-spin>
</template>

<script setup lang="ts">
import { reactive, ref, toRefs } from 'vue'
import { all as getAllSelection } from '@/api/service/result'
import { getAllTermInfo } from '@/api/service/termInfo'
import { handleResponse, tokenHeader } from '@/utils';
import { notification } from 'ant-design-vue';
import { useUserStore } from '@/store/store';
import { courseRecord } from '@/utils/types';

const userStore = useUserStore()
const { userInfo } = toRefs(userStore)

/**获取所有历史数据 */
const termId = ref('')
const termLoading = ref(false)
const termOption = ref([])
const getAllTerm = async () => {
  termLoading.value = true
  try {
    const res = await getAllTermInfo()
    handleResponse(res, () => {
      console.log(res.data.list);

      termOption.value = res.data?.map((t) => {
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
    notification.error({ message: '课程信息', description: e.message })
    termLoading.value = false
  }

}
getAllTerm()

/**Table 配置项 */
const columns = [
  {
    title: '序号',
    key: 'index',
    align: 'center',
    width: 60
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
  // {
  //   title: '授课时间',
  //   dataIndex: 'week_num',
  //   key: 'week_num'
  // },
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
    key: 'teachers',
    // ellipsis: true,
    width: 200,
  },
  {
    title: '选课结果',
    dataIndex: 'status',
    key: 'status'
  },
  {
    title: '操作',
    dataIndex: 'option',
    key: 'option',
    fixed: 'right',
  },


]
const loading = ref(false)
const dataSource = ref([])

// 获取学生选课信息
const init = async () => {
  const res = await getAllSelection({
    query: { term_id: termId.value, student_id: '' + userInfo.value.id },
    headers: tokenHeader()
  })
  handleResponse(res, () => {
    console.log(res.data);
    dataSource.value = res.data.map(r => { return { ...r, ...r.course } })
  })
}

const drawerOpen = ref(false)
const formRef = ref()
const submitLoading = ref(false)
const formData = ref<courseRecord>({})
const open = async (item?: { id?: number, name: string, teacher_id?: string } | null) => {
  formData.value = { ...item }
  drawerOpen.value = true
}

</script>