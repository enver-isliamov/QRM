import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function YandexMetrika() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ym) {
      // Notify Yandex Metrika about the route change
      (window as any).ym(106936532, 'hit', window.location.href);
    }
  }, [location]);

  return null;
}
