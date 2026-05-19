/** Structure officielle des départements et filières de l'ENSMR */

export interface DepartementENSMR {
  nom: string;
  code: string;
  filieres: string[];
}

export const ENSMR_DEPARTEMENTS: DepartementENSMR[] = [
  {
    nom: "Département Informatique",
    code: "INFO",
    filieres: [
      "Génie Informatique (GI)",
      "Génie Productique (GP)",
    ],
  },
  {
    nom: "Département Génie des Matériaux",
    code: "MAT",
    filieres: [
      "Matériaux et Contrôle Qualité (MCQ)",
    ],
  },
  {
    nom: "Département Électromécanique",
    code: "EM",
    filieres: [
      "Électromécanique",
      "Maintenance Industrielle",
      "Efficacité Énergétique et Énergies Renouvelables (3ER)",
    ],
  },
  {
    nom: "Département Génie Industriel",
    code: "GI",
    filieres: [
      "Management Industriel (MGI)",
      "Management Financier (MGF)",
    ],
  },
  {
    nom: "Département Génie des Procédés Industriels",
    code: "GPI",
    filieres: [
      "Ingénierie des Procédés Industriels (IPI)",
      "Génie Énergétique (GE)",
    ],
  },
  {
    nom: "Département Sciences de la Terre",
    code: "ST",
    filieres: [
      "GCM - Routes et Ouvrages Hydrauliques",
      "GCM - Génie des Constructions",
      "GCM - Génie Minier",
    ],
  },
  {
    nom: "Département Mines",
    code: "MINES",
    filieres: [
      "Aménagement et Exploitation du Sol et Sous-Sol (AESSS)",
      "Environnement et Sécurité Industriels (ESI)",
    ],
  },
];

/** Liste plate des noms de départements */
export const NOMS_DEPARTEMENTS: string[] = ENSMR_DEPARTEMENTS.map((d) => d.nom);

/** Toutes les filières */
export const TOUTES_FILIERES: string[] = ENSMR_DEPARTEMENTS.flatMap((d) => d.filieres);

/** Filière → département */
export const FILIERE_TO_DEPARTEMENT: Record<string, string> = Object.fromEntries(
  ENSMR_DEPARTEMENTS.flatMap((d) => d.filieres.map((f) => [f, d.nom]))
);

/** Département → ses filières */
export const DEPT_TO_FILIERES: Record<string, string[]> = Object.fromEntries(
  ENSMR_DEPARTEMENTS.map((d) => [d.nom, d.filieres])
);
