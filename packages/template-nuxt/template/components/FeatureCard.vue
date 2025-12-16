<template>
  <div class="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
    <h3 class="text-lg font-semibold mb-2">{{ title }}</h3>
    <p class="text-muted-foreground">{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  description: string;
}

defineProps<Props>();
</script>