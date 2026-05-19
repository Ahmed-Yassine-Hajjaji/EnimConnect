import { type Annonce } from "../api/client";

interface Props {
  annonces: Annonce[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
}

const STATUT_DOT: Record<string, string> = {
  en_attente: "bg-orange-400",
  validee: "bg-green-500",
  rejetee: "bg-red-400",
};

export default function OfferList({ annonces, selectedId, onSelect, loading }: Props) {
  return (
    <div className="w-80 bg-surface-container-low border-r border-outline-variant overflow-y-auto flex-shrink-0">
      <div className="p-5 border-b border-outline-variant">
        <h3 className="font-headline text-sm font-extrabold uppercase tracking-widest text-on-surface-variant/70">
          Mes offres ({annonces.length})
        </h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="material-symbols-outlined text-3xl animate-spin text-on-surface-variant">progress_activity</span>
        </div>
      ) : annonces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">work_off</span>
          <p className="text-sm text-on-surface-variant">Aucune offre publiée</p>
        </div>
      ) : (
        <div className="p-3 space-y-2">
          {annonces.map((a) => (
            <button
              key={a.id}
              onClick={() => onSelect(a.id)}
              className={`w-full text-left p-4 rounded-xl transition-all ${
                selectedId === a.id
                  ? "bg-primary/10 border-l-4 border-primary shadow-sm"
                  : "hover:bg-surface-container border-l-4 border-transparent"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className={`font-semibold text-sm leading-tight line-clamp-2 ${
                  selectedId === a.id ? "text-primary" : "text-on-surface"
                }`}>
                  {a.titre}
                </h4>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${STATUT_DOT[a.statut]}`} />
              </div>
              <p className="text-xs text-on-surface-variant">{a.departement}</p>
              {a.duree_mois && (
                <p className="text-xs text-on-surface-variant mt-0.5">{a.duree_mois} mois</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
