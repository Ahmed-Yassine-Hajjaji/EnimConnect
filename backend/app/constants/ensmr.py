"""Structure officielle des départements et filières de l'ENSMR (École Nationale Supérieure des Mines de Rabat)."""

# Dictionnaire : département → liste des filières
ENSMR_DEPARTEMENTS: dict[str, list[str]] = {
    "Département Informatique": [
        "Génie Informatique (GI)",
        "Génie Productique (GP)",
    ],
    "Département Génie des Matériaux": [
        "Matériaux et Contrôle Qualité (MCQ)",
    ],
    "Département Électromécanique": [
        "Électromécanique",
        "Maintenance Industrielle",
        "Efficacité Énergétique et Énergies Renouvelables (3ER)",
    ],
    "Département Génie Industriel": [
        "Management Industriel (MGI)",
        "Management Financier (MGF)",
    ],
    "Département Génie des Procédés Industriels": [
        "Ingénierie des Procédés Industriels (IPI)",
        "Génie Énergétique (GE)",
    ],
    "Département Sciences de la Terre": [
        "GCM - Routes et Ouvrages Hydrauliques",
        "GCM - Génie des Constructions",
        "GCM - Génie Minier",
    ],
    "Département Mines": [
        "Aménagement et Exploitation du Sol et Sous-Sol (AESSS)",
        "Environnement et Sécurité Industriels (ESI)",
    ],
}

# Liste plate des noms de départements
TOUS_LES_DEPARTEMENTS: list[str] = list(ENSMR_DEPARTEMENTS.keys())

# Toutes les filières, toutes sections confondues
TOUTES_LES_FILIERES: list[str] = [
    filiere
    for filieres in ENSMR_DEPARTEMENTS.values()
    for filiere in filieres
]

# Filière → département parent
FILIERE_TO_DEPARTEMENT: dict[str, str] = {
    filiere: dept
    for dept, filieres in ENSMR_DEPARTEMENTS.items()
    for filiere in filieres
}
