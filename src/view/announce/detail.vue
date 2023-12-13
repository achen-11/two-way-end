<template>
  <div>
    <div class="">
      <a-form ref="formRef" :model="formData" :label-col="{ span: 0 }">
        <a-form-item label="标题" name="title" required>
          <a-input v-model:value="formData.title" />
        </a-form-item>
        <a-form-item label="部门" name="department" required>
          <a-input v-model:value="formData.department" />
        </a-form-item>
        <a-form-item label="内容" name="content" required>
          <div style="border: 1px solid #ccc">
            <Toolbar style="border-bottom: 1px solid #ccc" :editor="editorRef" :defaultConfig="toolbarConfig"
              :mode="mode" />
            <Editor style="height: 500px; overflow-y: hidden;" v-model="formData.content" :defaultConfig="editorConfig"
              :mode="mode" @onCreated="handleCreated" />
          </div>
        </a-form-item>
        <div class="ml-12">
          <a-button>取消</a-button>
          <a-button class="ml-2" type="primary" v-if="!isEdit" @click="addAnnounce">确定</a-button>
          <a-button class="ml-2" type="primary" v-if="isEdit" @click="editAnnounce">确定</a-button>
        </div>
      </a-form>
    </div>
  </div>
</template>
<script lang="ts" setup>
import '@wangeditor/editor/dist/css/style.css' // 引入 css
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { ref, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router';
import { create as createAnnounce, } from '@/api/service/[module]/crud'
import { detail as getAnnounceDetail, update as updateAnnounce } from '@/api/service/announce'
import { handleResponse, tokenHeader } from '@/utils';
import { notification } from 'ant-design-vue';

const param = 'announce'
const formData = ref<{ id?: number, title: string, content: string, department: string }>({
  title: '',
  content: '',
  department: '',
})

const route = useRoute()
const isEdit = ref(false)
const init = async () => {
  const id = route.query?.id
  if (id) {
    // id存在则获取 id 内容
    const res = await getAnnounceDetail({
      query: { id: '' + id },
      // headers: tokenHeader()
    })
    handleResponse(res, () => {
      isEdit.value = true
      formData.value = res.data || {}
      if (id == '-1') formData.value.id = -1
    })
  } else {
    isEdit.value = false
    formData.value = { title: '', content: '', department: '', }
  }
}
init()

/** wang Edit */
const editorRef = shallowRef()
const toolbarConfig = {}
const editorConfig = { placeholder: '请输入内容...' }
const mode = 'default'
const handleCreated = (editor) => {
  editorRef.value = editor // 记录 editor 实例，重要！
}

const router = useRouter()

const addAnnounce = async () => {
  console.log(formData.value);
  const res = await createAnnounce(formData.value, {
    headers: tokenHeader(),
    params: { module: param }
  })
  handleResponse(res, () => {
    console.log('添加成功');
    notification.success({ message: '通知公告', description: '通知创建成功' })
    router.push('/announce/list')
  })
}

const editAnnounce = async () => {

  const res = await updateAnnounce(formData.value.id, formData.value, {
    headers: tokenHeader(),
  })
  handleResponse(res, () => {
    notification.success({ message: '通知公告', description: '操作成功' })
    init()
  })
}

</script>