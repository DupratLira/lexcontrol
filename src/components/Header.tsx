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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full border-2 border-gold-400 flex items-center justify-center text-gold-300 font-serif font-bold text-sm shrink-0">
            DL
          </div>
          <div className="leading-tight min-w-0">
            <div className="font-serif text-lg sm:text-xl tracking-wide text-gold-300 truncate">DUPRAT LIRA</div>
            <div className="text-[10px] sm:text-xs tracking-[0.2em] text-cream/60 truncate">ABOGADOS · CONTROL INTERNO</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {isAdmin && (
            <button
              onClick={onOpenUsuarios}
              title="Usuarios"
              className="flex items-center gap-2 bg-navy-800 hover:bg-navy-700 transition-colors text-cream/90 text-sm px-2.5 sm:px-3 py-2 rounded-lg border border-navy-700"
            >
              <Users size={16} /> <span className="hidden sm:inline">Usuarios</span>
            </button>
          )}
          <button
            onClick={onConectar}
            title="Conectar"
            className="flex items-center gap-2 bg-navy-800 hover:bg-navy-700 transition-colors text-cream/90 text-sm px-2.5 sm:px-3 py-2 rounded-lg border border-navy-700"
          >
            <Calendar size={16} /> <span className="hidden sm:inline">Conectar</span>
          </button>
          <button
            onClick={onExportZip}
            title="Descargar ZIP"
            className="flex items-center gap-2 bg-navy-800 hover:bg-navy-700 transition-colors text-cream/90 text-sm px-2.5 sm:px-3 py-2 rounded-lg border border-navy-700"
          >
            <Download size={16} /> <span className="hidden sm:inline">ZIP</span>
          </button>
          <div className="flex items-center gap-2 pl-1.5 sm:pl-3 sm:border-l sm:border-navy-700">
            <div className="hidden md:flex w-9 h-9 rounded-full bg-gold-500 text-navy-900 items-center justify-center font-semibold text-sm shrink-0">
              {initials}
            </div>
            <div className="text-xs leading-tight">
              <div className="hidden md:block text-cream/90 max-w-[160px] truncate">{userEmail}</div>
              <button
                onClick={onLogout}
                title="Cerrar Sesión"
                className="flex items-center gap-1 text-cream/70 hover:text-cream bg-navy-800 hover:bg-navy-700 sm:bg-transparent sm:hover:bg-transparent px-2.5 sm:px-0 py-2 sm:py-0 rounded-lg border border-navy-700 sm:border-0 transition-colors"
              >
                <LogOut size={14} className="sm:hidden" />
                <LogOut size={11} className="hidden sm:block" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
