<template>
  <div class="min-h-screen bg-background">
    <div class="container mx-auto px-4 py-16">
      <div class="text-center">
        <h1 class="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
          Welcome to <span class="text-primary">{{name}}</span>
        </h1>
        <p class="mt-6 text-lg leading-8 text-muted-foreground">
          A modern Nuxt 3 application built with Scaforge. Start building your next great project.
        </p>
        <div class="mt-10 flex items-center justify-center gap-x-6">
          <UButton
            to="/about"
            size="lg"
            class="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Get started
          </UButton>
          <UButton
            variant="outline"
            size="lg"
            to="https://nuxt.com/docs"
            target="_blank"
            external
          >
            Learn more
          </UButton>
        </div>
      </div>

      <div class="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <FeatureCard
          title="⚡ Fast Development"
          description="Hot module replacement and instant server start for rapid development."
        />
        <FeatureCard
          title="🎨 Beautiful UI"
          description="Pre-configured with Tailwind CSS and Nuxt UI components."
        />
        <FeatureCard
          title="🔧 Extensible"
          description="Add plugins anytime with the Scaforge CLI to extend functionality."
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Home - {{name}}',
});
</script>