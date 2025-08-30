'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import Link from 'next/link';
import { Cookie } from 'lucide-react';

export function CookieBanner() {
  const { showBanner, acceptCookies, rejectCookies } = useCookieConsent();

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <Card className="mx-auto max-w-4xl bg-white shadow-lg border">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Cookie className="h-6 w-6 text-amber-600 flex-shrink-0" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-gray-900">
                  Utilizamos cookies
                </h3>
                <p className="text-sm text-gray-600">
                  Este sitio utiliza cookies para mejorar tu experiencia. Puedes leer más en nuestra{' '}
                  <Link href="/legal/cookies" className="text-blue-600 hover:underline">
                    Política de Cookies
                  </Link>
                  .
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={rejectCookies}
                className="w-full sm:w-auto"
              >
                Rechazar
              </Button>
              <Button
                size="sm"
                onClick={acceptCookies}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
              >
                Aceptar
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}