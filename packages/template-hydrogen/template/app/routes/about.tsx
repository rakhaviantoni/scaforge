import type {MetaFunction} from '@shopify/remix-oxygen';
import {Card} from '~/components/ui/Card';

export const meta: MetaFunction = () => {
  return [
    {title: 'About - {{name}}'},
    {name: 'description', content: 'Learn more about our Hydrogen storefront.'},
  ];
};

export default function About() {
  return (
    <div className="about py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">
            About {{name}}
          </h1>
          
          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Built with Modern Technology
            </h2>
            <p className="text-gray-600 mb-6">
              This storefront is built using Shopify's Hydrogen framework, which provides
              a modern, performant foundation for e-commerce experiences. Combined with
              Scaforge's plugin ecosystem, you can rapidly build and extend your storefront
              with the features you need.
            </p>
            
            <h3 className="text-xl font-semibold mb-3">Key Technologies:</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li><strong>Hydrogen:</strong> Shopify's React-based framework for storefronts</li>
              <li><strong>Remix:</strong> Full-stack web framework with server-side rendering</li>
              <li><strong>TypeScript:</strong> Type-safe development experience</li>
              <li><strong>Tailwind CSS:</strong> Utility-first CSS framework</li>
              <li><strong>Scaforge:</strong> Modular plugin system for rapid development</li>
            </ul>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-semibold mb-4">
              Scaforge Plugin System
            </h2>
            <p className="text-gray-600 mb-4">
              Scaforge provides a powerful plugin system that allows you to add features
              to your Hydrogen storefront without complex configuration. Simply run a
              command to add authentication, databases, analytics, and more.
            </p>
            <p className="text-gray-600">
              Visit the{' '}
              <a 
                href="https://scaforge.dev" 
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Scaforge documentation
              </a>{' '}
              to learn more about available plugins and how to use them.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}