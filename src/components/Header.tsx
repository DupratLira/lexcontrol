import { Calendar, Download, LogOut, Users } from 'lucide-react';

interface Props {
  userEmail: string;
  onConectar: () => void;
  onExportZip: () => void;
  onLogout: () => void;
  isAdmin?: boolean;
  onOpenUsuarios?: () => void;
}

export default function Header({ userEmail, onConectar, onExportZip, onLogout, isAdmin, onOpenUsuarios }: Props) {
  const initials = userEmail.slice(0, 2).toUpperCase();
  return (
    <header className="bg-navy-900 text-cream border-b border-navy-700/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full border-2 border-gold-400 flex items-center justify-center text-gold-300 font-serif font-bold text-sm shrink-0">
            DL
          </div>
          <div className="leading-tight">
            <div className="font-serif text-lg sm:text-xl tracking-wide text-gold-300">DUPRAT LIRA</div>
            <div className="text-[10px] sm:text-xs tracking-[0.2em] text-cream/60">ABOGADOS · CONTROL INTERNO</div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {isAdmin && (
            <button
              onClick={onOpenUsuarios}
              className="hidden sm:flex items-center gap-2 bg-navy-800 hover:bg-navy-700 transition-colors text-cream/90 text-sm px-3 py-2 rounded-lg border border-navy-700"
            >
              <Users size={16} /> Usuarios
            </button>
          )}
          <button
            onClick={onConectar}
            className="hidden sm:flex items-center gap-2 bg-navy-800 hover:bg-navy-700 transition-colors text-cream/90 text-sm px-3 py-2 rounded-lg border border-navy-700"
          >
            <Calendar size={16} /> Conectar
          </button>
          <button
            onClick={onExportZip}
            className="flex items-center gap-2 bg-navy-800 hover:bg-navy-700 transition-colors text-cream/90 text-sm px-3 py-2 rounded-lg border border-navy-700"
          >
            <Download size={16} /> ZIP
          </button>
          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-navy-700">
            <div className="w-9 h-9 rounded-full bg-gold-500 text-navy-900 flex items-center justify-center font-semibold text-sm">
              {initials}
            </div>
            <div className="text-xs leading-tight">
              <div className="text-cream/90">{userEmail}</div>
              <button
                onClick={onLogout}
                className="flex items-center gap-1 text-cream/50 hover:text-cream/80 cursor-pointer transition-colors"
              >
                <LogOut size={11} /> Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
