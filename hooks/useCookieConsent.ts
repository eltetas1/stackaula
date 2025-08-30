'use client';

import { useState, useEffect } from 'react';

const COOKIE_CONSENT_KEY = 'cookie-consent';

export function useCookieConsent() {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    const consentValue = consent === 'true';
    setHasConsent(consentValue);
    setShowBanner(!consent); // Show banner if no consent stored
  }, []);

  const acceptCookies = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    setHasConsent(true);
    setShowBanner(false);
  };

  const rejectCookies = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'false');
    setHasConsent(false);
    setShowBanner(false);
  };

  return {
    hasConsent,
    showBanner,
    acceptCookies,
    rejectCookies
  };
}