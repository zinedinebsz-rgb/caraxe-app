import { c, f, size, sp, radius, shadow } from '../lib/theme'

export default function CGV() {
  const sections = [
    {
      title: 'Objet',
      content: 'Les présentes conditions générales de vente régissent les services d\'agent de sourcing fournis par CARAXES. Ces services incluent :',
      list: [
        'Recherche et identification de fournisseurs en Chine',
        'Contrôle de qualité et audits fournisseurs',
        'Négociation de prix et délais',
        'Gestion logistique et expédition',
      ]
    },
    {
      title: 'Tarification',
      content: 'Les tarifs des services de CARAXES sont établis au cas par cas sur devis, selon la nature et l\'importance de la prestation demandée. Aucun service n\'est fourni sans devis préalable accepté par le client.'
    },
    {
      title: 'Conditions de paiement',
      content: 'Le paiement s\'effectue via la plateforme Stripe selon les conditions suivantes :',
      list: [
        'Le paiement doit être effectué avant le début de la prestation, sauf accord contraire',
        'Les moyens de paiement acceptés : cartes bancaires (Visa, Mastercard)',
        'Les factures sont émises automatiquement et accessibles dans votre espace client',
      ]
    },
    {
      title: 'Délais et respect des engagements',
      content: 'CARAXES s\'engage à respecter les délais convenus lors de la signature du devis. En cas de dépassement imprévu, CARAXES en informera le client au plus tôt. Les délais ne commencent qu\'après validation du paiement.'
    },
    {
      title: 'Limitation de responsabilité',
      content: 'CARAXES ne peut être tenu responsable :',
      list: [
        'Des changements de marché ou de disponibilité des fournisseurs en Chine',
        'Des modifications réglementaires douanières ou commerciales',
        'Des retards de expéditions due à des facteurs externes (grèves portuaires, aéroport fermé)',
        'Des défauts de produits non signalés lors du contrôle de qualité',
      ],
      note: 'La responsabilité de CARAXES est limitée au montant de la prestation facturée.'
    },
    {
      title: 'Droits de propriété intellectuelle',
      content: 'Tous les documents fournis par CARAXES (rapports, analyses, devis) sont la propriété de CARAXES. Le client est autorisé à les utiliser à titre privé mais ne peut les reproduire ou les commercialiser sans accord préalable.'
    },
    {
      title: 'Confidentialité',
      content: 'CARAXES s\'engage à respecter la confidentialité des informations commerciales échangées lors de la collaboration, sauf si la divulgation est requise par la loi.'
    },
    {
      title: 'Résiliation',
      content: 'Le client peut résilier un contrat en cours en notifiant CARAXES par email. Les frais déjà engagés restent dus. CARAXES peut résilier en cas de non-paiement ou de comportement inapproprié du client.'
    },
    {
      title: 'Données personnelles',
      content: 'Les données personnelles sont traitées selon notre Politique de Confidentialité accessible à tout moment sur le site.'
    },
    {
      title: 'Droit applicable',
      content: 'Les présentes CGV sont régies par la loi française et les litiges seront soumis aux tribunaux commerciaux compétents.'
    },
    {
      title: 'Modifications',
      content: 'CARAXES se réserve le droit de modifier ces CGV à tout moment. Les modifications seront communiquées aux clients par email ou publication sur le site.'
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
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
        </div>
      </div>
    </div>
  )
}
