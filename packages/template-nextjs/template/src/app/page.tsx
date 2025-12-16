import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
          Welcome to{' '}
          <span className="text-primary">{{name}}</span>
        </h1>
        
        <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl">
          Your Next.js application is ready! This is a minimal Scaforge template with TypeScript, 
          Tailwind CSS, and basic UI components. Add plugins to extend functionality.
        </p>

        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Button size="lg">
            Get Started
          </Button>
          <Button variant="outline" size="lg">
            Learn More
          </Button>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>TypeScript Ready</CardTitle>
              <CardDescription>
                Full TypeScript support with strict type checking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Built-in TypeScript configuration optimized for Next.js development.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tailwind CSS</CardTitle>
              <CardDescription>
                Utility-first CSS framework for rapid UI development
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Pre-configured with a modern design system and CSS variables.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Plugin Ready</CardTitle>
              <CardDescription>
                Extend with 100+ plugins for any functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Add APIs, databases, auth, and more with simple commands.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-sm text-muted-foreground">
          <p>
            Add plugins with: <code className="bg-muted px-2 py-1 rounded">npx scaforge add &lt;plugin&gt;</code>
          </p>
        </div>
      </div>
    </main>
  );
}