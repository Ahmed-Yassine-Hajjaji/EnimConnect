import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api, type Annonce, type ValidationDept } from "../../api/client";

type Filter = "toutes" | "en_attente" | "validee" | "rejetee";

const STATUT_BADGE: Record<string, { label: string; icon: string }> = {
  en_attente: { label: "En attente", icon: "schedule" },
  validee:    { label: "Validée",    icon: "check_circle" },
  rejetee:    { label: "Rejetée",    icon: "cancel" },
};

function DeptValidationBadge({ v }: { v: ValidationDept }) {
  const s = STATUT_BADGE[v.statut];
  return (
    <div className={`rounded-xl px-3 py-2 text-xs ${v.statut === "en_attente" ? "bg-orange-50 border border-orange-100" : v.statut === "validee" ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100"}`}>
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className={`material-symbols-outlined text-sm ${v.statut === "validee" ? "text-green-600" : v.statut === "rejetee" ? "text-red-600" : "text-orange-500"}`}
          style={{ fontVariationSettings: "'FILL' 1" }}>
          {s.icon}
        </span>
        <span className="font-semibold text-on-surface truncate max-w-[180px]">{v.departement}</span>
      </div>
      {v.statut === "rejetee" && v.motif && (
        <div className="text-red-600 mt-1 pl-5 leading-tight">
          <span className="font-medium">Motif : </span>{v.motif}
        </div>
      )}
      {v.statut === "en_attente" && (
        <div className="text-orange-500 pl-5 leading-tight">En attente du chef</div>
      )}
      {v.statut === "validee" && (
        <div className="text-green-600 pl-5 leading-tight">Visible pour les étudiants</div>
      )}
    </div>
  );
}

function OffreModal({ annonce, onClose }: { annonce: Annonce; onClose: () => void }) {
  const vds = annonce.validations_dept ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-surface rounded-t-3xl sm:rounded-3xl border border-outline-variant shadow-xl w-full sm:max-w-lg max-h-[92vh] sm:max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-outline-variant">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h2 className="font-headline font-bold text-on-surface text-xl mb-1">{annonce.titre}</h2>
              <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                {annonce.duree_mois && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    {annonce.duree_mois} mois
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  {new Date(annonce.created_at).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-container transition-colors flex-shrink-0">
              <span className="material-symbols-outlined text-on-surface-variant">close</span>
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="px-6 py-4 border-b border-outline-variant">
          <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">{annonce.description}</p>
        </div>

        {/* Per-department details */}
        <div className="px-6 py-4">
          <h3 className="font-semibold text-on-surface text-sm mb-3">
            Validation par département ({vds.length})
          </h3>
          {vds.length === 0 ? (
            <p className="text-sm text-on-surface-variant">Aucun département ciblé.</p>
          ) : (
            <div className="space-y-2">
              {vds.map((v) => (
                <div
                  key={v.departement}
                  className={`rounded-xl border p-4 text-sm ${
                    v.statut === "validee"
                      ? "bg-green-50 border-green-200"
                      : v.statut === "rejetee"
                      ? "bg-red-50 border-red-200"
                      : "bg-orange-50 border-orange-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`material-symbols-outlined text-base ${
                        v.statut === "validee" ? "text-green-600" : v.statut === "rejetee" ? "text-red-600" : "text-orange-500"
                      }`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {STATUT_BADGE[v.statut].icon}
                    </span>
                    <span className="font-semibold text-on-surface">{v.departement}</span>
                    <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-lg ${
                      v.statut === "validee"
                        ? "bg-green-100 text-green-700"
                        : v.statut === "rejetee"
                        ? "bg-red-100 text-red-700"
                        : "bg-orange-100 text-orange-700"
                    }`}>
                      {STATUT_BADGE[v.statut].label}
                    </span>
                  </div>

                  {v.chef_nom && (
                    <div className="text-xs text-on-surface-variant flex items-center gap-1 mt-1 pl-6">
                      <span className="material-symbols-outlined text-xs">person</span>
                      {v.chef_nom}
                    </div>
                  )}

                  {v.validated_at && v.statut !== "en_attente" && (
                    <div className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5 pl-6">
                      <span className="material-symbols-outlined text-xs">event</span>
                      {new Date(v.validated_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  )}

                  {v.statut === "rejetee" && v.motif && (
                    <div className="mt-2 pl-6 text-xs text-red-700 bg-red-100 rounded-lg px-3 py-2">
                      <span className="font-semibold">Motif : </span>{v.motif}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {annonce.statut === "validee" && (
          <div className="px-6 pb-6">
            <Link
              to="/entreprise/gestion-candidats"
              state={{ annonceId: annonce.id }}
              onClick={onClose}
              className="btn-primary w-full justify-center"
            >
              <span className="material-symbols-outlined text-xl">people</span>
              Voir les candidats
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MesOffres() {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("toutes");
  const [selectedAnnonce, setSelectedAnnonce] = useState<Annonce | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAnnonces = useCallback(() => {
    api.getMesAnnonces().then(setAnnonces).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAnnonces();
    intervalRef.current = setInterval(fetchAnnonces, 30_000);

    const onFocus = () => fetchAnnonces();
    window.addEventListener("focus", onFocus);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchAnnonces]);

  const filtered = annonces.filter((a) => filter === "toutes" || a.statut === filter);
  const stats = {
    total: annonces.length,
    en_attente: annonces.filter((a) => a.statut === "en_attente").length,
    validee: annonces.filter((a) => a.statut === "validee").length,
    rejetee: annonces.filter((a) => a.statut === "rejetee").length,
  };

  return (
    <main className="min-h-screen flex flex-col">
      {selectedAnnonce && (
        <OffreModal annonce={selectedAnnonce} onClose={() => setSelectedAnnonce(null)} />
      )}

      <div className="px-4 sm:px-6 lg:px-10 pt-6 lg:pt-8 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-headline font-extrabold text-2xl lg:text-3xl text-on-surface mb-1">Mes offres</h1>
            <p className="text-on-surface-variant text-sm">Statut de validation par département</p>
          </div>
          <Link to="/entreprise/publier-offre" className="btn-primary sm:w-auto w-full justify-center">
            <span className="material-symbols-outlined text-xl">add</span>
            Nouvelle offre
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 sm:px-6 lg:px-10 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
        {[
          { label: "Total", value: stats.total, cls: "bg-gradient-to-br from-primary to-secondary text-white", i: 0 },
          { label: "En attente", value: stats.en_attente, cls: "bg-surface-container-low border border-outline-variant", i: 1 },
          { label: "Validées", value: stats.validee, cls: "bg-surface-container-low border border-outline-variant", i: 2 },
          { label: "Rejetées", value: stats.rejetee, cls: "bg-surface-container-low border border-outline-variant", i: 3 },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-5 ${s.cls}`}>
            <div className={`font-headline font-extrabold text-4xl mb-1 ${s.i === 0 ? "" : "text-on-surface"}`}>
              {loading ? "—" : s.value}
            </div>
            <div className={`text-sm font-medium ${s.i === 0 ? "text-white/80" : "text-on-surface-variant"}`}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="px-4 sm:px-6 lg:px-10 mb-4">
        <div className="flex bg-surface-container rounded-xl p-1 w-full sm:w-fit gap-1 overflow-x-auto">
          {(["toutes", "en_attente", "validee", "rejetee"] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f ? "bg-white shadow-sm text-on-surface" : "text-on-surface-variant hover:text-on-surface"
              }`}>
              {f === "toutes" ? "Toutes" : f === "en_attente" ? "En attente" : f === "validee" ? "Validées" : "Rejetées"}
              {f !== "toutes" && <span className="ml-1.5 text-xs">({stats[f]})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-4 sm:px-6 lg:px-10 pb-10 flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="material-symbols-outlined animate-spin text-3xl text-on-surface-variant">progress_activity</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-3">work_off</span>
            <p className="font-semibold text-on-surface mb-4">Aucune offre</p>
            <Link to="/entreprise/publier-offre" className="btn-primary">
              <span className="material-symbols-outlined text-xl">add</span>
              Publier une offre
            </Link>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl">
            {filtered.map((a) => {
              const vds = a.validations_dept ?? [];
              const nbValides = vds.filter((v) => v.statut === "validee").length;
              const nbAttente = vds.filter((v) => v.statut === "en_attente").length;
              const nbRefus = vds.filter((v) => v.statut === "rejetee").length;

              return (
                <button
                  key={a.id}
                  onClick={() => setSelectedAnnonce(a)}
                  className="w-full text-left bg-surface-container-low rounded-2xl border border-outline-variant p-4 sm:p-6 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-on-surface text-lg mb-1">{a.titre}</h3>
                      <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                        {a.duree_mois && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            {a.duree_mois} mois
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">calendar_today</span>
                          {new Date(a.created_at).toLocaleDateString("fr-FR")}
                        </span>
                        {vds.length > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">business</span>
                            {vds.length} département{vds.length > 1 ? "s" : ""} ciblé{vds.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                      {nbValides > 0 && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-green-50 text-green-600 border border-green-200">
                          {nbValides} validé{nbValides > 1 ? "s" : ""}
                        </span>
                      )}
                      {nbAttente > 0 && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 border border-orange-200">
                          {nbAttente} en attente
                        </span>
                      )}
                      {nbRefus > 0 && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-200">
                          {nbRefus} refusé{nbRefus > 1 ? "s" : ""}
                        </span>
                      )}
                      <span className="material-symbols-outlined text-on-surface-variant text-base">chevron_right</span>
                    </div>
                  </div>

                  {/* Per-department status grid */}
                  {vds.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {vds.map((v) => <DeptValidationBadge key={v.departement} v={v} />)}
                    </div>
                  ) : (
                    <div className={`flex items-start gap-2 p-3 rounded-xl text-xs border ${
                      a.statut === "validee"
                        ? "bg-green-50 border-green-200 text-green-700"
                        : a.statut === "rejetee"
                        ? "bg-red-50 border-red-200 text-red-700"
                        : "bg-orange-50 border-orange-200 text-orange-700"
                    }`}>
                      <span className="material-symbols-outlined text-sm mt-0.5">info</span>
                      <span>
                        {a.statut === "en_attente" && "En attente de validation par le chef de département."}
                        {a.statut === "validee" && "Offre validée et visible par les étudiants."}
                        {a.statut === "rejetee" && (a.motif ? `Rejetée : ${a.motif}` : "Offre rejetée.")}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
