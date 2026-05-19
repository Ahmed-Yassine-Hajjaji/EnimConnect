const FAQ = [
  {
    q: "Comment voir les offres de stage disponibles ?",
    a: "Accédez à la section \"Recherche de stages\" dans le menu. Vous ne verrez que les offres validées spécifiquement par le chef de VOTRE département. Pour un filtrage optimal, renseignez votre département et votre filière dans votre profil.",
    icon: "search",
  },
  {
    q: "Comment fonctionne le matching IA ?",
    a: "Lorsque vous uploadez votre CV, une analyse IA en extrait les compétences, projets et langues. Chaque offre validée est également analysée. Le système calcule une similarité entre votre profil et les offres disponibles, et les trie du plus pertinent au moins pertinent. Les scores ne sont jamais affichés — seul l'ordre change.",
    icon: "auto_awesome",
  },
  {
    q: "Pourquoi mon CV doit-il être analysé par une IA ?",
    a: "L'analyse IA (OpenAI GPT-4o-mini) extrait une description structurée de votre CV qui est ensuite convertie en vecteur mathématique (embedding). Ce vecteur permet de comparer automatiquement votre profil avec les offres disponibles et de vous présenter les plus adaptées en premier. Vous devez consentir à cette analyse lors de l'upload.",
    icon: "privacy_tip",
  },
  {
    q: "Comment postuler à une offre ?",
    a: "Depuis la page \"Recherche de stages\", cliquez sur une offre pour en voir les détails, puis cliquez sur \"Postuler\". Votre CV sera transmis à l'entreprise. Vous pouvez suivre l'état de vos candidatures dans la section \"Mes candidatures\".",
    icon: "send",
  },
  {
    q: "Comment mettre à jour mon profil et mon CV ?",
    a: "Accédez à \"Mon profil\" dans le menu latéral. Vous pouvez modifier vos informations personnelles, mettre à jour votre photo et uploader un nouveau CV PDF. Après chaque upload de CV, l'analyse IA est relancée automatiquement en arrière-plan.",
    icon: "manage_accounts",
  },
  {
    q: "Je ne vois aucune offre — pourquoi ?",
    a: "Deux raisons possibles : (1) Votre département n'est pas renseigné dans votre profil — complétez-le pour voir les offres adaptées. (2) Aucune offre n'a encore été validée pour votre département par le chef concerné. Revenez régulièrement, de nouvelles offres sont ajoutées en continu.",
    icon: "info",
  },
  {
    q: "Comment contacter le support ?",
    a: "Pour toute question, contactez le club EnimConnect directement via la section Notifications ou directement auprès de l'administration de l'ENSMR.",
    icon: "support_agent",
  },
];

export default function AideEtudiant() {
  return (
    <main className="min-h-screen px-10 pt-8 pb-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <h1 className="font-headline font-extrabold text-3xl text-on-surface mb-2">Centre d'aide</h1>
          <p className="text-on-surface-variant">Tout ce que vous devez savoir en tant qu'étudiant sur EnimConnect</p>
        </div>

        {/* Hero info */}
        <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent border border-primary/20 rounded-2xl p-6 mb-8 flex items-start gap-4">
          <span className="material-symbols-outlined text-primary text-3xl mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
          <div>
            <div className="font-headline font-bold text-on-surface mb-1">Espace Étudiant — EnimConnect</div>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Trouvez votre stage de fin d'études grâce au matching IA. Uploadez votre CV, complétez votre profil,
              et les offres les plus adaptées à vos compétences et à votre département remontent automatiquement.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="space-y-4">
          {FAQ.map((item, i) => (
            <div key={i} className="bg-surface-container-low rounded-2xl border border-outline-variant p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                </div>
                <div>
                  <h2 className="font-headline font-bold text-on-surface mb-2">{item.q}</h2>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{item.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-8 p-5 bg-surface-container rounded-2xl border border-outline-variant text-center">
          <span className="material-symbols-outlined text-on-surface-variant text-2xl mb-2 block">contact_support</span>
          <p className="text-sm text-on-surface-variant">
            Vous n'avez pas trouvé la réponse à votre question ?<br />
            Contactez le club EnimConnect via la section Notifications ou directement auprès de l'administration de l'ENSMR.
          </p>
        </div>
      </div>
    </main>
  );
}
