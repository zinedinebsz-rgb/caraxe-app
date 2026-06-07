import { c, f, size, sp, radius, shadow } from '../lib/theme'

export default function CGV() {
  const sections = [
    {
      title: "1. Objet et champ d'application",
      content: "Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles entre CARAXES, micro-entreprise (entrepreneur individuel), et tout client, professionnel ou consommateur, souscrivant à ses services d'agent de sourcing et d'achat en Chine. Toute commande implique l'acceptation pleine et entière des présentes CGV.",
      list: [
        "Recherche et identification de fournisseurs en Chine",
        "Contrôle de qualité et audits fournisseurs",
        "Négociation de prix et délais",
        "Gestion logistique et expédition",
      ]
    },
    {
      title: "2. Identité du vendeur",
      content: "Le service est édité par : [Prénom NOM — à compléter], entrepreneur individuel exerçant sous le nom commercial CARAXES — Adresse : [Adresse complète — à compléter] — Email : contact@caraxes.fr — Téléphone : [Téléphone — à compléter] — SIRET : [à compléter après immatriculation]."
    },
    {
      title: "3. Prix",
      content: "Les prix des services sont établis sur devis individuel, en euros et toutes taxes comprises (TTC). Mention TVA : « TVA non applicable, art. 293 B du CGI » (franchise en base de TVA). Aucun service n'est fourni sans devis préalablement accepté par le client. Les éventuels frais de livraison, droits de douane et taxes d'importation sont indiqués séparément avant la conclusion du contrat."
    },
    {
      title: "4. Commande et paiement",
      content: "La commande est réputée ferme après acceptation du devis et règlement selon les modalités convenues. Le paiement s'effectue de manière sécurisée via la plateforme Stripe.",
      list: [
        "Moyens acceptés : cartes bancaires (Visa, Mastercard)",
        "Le paiement est exigible avant le début de la prestation, sauf accord écrit contraire",
        "Une facture est émise et mise à disposition dans l'espace client",
      ]
    },
    {
      title: "5. Droit de rétractation (consommateurs)",
      content: "Conformément à l'article L.221-18 du Code de la consommation, le client consommateur dispose d'un délai de quatorze (14) jours à compter de la conclusion du contrat pour exercer son droit de rétractation, sans avoir à motiver sa décision. Pour l'exercer, il notifie sa décision par déclaration dénuée d'ambiguïté (courrier ou email à contact@caraxes.fr), ou via le formulaire type ci-dessous.",
      list: [
        "Formulaire type — À l'attention de CARAXES, [Adresse], contact@caraxes.fr :",
        "« Je vous notifie par la présente ma rétractation du contrat portant sur la prestation de services ci-dessous : commandée le […] / reçue le […] — Nom du consommateur — Adresse — Date — Signature (si papier). »",
      ],
      note: "Exception (art. L.221-28) : le client peut demander l'exécution du service avant la fin du délai de 14 jours. S'il le fait expressément et que le service est pleinement exécuté avant la fin du délai, il renonce à son droit de rétractation. Si le service est partiellement exécuté, un montant proportionnel reste dû en cas de rétractation."
    },
    {
      title: "6. Garanties légales",
      content: "Indépendamment de toute garantie commerciale, le client consommateur bénéficie des garanties légales suivantes :",
      list: [
        "Garantie légale de conformité (art. L.217-3 et suivants du Code de la consommation)",
        "Garantie contre les vices cachés (art. 1641 et suivants du Code civil)",
      ],
      note: "Pour mettre en œuvre ces garanties, le client contacte CARAXES à contact@caraxes.fr."
    },
    {
      title: "7. Délais et exécution",
      content: "CARAXES s'engage à respecter les délais convenus lors de l'acceptation du devis. Les délais courent à compter de la validation du paiement. En cas de retard imprévu, CARAXES en informe le client dans les meilleurs délais."
    },
    {
      title: "8. Limitation de responsabilité",
      content: "Dans les limites permises par la loi (et sans exclure la responsabilité en cas de manquement aux garanties légales ci-dessus), CARAXES ne saurait être tenu responsable :",
      list: [
        "Des évolutions de marché ou de disponibilité des fournisseurs en Chine",
        "Des modifications réglementaires douanières ou commerciales",
        "Des retards d'expédition dus à des facteurs externes (grèves portuaires, fermeture d'aéroport)",
        "Des défauts de produits non décelables lors du contrôle de qualité convenu",
      ],
      note: "Pour les clients professionnels, la responsabilité de CARAXES est limitée au montant de la prestation facturée."
    },
    {
      title: "9. Données personnelles",
      content: "Les données personnelles sont traitées conformément au RGPD et à notre Politique de Confidentialité accessible sur le site. Le client dispose de droits d'accès, de rectification, d'effacement et d'opposition qu'il peut exercer à contact@caraxes.fr."
    },
    {
      title: "10. Médiation de la consommation",
      content: "Conformément aux articles L.612-1 et suivants du Code de la consommation, le client consommateur peut recourir gratuitement à un médiateur de la consommation en vue de la résolution amiable d'un litige, après avoir tenté de le résoudre directement auprès de CARAXES.",
      list: [
        "Médiateur : [Nom du médiateur — à compléter après adhésion]",
        "Adresse : [Adresse du médiateur — à compléter]",
        "Site / saisine en ligne : [URL du médiateur — à compléter]",
        "Plateforme européenne de règlement en ligne des litiges (RLL) : https://ec.europa.eu/consumers/odr",
      ]
    },
    {
      title: "11. Droit applicable et litiges",
      content: "Les présentes CGV sont régies par le droit français. En cas de litige, une solution amiable sera recherchée en priorité. À défaut, le consommateur peut saisir à son choix l'une des juridictions territorialement compétentes au sens du Code de procédure civile, ou la juridiction du lieu où il demeurait au moment de la conclusion du contrat (art. R.631-3 du Code de la consommation). Pour les clients professionnels, compétence est attribuée aux tribunaux compétents du ressort du siège de CARAXES."
    },
    {
      title: "12. Propriété intellectuelle",
      content: "Les documents produits par CARAXES (rapports, analyses, devis) restent sa propriété. Le client est autorisé à les utiliser pour ses besoins propres mais ne peut les reproduire ou les commercialiser sans accord préalable écrit."
    },
    {
      title: "13. Modifications",
      content: "CARAXES se réserve le droit de modifier les présentes CGV. Les CGV applicables sont celles en vigueur à la date de la commande."
    }
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: c.bg,
      padding: sp[4],
      color: c.text,
      fontFamily: f.body,
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        {/* Header */}
        <div style={{
          marginBottom: sp[8],
          paddingBottom: sp[4],
          borderBottom: `1px solid ${c.border}`,
        }}>
          <h1 style={{
            fontFamily: f.display,
            fontSize: size['2xl'],
            fontWeight: 700,
            color: c.gold,
            margin: 0,
            marginBottom: sp[2],
            letterSpacing: '-0.02em',
          }}>
            Conditions Générales de Vente
          </h1>
          <p style={{
            fontSize: size.sm,
            color: c.textSecondary,
            margin: 0,
            lineHeight: 1.6,
          }}>
            Services de sourcing et agent d'achat en Chine
          </p>
        </div>

        {/* Sections */}
        {sections.map((section, idx) => (
          <div key={idx} style={{ marginBottom: sp[6], padding: sp[4], background: c.bgCard, borderRadius: radius.lg, boxShadow: shadow.card }}>
            <h2 style={{
              fontFamily: f.display,
              fontSize: size.lg,
              fontWeight: 700,
              color: c.gold,
              margin: `0 0 ${sp[3]} 0`,
              letterSpacing: '-0.01em',
            }}>
              {section.title}
            </h2>

            <div style={{
              fontSize: size.sm,
              color: c.textSecondary,
              lineHeight: 1.7,
              marginBottom: sp[2],
            }}>
              {section.content}
            </div>

            {section.list && (
              <ul style={{
                margin: `0 0 ${sp[2]} 0`,
                paddingLeft: sp[4],
                listStyleType: 'disc',
              }}>
                {section.list.map((item, i) => (
                  <li key={i} style={{
                    fontSize: size.sm,
                    color: c.textSecondary,
                    lineHeight: 1.7,
                    marginBottom: sp[1],
                  }}>
                    {item}
                  </li>
                ))}
              </ul>
            )}

            {section.note && (
              <div style={{
                padding: sp[2],
                background: c.bgCard,
                border: `1px solid ${c.borderSubtle}`,
                borderRadius: radius.lg,
                fontSize: size.xs,
                color: c.textTertiary,
                fontStyle: 'italic',
              }}>
                {section.note}
              </div>
            )}
          </div>
        ))}

        {/* Last update */}
        <div style={{
          marginTop: sp[8],
          paddingTop: sp[4],
          borderTop: `1px solid ${c.border}`,
          fontSize: size.xs,
          color: c.textTertiary,
          textAlign: 'center',
        }}>
          Dernière mise à jour : {'07/06/2026'}
        </div>
      </div>
    </div>
  )
}
