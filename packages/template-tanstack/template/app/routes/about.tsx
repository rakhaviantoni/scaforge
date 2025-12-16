import * as React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/about')({
  component: AboutComponent,
});

function AboutComponent() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">About {{name}}</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Built with Scaforge</CardTitle>
          <CardDescription>
            A modular, plug-and-play full-stack boilerplate ecosystem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This project was created using Scaforge's TanStack Start template. 
            Scaforge provides a minimal foundation that you can extend with 
            plugins for authentication, databases, APIs, and much more.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>TanStack Start Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>File-based routing</li>
              <li>Server-side rendering</li>
              <li>Type-safe APIs</li>
              <li>Automatic code splitting</li>
              <li>Built-in dev tools</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Plugins</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>API providers (tRPC, GraphQL)</li>
              <li>Authentication (Auth.js, Clerk)</li>
              <li>Databases (Prisma, Drizzle)</li>
              <li>CMS integrations</li>
              <li>And 100+ more...</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}