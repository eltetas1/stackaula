import Link from 'next/link';
import { Book } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-6 md:space-y-0">
          {/* Logo and Description */}
          <div className="flex flex-col space-y-3">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <Book className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-bold text-gray-900">Aula CEIP</span>
            </Link>
            <p className="text-sm text-gray-600 max-w-md">
              Portal de comunicación para la comunidad educativa del centro.
            </p>
          </div>

          {/* Legal Links */}
          <div className="flex flex-col space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Legal</h3>
            <Link 
              href="/legal/cookies" 
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              Política de Cookies
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Aula CEIP. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}