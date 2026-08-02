import { useEffect, useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('lexcontrol.installDismissed') === '1');

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (isStandalone() || dismissed) return null;
  if (!deferred && !isIos()) return null;

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem('lexcontrol.installDismissed', '1');
  };

  return (
    <>
      <div className="bg-gold-500/15 border border-gold-500/30 rounded-xl px-4 py-3 flex items-center gap-3 text-sm">
        <Smartphone size={18} className="text-navy-900/70 shrink-0" />
        <span className="text-navy-900/80 flex-1">
          Instala LexControl en tu celular para acceder como una app, con un ícono en tu pantalla de inicio.
        </span>
        <button
          onClick={async () => {
            if (deferred) {
              await deferred.prompt();
              setDeferred(null);
            } else {
              setShowIosHelp(true);
            }
          }}
          className="flex items-center gap-1.5 bg-navy-900 text-cream px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap"
        >
          <Download size={13} /> Instalar
        </button>
        <button onClick={dismiss} className="text-navy-900/40 hover:text-navy-900/70 shrink-0">
          <X size={16} />
        </button>
      </div>

      {showIosHelp && (
        <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-sm p-5 space-y-3">
            <h3 className="font-serif text-lg text-navy-900">Instalar en iPhone / iPad</h3>
            <ol className="text-sm text-navy-900/70 space-y-2 list-decimal list-inside">
              <li>Toca el botón <strong>Compartir</strong> (el cuadro con la flecha hacia arriba) en Safari.</li>
              <li>Selecciona <strong>"Agregar a pantalla de inicio"</strong>.</li>
              <li>Confirma tocando <strong>"Agregar"</strong>.</li>
            </ol>
            <button
              onClick={() => setShowIosHelp(false)}
              className="w-full bg-navy-900 text-cream rounded-lg py-2 text-sm font-medium mt-2"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
