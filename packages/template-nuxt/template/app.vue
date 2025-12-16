<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: '{{name}}',
  meta: [
    { name: 'description', content: 'A Scaforge Nuxt 3 application' }
  ]
});
</script>