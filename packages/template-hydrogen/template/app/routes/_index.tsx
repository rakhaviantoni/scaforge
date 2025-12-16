import type {MetaFunction} from '@shopify/remix-oxygen';
import {Button} from '~/components/ui/Button';
import {Card} from '~/components/ui/Card';

export const meta: MetaFunction = () => {
  return [
    {title: '{{name}}'},
    {name: 'description', content: 'Welcome to your Hydrogen storefront!'},
  ];
};

export default function Homepage() {
  return (
    <div className="home">
      <section className="hero bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Welcome to {{name}}
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Your Hydrogen-powered storefront built with Scaforge. 
            Start building your e-commerce experience today.
          </p>
          <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
            Shop Now
          </Button>
        </div>
      </section>

      <section className="features py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            What's Included
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">⚡ Hydrogen Framework</h3>
              <p className="text-gray-600">
                Built on Shopify's Hydrogen framework for blazing-fast storefronts
                with React Server Components.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">🎨 Tailwind CSS</h3>
              <p className="text-gray-600">
                Utility-first CSS framework for rapid UI development with
                beautiful, responsive designs.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">🔧 TypeScript</h3>
              <p className="text-gray-600">
                Full TypeScript support for better developer experience and
                type safety throughout your application.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="getting-started py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">
            Extend with Scaforge Plugins
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Add powerful features to your Hydrogen storefront with Scaforge plugins.
            Authentication, databases, analytics, and more.
          </p>
          <div className="bg-gray-900 text-green-400 p-6 rounded-lg max-w-2xl mx-auto text-left">
            <code className="block">
              # Add authentication<br />
              npx scaforge add auth-clerk<br />
              <br />
              # Add a database<br />
              npx scaforge add db-prisma<br />
              <br />
              # Add analytics<br />
              npx scaforge add analytics-posthog
            </code>
          </div>
        </div>
      </section>
    </div>
  );
}