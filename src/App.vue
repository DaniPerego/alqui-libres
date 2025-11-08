<template>
  <div id="app">
    <DemoBanner />
    <AppHeader />
    <main class="main-content">
      <router-view />
    </main>
    <AppFooter />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import DemoBanner from '@/components/layout/DemoBanner.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'

const authStore = useAuthStore()

onMounted(() => {
  authStore.checkAuth()
})
</script>

<style>
.main-content {
  min-height: calc(100vh - 140px);
  padding-top: 70px;
}
</style>
