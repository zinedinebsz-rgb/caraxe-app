import { c, f, size, sp, radius, shadow } from '../lib/theme'

export default function MentionsLegales() {
  const sections = [
    {
      title: 'Propriétaire du site',
      content: [
        { label: 'Entrepreneur individuel', value: '[Prénom NOM — à compléter]' },
        { label: 'Nom commercial', value: 'CARAXES' },
        { label: 'Statut juridique', value: 'Micro-entreprise (Entreprise Individuelle)' },
        { label: 'Adresse', value: '[Adresse complète — à compléter]' },
        { label: 'SIRET', value: '[SIRET — à compléter après immatriculation]' },
        { label: 'Email', value: 'contact@caraxes.fr' },
        { label: 'Téléphone', value: '[Téléphone — à compléter]' },
        { label: 'Directeur de la publication', value: '[Prénom NOM — à compléter]' },
      ]
    },
    {
      title: 'Hébergement',
      content: [
        { label: 'Hébergeur du site', value: 'Vercel Inc.' },
        { label: 'Adresse', value: '340 S Lemon Ave #4133, Walnut, CA 91789, USA' },
      ]
    },
    {
      title: 'Base de données',
      content: [
        { label: 'Hébergeur', value: 'Supabase Inc.' },
        { label: 'Localisation', value: 'Serveurs distribués (voir politique de confidentialité)' },
      ]
    },
    {
      title: 'Paiements',
      content: [
        { label: 'Processeur de paiement', value: 'Stripe Inc.' },
      ]
    },
    {
      title: 'Propriété intellectuelle',
      content: [
        { label: 'Droits', value: 'Tous les contenus, textes, images et éléments du site sont la propriété de CARAXES ou de ses partenaires. Toute reproduction est interdite sans autorisation préalable.' },
      ]
    },
    {
      title: 'Limitation de responsabilité',
      content: [
        { label: 'Contenu', value: 'CARAXES ne peut être responsable des erreurs, omissions ou imprécisions du site. L\'utilisateur accède au site sous sa responsabilité.' },
      ]
    },
    {
      title: 'Modifications',
      content: [
        { label: 'Droit de modification', value: 'CARAXES se réserve le droit de modifier ces mentions légales à tout moment sans préavis.' },
      ]
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
            Mentions Légales
          </h1>
          <p style={{
            fontSize: size.sm,
            color: c.textSecondary,
            margin: 0,
            lineHeight: 1.6,
          }}>
            Informations légales relatives au site caraxes.fr et à l'application app.caraxes.fr
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

            <div style={{ display: 'grid', gap: sp[2] }}>
              {section.content.map((item, i) => (
                <div key={i} style={{
                  padding: sp[2],
                  background: c.bgCard,
                  border: `1px solid ${c.borderSubtle}`,
                  borderRadius: radius.lg,
                }}>
                  <div style={{
                    fontSize: size.xs,
                    color: c.gold,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: sp[1],
                  }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontSize: size.sm,
                    color: c.textSecondary,
                    lineHeight: 1.6,
                  }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
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
