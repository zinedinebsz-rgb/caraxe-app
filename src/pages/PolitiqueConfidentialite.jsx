import { c, f, size, sp, radius, shadow } from '../lib/theme'

export default function PolitiqueConfidentialite() {
  const sections = [
    {
      title: 'Responsable du traitement',
      content: 'CARAXES - contact@caraxes.fr'
    },
    {
      title: 'Données collectées',
      content: 'CARAXES collecte les données personnelles suivantes lors de votre inscription et utilisation des services :',
      list: [
        'Prénom et nom',
        'Adresse email',
        'Numéro de téléphone',
        'Informations de profil (secteur d\'activité, localisation)',
      ]
    },
    {
      title: 'Finalités du traitement',
      content: 'Vos données sont traitées pour les finalités suivantes :',
      list: [
        'Gestion de votre compte et de vos commandes',
        'Communication commerciale et support client',
        'Envoi de notifications relatives à votre activité',
        'Amélioration de nos services (analyse statistique)',
      ]
    },
    {
      title: 'Base légale',
      content: 'Le traitement de vos données est fondé sur :',
      list: [
        'Votre consentement (pour les communications marketing)',
        'L\'exécution du contrat que vous avez conclu avec CARAXES (gestion des commandes)',
        'Nos obligations légales (comptabilité, fiscalité)',
      ]
    },
    {
      title: 'Durée de conservation',
      content: 'Vos données personnelles sont conservées pendant la durée de votre relation commerciale avec CARAXES, puis pendant 3 ans à compter de la fin de cette relation, conformément aux obligations légales françaises en matière de comptabilité.'
    },
    {
      title: 'Destinataires des données',
      content: 'Vos données peuvent être partagées avec les tiers suivants, qui agissent en tant que sous-traitants :',
      list: [
        'Supabase Inc. (hébergement et gestion des données)',
        'Stripe Inc. (traitement des paiements)',
        'Google Analytics (analyse statistique du trafic du site)',
      ]
    },
    {
      title: 'Transferts internationaux',
      content: 'CARAXES opère en partie depuis la Chine (équipe terrain à Yiwu pour la coordination fournisseurs). Vos données peuvent donc être consultées depuis la Chine par les membres autorisés de l\'équipe CARAXES, dans le cadre strict de l\'exécution de votre contrat (art. 49.1.b du RGPD). Ces accès sont limités aux finalités contractuelles, encadrés par des engagements de confidentialité, et restreints au personnel strictement nécessaire. Par ailleurs, certains de nos sous-traitants (Supabase Inc., Stripe Inc.) opèrent depuis les États-Unis ; ces transferts sont encadrés par les clauses contractuelles types de la Commission européenne.'
    },
    {
      title: 'Droits des utilisateurs',
      content: 'Vous disposez des droits suivants concernant vos données personnelles :',
      list: [
        'Droit d\'accès : obtenir une copie de vos données',
        'Droit de rectification : corriger vos données inexactes',
        'Droit à l\'oubli : demander la suppression de vos données',
        'Droit à la portabilité : recevoir vos données dans un format structuré',
        'Droit d\'opposition : vous opposer au traitement de vos données',
      ]
    },
    {
      title: 'Exercer vos droits',
      content: 'Pour exercer l\'un de ces droits, contactez-nous à : contact@caraxes.fr. Nous répondrons à votre demande dans un délai de 30 jours. Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la CNIL : 3 place de Fontenoy, 75007 Paris — cnil.fr.'
    },
    {
      title: 'Cookies',
      content: 'CARAXES utilise les types de cookies suivants :',
      list: [
        'Google Analytics : pour analyser le trafic et les comportements des utilisateurs',
        'Cookies de préférences (localStorage) : pour mémoriser vos préférences d\'interface',
      ],
      note: 'Vous pouvez refuser les cookies de suivi à tout moment via la banneau de consentement en bas du site.'
    },
    {
      title: 'Sécurité des données',
      content: 'CARAXES met en œuvre des mesures techniques et organisationnelles pour protéger vos données contre l\'accès non autorisé, la modification ou la suppression.'
    },
    {
      title: 'Modifications',
      content: 'CARAXES se réserve le droit de modifier cette politique de confidentialité. Les modifications seront communiquées aux utilisateurs via le site.'
    },
    {
      title: 'Conformité RGPD',
      content: 'Cette politique respecte les exigences du Règlement Général sur la Protection des Données (RGPD) de l\'Union Européenne.'
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
            Politique de Confidentialité
          </h1>
          <p style={{
            fontSize: size.sm,
            color: c.textSecondary,
            margin: 0,
            lineHeight: 1.6,
          }}>
            Conformité RGPD - Protection de vos données personnelles
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
