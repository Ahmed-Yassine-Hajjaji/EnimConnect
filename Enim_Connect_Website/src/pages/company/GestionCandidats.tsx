import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { api, type Annonce, type Candidat } from "../../api/client";
import OfferList from "../../components/OfferList";
import CandidateList from "../../components/CandidateList";
import CandidateDetail from "../../components/CandidateDetail";

export default function GestionCandidats() {
  const location = useLocation();

  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [annoncesLoading, setAnnoncesLoading] = useState(true);

  const [selectedAnnonceId, setSelectedAnnonceId] = useState<string | null>(
    (location.state as { annonceId?: string } | null)?.annonceId ?? null
  );
  const [candidats, setCandidats] = useState<Candidat[]>([]);
  const [candidatsLoading, setCandidatsLoading] = useState(false);

  const [selectedCandidat, setSelectedCandidat] = useState<Candidat | null>(null);

  // Load offers on mount
  useEffect(() => {
    api.getMesAnnonces()
      .then((data) => {
        setAnnonces(data);
        // Auto-select first active offer if none preselected
        if (!selectedAnnonceId) {
          const first = data.find((a) => a.statut === "validee");
          if (first) setSelectedAnnonceId(first.id);
        }
      })
      .catch(console.error)
      .finally(() => setAnnoncesLoading(false));
  }, []);

  // Load candidats when offer selected
  useEffect(() => {
    if (!selectedAnnonceId) { setCandidats([]); return; }
    setCandidatsLoading(true);
    setSelectedCandidat(null);
    api.getCandidatures(selectedAnnonceId)
      .then(setCandidats)
      .catch(console.error)
      .finally(() => setCandidatsLoading(false));
  }, [selectedAnnonceId]);

  const selectedAnnonce = annonces.find((a) => a.id === selectedAnnonceId) ?? null;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      <OfferList
        annonces={annonces}
        selectedId={selectedAnnonceId}
        onSelect={(id) => setSelectedAnnonceId(id)}
        loading={annoncesLoading}
      />
      <CandidateList
        annonce={selectedAnnonce}
        candidats={candidats}
        selectedId={selectedCandidat?.etudiant_id ?? null}
        onSelect={setSelectedCandidat}
        loading={candidatsLoading}
      />
      <CandidateDetail
        candidat={selectedCandidat}
      />
    </div>
  );
}
