import { useEffect, useState } from 'react';
import { api, type AnnonceAdmin, type EntrepriseAvecOffres } from '../../api/client';

type Vue = 'entreprise' | 'offres';
type FilterStatut = 'toutes' | 'en_attente' | 'validee' | 'rejetee';

const STATUT = {
  en_attente: { label: 'En attente', cls: 'bg-orange-50 text-orange-600 border-orange-200' },
  validee:    { label: 'Validée',    cls: 'bg-green-50 text-green-600 border-green-200' },
  rejetee:    { label: 'Rejetée',    cls: 'bg-red-50 text-red-600 border-red-200' },
};

const STATUT_DEPT = {
  en_attente: { label: 'En attente', cls: 'text-orange-600 bg-orange-50' },
  validee:    { label: 'Validée',    cls: 'text-green-600 bg-green-50' },
  rejetee:    { label: 'Rejetée',    cls: 'text-red-600 bg-red-50' },
};

export default function OffresAdmin() {
  const [vue, setVue] = useState<Vue>('entreprise');

  // Vue entreprise
  const [entreprises, setEntreprises] = useState<EntrepriseAvecOffres[]>([]);
  const [selectedEntreprise, setSelectedEntreprise] = useState<EntrepriseAvecOffres | null>(null);
  const [offresEntreprise, setOffresEntreprise] = useState<AnnonceAdmin[]>([]);
  const [loadingOffres, setLoadingOffres] = useState(false);
  const [searchEntreprise, setSearchEntreprise] = useState('');

  // Vue offres
  const [toutesOffres, setToutesOffres] = useState<AnnonceAdmin[]>([]);

  // Commun
  const [loading, setLoading] = useState(true);
  const [selectedOffre, setSelectedOffre] = useState<AnnonceAdmin | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [searchOffre, setSearchOffre] = useState('');
  const [filterStatut, setFilterStatut] = useState<FilterStatut>('toutes');

  useEffect(() => {
    if (vue === 'entreprise') {
      setLoading(true);
      api.getEntreprisesAvecOffres()
        .then(setEntreprises)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(true);
      api.getClubAnnoncesDetaillees()
        .then(setToutesOffres)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [vue]);

  function switchVue(v: Vue) {
    setVue(v);
    setSelectedEntreprise(null);
    setSelectedOffre(null);
    setSearchEntreprise('');
    setSearchOffre('');
    setFilterStatut('toutes');
  }

  async function selectEntreprise(e: EntrepriseAvecOffres) {
    setSelectedEntreprise(e);
    setSelectedOffre(null);
    setSearchOffre('');
    setFilterStatut('toutes');
    setLoadingOffres(true);
    try {
      const data = await api.getOffresEntreprise(e.id);
      setOffresEntreprise(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOffres(false);
    }
  }

  async function handleToggleActif(offre: AnnonceAdmin) {
    setToggling(offre.id);
    try {
      const res = await api.toggleAnnonceActif(offre.id);
      const updated = { ...offre, is_active: res.is_active };
      setOffresEntreprise((prev) => prev.map((o) => (o.id === offre.id ? updated : o)));
      setToutesOffres((prev) => prev.map((o) => (o.id === offre.id ? updated : o)));
      if (selectedOffre?.id === offre.id) setSelectedOffre(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setToggling(null);
    }
  }

  const filteredEntreprises = entreprises.filter((e) =>
    !searchEntreprise || e.nom_entreprise.toLowerCase().includes(searchEntreprise.toLowerCase())
  );

  const filteredOffresEntreprise = offresEntreprise.filter(
    (o) =>
      (filterStatut === 'toutes' || o.statut === filterStatut) &&
      (!searchOffre || o.titre.toLowerCase().includes(searchOffre.toLowerCase()))
  );

  const filteredToutesOffres = toutesOffres.filter(
    (o) =>
      (filterStatut === 'toutes' || o.statut === filterStatut) &&
      (!searchOffre ||
        o.titre.toLowerCase().includes(searchOffre.toLowerCase()) ||
        (o.nom_entreprise ?? '').toLowerCase().includes(searchOffre.toLowerCase()))
  );

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-10 pt-8 pb-4">
        <h1 className="font-headline font-extrabold text-3xl text-on-surface mb-1">Gestion des offres</h1>
        <p className="text-on-surface-variant text-sm">Consultez et gérez toutes les offres de stage</p>
      </div>

      {/* Toggle vue */}
      <div className="px-10 mb-6">
        <div className="flex bg-surface-container rounded-xl p-1 w-fit gap-1">
          <button
            onClick={() => switchVue('entreprise')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              vue === 'entreprise'
                ? 'bg-white shadow-sm text-on-surface'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-base">business</span>
            Par entreprise
          </button>
          <button
            onClick={() => switchVue('offres')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              vue === 'offres'
                ? 'bg-white shadow-sm text-on-surface'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-base">work</span>
            Par offres
          </button>
        </div>
      </div>

      {/* Contenu */}
      {vue === 'entreprise' ? (
        <div className="px-10 pb-10 flex-1 flex gap-5" style={{ minHeight: 0 }}>
          {/* Colonne gauche — liste entreprises */}
          <div className="w-80 flex-shrink-0 flex flex-col gap-3">
            <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 focus-within:border-primary transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
              <input
                type="text"
                value={searchEntreprise}
                onChange={(e) => setSearchEntreprise(e.target.value)}
                placeholder="Rechercher une entreprise…"
                className="bg-transparent text-sm text-on-surface placeholder-on-surface-variant outline-none w-full"
              />
              {searchEntreprise && (
                <button onClick={() => setSearchEntreprise('')} className="text-on-surface-variant hover:text-on-surface">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              )}
            </div>

            <div className="flex-1 bg-surface-container-low border border-outline-variant rounded-2xl overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <span className="material-symbols-outlined animate-spin text-2xl text-on-surface-variant">progress_activity</span>
                </div>
              ) : filteredEntreprises.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">business_center</span>
                  <p className="text-sm text-on-surface-variant">Aucune entreprise trouvée</p>
                </div>
              ) : (
                <ul className="divide-y divide-outline-variant">
                  {filteredEntreprises.map((e) => (
                    <li key={e.id}>
                      <button
                        onClick={() => selectEntreprise(e)}
                        className={`w-full text-left px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-surface-container transition-colors ${
                          selectedEntreprise?.id === e.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-on-surface truncate">{e.nom_entreprise}</div>
                          <div className="text-xs text-on-surface-variant mt-0.5">{e.ville ?? '—'}</div>
                        </div>
                        <span className={`flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-lg ${
                          e.nb_offres > 0 ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'
                        }`}>
                          {e.nb_offres} offre{e.nb_offres !== 1 ? 's' : ''}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Colonne droite — offres de l'entreprise sélectionnée */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            {!selectedEntreprise ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-surface-container-low border border-outline-variant rounded-2xl text-center py-16 px-8">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-3">arrow_back</span>
                <p className="font-semibold text-on-surface mb-1">Sélectionnez une entreprise</p>
                <p className="text-sm text-on-surface-variant">Cliquez sur une entreprise à gauche pour voir ses offres</p>
              </div>
            ) : (
              <>
                {/* Header entreprise sélectionnée */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="font-headline font-bold text-xl text-on-surface">{selectedEntreprise.nom_entreprise}</h2>
                    <p className="text-sm text-on-surface-variant">
                      {selectedEntreprise.secteur && `${selectedEntreprise.secteur} · `}
                      {selectedEntreprise.ville ?? '—'} · {offresEntreprise.length} offre{offresEntreprise.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Filtres */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex bg-surface-container rounded-xl p-1 gap-1">
                      {(['toutes', 'en_attente', 'validee', 'rejetee'] as FilterStatut[]).map((f) => (
                        <button
                          key={f}
                          onClick={() => setFilterStatut(f)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            filterStatut === f ? 'bg-white shadow-sm text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
                          }`}
                        >
                          {f === 'toutes' ? 'Toutes' : f === 'en_attente' ? 'En attente' : f === 'validee' ? 'Validées' : 'Rejetées'}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 focus-within:border-primary transition-colors">
                      <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
                      <input
                        type="text"
                        value={searchOffre}
                        onChange={(e) => setSearchOffre(e.target.value)}
                        placeholder="Rechercher…"
                        className="bg-transparent text-sm text-on-surface placeholder-on-surface-variant outline-none w-36"
                      />
                    </div>
                  </div>
                </div>

                {/* Liste offres */}
                <div className="flex-1 bg-surface-container-low border border-outline-variant rounded-2xl overflow-hidden">
                  {loadingOffres ? (
                    <div className="flex items-center justify-center py-16">
                      <span className="material-symbols-outlined animate-spin text-2xl text-on-surface-variant">progress_activity</span>
                    </div>
                  ) : filteredOffresEntreprise.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">inbox</span>
                      <p className="text-sm text-on-surface-variant">Aucune offre correspondante</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-outline-variant bg-surface-container">
                          {['Offre', 'Département', 'Durée', 'Date', 'Statut', 'Active', ''].map((h) => (
                            <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant">
                        {filteredOffresEntreprise.map((o) => {
                          const s = STATUT[o.statut];
                          return (
                            <tr key={o.id} className="hover:bg-surface-container/50 transition-colors">
                              <td className="px-5 py-3">
                                <div className="font-medium text-sm text-on-surface">{o.titre}</div>
                              </td>
                              <td className="px-5 py-3 text-xs text-on-surface-variant">{o.departement}</td>
                              <td className="px-5 py-3 text-xs text-on-surface-variant">{o.duree_mois ? `${o.duree_mois} mois` : '—'}</td>
                              <td className="px-5 py-3 text-xs text-on-surface-variant">{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                              <td className="px-5 py-3">
                                <span className={`text-xs font-semibold px-2 py-1 rounded-lg border ${s.cls}`}>{s.label}</span>
                              </td>
                              <td className="px-5 py-3">
                                <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${o.is_active ? 'bg-green-50 text-green-700' : 'bg-surface-container text-on-surface-variant'}`}>
                                  {o.is_active ? 'Oui' : 'Non'}
                                </span>
                              </td>
                              <td className="px-5 py-3">
                                <button
                                  onClick={() => setSelectedOffre(o)}
                                  className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors font-medium"
                                >
                                  Voir détails
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* ── Vue Par offres ── */
        <div className="px-10 pb-10 flex-1 flex flex-col gap-4">
          {/* Filtres */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex bg-surface-container rounded-xl p-1 gap-1">
              {(['toutes', 'en_attente', 'validee', 'rejetee'] as FilterStatut[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterStatut(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterStatut === f ? 'bg-white shadow-sm text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {f === 'toutes' ? 'Toutes' : f === 'en_attente' ? 'En attente' : f === 'validee' ? 'Validées' : 'Rejetées'}
                  {f !== 'toutes' && (
                    <span className="ml-1.5 text-xs">
                      ({toutesOffres.filter((o) => o.statut === f).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 w-64 focus-within:border-primary transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
              <input
                type="text"
                value={searchOffre}
                onChange={(e) => setSearchOffre(e.target.value)}
                placeholder="Titre, entreprise…"
                className="bg-transparent text-sm text-on-surface placeholder-on-surface-variant outline-none w-full"
              />
              {searchOffre && (
                <button onClick={() => setSearchOffre('')} className="text-on-surface-variant hover:text-on-surface">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              )}
            </div>
            <span className="text-sm text-on-surface-variant ml-auto">{filteredToutesOffres.length} offre{filteredToutesOffres.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="bg-surface-container-low border border-outline-variant rounded-2xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <span className="material-symbols-outlined animate-spin text-3xl text-on-surface-variant">progress_activity</span>
              </div>
            ) : filteredToutesOffres.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-3">inbox</span>
                <p className="font-semibold text-on-surface mb-1">Aucune offre</p>
                <p className="text-sm text-on-surface-variant">Aucune offre ne correspond à ce filtre.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container">
                    {['Offre', 'Entreprise', 'Département', 'Durée', 'Date', 'Statut', 'Active', ''].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {filteredToutesOffres.map((o) => {
                    const s = STATUT[o.statut];
                    return (
                      <tr key={o.id} className="hover:bg-surface-container/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-medium text-sm text-on-surface">{o.titre}</div>
                        </td>
                        <td className="px-5 py-4 text-sm text-on-surface-variant">{o.nom_entreprise ?? '—'}</td>
                        <td className="px-5 py-4 text-xs text-on-surface-variant">{o.departement}</td>
                        <td className="px-5 py-4 text-xs text-on-surface-variant">{o.duree_mois ? `${o.duree_mois} mois` : '—'}</td>
                        <td className="px-5 py-4 text-xs text-on-surface-variant">{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${s.cls}`}>{s.label}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${o.is_active ? 'bg-green-50 text-green-700' : 'bg-surface-container text-on-surface-variant'}`}>
                            {o.is_active ? 'Oui' : 'Non'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => setSelectedOffre(o)}
                            className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors font-medium"
                          >
                            Voir détails
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Modal détail offre */}
      {selectedOffre && (
        <OffreDetailModal
          offre={selectedOffre}
          toggling={toggling === selectedOffre.id}
          onClose={() => setSelectedOffre(null)}
          onToggle={() => handleToggleActif(selectedOffre)}
        />
      )}
    </main>
  );
}

// ─── Modal détail ────────────────────────────────────────────────────────────

function OffreDetailModal({
  offre,
  toggling,
  onClose,
  onToggle,
}: {
  offre: AnnonceAdmin;
  toggling: boolean;
  onClose: () => void;
  onToggle: () => void;
}) {
  const s = STATUT[offre.statut];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl border border-outline-variant shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header modal */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-outline-variant">
          <div className="min-w-0">
            <h2 className="font-headline font-bold text-xl text-on-surface truncate">{offre.titre}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm text-on-surface-variant">{offre.nom_entreprise}</span>
              {offre.ville && <span className="text-on-surface-variant">·</span>}
              {offre.ville && <span className="text-sm text-on-surface-variant">{offre.ville}</span>}
              {offre.duree_mois && <span className="text-on-surface-variant">·</span>}
              {offre.duree_mois && <span className="text-sm text-on-surface-variant">{offre.duree_mois} mois</span>}
            </div>
          </div>
          <button onClick={onClose} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {/* Body modal */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Badges statut + actif */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-sm font-semibold px-3 py-1.5 rounded-xl border ${s.cls}`}>{s.label}</span>
            <span className={`text-sm font-semibold px-3 py-1.5 rounded-xl ${offre.is_active ? 'bg-green-50 text-green-700' : 'bg-surface-container text-on-surface-variant'}`}>
              {offre.is_active ? 'Visible par les étudiants' : 'Masquée'}
            </span>
            <span className="text-xs text-on-surface-variant ml-auto">
              Soumise le {new Date(offre.created_at).toLocaleDateString('fr-FR')}
            </span>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Description</h3>
            <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{offre.description}</p>
          </div>

          {/* Départements ciblés */}
          {offre.departements && offre.departements.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Départements ciblés</h3>
              <div className="flex flex-wrap gap-2">
                {offre.departements.map((d) => (
                  <span key={d} className="text-xs px-2.5 py-1 bg-primary/10 text-primary rounded-lg font-medium">{d}</span>
                ))}
              </div>
            </div>
          )}

          {/* Validations par département */}
          {offre.validations_dept && offre.validations_dept.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Validations par département</h3>
              <div className="rounded-xl border border-outline-variant overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-container border-b border-outline-variant">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-on-surface-variant">Département</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-on-surface-variant">Statut</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-on-surface-variant">Chef</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-on-surface-variant">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {offre.validations_dept.map((v) => {
                      const vs = STATUT_DEPT[v.statut];
                      return (
                        <tr key={v.departement}>
                          <td className="px-4 py-3 text-sm text-on-surface font-medium">{v.departement}</td>
                          <td className="px-4 py-3">
                            <div>
                              <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${vs.cls}`}>{vs.label}</span>
                              {v.motif && <p className="text-xs text-on-surface-variant mt-1 italic">{v.motif}</p>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-on-surface-variant">{v.chef_nom ?? '—'}</td>
                          <td className="px-4 py-3 text-xs text-on-surface-variant">
                            {v.validated_at ? new Date(v.validated_at).toLocaleDateString('fr-FR') : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer modal — action désactiver/activer */}
        <div className="px-6 py-4 border-t border-outline-variant flex items-center justify-between gap-4">
          <p className="text-xs text-on-surface-variant">
            {offre.is_active
              ? 'Désactiver masquera cette offre pour tous les étudiants.'
              : 'Activer rendra cette offre visible aux étudiants (si validée).'}
          </p>
          <button
            onClick={onToggle}
            disabled={toggling}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
              offre.is_active
                ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
            }`}
          >
            <span className="material-symbols-outlined text-base">
              {toggling ? 'progress_activity' : offre.is_active ? 'visibility_off' : 'visibility'}
            </span>
            {offre.is_active ? 'Désactiver l\'offre' : 'Activer l\'offre'}
          </button>
        </div>
      </div>
    </div>
  );
}
