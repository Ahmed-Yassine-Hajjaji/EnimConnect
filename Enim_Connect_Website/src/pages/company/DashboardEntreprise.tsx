import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type Annonce, type EntrepriseProfile } from "../../api/client";

const STATUT: Record<string, { label: string; cls: string }> = {
  en_attente: { label: "En attente", cls: "bg-orange-50 text-orange-600" },
  validee:    { label: "Active",     cls: "bg-green-50 text-green-600" },
  rejetee:    { label: "Rejetée",    cls: "bg-red-50 text-red-600" },
};

export default function DashboardEntreprise() {
  const navigate = useNavigate();
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [entreprise, setEntreprise] = useState<EntrepriseProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getMesAnnonces(), api.getMonEntreprise()])
      .then(([a, e]) => { setAnnonces(a); setEntreprise(e); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette annonce ?")) return;
    setDeletingId(id);
    try {
      await api.supprimerAnnonce(id);
      setAnnonces((prev) => prev.filter((a) => a.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setDeletingId(null);
    }
  }

  const total = annonces.length;
  const actives = annonces.filter((a) => a.statut === "validee").length;
  const enAttente = annonces.filter((a) => a.statut === "en_attente").length;
  const rejetees = annonces.filter((a) => a.statut === "rejetee").length;

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-10 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline font-extrabold text-3xl text-on-surface mb-1">
              {loading ? "Chargement…" : (entreprise?.nom_entreprise || "Tableau de bord")}
            </h1>
            <p className="text-on-surface-variant text-sm flex items-center gap-2">
              {entreprise?.secteur && <span>{entreprise.secteur}</span>}
              {entreprise?.secteur && entreprise?.ville && <span>·</span>}
              {entreprise?.ville && <span>{entreprise.ville}</span>}
              {!entreprise?.valide && (
                <span className="text-orange-600 font-medium">⚠ Compte en attente de validation</span>
              )}
            </p>
          </div>
          <Link to="/entreprise/publier-offre" className="btn-primary">
            <span className="material-symbols-outlined text-xl">add</span>
            Publier une offre
          </Link>
        </div>
      </div>

      <div className="flex flex-1 gap-6 px-10 pb-10">
        {/* Left */}
        <div className="flex-1 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { icon: "work", label: "Total offres", value: total, gradient: true },
              { icon: "check_circle", label: "Actives", value: actives, iconCls: "text-green-600 bg-green-100" },
              { icon: "hourglass_top", label: "En attente", value: enAttente, iconCls: "text-orange-600 bg-orange-100" },
              { icon: "cancel", label: "Rejetées", value: rejetees, iconCls: "text-red-500 bg-red-100" },
            ].map((s, i) => (
              <div key={i} className={s.gradient
                ? "bg-gradient-to-br from-primary to-secondary rounded-2xl p-5 text-white"
                : "bg-surface-container-low rounded-2xl p-5 border border-outline-variant"
              }>
                {s.gradient ? (
                  <span className="material-symbols-outlined text-2xl text-white/80 mb-3 block" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                ) : (
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.iconCls}`}>
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                  </div>
                )}
                <div className={`font-headline font-extrabold text-4xl mb-1 ${s.gradient ? "" : "text-on-surface"}`}>
                  {loading ? "—" : s.value}
                </div>
                <div className={`text-sm font-medium ${s.gradient ? "text-white/80" : "text-on-surface-variant"}`}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Offers table */}
          <div className="bg-surface-container-low rounded-2xl border border-outline-variant overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
              <h2 className="font-headline font-bold text-lg text-on-surface">Mes offres de stage</h2>
              <Link to="/entreprise/publier-offre" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                <span className="material-symbols-outlined text-base">add</span>Nouvelle offre
              </Link>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 text-on-surface-variant">
                <span className="material-symbols-outlined text-3xl animate-spin">progress_activity</span>
              </div>
            ) : annonces.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-3">work_off</span>
                <p className="font-semibold text-on-surface mb-1">Aucune offre publiée</p>
                <p className="text-sm text-on-surface-variant mb-4">Commencez par publier votre première offre de stage.</p>
                <Link to="/entreprise/publier-offre" className="btn-primary">
                  <span className="material-symbols-outlined text-xl">add</span>Publier une offre
                </Link>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container">
                    {["Poste", "Département", "Durée", "Statut", "Date", ""].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {annonces.map((a) => {
                    const s = STATUT[a.statut];
                    return (
                      <tr key={a.id} className="hover:bg-surface-container/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-medium text-on-surface text-sm">{a.titre}</div>
                          {a.motif && <div className="text-xs text-red-500 mt-0.5">↳ {a.motif}</div>}
                        </td>
                        <td className="px-5 py-4 text-sm text-on-surface-variant">{a.departement}</td>
                        <td className="px-5 py-4 text-sm text-on-surface-variant">
                          {a.duree_mois ? `${a.duree_mois} mois` : "—"}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${s.cls}`}>{s.label}</span>
                        </td>
                        <td className="px-5 py-4 text-sm text-on-surface-variant">
                          {new Date(a.created_at).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            {a.statut === "validee" && (
                              <button
                                onClick={() => navigate("/entreprise/gestion-candidats", { state: { annonceId: a.id } })}
                                className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                                title="Voir les candidats"
                              >
                                <span className="material-symbols-outlined text-base">group</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(a.id)}
                              disabled={deletingId === a.id || a.statut === "validee"}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors disabled:opacity-30"
                              title={a.statut === "validee" ? "Impossible de supprimer une offre active" : "Supprimer"}
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="w-72 flex-shrink-0">
          <div className="sticky top-24 space-y-4">
            <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent rounded-2xl border border-primary/10 p-5">
              <h3 className="font-headline font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
                Actions rapides
              </h3>
              <div className="space-y-2">
                {[
                  { to: "/entreprise/publier-offre", icon: "add_circle", iconCls: "text-primary", label: "Publier une offre" },
                  { to: "/entreprise/gestion-candidats", icon: "manage_accounts", iconCls: "text-secondary", label: "Gérer les candidatures" },
                  { to: "/entreprise/candidats-favoris", icon: "person_search", iconCls: "text-tertiary", label: "Rechercher des étudiants" },
                ].map((item) => (
                  <Link key={item.to} to={item.to}
                    className="flex items-center gap-3 p-3 bg-white/70 rounded-xl hover:bg-white transition-colors text-sm font-medium text-on-surface"
                  >
                    <span className={`material-symbols-outlined text-lg ${item.iconCls}`}>{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {!loading && total > 0 && (
              <div className="bg-surface-container-low rounded-2xl border border-outline-variant p-5">
                <h3 className="font-semibold text-on-surface mb-3 text-sm">Répartition des offres</h3>
                <div className="space-y-2 mb-3">
                  {[
                    { label: "Actives", count: actives, color: "bg-green-500" },
                    { label: "En attente", count: enAttente, color: "bg-orange-400" },
                    { label: "Rejetées", count: rejetees, color: "bg-red-400" },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.color}`} />
                      <span className="text-sm text-on-surface-variant flex-1">{s.label}</span>
                      <span className="text-sm font-semibold text-on-surface">{s.count}</span>
                    </div>
                  ))}
                </div>
                <div className="h-2 bg-surface-container rounded-full overflow-hidden flex">
                  <div className="bg-green-500 h-full" style={{ width: `${(actives / total) * 100}%` }} />
                  <div className="bg-orange-400 h-full" style={{ width: `${(enAttente / total) * 100}%` }} />
                  <div className="bg-red-400 h-full" style={{ width: `${(rejetees / total) * 100}%` }} />
                </div>
              </div>
            )}

            <div className="bg-surface-container-low rounded-2xl border border-outline-variant p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <span className="text-sm font-semibold text-on-surface">Matching IA actif</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Les candidats de vos offres actives sont automatiquement classés par pertinence grâce à l'IA (similarité cosinus sur embeddings).
              </p>
              <Link to="/entreprise/gestion-candidats" className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                Voir les candidatures<span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
