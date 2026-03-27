import { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);
  const [dismissed, setDismissed] = useState(true); // Start true to prevent flash

  useEffect(() => {
    // Check if already dismissed
    const isDismissed = localStorage.getItem('pwa-prompt-dismissed') === 'true';
    setDismissed(isDismissed);

    // Check if already installed (standalone mode)
    const isStandAloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(!!isStandAloneMode);

    // Detect iOS
    const ua = window.navigator.userAgent;
    const webkit = !!ua.match(/WebKit/i);
    const isIPad = !!ua.match(/iPad/i);
    const isIPhone = !!ua.match(/iPhone/i);
    const isIOSDevice = isIPad || isIPhone;
    setIsIOS(isIOSDevice && webkit && !ua.match(/CriOS/i));

    // Listen for Android install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  if (isStandalone || dismissed || (!isInstallable && !isIOS)) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstallable(false);
      }
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  return (
    <div className="px-4 pt-4 animate-fade-in">
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 relative shadow-sm">
        <button onClick={handleDismiss} className="absolute top-2 right-2 p-1.5 text-emerald-400 hover:text-emerald-600 touch-feedback">
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="pr-4">
            <h3 className="font-semibold text-emerald-900 text-sm">Установить приложение</h3>
            <p className="text-xs text-emerald-700 mt-0.5 mb-3 leading-relaxed">
              Добавьте ORAZA на экран «Домой» для быстрого доступа и работы без интернета.
            </p>
            {isIOS ? (
              <div className="text-xs text-emerald-800 bg-emerald-100/50 p-2.5 rounded-lg flex items-center gap-2 font-medium">
                <span>Нажмите</span> <Share className="w-4 h-4 inline text-blue-500" /> <span>затем</span> <PlusSquare className="w-4 h-4 inline text-gray-600" /> <span>«На экран Домой»</span>
              </div>
            ) : (
              <button onClick={handleInstall} className="bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors touch-feedback">
                Установить
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
