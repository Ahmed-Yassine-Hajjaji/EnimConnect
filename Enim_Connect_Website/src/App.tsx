import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Layouts
import StudentLayout from "./components/layout/StudentLayout";
import CompanyLayout from "./components/layout/CompanyLayout";
import AdminLayout from "./components/layout/AdminLayout";

// Auth
import LoginPage from "./pages/auth/LoginPage";

// Student Pages
import DashboardEtudiant from "./pages/student/DashboardEtudiant";
import RechercheStages from "./pages/student/RechercheStages";
import MesCandidatures from "./pages/student/MesCandidatures";
import ProfilCandidat from "./pages/student/ProfilCandidat";
import DetailsOffre from "./pages/student/DetailsOffre";

// Company Pages
import DashboardEntreprise from "./pages/company/DashboardEntreprise";
import PublierOffre from "./pages/company/PublierOffre";
import CandidatsFavoris from "./pages/company/CandidatsFavoris";
import GestionCandidats from "./pages/company/GestionCandidats";
import MesOffres from "./pages/company/MesOffres";
import ProfilEntreprise from "./pages/company/ProfilEntreprise";

// Admin Pages
import InterfaceAdministration from "./pages/admin/InterfaceAdministration";
import OffresAdmin from "./pages/admin/OffresAdmin";
import EntreprisesValidation from "./pages/admin/EntreprisesValidation";
import CreerEntreprise from "./pages/admin/CreerEntreprise";
import DatabaseEtudiants from "./pages/admin/DatabaseEtudiants";
import StatistiquesScolarite from "./pages/admin/StatistiquesScolarite";
import DecisionPage from "./pages/DecisionPage";
import AidePage from "./pages/AidePage";
import AideEtudiant from "./pages/student/AideEtudiant";
import AideEntreprise from "./pages/company/AideEntreprise";

export default function App() {
  return (
    <div className="bg-surface font-body text-on-surface antialiased flex flex-col min-h-screen">
      <BrowserRouter>
        <Routes>
          {/* Auth Route */}
          <Route path="/" element={<LoginPage />} />

          {/* Page de décision chef — standalone, sans auth */}
          <Route path="/decision/:validation_id" element={<DecisionPage />} />

          {/* Student Routes */}
          <Route path="/etudiant" element={<StudentLayout />}>
            <Route path="tableau-de-bord" element={<DashboardEtudiant />} />
            <Route path="recherche" element={<RechercheStages />} />
            <Route path="candidatures" element={<MesCandidatures />} />
            <Route path="profil/:id" element={<ProfilCandidat />} />
            <Route path="offre/:id" element={<DetailsOffre />} />
            <Route path="aide" element={<AideEtudiant />} />
            <Route index element={<Navigate to="tableau-de-bord" replace />} />
          </Route>

          {/* Company Routes */}
          <Route path="/entreprise" element={<CompanyLayout />}>
            <Route path="tableau-de-bord" element={<DashboardEntreprise />} />
            <Route path="publier-offre" element={<PublierOffre />} />
            <Route path="candidats-favoris" element={<CandidatsFavoris />} />
            <Route path="gestion-candidats" element={<GestionCandidats />} />
            <Route path="mes-offres" element={<MesOffres />} />
            <Route path="profil" element={<ProfilEntreprise />} />
            <Route path="aide" element={<AideEntreprise />} />
            <Route index element={<Navigate to="tableau-de-bord" replace />} />
          </Route>

          {/* Club/Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="interface" element={<InterfaceAdministration />} />
            <Route path="offres" element={<OffresAdmin />} />
            <Route path="entreprises" element={<EntreprisesValidation />} />
            <Route path="creer-entreprise" element={<CreerEntreprise />} />
            <Route path="etudiants" element={<DatabaseEtudiants />} />
            <Route path="statistiques" element={<StatistiquesScolarite />} />
            <Route path="aide" element={<AidePage />} />
            <Route index element={<Navigate to="interface" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}
