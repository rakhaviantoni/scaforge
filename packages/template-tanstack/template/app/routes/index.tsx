import * as React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/')({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Welcome to <span className="text-blue-600">{{name}}</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-6">
          Built with TanStack Start, TypeScript, and Tailwind CSS
        </p>
        <Button size="lg">Get Started</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <Card>
          <CardHeader>
            <CardTitle>TanStack Router</CardTitle>
            <CardDescription>
              Type-safe routing with automatic code splitting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Full-stack React framework with file-based routing and server-side rendering.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>TypeScript</CardTitle>
            <CardDescription>
              End-to-end type safety for better developer experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Catch errors at compile time and enjoy better IDE support.
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
              Build beautiful interfaces with pre-built components and utilities.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 text-center">
        <h2 className="text-2xl font-semibold mb-4">Ready to extend?</h2>
        <p className="text-muted-foreground mb-4">
          Add plugins to extend your application with additional features:
        </p>
        <div className="bg-muted p-4 rounded-lg font-mono text-sm">
          <div>npx scaforge add api-trpc</div>
          <div>npx scaforge add db-prisma</div>
          <div>npx scaforge add auth-clerk</div>
        </div>
      </div>
    </div>
  );
}