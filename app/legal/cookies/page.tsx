import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Cookie, Shield, Eye, Settings } from 'lucide-react';

export default function CookiesPolicyPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-amber-100 rounded-full">
              <Cookie className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Política de Cookies
          </h1>
          <p className="text-lg text-gray-600">
            Información sobre el uso de cookies en Aula CEIP
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-blue-600" />
                ¿Qué son las cookies?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web. 
                Nos ayudan a recordar tus preferencias y mejorar tu experiencia de navegación.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-blue-600" />
                Tipos de cookies que utilizamos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Cookies esenciales</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Son necesarias para el funcionamiento básico del sitio web. Incluyen el consentimiento de cookies 
                    y la funcionalidad básica de navegación.
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Cookies de preferencias</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Recordamos tus preferencias como el idioma seleccionado o configuraciones de visualización 
                    para personalizar tu experiencia.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-blue-600" />
                Control de cookies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Puedes controlar y eliminar las cookies según desees. Puedes eliminar todas las cookies que ya están 
                en tu dispositivo y configurar la mayoría de navegadores para evitar que se almacenen.
              </p>
              
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Si eliges rechazar las cookies, algunas funcionalidades del sitio web 
                  pueden no funcionar correctamente.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contacto</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                Si tienes preguntas sobre esta política de cookies, puedes contactar con el centro educativo 
                a través de los canales oficiales de comunicación.
              </p>
              
              <div className="mt-4 text-sm text-gray-500">
                <p>Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}