<template>
  <div class="flex bg-white h-[60px] items-center justify-end px-6">
    <!-- 头像 -->
    <a-dropdown placement="bottom">
      <div class="">{{ userInfo.name }}</div>
      <template #overlay>
        <a-menu>
          <a-menu-item>
            <div class="text-blue-400" v-if="userInfo.role === 'student'" @click="showChangeModal">修改密码</div>
          </a-menu-item>
          <a-menu-item>
            <div class="text-red-400" @click="logout">退出登录</div>
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
  </div>
  <a-modal title="修改密码" v-model:open="modalVisible" @ok="handleOk" centered>
        <a-form :model="resetData" ref="resetFormRef" :label-col="{ span: 5 }">
          <a-form-item label="学号" name="stu_id" required>
            <a-input v-model:value="resetData.stu_id"></a-input>
          </a-form-item>
          <a-form-item label="旧密码" name="ori_pwd" required>
            <a-input-password v-model:value="resetData.ori_pwd"></a-input-password>
          </a-form-item>
          <a-form-item label="新密码" name="new_pwd" :rules="[{ min: 6, max: 20, message: '密码长度需要在 6-20 之间', trigger: 'blur' }]" required>
            <a-input-password v-model:value="resetData.new_pwd"></a-input-password>
          </a-form-item>
          <a-form-item label="确认密码" name="confirm_pwd" :rules="[{validator: confirmPwdValidate, message: '两次密码不一致', trigger: 'blur'}]" required>
            <a-input-password v-model:value="resetData.confirm_pwd"></a-input-password>
          </a-form-item>
        </a-form>
    </a-modal>
</template>
<script setup lang="ts">
import { useUserStore } from '@/store/store';
import { Modal, message, notification } from 'ant-design-vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {change as changePassword} from '@/api/service/account'
import { handleResponse, tokenHeader } from '@/utils';

const userStore = useUserStore()
const userInfo = userStore.userInfo

const router = useRouter()

const logout = () => {
  Modal.confirm({
    title: "退出登录",
    content: "是否确认退出登录?",
    onOk() {
      localStorage.removeItem('token')
      router.push('/login')
      location.reload()
    }
  })
}

const modalVisible = ref(false)
const resetFormRef = ref()
const resetData = ref<{
  stu_id?: string, ori_pwd?: string, new_pwd?: string, confirm_pwd?: string
}>({})

const showChangeModal = () =>{
  modalVisible.value = true
  resetData.value = {
    stu_id: userInfo.stu_id
   }
}
// 确认密码校验
const confirmPwdValidate = async (_rule, value: string) => {
  if (value !== resetData.value.new_pwd) {
    return Promise.reject('两次输入密码不一致')
  }
  return Promise.resolve()
}

const handleOk = async () => {
  try {
    await resetFormRef.value.validate()
    const  {stu_id, ori_pwd, new_pwd} = resetData.value
    const res = await changePassword(stu_id, ori_pwd, new_pwd, {headers: tokenHeader()})
    handleResponse(res, ()=>{
      notification.success({message: '修改密码', description: res.message})
      modalVisible.value = false
    })
  } catch(e) {

  }
}
</script>