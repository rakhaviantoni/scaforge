<template>
  <div class="min-h-screen bg-background">
    <div class="container mx-auto px-4 py-16">
      <div class="max-w-3xl mx-auto">
        <h1 class="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          About {{name}}
        </h1>
        <p class="mt-6 text-lg text-muted-foreground">
          This is a Nuxt 3 application created with Scaforge, a modular full-stack boilerplate ecosystem.
        </p>
        
        <div class="mt-8">
          <h2 class="text-2xl font-semibold text-foreground mb-4">
            What's Included
          </h2>
          <ul class="space-y-2 text-muted-foreground">
            <li class="flex items-center">
              <span class="w-2 h-2 bg-primary rounded-full mr-3"></span>
              Nuxt 3 with TypeScript
            </li>
            <li class="flex items-center">
              <span class="w-2 h-2 bg-primary rounded-full mr-3"></span>
              Tailwind CSS for styling
            </li>
            <li class="flex items-center">
              <span class="w-2 h-2 bg-primary rounded-full mr-3"></span>
              Nuxt UI components
            </li>
            <li class="flex items-center">
              <span class="w-2 h-2 bg-primary rounded-full mr-3"></span>
              ESLint for code quality
            </li>
            <li class="flex items-center">
              <span class="w-2 h-2 bg-primary rounded-full mr-3"></span>
              Ready for Scaforge plugins
            </li>
          </ul>
        </div>

        <div class="mt-8 flex gap-4">
          <UButton to="/" variant="outline">
            ← Back to Home
          </UButton>
          <UButton
            to="https://scaforge.dev"
            target="_blank"
            external
            class="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Learn about Scaforge
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'About - {{name}}',
});
</script>