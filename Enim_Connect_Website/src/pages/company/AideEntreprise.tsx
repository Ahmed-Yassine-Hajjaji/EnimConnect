const FAQ = [
  {
    q: "Comment soumettre une offre de stage ?",
    a: `Votre compte doit d'abord être validé par le club EnimConnect. Une fois validé, accédez à "Publier une offre" dans le menu latéral. Renseignez le titre, la description, la durée et les départements ENSMR ciblés. L'offre est soumise à validation avant d'être visible par les étudiants.`,
    icon: "business_center",
  },
  {
    q: "Comment fonctionne la validation par département ?",
    a: "Chaque chef de département reçoit un email contenant un lien sécurisé (valide 48h). En cliquant sur ce lien, il accède à une page de décision où il peut valider ou rejeter l'offre pour son département, avec la possibilité d'indiquer un motif de refus. La validation est indépendante pour chaque département ciblé.",
    icon: "mark_email_read",
  },
  {
    q: "Mon offre est validée pour un département mais rejetée pour un autre — que se passe-t-il ?",
    a: "La validation est par département : une offre peut être validée pour le Département Informatique et encore en attente ou rejetée pour le Génie Industriel. Les étudiants de chaque département voient uniquement les offres validées par leur chef. Vous êtes notifié par email à chaque décision.",
    icon: "account_tree",
  },
  {
    q: "Comment suivre l'état de mes offres ?",
    a: "Accédez à \"Mes offres\" dans le menu latéral. Chaque carte est cliquable et affiche le détail de la validation par département : statut, chef concerné, date de décision et motif de refus si applicable. Les données se rafraîchissent automatiquement toutes les 30 secondes.",
    icon: "work",
  },
  {
    q: "Comment accéder aux candidatures reçues ?",
    a: "Dans \"Gestion candidats\", vous retrouvez tous les étudiants ayant postulé à vos offres validées. Vous pouvez consulter leur profil et leur CV (protégé, accessible uniquement aux entreprises validées).",
    icon: "people",
  },
  {
    q: "Mon compte est en attente de validation — que faire ?",
    a: "Après inscription, votre compte est examiné par le club EnimConnect avant d'être activé. Ce processus peut prendre quelques heures. Vous recevrez une notification une fois votre compte validé. En cas de délai, contactez directement le club.",
    icon: "hourglass_top",
  },
  {
    q: "Comment contacter le support ?",
    a: "Pour toute question, contactez le club EnimConnect directement via la section Notifications ou par email à l'adresse disponible sur le site de l'ENSMR.",
    icon: "support_agent",
  },
];

export default function AideEntreprise() {
  return (
    <main className="min-h-screen px-10 pt-8 pb-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <h1 className="font-headline font-extrabold text-3xl text-on-surface mb-2">Centre d'aide</h1>
          <p className="text-on-surface-variant">Tout ce que vous devez savoir en tant qu'entreprise partenaire sur EnimConnect</p>
        </div>

        {/* Hero info */}
        <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent border border-primary/20 rounded-2xl p-6 mb-8 flex items-start gap-4">
          <span className="material-symbols-outlined text-primary text-3xl mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
          <div>
            <div className="font-headline font-bold text-on-surface mb-1">Recruiter Portal — EnimConnect</div>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Publiez vos offres de stage et accédez aux profils des étudiants de l'École Nationale Supérieure des Mines de Rabat.
              Chaque offre est validée par le chef du département ciblé avant d'être visible par les étudiants.
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
