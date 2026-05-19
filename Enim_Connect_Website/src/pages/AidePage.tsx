const FAQ = [
  {
    q: "Comment soumettre une offre de stage (entreprise) ?",
    a: `Votre compte doit d'abord être validé par le club EnimConnect. Une fois validé, accédez à "Publier une offre" dans le menu latéral. Renseignez le titre, la description, la durée et les départements ENSMR ciblés. L'offre est soumise à validation avant d'être visible par les étudiants.`,
    icon: "business_center",
  },
  {
    q: "Comment fonctionne la validation par département ?",
    a: "Chaque chef de département reçoit un email contenant un lien sécurisé (valide 48h). En cliquant sur ce lien, il accède à une page de décision où il peut valider ou rejeter l'offre pour son département, avec la possibilité d'indiquer un motif de refus. La validation est indépendante pour chaque département ciblé.",
    icon: "mark_email_read",
  },
  {
    q: "Quelles offres les étudiants peuvent-ils voir ?",
    a: "Un étudiant ne voit que les offres validées spécifiquement par le chef de SON département. Si vous avez renseigné votre filière dans votre profil, le système filtre automatiquement les offres adaptées à votre département. Complétez votre profil pour voir les offres pertinentes.",
    icon: "school",
  },
  {
    q: "Comment fonctionne le matching IA ?",
    a: "Lorsque vous uploadez votre CV (étudiant), une analyse IA en extrait les compétences, projets et langues. Chaque offre validée est également analysée. Le système calcule une similarité entre votre profil et les offres disponibles, et les trie du plus pertinent au moins pertinent. Les scores de similarité ne sont jamais affichés — seul l'ordre change.",
    icon: "auto_awesome",
  },
  {
    q: "Pourquoi mon CV doit-il être analysé par une IA ?",
    a: "L'analyse IA (OpenAI GPT-4o-mini) extrait une description structurée de votre CV qui est ensuite convertie en vecteur mathématique (embedding). Ce vecteur permet de comparer automatiquement votre profil avec les offres disponibles et de vous présenter les plus adaptées en premier. Vous devez consentir à cette analyse lors de l'upload.",
    icon: "privacy_tip",
  },
  {
    q: "Mon offre est validée pour un département mais rejetée pour un autre — que se passe-t-il ?",
    a: "La validation est par département : une offre peut être validée pour le Département Informatique et encore en attente ou rejetée pour le Génie Industriel. Les étudiants de chaque département voient uniquement les offres validées par leur chef. Vous êtes notifié par email à chaque décision.",
    icon: "account_tree",
  },
  {
    q: "Comment contacter le support ?",
    a: "Pour toute question, contactez le club EnimConnect directement via la plateforme (notifications) ou par email à l'adresse disponible sur le site de l'ENSMR.",
    icon: "support_agent",
  },
];

export default function AidePage() {
  return (
    <main className="min-h-screen px-10 pt-8 pb-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <h1 className="font-headline font-extrabold text-3xl text-on-surface mb-2">Centre d'aide</h1>
          <p className="text-on-surface-variant">Tout ce que vous devez savoir sur EnimConnect</p>
        </div>

        {/* Hero info */}
        <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent border border-primary/20 rounded-2xl p-6 mb-8 flex items-start gap-4">
          <span className="material-symbols-outlined text-primary text-3xl mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
          <div>
            <div className="font-headline font-bold text-on-surface mb-1">EnimConnect — Plateforme de stages ENSMR</div>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Plateforme de mise en relation entre les étudiants de l'École Nationale Supérieure des Mines de Rabat et les entreprises partenaires.
              Le matching IA analyse automatiquement les CVs et les offres pour vous présenter les opportunités les plus pertinentes.
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
