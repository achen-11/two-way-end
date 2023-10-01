<template>
  <div class="flex bg-white h-[60px] items-center justify-end px-6">
    <!-- 头像 -->
    <a-dropdown placement="bottom">
      <div class="">{{ userInfo.name }}</div>
      <template #overlay>
        <a-menu>
          <a-menu-item>
            <div class="text-red-400" @click="logout">退出登录</div>
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
  </div>
</template>
<script setup lang="ts">
import { useUserStore } from '@/store/store';
import { Modal } from 'ant-design-vue';
import { useRouter } from 'vue-router';

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
    }
  })
}
</script>