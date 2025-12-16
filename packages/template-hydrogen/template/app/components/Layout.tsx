import {Link} from '@remix-run/react';
import type {ReactNode} from 'react';
import {Button} from '~/components/ui/Button';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({children}: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold text-gray-900">
            {{name}}
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Home
            </Link>
            <Link 
              to="/about" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              About
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              Cart (0)
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">{{name}}</h3>
            <p className="text-gray-400">
              A modern Hydrogen storefront built with Scaforge.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider">
              Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider">
              Resources
            </h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://hydrogen.shopify.dev" 
                  className="text-gray-400 hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Hydrogen Docs
                </a>
              </li>
              <li>
                <a 
                  href="https://scaforge.dev" 
                  className="text-gray-400 hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Scaforge
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 {{name}}. Built with Hydrogen and Scaforge.</p>
        </div>
      </div>
    </footer>
  );
}