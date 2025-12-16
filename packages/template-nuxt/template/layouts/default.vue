<template>
  <div class="min-h-screen bg-background">
    <header class="border-b">
      <div class="container mx-auto px-4 py-4">
        <nav class="flex items-center justify-between">
          <NuxtLink to="/" class="text-xl font-bold text-foreground">
            {{name}}
          </NuxtLink>
          <div class="flex items-center space-x-4">
            <NuxtLink
              to="/"
              class="text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </NuxtLink>
            <NuxtLink
              to="/about"
              class="text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </NuxtLink>
          </div>
        </nav>
      </div>
    </header>
    
    <main>
      <slot />
    </main>
    
    <footer class="border-t mt-16">
      <div class="container mx-auto px-4 py-8">
        <div class="text-center text-muted-foreground">
          <p>&copy; {{ new Date().getFullYear() }} {{name}}. Built with Scaforge.</p>
        </div>
      </div>
    </footer>
  </div>
</template>