import { useMemo, useState } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import FilterBar from './components/FilterBar';
import StatsGrid from './components/StatsGrid';
import MateriaDistribution from './components/MateriaDistribution';
import ViewTabs from './components/ViewTabs';
import ExpedientesTable from './components/ExpedientesTable';
import ExpedienteDetail from './components/ExpedienteDetail';
import NewExpedienteModal from './components/NewExpedienteModal';
import CalendarioView from './components/CalendarioView';
import EscritosView from './components/EscritosView';
import InstallPrompt from './components/InstallPrompt';
import Login from './components/Login';
import AdminUsuarios from './components/AdminUsuarios';
import { useAuth } from './hooks/useAuth';
import { useExpedientes } from './hooks/useExpedientes';
import { useRolActual } from './hooks/useRolActual';
import { computeStats, isVencimientoUrgente, isCongelado } from './utils/stats';
import { downloadExpedientesZip } from './utils/export';
import type { Materia, QuickFilter, TabMode } from './types';

export default function App() {
  const { session, loading: authLoading, signIn, signOut, email } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-800 text-cream/40 text-sm">
        Cargando...
      </div>
    );
  }

  if (!session) {
    return <Login onSignIn={async (e, p) => (await signIn(e, p))?.message ?? null} />;
  }

  return <Dashboard userEmail={email ?? ''} onLogout={signOut} />;
}

function Dashboard({ userEmail, onLogout }: { userEmail: string; onLogout: () => void }) {
  const {
    expedientes, loading, error, addExpediente, updateExpediente,
    addActuacion, concluirExpediente, eliminarExpediente,
  } = useExpedientes(userEmail);
  const { isAdmin } = useRolActual(userEmail);

  const [search, setSearch] = useState('');
  const [materia, setMateria] = useState<Materia | 'todas'>('todas');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('todas');
  const [tab, setTab] = useState<TabMode>('tabla');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showUsuarios, setShowUsuarios] = useState(false);

  const stats = useMemo(() => computeStats(expedientes), [expedientes]);

  const filtered = useMemo(() => {
    let list = expedientes.filter((e) => !e.concluido);

    if (materia !== 'todas') list = list.filter((e) => e.materia === materia);

    switch (quickFilter) {
      case 'amparos':
        list = list.filter((e) => e.enAmparo);
        break;
      case 'apelaciones':
        list = list.filter((e) => e.enApelacion);
        break;
      case 'escritos':
        list = list.filter((e) => e.escritoPendiente);
        break;
      case 'urgentes':
        list = list.filter(isVencimientoUrgente);
        break;
      case 'congelados':
        list = list.filter(isCongelado);
        break;
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (e) =>
          e.numero.toLowerCase().includes(q) ||
          e.actor.toLowerCase().includes(q) ||
          e.demandado.toLowerCase().includes(q) ||
          e.juzgado.toLowerCase().includes(q)
      );
    }

    return list;
  }, [expedientes, materia, quickFilter, search]);

  const selected = selectedId ? expedientes.find((e) => e.id === selectedId) ?? null : null;

  return (
    <div className="min-h-screen pb-16">
      <Header
        userEmail={userEmail}
        onConectar={() =>
          alert('Para sincronizar un vencimiento con Google Calendar, abre el expediente y usa el botón "Sincronizar con Google Calendar" en la sección de Fecha Límite.')
        }
        onExportZip={() => downloadExpedientesZip(expedientes)}
        onLogout={onLogout}
        isAdmin={isAdmin}
        onOpenUsuarios={() => setShowUsuarios(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            No se pudo conectar con la base de datos: {error}
          </div>
        )}

        {loading ? (
          <div className="text-center text-sm text-navy-900/40 py-16">Cargando expedientes...</div>
        ) : (
          <>
            <div className={selected ? 'hidden lg:block space-y-5' : 'space-y-5'}>
              <InstallPrompt />
              <SearchBar value={search} onChange={setSearch} />
              <FilterBar
                activeMateria={materia}
                onChangeMateria={setMateria}
                onNuevoExpediente={() => setShowNewModal(true)}
              />
              <StatsGrid stats={stats} active={quickFilter} onSelect={setQuickFilter} />
              <MateriaDistribution stats={stats} />
            </div>

            <div className={`flex items-center justify-between flex-wrap gap-3 ${selected ? 'hidden lg:flex' : ''}`}>
              <ViewTabs active={tab} onChange={setTab} />
            </div>

            <div className="lg:flex lg:items-start lg:gap-5">
              <div className={`lg:w-[420px] lg:shrink-0 space-y-5 ${selected ? 'hidden lg:block' : ''}`}>
                {tab === 'tabla' && (
                  <ExpedientesTable expedientes={filtered} onSelect={setSelectedId} selectedId={selectedId} />
                )}
                {tab === 'calendario' && <CalendarioView expedientes={filtered} onSelect={setSelectedId} />}
                {tab === 'escritos' && <EscritosView expedientes={filtered} onSelect={setSelectedId} />}
              </div>

              <div className={`flex-1 min-w-0 ${selected ? '' : 'hidden lg:block'}`}>
                {selected ? (
                  <ExpedienteDetail
                    key={selected.id}
                    expediente={selected}
                    onBack={() => setSelectedId(null)}
                    onUpdate={(patch) => updateExpediente(selected.id, patch).catch((e) => alert('Error al guardar: ' + e.message))}
                    onAddActuacion={(desc) => addActuacion(selected.id, desc)}
                    onConcluir={() => {
                      concluirExpediente(selected.id).catch((e) => alert('Error: ' + e.message));
                      setSelectedId(null);
                    }}
                    onEliminar={() => {
                      eliminarExpediente(selected.id).catch((e) => alert('Error: ' + e.message));
                      setSelectedId(null);
                    }}
                  />
                ) : (
                  <div className="hidden lg:flex items-center justify-center min-h-[400px] bg-white rounded-xl shadow-sm text-navy-900/30 text-sm text-center px-6">
                    Selecciona un expediente de la lista para ver su detalle aquí.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="text-center text-xs text-navy-900/40 py-6">
        Duprat Lira Abogados — Insurgentes Sur 300, Roma Norte, CDMX — Tel: 5551601668
      </footer>

      {showNewModal && (
        <NewExpedienteModal
          onClose={() => setShowNewModal(false)}
          onCreate={(data) => addExpediente(data).catch((e) => alert('Error al crear: ' + e.message))}
        />
      )}

      {showUsuarios && <AdminUsuarios onClose={() => setShowUsuarios(false)} />}
    </div>
  );
}
