import { useEffect, useState } from "react";
import { api } from "../../api/client";

interface StatsEtudiants {
  total: number;
  avec_cv: number;
  sans_cv: number;
  par_departement: Record<string, number>;
  par_niveau: Record<string, number>;
}

interface StatsGlobales {
  entreprises: { total: number; validees: number; en_attente: number };
  annonces: { total: number; en_attente: number; validees: number; rejetees: number };
  candidatures: { total: number };
}

const DEPT_COLORS: Record<string, string> = {
  "Département Informatique": "bg-blue-500",
  "Département Génie des Matériaux": "bg-yellow-500",
  "Département Électromécanique": "bg-orange-500",
  "Département Génie Industriel": "bg-purple-500",
  "Département Génie des Procédés Industriels": "bg-teal-500",
  "Département Sciences de la Terre": "bg-stone-500",
  "Département Mines": "bg-red-500",
};


export default function StatistiquesScolarite() {
  const [statsEt, setStatsEt] = useState<StatsEtudiants | null>(null);
  const [statsGlob, setStatsGlob] = useState<StatsGlobales | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getStatsEtudiants() as Promise<StatsEtudiants>,
      api.getStats() as Promise<StatsGlobales>,
    ])
      .then(([se, sg]) => { setStatsEt(se); setStatsGlob(sg); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const deptEntries = statsEt ? Object.entries(statsEt.par_departement).sort((a, b) => b[1] - a[1]) : [];
  const maxDept = deptEntries[0]?.[1] ?? 1;

  return (
    <main className="min-h-screen pb-12 px-10 pt-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-headline font-extrabold text-3xl text-on-surface mb-1">
            Statistiques
          </h1>
          <p className="text-on-surface-variant">Tableau de bord du service de scolarité EnimConnect</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-xl">
          <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
          <span className="text-sm font-medium text-primary">Service de scolarité</span>
        </div>
      </div>

      {/* Platform KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Étudiants inscrits", value: statsEt?.total, icon: "school", color: "from-primary to-secondary", white: true },
          { label: "Entreprises validées", value: statsGlob?.entreprises.validees, icon: "business", color: "bg-surface-container-low border border-outline-variant", white: false },
          { label: "Offres publiées", value: statsGlob?.annonces.validees, icon: "work", color: "bg-surface-container-low border border-outline-variant", white: false },
          { label: "Candidatures totales", value: statsGlob?.candidatures.total, icon: "assignment", color: "bg-surface-container-low border border-outline-variant", white: false },
        ].map((s, i) => (
          <div key={s.label} className={`rounded-2xl p-5 ${i === 0 ? `bg-gradient-to-br ${s.color}` : s.color}`}>
            <span
              className={`material-symbols-outlined text-2xl mb-2 block ${i === 0 ? "text-white/80" : "text-on-surface-variant"}`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {s.icon}
            </span>
            <div className={`font-headline font-extrabold text-4xl mb-1 ${i === 0 ? "text-white" : "text-on-surface"}`}>
              {loading ? "—" : (s.value ?? "—")}
            </div>
            <div className={`text-sm font-medium ${i === 0 ? "text-white/80" : "text-on-surface-variant"}`}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Par département */}
        <div className="col-span-2 bg-surface-container-low rounded-2xl border border-outline-variant p-6">
          <h2 className="font-headline font-bold text-lg text-on-surface mb-5">Étudiants par département</h2>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <span className="material-symbols-outlined animate-spin text-2xl text-on-surface-variant">progress_activity</span>
            </div>
          ) : deptEntries.length === 0 ? (
            <p className="text-sm text-on-surface-variant text-center py-8">Aucune donnée disponible.</p>
          ) : (
            <div className="space-y-3">
              {deptEntries.map(([dept, count]) => (
                <div key={dept}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-on-surface">{dept}</span>
                    <span className="text-sm font-bold text-on-surface">{count}</span>
                  </div>
                  <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${DEPT_COLORS[dept] ?? "bg-primary"} transition-all`}
                      style={{ width: `${(count / maxDept) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Par niveau + CV */}
        <div className="space-y-4">
          <div className="bg-surface-container-low rounded-2xl border border-outline-variant p-5">
            <h2 className="font-headline font-bold text-base text-on-surface mb-4">Par année</h2>
            {loading ? (
              <div className="text-center text-on-surface-variant text-sm py-4">Chargement…</div>
            ) : (
              <div className="space-y-2">
                {Object.entries(statsEt?.par_niveau ?? {}).map(([niv, count]) => (
                  <div key={niv} className="flex items-center justify-between">
                    <span className="text-sm text-on-surface-variant">{niv}</span>
                    <span className="text-sm font-bold text-on-surface px-2 py-0.5 bg-primary/10 text-primary rounded-lg">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-surface-container-low rounded-2xl border border-outline-variant p-5">
            <h2 className="font-headline font-bold text-base text-on-surface mb-4">Couverture CV</h2>
            {loading || !statsEt ? (
              <div className="text-center text-on-surface-variant text-sm py-4">Chargement…</div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 h-3 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-3 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all"
                      style={{ width: `${statsEt.total ? (statsEt.avec_cv / statsEt.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-green-600">
                    {statsEt.total ? Math.round((statsEt.avec_cv / statsEt.total) * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                    {statsEt.avec_cv} avec CV
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-surface-container inline-block border border-outline-variant"></span>
                    {statsEt.sans_cv} sans CV
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

    </main>
  );
}
