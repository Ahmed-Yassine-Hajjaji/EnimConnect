import { useEffect, useState } from 'react';
import { api, type Annonce } from '../../api/client';

const STATUT: Record<string, { label: string; cls: string }> = {
  en_attente: { label: 'En attente', cls: 'bg-orange-50 text-orange-600' },
  validee:    { label: 'Validée',    cls: 'bg-green-50 text-green-600' },
  rejetee:    { label: 'Rejetée',    cls: 'bg-red-50 text-red-600' },
};

type Filter = 'toutes' | 'en_attente' | 'validee' | 'rejetee';

export default function InterfaceAdministration() {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('toutes');
  const [actionId, setActionId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getClubAnnonces()
      .then(setAnnonces)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleValider(id: string) {
    setActionId(id);
    try {
      await api.validerAnnonceClub(id);
      setAnnonces((prev) => prev.map((a) => a.id === id ? { ...a, statut: 'validee', is_active: true } : a));
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Erreur'); }
    finally { setActionId(null); }
  }

  async function handleRejeter(id: string) {
    setActionId(id);
    try {
      await api.rejeterAnnonceClub(id);
      setAnnonces((prev) => prev.map((a) => a.id === id ? { ...a, statut: 'rejetee', is_active: false } : a));
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Erreur'); }
    finally { setActionId(null); }
  }

  const filtered = annonces.filter((a) => {
    const matchFilter = filter === 'toutes' || a.statut === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      a.titre.toLowerCase().includes(q) ||
      (a.nom_entreprise ?? '').toLowerCase().includes(q) ||
      a.departement.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });
  const stats = {
    total: annonces.length,
    en_attente: annonces.filter((a) => a.statut === 'en_attente').length,
    validee: annonces.filter((a) => a.statut === 'validee').length,
    rejetee: annonces.filter((a) => a.statut === 'rejetee').length,
  };

  return (
    <main className="min-h-screen flex flex-col">
      <div className="px-4 sm:px-6 lg:px-10 pt-6 lg:pt-8 pb-4">
        <h1 className="font-headline font-extrabold text-2xl lg:text-3xl text-on-surface mb-1">Validation des annonces</h1>
        <p className="text-on-surface-variant text-sm">Validez les offres de stage soumises par les entreprises</p>
      </div>

      {/* Stats */}
      <div className="px-4 sm:px-6 lg:px-10 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
          {[
            { label: 'Total', value: stats.total, cls: 'bg-gradient-to-br from-primary to-secondary text-white', badge: '' },
            { label: 'En attente', value: stats.en_attente, cls: 'bg-surface-container-low border border-outline-variant', badge: 'text-orange-600 bg-orange-50' },
            { label: 'Validées', value: stats.validee, cls: 'bg-surface-container-low border border-outline-variant', badge: 'text-green-600 bg-green-50' },
            { label: 'Rejetées', value: stats.rejetee, cls: 'bg-surface-container-low border border-outline-variant', badge: 'text-red-500 bg-red-50' },
          ].map((s, i) => (
            <div key={i} className={`rounded-2xl p-5 ${s.cls}`}>
              <div className={`font-headline font-extrabold text-4xl mb-1 ${i === 0 ? '' : 'text-on-surface'}`}>
                {loading ? '—' : s.value}
              </div>
              <div className={`text-sm font-medium ${i === 0 ? 'text-white/80' : 'text-on-surface-variant'}`}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter tabs + Search */}
      <div className="px-4 sm:px-6 lg:px-10 mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
        <div className="flex bg-surface-container rounded-xl p-1 w-full sm:w-fit gap-1 overflow-x-auto">
          {(['toutes', 'en_attente', 'validee', 'rejetee'] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f ? 'bg-white shadow-sm text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
              }`}>
              {f === 'toutes' ? 'Toutes' : f === 'en_attente' ? 'En attente' : f === 'validee' ? 'Validées' : 'Rejetées'}
              {f !== 'toutes' && <span className="ml-1.5 text-xs">({stats[f]})</span>}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 w-full sm:w-64 focus-within:border-primary transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Titre, entreprise, département…"
            className="bg-transparent text-sm text-on-surface placeholder-on-surface-variant outline-none w-full"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="px-4 sm:px-6 lg:px-10 pb-10 flex-1">
        <div className="bg-surface-container-low rounded-2xl border border-outline-variant overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <span className="material-symbols-outlined animate-spin text-3xl text-on-surface-variant">progress_activity</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-3">inbox</span>
              <p className="font-semibold text-on-surface mb-1">Aucune annonce</p>
              <p className="text-sm text-on-surface-variant">Aucune annonce ne correspond à ce filtre.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container">
                  {['Offre', 'Département', 'Durée', 'Date soumission', 'Statut', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filtered.map((a) => {
                  const s = STATUT[a.statut];
                  const busy = actionId === a.id;
                  return (
                    <tr key={a.id} className="hover:bg-surface-container/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-medium text-on-surface text-sm">{a.titre}</div>
                        <div className="text-xs text-on-surface-variant mt-0.5">{a.nom_entreprise ?? 'Entreprise'}</div>
                      </td>
                      <td className="px-5 py-4 text-sm text-on-surface-variant">{a.departement}</td>
                      <td className="px-5 py-4 text-sm text-on-surface-variant">{a.duree_mois ? `${a.duree_mois} mois` : '—'}</td>
                      <td className="px-5 py-4 text-sm text-on-surface-variant">{new Date(a.created_at).toLocaleDateString('fr-FR')}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${s.cls}`}>{s.label}</span>
                      </td>
                      <td className="px-5 py-4">
                        {a.statut === 'en_attente' && (
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleValider(a.id)} disabled={busy}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors">
                              <span className="material-symbols-outlined text-sm">{busy ? 'progress_activity' : 'check'}</span>
                              Valider
                            </button>
                            <button onClick={() => handleRejeter(a.id)} disabled={busy}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 text-xs font-semibold rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors">
                              <span className="material-symbols-outlined text-sm">close</span>
                              Rejeter
                            </button>
                          </div>
                        )}
                        {a.statut === 'validee' && (
                          <button onClick={() => handleRejeter(a.id)} disabled={busy}
                            className="text-xs px-3 py-1.5 text-red-500 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50">
                            Désactiver
                          </button>
                        )}
                        {a.statut === 'rejetee' && (
                          <button onClick={() => handleValider(a.id)} disabled={busy}
                            className="text-xs px-3 py-1.5 text-green-600 border border-green-200 rounded-lg hover:bg-green-50 disabled:opacity-50">
                            Réactiver
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
