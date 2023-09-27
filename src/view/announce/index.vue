<template>
  <div>{{res}}</div>
</template>
<script lang="ts" setup>
import {login} from '@/api/account'
const res = await login('admin', 'hxxy123456')
</script>