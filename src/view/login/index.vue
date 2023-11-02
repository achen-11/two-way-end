<template>
  <div class="flex items-center justify-center w-full h-[100vh] bg-neutral-50">
    <div class="flex items-center justify-center w-[400px] h-[400px] shadow rounded-lg bg-white">
      <a-form :model="formState" name="normal_login" class="login-form ">
        <a-form-item label="账号" name="username" class=""
        placeholder="登录账号为学号"
          :rules="[{ required: true, message: '请输入账号' }]">
          <a-input v-model:value="formState.username">
            <template #prefix>
              <UserOutlined class="site-form-item-icon" />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item label="密码" name="password" :rules="[{ required: true, message: '请输入密码' }]">
          <a-input-password v-model:value="formState.password">
            <template #prefix>
              <LockOutlined class="site-form-item-icon" />
            </template>
          </a-input-password>
        </a-form-item>

        <a-form-item>
          <div class="flex justify-between">
            <a-form-item name="remember" no-style>
              <a-checkbox v-model:checked="formState.remember">记住我</a-checkbox>
            </a-form-item>
            <a class="login-form-forgot text-xs" href="">忘记密码?</a>
          </div>
        </a-form-item>

        <a-form-item>
          <a-button :disabled="disabled" type="primary" class="login-form-button w-full bg-[#1677ff]"
            @click="handleSubmit">
            登录
          </a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { reactive, computed } from 'vue';
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue';
import { login } from '@/api/service/account';
import { notification } from 'ant-design-vue';
import { useRouterStore, useUserStore } from '@/store/store';
import { useRouter } from 'vue-router';
import { UserInfo } from '@/utils/types';

interface FormState {
  username: string;
  password: string;
  remember: boolean;
}
const formState = reactive<FormState>({
  username: 'admin',
  password: 'hxxy123456',
  remember: true,
});

const userStore = useUserStore()
const router = useRouter()
const routerStore = useRouterStore()
const handleSubmit = async () => {
  console.log(formState);
  const res = await login(formState.username, formState.password, formState.remember)
  if (res.code === 200) {
    // 登录成功
    // set token
    const {token, userInfo} = <{token: string, userInfo: UserInfo}>res.data
    localStorage.setItem('token', token)
    // set userInfo
    userStore.userInfo = userInfo
    routerStore.setRouter(userInfo.role)
    sessionStorage.setItem('userInfo', JSON.stringify(userInfo))
    // 设置动态路由
    router.push('/')
  } else {
    notification.error({message: '登录异常', description: res.message})
  }
  
}
const disabled = computed(() => {
  return !(formState.username && formState.password);
});
</script>
<style scoped>
#components-form-demo-normal-login .login-form {
  max-width: 300px;
}

#components-form-demo-normal-login .login-form-forgot {
  float: right;
}

#components-form-demo-normal-login .login-form-button {
  width: 100%;
}
</style>
