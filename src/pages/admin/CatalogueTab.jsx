/* ── CARAXES Admin — Catalogue Tab ── */
import { useState, useRef } from 'react'
import { c, f, size, sp, shadow, ease, radius } from '../../lib/theme'
import { CATALOGS, getCatalog, VERIFIED_SUPPLIERS } from '../../lib/catalogsByProfile'
import { TIERS, getTierByKey, DEFAULT_TIER, getTierPrice, getTierMOQ } from '../../lib/clientTiers'
import { useAdmin } from './AdminContext'
import { Icon, icons, DragonMark, ArtDecoDivider, DragonEmptyState, fmtMoney, inputStyle, labelStyle, focusGlow, n8nFetch } from './AdminShared'

const DecoPattern = () => null

export default function CatalogueTab() {
  const {
    products, categories, allProfiles, orders, loadAll,
    toast, t, tToast, confirmDialog, setConfirmDialog, clientName,
    createProduct, updateProduct, deleteProduct, uploadProductImage, deleteProductImage,
    createCategory, updateCategory, deleteCategory,
  } = useAdmin()

  // ── Local state ──
  const [supplierFilter, setSupplierFilter] = useState('all')
  const [supplierSearch, setSupplierSearch] = useState('')
  const [customSuppliers, setCustomSuppliers] = useState([])
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [supplierForm, setSupplierForm] = useState({ name: '', category: '', city: '', province: '', specialty: '', moq: '', priceRange: '', leadTime: '', email: '', wechat: '', phone: '', website: '', certifications: '', notes: '' })
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [catalogSubTab, setCatalogSubTab] = useState('fournisseurs')
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', body: '', supplierName: '' })
  const [emailSending, setEmailSending] = useState(false)
  const [catalogSearch, setCatalogSearch] = useState('')
  const [expandedTier, setExpandedTier] = useState(null)
  const [catalogOverrides, setCatalogOverrides] = useState(() => {
    try { return JSON.parse(localStorage.getItem('caraxes_catalog_overrides') || '{}') } catch { return {} }
  })
  const [deletedCatalogItems, setDeletedCatalogItems] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('caraxes_catalog_deleted') || '[]')) } catch { return new Set() }
  })
  const [showCatalogItemModal, setShowCatalogItemModal] = useState(false)
  const [editingCatalogItem, setEditingCatalogItem] = useState(null)
  const [editingCatalogTier, setEditingCatalogTier] = useState(null)
  const [catalogItemForm, setCatalogItemForm] = useState({ name: '', icon: '📦', description: '', priceRange: '', moq: '', margin: '', topProducts: '', locations: '' })
  const [showProductModal, setShowProductModal] = useState(false)
  const [productForm, setProductForm] = useState({ name: '', description: '', category: '', price_min: '', price_max: '', moq: '1', margin_estimate: '', tags: '', tier_keys: ['detaillant','grossiste','ecommerce','pro'], active: true, featured: false })
  const [editingProduct, setEditingProduct] = useState(null)
  const [productUploading, setProductUploading] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [categoryForm, setCategoryForm] = useState({ name: '', icon: '📦', description: '', sort_order: 0, active: true, tier_keys: ['detaillant','grossiste','ecommerce','pro'] })
  const [editingCategory, setEditingCategory] = useState(null)

  const productFileRef = useRef(null)

  // ── Catalog helpers ──
  const saveCatalogOverride = (tierKey, catId, data) => {
    const key = `${tierKey}_${catId}`
    const next = { ...catalogOverrides, [key]: data }
    setCatalogOverrides(next)
    localStorage.setItem('caraxes_catalog_overrides', JSON.stringify(next))
  }
  const deleteCatalogItem = (tierKey, catId) => {
    const key = `${tierKey}_${catId}`
    const next = new Set(deletedCatalogItems)
    next.add(key)
    setDeletedCatalogItems(next)
    localStorage.setItem('caraxes_catalog_deleted', JSON.stringify([...next]))
  }
  const getEffectiveCatalog = (tierKey) => {
    return getCatalog(tierKey)
      .filter(cat => !deletedCatalogItems.has(`${tierKey}_${cat.id}`))
      .map(cat => {
        const override = catalogOverrides[`${tierKey}_${cat.id}`]
        return override ? { ...cat, ...override } : cat
      })
  }

  return (
    <>
      <div className="admin-scroll" style={{ flex: 1, overflowY: 'auto', padding: sp[4] }}>
              {/* ═══ UNIFIED HEADER: Catalogue & Fournisseurs ═══ */}
              <div style={{
                height: 100, marginBottom: sp[3], position: 'relative', overflow: 'hidden',
                background: `${c.bgCard}`,
                border: `1px solid ${c.borderSubtle}`,
              }}>
                <DecoPattern color={c.teal} opacity={0.06} />
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: c.teal, opacity: 0.5 }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${sp[5]}`, zIndex: 1 }}>
                  <div>
                    <p style={{ fontFamily: f.mono, fontSize: '10px', color: c.teal, letterSpacing: '0.12em', textTransform: 'uppercase', margin: `0 0 ${sp[1]}`, fontWeight: 600 }}>◆ SOURCING & SUPPLY CHAIN</p>
                    <h1 style={{ fontSize: size['2xl'], fontFamily: f.display, fontWeight: 700, color: c.text, margin: 0, letterSpacing: '-0.02em' }}>Catalogue & Fournisseurs</h1>
                  </div>
                  <div style={{ display: 'flex', gap: sp[2] }}>
                    <button onClick={() => setShowAddSupplier(true)} style={{
                      padding: `8px ${sp[3]}`, background: 'transparent', border: `1px solid ${c.teal}`,
                      color: c.teal, fontFamily: f.mono, fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.04em',
                      transition: `all 0.2s ${ease.luxury}`,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = c.teal; e.currentTarget.style.color = c.bg }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = c.teal }}>
                      <Icon d={icons.plus} size={13} color="currentColor" /> Fournisseur
                    </button>
                    <button onClick={() => { setEditingProduct(null); setProductForm({ name: '', description: '', category: '', price_min: '', price_max: '', moq: '1', margin_estimate: '', tags: '', tier_keys: ['detaillant','grossiste','ecommerce','pro'], active: true, featured: false }); setShowProductModal(true) }} style={{
                      padding: `8px ${sp[3]}`, background: c.red, color: c.text, border: 'none',
                      fontFamily: f.mono, fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.04em',
                    }}>
                      <Icon d={icons.plus} size={13} color={c.text} /> Produit
                    </button>
                  </div>
                </div>
              </div>

              {/* Sub-tabs: Fournisseurs | Catalogue | Outils */}
              <div style={{ display: 'flex', gap: '1px', marginBottom: sp[3], background: c.border }}>
                {[
                  { key: 'fournisseurs', label: 'Fournisseurs', count: VERIFIED_SUPPLIERS.length + customSuppliers.length },
                  { key: 'catalogue', label: 'Catalogue Produits', count: products.length },
                  { key: 'outils', label: 'Outils & Partenaires' },
                ].map(st => (
                  <button key={st.key} onClick={() => setCatalogSubTab(st.key)} style={{
                    flex: 1, padding: `${sp[2]} ${sp[3]}`,
                    background: catalogSubTab === st.key ? c.bgElevated : c.bg,
                    border: 'none', cursor: 'pointer', textAlign: 'center',
                    borderBottom: `2px solid ${catalogSubTab === st.key ? c.gold : 'transparent'}`,
                    transition: `all 0.2s ${ease.luxury}`,
                  }}>
                    <span style={{ fontWeight: 600, fontSize: size.sm, color: catalogSubTab === st.key ? c.text : c.textTertiary }}>{st.label}</span>
                    {st.count !== undefined && <span style={{ marginInlineStart: '6px', fontFamily: f.mono, fontSize: '10px', color: c.goldMuted }}>({st.count})</span>}
                  </button>
                ))}
              </div>

              {/* Search bar */}
              <div style={{ marginBottom: sp[3], position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: sp[2], fontSize: '10px', color: c.gold, pointerEvents: 'none' }}>◆</span>
                <input type="text" value={catalogSubTab === 'fournisseurs' ? supplierSearch : catalogSearch}
                  onChange={e => catalogSubTab === 'fournisseurs' ? setSupplierSearch(e.target.value) : setCatalogSearch(e.target.value)}
                  placeholder={catalogSubTab === 'fournisseurs' ? "Rechercher fournisseur, ville, spécialité..." : "Rechercher un produit, une catégorie..."}
                  style={{ ...inputStyle, paddingInlineStart: sp[5], borderBottom: `2px solid ${c.border}` }}
                  onFocus={(e) => { e.target.style.borderBottomColor = c.gold }}
                  onBlur={(e) => { e.target.style.borderBottomColor = c.border }} />
              </div>

              {/* ══════ SUB-TAB: FOURNISSEURS ══════ */}
              {catalogSubTab === 'fournisseurs' && (
                <div>
                  {/* Category filter pills */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: sp[3] }}>
                    {[{ key: 'all', label: 'Tous', color: c.gold }, ...[...new Set([...VERIFIED_SUPPLIERS, ...customSuppliers].map(s => s.category))].map(cat => {
                      const catColors = { textile: c.red, electronique: c.blue || '#6495ED', cosmetique: c.purple, maison: c.gold, sport: c.teal, alimentaire: c.green || '#4CAF50' }
                      return { key: cat, label: cat, color: catColors[cat] || c.gold }
                    })].map(item => (
                      <button key={item.key} onClick={() => setSupplierFilter(supplierFilter === item.key ? 'all' : item.key)} style={{
                        padding: '4px 12px', fontSize: '10px', fontFamily: f.mono,
                        color: supplierFilter === item.key ? c.bg : item.color,
                        background: supplierFilter === item.key ? item.color : 'transparent',
                        border: `1px solid ${item.color}`, cursor: 'pointer',
                        textTransform: 'capitalize', transition: `all 0.2s ${ease.luxury}`,
                      }}>
                        {item.label} ({item.key === 'all' ? [...VERIFIED_SUPPLIERS, ...customSuppliers].length : [...VERIFIED_SUPPLIERS, ...customSuppliers].filter(s => s.category === item.key).length})
                      </button>
                    ))}
                  </div>

                  {/* Supplier table */}
                  <div style={{ overflowX: 'auto', background: c.bgElevated, border: `1px solid ${c.border}` }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: size.xs }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                          {['Fournisseur', 'Catégorie', 'Ville', 'MOQ', 'Prix', 'Délai', 'Certif.', 'Contact', 'Actions'].map(h => (
                            <th key={h} style={{
                              padding: '10px 12px', textAlign: 'start',
                              fontFamily: f.mono, fontSize: '9px', fontWeight: 700,
                              color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em',
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...VERIFIED_SUPPLIERS, ...customSuppliers]
                          .filter(s => supplierFilter === 'all' || s.category === supplierFilter)
                          .filter(s => {
                            if (!supplierSearch.trim()) return true
                            const q = supplierSearch.toLowerCase()
                            return (s.name || '').toLowerCase().includes(q) || (s.city || '').toLowerCase().includes(q) || (s.specialty || '').toLowerCase().includes(q) || (s.category || '').toLowerCase().includes(q)
                          })
                          .map((s, idx) => (
                          <tr key={s.id} style={{
                            borderBottom: `1px solid ${c.borderSubtle}`,
                            animation: `fadeSlideUp 0.3s ${ease.out} both`,
                            animationDelay: `${idx * 40}ms`,
                            background: s.custom ? `${c.gold}04` : 'transparent',
                          }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = c.bgHover }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = s.custom ? `${c.gold}04` : 'transparent' }}>
                            <td style={{ padding: '10px 12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ fontWeight: 600, color: c.text }}>{s.name}</div>
                                {s.custom && <span style={{ fontSize: '7px', fontFamily: f.mono, color: c.gold, border: `1px solid ${c.gold}33`, padding: '0 4px' }}>CUSTOM</span>}
                              </div>
                              <div style={{ fontSize: '10px', color: c.textTertiary, marginTop: 2 }}>{(s.specialty || '').slice(0, 50)}{(s.specialty || '').length > 50 ? '...' : ''}</div>
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <span style={{ padding: '2px 8px', fontSize: '9px', fontFamily: f.mono, textTransform: 'uppercase', letterSpacing: '0.04em', color: c.teal, border: `1px solid ${c.teal}33` }}>{s.category}</span>
                            </td>
                            <td style={{ padding: '10px 12px', color: c.textSecondary }}>{s.city}</td>
                            <td style={{ padding: '10px 12px', fontFamily: f.mono, color: c.text }}>{s.moq}</td>
                            <td style={{ padding: '10px 12px', fontFamily: f.mono, color: c.gold, fontWeight: 600 }}>{s.priceRange}</td>
                            <td style={{ padding: '10px 12px', color: c.textSecondary }}>{s.leadTime}</td>
                            <td style={{ padding: '10px 12px' }}>
                              {(s.certifications || []).length > 0 ? s.certifications.map(cert => (
                                <span key={cert} style={{ padding: '1px 6px', fontSize: '8px', fontFamily: f.mono, color: c.gold, border: `1px solid ${c.gold}22`, marginInlineEnd: 4 }}>{cert}</span>
                              )) : <span style={{ color: c.textTertiary }}>—</span>}
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              {s.contact?.wechat && <div style={{ fontSize: '10px', fontFamily: f.mono, color: c.textSecondary }}>WC: {s.contact.wechat}</div>}
                              {(s.contact?.email || s.email) && <div style={{ fontSize: '10px', fontFamily: f.mono, color: c.textTertiary }}>{s.contact?.email || s.email}</div>}
                              {s.phone && <div style={{ fontSize: '10px', fontFamily: f.mono, color: c.textTertiary }}>{s.phone}</div>}
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                {/* Email button */}
                                <button onClick={() => {
                                  setEmailForm({ to: s.contact?.email || s.email || '', subject: '', body: `Bonjour ${s.name},\n\nNous sommes CARAXES, agent de sourcing basé en Chine.\n\n`, supplierName: s.name })
                                  setShowEmailModal(true)
                                }} title="Envoyer email" style={{
                                  width: 28, height: 28, background: 'transparent', border: `1px solid ${c.teal}40`,
                                  color: c.teal, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  transition: `all 0.2s ${ease.smooth}`,
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = `${c.teal}15` }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                                  <Icon d={icons.send} size={12} />
                                </button>
                                {/* Delete custom supplier */}
                                {s.custom && (
                                  <button onClick={() => {
                                    setConfirmDialog({ open: true, title: 'Supprimer', message: `Supprimer "${s.name}" ?`, onConfirm: () => {
                                      setCustomSuppliers(prev => prev.filter(x => x.id !== s.id))
                                      toast.success(t('toast.supplierDeleted'))
                                    }})
                                  }} title="Supprimer" style={{
                                    width: 28, height: 28, background: 'transparent', border: `1px solid ${c.red}40`,
                                    color: c.red, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: `all 0.2s ${ease.smooth}`,
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.background = `${c.red}15` }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                                    <Icon d={icons.trash} size={12} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ══════ SUB-TAB: CATALOGUE ══════ */}
              {catalogSubTab === 'catalogue' && (
                <div>

              {/* ═══ SECTION 1: PRODUITS PERSONNALISÉS (Supabase) ═══ */}
              <div style={{ marginBottom: sp[5] }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: sp[1], marginBottom: sp[3] }}>
                  <div style={{ width: 24, height: '1px', background: c.red }} />
                  <span style={{ fontFamily: f.mono, fontSize: '10px', color: c.red, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
                    Produits personnalisés
                  </span>
                  <span style={{ fontFamily: f.mono, fontSize: '10px', color: c.textTertiary }}>({products.length})</span>
                </div>

                {products.length === 0 ? (
                  <div style={{ padding: sp[4], textAlign: 'center', color: c.textTertiary, background: c.bgCard, border: `1px solid ${c.border}` }}>
                    <div style={{ fontSize: '32px', marginBottom: sp[1], opacity: 0.3 }}>📦</div>
                    <p style={{ fontSize: size.sm, fontWeight: 600, marginBottom: sp[1] }}>Aucun produit personnalisé</p>
                    <p style={{ fontSize: size.xs, color: c.textTertiary, maxWidth: 400, margin: '0 auto' }}>
                      Cliquez sur « Nouveau produit » pour ajouter des produits au catalogue client.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: sp[3] }}>
                    {products.filter(p => !catalogSearch || p.name?.toLowerCase().includes(catalogSearch.toLowerCase()) || p.category?.toLowerCase().includes(catalogSearch.toLowerCase())).map((prod, i) => {
                      const openEditModal = () => {
                        setEditingProduct(prod)
                        setProductForm({
                          name: prod.name || '', description: prod.description || '', category: prod.category || '',
                          price_min: prod.price_min || '', price_max: prod.price_max || '', moq: prod.moq || '1',
                          margin_estimate: prod.margin_estimate || '', tags: (prod.tags || []).join(', '),
                          tier_keys: prod.tier_keys || ['detaillant','grossiste','ecommerce','pro'],
                          active: prod.active !== false, featured: prod.featured || false,
                        })
                        setShowProductModal(true)
                      }
                      const handleDelete = async (e) => {
                        e.stopPropagation()
                        setConfirmDialog({
                          open: true,
                          title: 'Supprimer',
                          message: `Supprimer « ${prod.name} » ? Cette action est irréversible.`,
                          onConfirm: async () => {
                            try {
                              for (const url of (prod.image_urls || [])) { await deleteProductImage(url) }
                              await deleteProduct(prod.id)
                              await loadAll()
                              toast.success(t('toast.productDeleted'))
                            } catch (err) { toast.error(tToast('genericError', { error: err.message })) }
                          }
                        })
                        return
                      }
                      const handleToggleActive = async (e) => {
                        e.stopPropagation()
                        try {
                          await updateProduct(prod.id, { active: !prod.active })
                          await loadAll()
                          toast.success(prod.active ? t('toast.productToggleDeactivated') : t('toast.productToggleActivated'))
                        } catch (err) { toast.error(tToast('genericError', { error: err.message })) }
                      }
                      return (
                      <div key={prod.id} className="catalog-card" style={{
                        background: c.bgCard, border: `1px solid ${c.border}`, overflow: 'hidden', borderRadius: radius.md,
                        transition: `all 0.35s ${ease.luxury}`, cursor: 'pointer', opacity: prod.active ? 1 : 0.6,
                        boxShadow: shadow.xs, position: 'relative', animation: `cardReveal 0.5s ${ease.smooth} ${0.03 * (i % 10)}s backwards`,
                      }}
                      onClick={openEditModal}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = c.gold
                        const overlay = e.currentTarget.querySelector('.card-actions')
                        if (overlay) overlay.style.opacity = '1'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = c.border
                        const overlay = e.currentTarget.querySelector('.card-actions')
                        if (overlay) overlay.style.opacity = '0'
                      }}>
                        {/* Image + Badges */}
                        <div style={{ height: 160, background: c.bgElevated, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                          {prod.image_urls?.[0] ? (
                            <img src={prod.image_urls[0]} alt={prod.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: c.bgElevated }}>
                              <DecoPattern color={c.gold} opacity={0.06} />
                              <DragonMark s={32} />
                            </div>
                          )}
                          {prod.featured && (
                            <span style={{ position: 'absolute', top: 8, left: 8, background: c.gold, color: c.black, fontSize: '9px', fontWeight: 700, padding: '2px 8px', fontFamily: f.mono, zIndex: 2 }}>STAR</span>
                          )}
                          {!prod.active && (
                            <span style={{ position: 'absolute', top: 8, left: prod.featured ? 60 : 8, background: c.red, color: c.white, fontSize: '9px', fontWeight: 700, padding: '2px 8px', fontFamily: f.mono, zIndex: 2 }}>INACTIF</span>
                          )}

                          {/* ── Hover action buttons ── */}
                          <div className="card-actions" style={{
                            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: sp[2],
                            opacity: 0, transition: `opacity 0.25s ${ease.out}`, zIndex: 3,
                          }}>
                            <button onClick={(e) => { e.stopPropagation(); openEditModal() }} title="Modifier" style={{
                              width: 40, height: 40, border: `1px solid ${c.gold}`, background: `${c.gold}22`,
                              color: c.gold, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: `all 0.2s ${ease.out}`,
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = c.gold; e.currentTarget.style.color = c.black }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = `${c.gold}22`; e.currentTarget.style.color = c.gold }}>
                              <Icon d={icons.edit || 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z'} size={18} />
                            </button>
                            <button onClick={handleToggleActive} title={prod.active ? 'Désactiver' : 'Activer'} style={{
                              width: 40, height: 40, border: `1px solid ${prod.active ? c.amber : c.green}`, background: prod.active ? `${c.amber}22` : `${c.green}22`,
                              color: prod.active ? c.amber : c.green, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: `all 0.2s ${ease.out}`,
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = prod.active ? c.amber : c.green; e.currentTarget.style.color = c.black }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = prod.active ? `${c.amber}22` : `${c.green}22`; e.currentTarget.style.color = prod.active ? c.amber : c.green }}>
                              <Icon d={prod.active ? 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z' : 'M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.8 11.8 0 001 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z'} size={18} />
                            </button>
                            <button onClick={handleDelete} title="Supprimer" style={{
                              width: 40, height: 40, border: `1px solid ${c.red}`, background: `${c.red}22`,
                              color: c.red, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: `all 0.2s ${ease.out}`,
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = c.red; e.currentTarget.style.color = c.white }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = `${c.red}22`; e.currentTarget.style.color = c.red }}>
                              <Icon d={icons.close} size={18} />
                            </button>
                          </div>
                        </div>
                        {/* Card content */}
                        <div style={{ padding: sp[2], position: 'relative' }}>
                          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', borderTop: `1.5px solid ${c.gold}`, borderInlineStart: `1.5px solid ${c.gold}`, opacity: 0.3, pointerEvents: 'none' }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <div style={{ fontFamily: f.display, fontWeight: 700, fontSize: size.sm, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prod.name}</div>
                          </div>
                          {prod.category && <span style={{ fontSize: '9px', color: c.gold, fontFamily: f.mono, padding: '1px 6px', background: c.goldSoft, border: `1px solid ${c.gold}33` }}>{prod.category}</span>}
                          {prod.description && <p style={{ fontSize: '11px', color: c.textSecondary, marginTop: '6px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{prod.description}</p>}
                        </div>
                        {/* Stats bar */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: `1px solid ${c.borderSubtle}` }}>
                          {[
                            { label: 'Prix', value: prod.price_min && prod.price_max ? `${prod.price_min}-${prod.price_max}` : prod.price_min || '-', color: c.green },
                            { label: 'Marge', value: prod.margin_estimate || '-', color: c.gold },
                            { label: 'MOQ', value: prod.moq || '-', color: c.amber },
                          ].map((cell, j) => (
                            <div key={j} style={{ padding: `${sp[1]} ${sp[2]}`, borderInlineEnd: j < 2 ? `1px solid ${c.borderSubtle}` : 'none', textAlign: 'center' }}>
                              <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{cell.label}</div>
                              <div style={{ fontFamily: f.mono, fontSize: size.xs, fontWeight: 700, color: cell.color }}>{cell.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* ═══ SECTION 2: CATALOGUE PAR PROFIL (interactif) ═══ */}
              <div style={{ marginBottom: sp[4] }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: sp[1], marginBottom: sp[3] }}>
                  <div style={{ width: 24, height: '1px', background: c.gold }} />
                  <span style={{ fontFamily: f.mono, fontSize: '10px', color: c.gold, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
                    Catalogue par profil client
                  </span>
                </div>
                <p style={{ fontSize: size.xs, color: c.textTertiary, marginBottom: sp[3], lineHeight: 1.5 }}>
                  Catalogue statique affiché aux clients selon leur profil. Cliquez sur un profil pour voir les catégories, produits phares, prix et MOQ.
                </p>

                {/* Tier selector pills */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: sp[3], flexWrap: 'wrap' }}>
                  {TIERS.map(tier => (
                    <button key={tier.key} onClick={() => setExpandedTier(expandedTier === tier.key ? null : tier.key)} style={{
                      padding: `8px ${sp[3]}`, border: `1px solid ${expandedTier === tier.key ? tier.color : c.border}`,
                      background: expandedTier === tier.key ? `${tier.color}15` : c.bgCard,
                      color: expandedTier === tier.key ? tier.color : c.textSecondary,
                      fontFamily: f.body, fontSize: size.sm, fontWeight: expandedTier === tier.key ? 700 : 500,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                      <span style={{ fontSize: '16px' }}>{tier.icon}</span>
                      {tier.label}
                      <span style={{ fontFamily: f.mono, fontSize: '9px', opacity: 0.7 }}>{getEffectiveCatalog(tier.key).length}</span>
                      <span style={{ fontSize: '10px', transform: expandedTier === tier.key ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▾</span>
                    </button>
                  ))}
                </div>

                {/* Expanded tier categories */}
                {expandedTier && (() => {
                  const tier = TIERS.find(t => t.key === expandedTier)
                  const cats = getEffectiveCatalog(expandedTier).filter(cat => !catalogSearch || (cat.name || '').toLowerCase().includes(catalogSearch.toLowerCase()) || cat.topProducts?.some(p => p.toLowerCase().includes(catalogSearch.toLowerCase())))
                  if (!tier) return null
                  return (
                    <div style={{  }}>
                      {/* Tier info bar */}
                      <div style={{ display: 'flex', gap: sp[3], padding: sp[3], background: c.bgElevated, border: `1px solid ${c.border}`, marginBottom: sp[3] }}>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Commande min.</div>
                          <div style={{ fontFamily: f.mono, fontSize: size.sm, fontWeight: 700, color: tier.color }}>{fmtMoney(tier.minOrderValue)}</div>
                        </div>
                        <div style={{ width: '1px', background: c.border }} />
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Catégories</div>
                          <div style={{ fontFamily: f.mono, fontSize: size.sm, fontWeight: 700, color: c.text }}>{cats.length}</div>
                        </div>
                        <div style={{ width: '1px', background: c.border }} />
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontFamily: f.mono, fontSize: '9px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Multiplicateur</div>
                          <div style={{ fontFamily: f.mono, fontSize: size.sm, fontWeight: 700, color: c.gold }}>×{tier.priceMultiplier}</div>
                        </div>
                      </div>

                      {/* Category cards grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: sp[3] }}>
                        {cats.map((cat, ci) => (
                          <div key={cat.id} style={{
                            background: c.bgCard, border: `1px solid ${c.border}`, overflow: 'hidden', borderRadius: radius.md,
                            transition: `all 0.2s ${ease.smooth}`, boxShadow: shadow.xs,
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = tier.color }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border }}>
                            {/* Category header */}
                            <div style={{ padding: `${sp[2]} ${sp[3]}`, borderBottom: `1px solid ${c.borderSubtle}`, display: 'flex', alignItems: 'center', gap: sp[2] }}>
                              <span style={{ fontSize: '24px' }}>{cat.icon}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontFamily: f.display, fontWeight: 700, fontSize: size.sm, color: c.text }}>{cat.name}</div>
                                <div style={{ fontSize: '11px', color: c.textSecondary, lineHeight: 1.4, marginTop: '2px' }}>{cat.description}</div>
                              </div>
                            </div>

                            {/* Stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: `1px solid ${c.borderSubtle}` }}>
                              {[
                                { label: 'Prix', value: getTierPrice(cat, expandedTier), color: c.green },
                                { label: 'MOQ', value: getTierMOQ(cat.moq, expandedTier), color: c.amber },
                                { label: 'Marge', value: cat.margin || '-', color: c.gold },
                              ].map((cell, j) => (
                                <div key={j} style={{ padding: `${sp[1]} ${sp[2]}`, borderInlineEnd: j < 2 ? `1px solid ${c.borderSubtle}` : 'none', textAlign: 'center' }}>
                                  <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{cell.label}</div>
                                  <div style={{ fontFamily: f.mono, fontSize: size.xs, fontWeight: 700, color: cell.color }}>{cell.value}</div>
                                </div>
                              ))}
                            </div>

                            {/* Top products */}
                            {cat.topProducts && cat.topProducts.length > 0 && (
                              <div style={{ padding: `${sp[2]} ${sp[3]}` }}>
                                <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Produits phares</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                  {(cat.topProducts || []).map((tp, tpi) => (
                                    <span key={tpi} style={{
                                      padding: '2px 8px', background: c.bgElevated, border: `1px solid ${c.borderSubtle}`,
                                      fontSize: '10px', color: c.textSecondary, fontFamily: f.body,
                                    }}>{tp}</span>
                                  ))}
                                </div>
                                {cat.locations && (
                                  <div style={{ marginTop: '6px', fontSize: '10px', color: c.textTertiary, fontFamily: f.mono }}>
                                    📍 {cat.locations.join(', ')}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* ── Action buttons (edit/delete) ── */}
                            <div style={{ padding: `${sp[1]} ${sp[3]}`, display: 'flex', gap: '6px', borderTop: `1px solid ${c.borderSubtle}` }}>
                              <button onClick={() => {
                                setEditingCatalogItem(cat)
                                setEditingCatalogTier(expandedTier)
                                setCatalogItemForm({
                                  name: cat.name || '', icon: cat.icon || '📦', description: cat.description || '',
                                  priceRange: cat.priceRange || '', moq: String(cat.moq || ''), margin: cat.margin || '',
                                  topProducts: (cat.topProducts || []).join(', '), locations: (cat.locations || []).join(', '),
                                })
                                setShowCatalogItemModal(true)
                              }} style={{
                                flex: 1, padding: '6px', background: c.bgElevated, border: `1px solid ${c.border}`, color: c.text,
                                fontFamily: f.body, fontSize: '10px', fontWeight: 600, cursor: 'pointer', transition: `all 0.2s ${ease.smooth}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.gold; e.currentTarget.style.background = `${c.gold}11` }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.background = c.bgElevated }}>
                                <Icon d={icons.edit} size={12} /> Modifier
                              </button>
                              <button onClick={() => {
                                setConfirmDialog({
                                  open: true,
                                  title: 'Supprimer cette catégorie ?',
                                  message: `Voulez-vous supprimer "${cat.name}" du catalogue ${tier.label} ?`,
                                  onConfirm: () => {
                                    deleteCatalogItem(expandedTier, cat.id)
                                    toast.success(tToast('catalogItemRemoved', { name: cat.name }))
                                  }
                                })
                              }} style={{
                                flex: 1, padding: '6px', background: 'transparent', border: `1px solid ${c.red}33`, color: c.red,
                                fontFamily: f.body, fontSize: '10px', fontWeight: 600, cursor: 'pointer', transition: `all 0.2s ${ease.smooth}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.red; e.currentTarget.style.background = `${c.red}11` }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${c.red}33`; e.currentTarget.style.background = 'transparent' }}>
                                <Icon d={icons.trash} size={12} /> Supprimer
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* ═══ SECTION 3: GESTION DES CATEGORIES ═══ */}
              <div style={{ marginBottom: sp[4] }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp[3] }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: sp[1] }}>
                    <div style={{ width: 24, height: '1px', background: c.gold }} />
                    <span style={{ fontFamily: f.mono, fontSize: '10px', color: c.gold, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
                      Gestion des categories
                    </span>
                  </div>
                  <button onClick={() => { setEditingCategory(null); setCategoryForm({ name: '', icon: '📦', description: '', sort_order: 0, active: true, tier_keys: ['detaillant','grossiste','ecommerce','pro'] }); setShowCategoryModal(true) }} style={{
                    padding: `8px ${sp[3]}`, background: c.red, color: c.text, border: 'none',
                    fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}>
                    <Icon d={icons.plus} size={16} color={c.text} />
                    Nouvelle categorie
                  </button>
                </div>
                <p style={{ fontSize: size.xs, color: c.textTertiary, marginBottom: sp[3], lineHeight: 1.5 }}>
                  Gérez les catégories de produits utilisées dans le catalogue client.
                </p>

                {categories.length === 0 ? (
                  <DragonEmptyState title="Aucune catégorie" subtitle="Créez votre première catégorie pour organiser le catalogue" />
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: sp[3] }}>
                    {categories.map((cat, idx) => {
                      const productCount = products.filter(p => p.category === cat.name).length
                      return (
                        <div key={cat.id} style={{
                          background: c.bgCard, border: `1px solid ${c.border}`, overflow: 'hidden', borderRadius: radius.md,
                          transition: `all 0.2s ${ease.smooth}`, boxShadow: shadow.xs,
                          cursor: 'pointer', position: 'relative', animation: `cardReveal 0.5s ${ease.smooth} ${0.04 * (idx % 8)}s backwards`,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.gold; e.currentTarget.style.boxShadow = `0 4px 12px ${c.gold}22` }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.boxShadow = 'none' }}>
                          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', borderTop: `2px solid ${c.gold}`, borderInlineStart: `2px solid ${c.gold}`, opacity: 0.35, pointerEvents: 'none' }} />
                          {/* Category header */}
                          <div style={{ padding: sp[3], borderBottom: `1px solid ${c.borderSubtle}`, display: 'flex', alignItems: 'flex-start', gap: sp[2], justifyContent: 'space-between' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: sp[1], marginBottom: '6px' }}>
                                <span style={{ fontSize: '28px' }}>{cat.icon}</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontFamily: f.display, fontWeight: 700, fontSize: size.sm, color: c.text }}>{cat.name}</div>
                                  {!cat.active && <span style={{ fontSize: '9px', color: c.red, fontFamily: f.mono, fontWeight: 600 }}>INACTIVE</span>}
                                </div>
                              </div>
                              {cat.description && <p style={{ fontSize: '11px', color: c.textSecondary, lineHeight: 1.4 }}>{cat.description}</p>}
                            </div>
                          </div>

                          {/* Stats */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: `1px solid ${c.borderSubtle}` }}>
                            <div style={{ padding: `${sp[1]} ${sp[2]}`, borderInlineEnd: `1px solid ${c.borderSubtle}`, textAlign: 'center' }}>
                              <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Produits</div>
                              <div style={{ fontFamily: f.mono, fontSize: size.sm, fontWeight: 700, color: c.gold }}>{productCount}</div>
                            </div>
                            <div style={{ padding: `${sp[1]} ${sp[2]}`, textAlign: 'center' }}>
                              <div style={{ fontFamily: f.mono, fontSize: '8px', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Ordre</div>
                              <div style={{ fontFamily: f.mono, fontSize: size.sm, fontWeight: 700, color: c.amber }}>{cat.sort_order}</div>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div style={{ padding: sp[2], display: 'flex', gap: '6px' }}>
                            <button onClick={() => { setEditingCategory(cat); setCategoryForm({ name: cat.name, icon: cat.icon, description: cat.description || '', sort_order: cat.sort_order || 0, active: cat.active, tier_keys: cat.tier_keys || ['detaillant','grossiste','ecommerce','pro'] }); setShowCategoryModal(true) }} style={{
                              flex: 1, padding: '6px', background: c.bgElevated, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body, fontSize: '10px', fontWeight: 600, cursor: 'pointer', transition: `all 0.2s ${ease.smooth}`,
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.gold; e.currentTarget.style.background = `${c.gold}11` }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.background = c.bgElevated }}>
                              <Icon d={icons.edit} size={12} /> Editer
                            </button>
                            <button onClick={async () => {
                              setConfirmDialog({
                                open: true,
                                title: 'Supprimer',
                                message: `Supprimer la categorie "${cat.name}" ?`,
                                onConfirm: async () => {
                                  try {
                                    await deleteCategory(cat.id)
                                    await loadAll()
                                    toast.success(t('toast.categoryRemoved'))
                                  } catch (err) { toast.error(tToast('genericError', { error: err.message })) }
                                }
                              })
                              return
                            }} style={{
                              flex: 1, padding: '6px', background: 'transparent', border: `1px solid ${c.red}33`, color: c.red, fontFamily: f.body, fontSize: '10px', fontWeight: 600, cursor: 'pointer', transition: `all 0.2s ${ease.smooth}`,
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.red; e.currentTarget.style.background = `${c.red}11` }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${c.red}33`; e.currentTarget.style.background = 'transparent' }}>
                              <Icon d={icons.trash} size={12} /> Supprimer
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* ── CATEGORY DETAIL/EDIT MODAL ── */}
              {showCategoryModal && (
                <div style={{
                  position: 'fixed', inset: 0, background: 'rgba(6, 5, 4, 0.92)', zIndex: 1000,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
                }} onClick={() => setShowCategoryModal(false)}>
                  <div style={{
                    background: c.bgCard, border: `1px solid ${c.borderLight}`, width: '90%', maxWidth: '500px', maxHeight: '85vh', overflow: 'auto',
                    borderRadius: radius.sm, animation: `cardReveal 0.4s ${ease.smooth}`, boxShadow: shadow.xs,
                  }} onClick={e => e.stopPropagation()}>
                    <form onSubmit={async (e) => {
                      e.preventDefault()
                      try {
                        if (editingCategory) {
                          await updateCategory(editingCategory.id, categoryForm)
                          toast.success(t('toast.categoryUpdated'))
                        } else {
                          await createCategory(categoryForm)
                          toast.success(t('toast.categoryCreated'))
                        }
                        setShowCategoryModal(false)
                        await loadAll()
                      } catch (err) { toast.error(tToast('genericError', { error: err.message })) }
                    }} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div style={{ padding: sp[4], borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, margin: 0 }}>
                          {editingCategory ? 'Editer la categorie' : 'Nouvelle categorie'}
                        </h3>
                        <button type="button" onClick={() => setShowCategoryModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textSecondary }}>
                          <Icon d={icons.close} size={20} color={c.textSecondary} />
                        </button>
                      </div>

                      <div style={{ flex: 1, padding: sp[4], overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: sp[3] }}>
                        <div>
                          <label style={labelStyle}>Nom *</label>
                          <input type="text" required value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})}
                            placeholder="Ex: Textile, Alimentaire..." style={inputStyle}
                            onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                            onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                        </div>

                        <div>
                          <label style={labelStyle}>Icone (emoji)</label>
                          <input type="text" maxLength="2" value={categoryForm.icon} onChange={e => setCategoryForm({...categoryForm, icon: e.target.value})}
                            placeholder="📦" style={{...inputStyle, fontSize: '18px', textAlign: 'center'}}
                            onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                            onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                          <div style={{ fontSize: '9px', color: c.textTertiary, marginTop: '4px' }}>Entrez un emoji ou copiez/collez le votre</div>
                        </div>

                        <div>
                          <label style={labelStyle}>Description</label>
                          <textarea value={categoryForm.description} onChange={e => setCategoryForm({...categoryForm, description: e.target.value})}
                            placeholder="Description de la categorie..." style={{...inputStyle, minHeight: '60px', fontFamily: f.body}}
                            onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                            onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                        </div>

                        <div>
                          <label style={labelStyle}>Ordre de tri</label>
                          <input type="number" value={categoryForm.sort_order} onChange={e => setCategoryForm({...categoryForm, sort_order: parseInt(e.target.value) || 0})}
                            placeholder="0" style={inputStyle}
                            onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                            onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                          <div style={{ fontSize: '9px', color: c.textTertiary, marginTop: '4px' }}>Ordre d'affichage (ascendant)</div>
                        </div>

                        <div>
                          <label style={{ ...labelStyle, marginBottom: sp[2] }}>Tiers disponibles</label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {['detaillant', 'grossiste', 'ecommerce', 'pro'].map(tier => (
                              <label key={tier} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: size.sm }}>
                                <input type="checkbox" checked={categoryForm.tier_keys.includes(tier)} onChange={e => {
                                  if (e.target.checked) {
                                    setCategoryForm({...categoryForm, tier_keys: [...categoryForm.tier_keys, tier]})
                                  } else {
                                    setCategoryForm({...categoryForm, tier_keys: categoryForm.tier_keys.filter(t => t !== tier)})
                                  }
                                }} />
                                {tier.charAt(0).toUpperCase() + tier.slice(1)}
                              </label>
                            ))}
                          </div>
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: size.sm }}>
                          <input type="checkbox" checked={categoryForm.active} onChange={e => setCategoryForm({...categoryForm, active: e.target.checked})} />
                          Actif (visible aux clients)
                        </label>
                      </div>

                      <div style={{ padding: sp[4], borderTop: `1px solid ${c.border}`, display: 'flex', gap: sp[2] }}>
                        {editingCategory && (
                          <button type="button" onClick={async () => {
                            setConfirmDialog({
                              open: true,
                              title: 'Supprimer',
                              message: 'Supprimer cette categorie ?',
                              onConfirm: async () => {
                                try {
                                  await deleteCategory(editingCategory.id)
                                  setShowCategoryModal(false)
                                  await loadAll()
                                  toast.success(t('toast.categoryRemoved'))
                                } catch (err) { toast.error(tToast('genericError', { error: err.message })) }
                              }
                            })
                            return
                          }} style={{
                            padding: `10px ${sp[3]}`, background: 'transparent', color: c.red,
                            border: `1px solid ${c.red}33`, fontFamily: f.body, fontSize: size.sm, fontWeight: 700,
                            cursor: 'pointer',
                          }}>
                            Supprimer
                          </button>
                        )}
                        <div style={{ flex: 1 }} />
                        <button type="button" onClick={() => setShowCategoryModal(false)} style={{
                          padding: `10px ${sp[3]}`, background: 'transparent', color: c.textSecondary,
                          border: `1px solid ${c.border}`, fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
                        }}>Annuler</button>
                        <button type="submit" style={{
                          padding: `10px ${sp[3]}`, background: c.red, color: c.text,
                          border: 'none', fontFamily: f.body, fontSize: size.sm, fontWeight: 700,
                          cursor: 'pointer', transition: `all 0.35s ${ease.luxury}`,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = c.redDeep }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = c.red }}>
                          {editingCategory ? 'Sauvegarder' : 'Creer la categorie'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* ── CATALOG ITEM EDIT MODAL ── */}
              {showCatalogItemModal && (
                <div style={{
                  position: 'fixed', inset: 0, background: 'rgba(6, 5, 4, 0.92)', zIndex: 1000,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
                }} onClick={() => setShowCatalogItemModal(false)}>
                  <div style={{
                    background: c.bgCard, border: `1px solid ${c.borderLight}`, width: '90%', maxWidth: '520px', maxHeight: '85vh', overflow: 'auto',
                    borderRadius: radius.sm, animation: `cardReveal 0.4s ${ease.smooth}`, boxShadow: shadow.xs,
                  }} onClick={e => e.stopPropagation()}>
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      if (!editingCatalogItem || !editingCatalogTier) return
                      const override = {
                        name: catalogItemForm.name,
                        icon: catalogItemForm.icon,
                        description: catalogItemForm.description,
                        priceRange: catalogItemForm.priceRange,
                        moq: parseInt(catalogItemForm.moq) || 0,
                        margin: catalogItemForm.margin,
                        topProducts: catalogItemForm.topProducts.split(',').map(s => s.trim()).filter(Boolean),
                        locations: catalogItemForm.locations.split(',').map(s => s.trim()).filter(Boolean),
                      }
                      saveCatalogOverride(editingCatalogTier, editingCatalogItem.id, override)
                      toast.success(tToast('overrideModified', { name: override.name }))
                      setShowCatalogItemModal(false)
                    }} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div style={{ padding: sp[4], borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, margin: 0 }}>
                          Modifier la catégorie
                        </h3>
                        <button type="button" onClick={() => setShowCatalogItemModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textSecondary }}>
                          <Icon d={icons.close} size={20} color={c.textSecondary} />
                        </button>
                      </div>

                      <div style={{ flex: 1, padding: sp[4], overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: sp[3] }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: sp[2] }}>
                          <div>
                            <label style={labelStyle}>Nom *</label>
                            <input type="text" required value={catalogItemForm.name} onChange={e => setCatalogItemForm({...catalogItemForm, name: e.target.value})}
                              style={inputStyle}
                              onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                              onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                          </div>
                          <div>
                            <label style={labelStyle}>Icône</label>
                            <input type="text" maxLength="2" value={catalogItemForm.icon} onChange={e => setCatalogItemForm({...catalogItemForm, icon: e.target.value})}
                              style={{...inputStyle, fontSize: '18px', textAlign: 'center', width: '56px'}}
                              onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                              onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                          </div>
                        </div>

                        <div>
                          <label style={labelStyle}>Description</label>
                          <textarea value={catalogItemForm.description} onChange={e => setCatalogItemForm({...catalogItemForm, description: e.target.value})}
                            style={{...inputStyle, minHeight: '50px', fontFamily: f.body}}
                            onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                            onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: sp[2] }}>
                          <div>
                            <label style={labelStyle}>Fourchette prix</label>
                            <input type="text" value={catalogItemForm.priceRange} onChange={e => setCatalogItemForm({...catalogItemForm, priceRange: e.target.value})}
                              placeholder="1-5€" style={inputStyle}
                              onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                              onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                          </div>
                          <div>
                            <label style={labelStyle}>MOQ</label>
                            <input type="number" value={catalogItemForm.moq} onChange={e => setCatalogItemForm({...catalogItemForm, moq: e.target.value})}
                              placeholder="100" style={inputStyle}
                              onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                              onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                          </div>
                          <div>
                            <label style={labelStyle}>Marge</label>
                            <input type="text" value={catalogItemForm.margin} onChange={e => setCatalogItemForm({...catalogItemForm, margin: e.target.value})}
                              placeholder="×2 à ×3" style={inputStyle}
                              onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                              onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                          </div>
                        </div>

                        <div>
                          <label style={labelStyle}>Produits phares (séparés par virgule)</label>
                          <input type="text" value={catalogItemForm.topProducts} onChange={e => setCatalogItemForm({...catalogItemForm, topProducts: e.target.value})}
                            placeholder="Produit 1, Produit 2, ..." style={inputStyle}
                            onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                            onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                        </div>

                        <div>
                          <label style={labelStyle}>Localisations (séparées par virgule)</label>
                          <input type="text" value={catalogItemForm.locations} onChange={e => setCatalogItemForm({...catalogItemForm, locations: e.target.value})}
                            placeholder="Yiwu, Guangzhou, ..." style={inputStyle}
                            onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                            onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                        </div>
                      </div>

                      <div style={{ padding: sp[4], borderTop: `1px solid ${c.border}`, display: 'flex', gap: sp[2], justifyContent: 'flex-end' }}>
                        <button type="button" onClick={() => setShowCatalogItemModal(false)} style={{
                          padding: `10px ${sp[3]}`, background: 'transparent', color: c.textSecondary,
                          border: `1px solid ${c.border}`, fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
                        }}>Annuler</button>
                        <button type="submit" style={{
                          padding: `10px ${sp[3]}`, background: c.red, color: c.text,
                          border: 'none', fontFamily: f.body, fontSize: size.sm, fontWeight: 700,
                          cursor: 'pointer', transition: `all 0.35s ${ease.luxury}`,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = c.redDeep }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = c.red }}>
                          Sauvegarder
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
                </div>
              )}

              {/* ══════ SUB-TAB: OUTILS ══════ */}
              {catalogSubTab === 'outils' && (
                <div>
                  <h2 style={{ fontFamily: f.display, fontSize: size.lg, color: c.text, marginBottom: sp[3], fontWeight: 600 }}>Outils & Partenaires recommandés</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: sp[2] }}>
                    {[
                      { name: 'Airwallex', type: 'Paiements', desc: 'Multi-devises, taux 0.3-0.5%', usage: '>5K€/mois' },
                      { name: 'Wise', type: 'Virements', desc: '50+ devises, carte physique', usage: '<5K€/mois' },
                      { name: 'Shopify', type: 'E-commerce', desc: 'Boutique complète, offre 3 mois 1€', usage: 'Boutiques clients' },
                      { name: 'LegalPlace', type: 'Juridique', desc: 'Création société en ligne', usage: 'Structure FR' },
                      { name: 'Orus', type: 'Assurance', desc: 'RC Pro, marchandises transportées', usage: 'Protection import' },
                      { name: '1688.com', type: 'Sourcing', desc: 'Alibaba chinois, prix usine', usage: 'Sourcing direct' },
                      { name: 'Alibaba', type: 'Sourcing', desc: 'Plateforme B2B internationale', usage: 'Premiers contacts' },
                      { name: 'Global Sources', type: 'Sourcing', desc: 'Fournisseurs vérifiés Asie', usage: 'Électronique' },
                    ].map(tool => (
                      <div key={tool.name} style={{
                        padding: sp[2], background: c.bgElevated, border: `1px solid ${c.border}`,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        transition: `all 0.2s ${ease.luxury}`,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = c.goldMuted }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = c.border }}>
                        <div>
                          <div style={{ fontWeight: 600, color: c.text, fontSize: size.sm }}>{tool.name}</div>
                          <div style={{ fontSize: '10px', color: c.textTertiary }}>{tool.desc}</div>
                        </div>
                        <span style={{ fontSize: '9px', fontFamily: f.mono, color: c.teal, whiteSpace: 'nowrap' }}>{tool.usage}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── PRODUCT DETAIL/EDIT MODAL ── */}
              {showProductModal && (
                <div style={{
                  position: 'fixed', inset: 0, background: 'rgba(6, 5, 4, 0.92)', zIndex: 1000,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
                }} onClick={() => setShowProductModal(false)}>
                  <div style={{
                    background: c.bgCard, border: `1px solid ${c.borderLight}`, padding: sp[4],
                    maxWidth: '560px', width: '90%', maxHeight: '90vh', overflowY: 'auto', position: 'relative',
                    animation: `cardReveal 0.4s ${ease.smooth}`, borderRadius: radius.sm, boxShadow: shadow.xs,
                  }} onClick={(e) => e.stopPropagation()} className="admin-scroll">
                    <button onClick={() => setShowProductModal(false)} style={{
                      position: 'absolute', top: sp[3], right: sp[3], background: 'transparent', border: 'none',
                      color: c.textTertiary, cursor: 'pointer', padding: 0, width: '28px', height: '28px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = c.red }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = c.textTertiary }}>
                      <Icon d={icons.close} size={16} />
                    </button>

                    <h2 style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, marginBottom: '4px' }}>
                      {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
                    </h2>
                    <ArtDecoDivider width={80} />

                    {/* Image upload section */}
                    {editingProduct && (
                      <div style={{ marginTop: sp[3], marginBottom: sp[3] }}>
                        <label style={labelStyle}>Images</label>
                        <div style={{ display: 'flex', gap: sp[2], flexWrap: 'wrap', marginBottom: sp[1] }}>
                          {(editingProduct.image_urls || []).map((url, i) => (
                            <div key={url} style={{ width: 80, height: 80, position: 'relative', border: `1px solid ${c.border}`, overflow: 'hidden' }}>
                              <img src={url} alt={`Image du produit ${i + 1}`} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <button onClick={async () => {
                                try {
                                  await deleteProductImage(url)
                                  const newUrls = editingProduct.image_urls.filter((_, j) => j !== i)
                                  await updateProduct(editingProduct.id, { image_urls: newUrls })
                                  setEditingProduct({ ...editingProduct, image_urls: newUrls })
                                  toast.success(t('toast.imageDeleted'))
                                } catch (err) { toast.error(tToast('genericError', { error: err.message || 'Inconnue' })) }
                              }} style={{
                                position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.7)', border: 'none',
                                color: c.white, cursor: 'pointer', width: 18, height: 18, fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>x</button>
                            </div>
                          ))}
                          <button onClick={() => productFileRef.current?.click()} disabled={productUploading} style={{
                            width: 80, height: 80, border: `2px dashed ${c.border}`, background: 'transparent',
                            color: c.textTertiary, cursor: 'pointer', display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', fontSize: '10px', gap: '4px',
                          }}>
                            <Icon d={icons.plus} size={16} color={c.textTertiary} />
                            {productUploading ? '...' : 'Photo'}
                          </button>
                        </div>
                        <input ref={productFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file || !editingProduct) return
                          setProductUploading(true)
                          try {
                            const url = await uploadProductImage(file, editingProduct.id)
                            const newUrls = [...(editingProduct.image_urls || []), url]
                            await updateProduct(editingProduct.id, { image_urls: newUrls })
                            setEditingProduct({ ...editingProduct, image_urls: newUrls })
                            toast.success(t('toast.imageAdded'))
                          } catch (err) { toast.error(tToast('imageUploadError', { error: err.message })) }
                          setProductUploading(false)
                          e.target.value = ''
                        }} />
                      </div>
                    )}

                    <form onSubmit={async (e) => {
                      e.preventDefault()
                      if (!productForm.name.trim()) return
                      const payload = {
                        name: productForm.name, description: productForm.description, category: productForm.category,
                        price_min: productForm.price_min ? parseFloat(productForm.price_min) : null,
                        price_max: productForm.price_max ? parseFloat(productForm.price_max) : null,
                        moq: productForm.moq ? parseInt(productForm.moq) : 1,
                        margin_estimate: productForm.margin_estimate,
                        tags: productForm.tags ? productForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
                        tier_keys: productForm.tier_keys,
                        active: productForm.active, featured: productForm.featured,
                      }
                      try {
                        if (editingProduct) {
                          await updateProduct(editingProduct.id, payload)
                          toast.success(t('toast.productUpdated'))
                        } else {
                          await createProduct(payload)
                          toast.success(t('toast.productCreated'))
                        }
                        setShowProductModal(false)
                        await loadAll()
                      } catch (err) { toast.error(tToast('genericError', { error: err.message })) }
                    }} style={{ display: 'flex', flexDirection: 'column', gap: sp[3], marginTop: sp[3] }}>
                      <div>
                        <label style={labelStyle}>Nom du produit *</label>
                        <input type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})}
                          placeholder="Ex: Tapis de priere premium" style={inputStyle}
                          onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                          onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                      </div>

                      <div>
                        <label style={labelStyle}>Description</label>
                        <textarea value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})}
                          placeholder="Description du produit..." style={{...inputStyle, minHeight: '60px', fontFamily: f.body}}
                          onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                          onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp[2] }}>
                        <div>
                          <label style={labelStyle}>Catégorie</label>
                          <select value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})}
                            style={inputStyle}
                            onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                            onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }}>
                            <option value="">Selectionner une categorie</option>
                            {categories.filter(c => c.active).map(cat => (
                              <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={labelStyle}>MOQ</label>
                          <input type="number" value={productForm.moq} onChange={e => setProductForm({...productForm, moq: e.target.value})}
                            placeholder="1" style={inputStyle}
                            onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                            onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: sp[2] }}>
                        <div>
                          <label style={labelStyle}>Prix min (CNY)</label>
                          <input type="number" step="0.01" value={productForm.price_min} onChange={e => setProductForm({...productForm, price_min: e.target.value})}
                            placeholder="0" style={inputStyle}
                            onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                            onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                        </div>
                        <div>
                          <label style={labelStyle}>Prix max (CNY)</label>
                          <input type="number" step="0.01" value={productForm.price_max} onChange={e => setProductForm({...productForm, price_max: e.target.value})}
                            placeholder="0" style={inputStyle}
                            onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                            onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                        </div>
                        <div>
                          <label style={labelStyle}>Marge estimée</label>
                          <input type="text" value={productForm.margin_estimate} onChange={e => setProductForm({...productForm, margin_estimate: e.target.value})}
                            placeholder="x3-x5" style={inputStyle}
                            onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                            onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                        </div>
                      </div>

                      <div>
                        <label style={labelStyle}>Tags (separes par virgule)</label>
                        <input type="text" value={productForm.tags} onChange={e => setProductForm({...productForm, tags: e.target.value})}
                          placeholder="halal, premium, bestseller" style={inputStyle}
                          onFocus={(e) => { e.target.style.borderColor = c.gold; e.target.style.boxShadow = focusGlow }}
                          onBlur={(e) => { e.target.style.borderColor = c.border; e.target.style.boxShadow = 'none' }} />
                      </div>

                      {/* Toggles */}
                      <div style={{ display: 'flex', gap: sp[3] }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: size.sm }}>
                          <input type="checkbox" checked={productForm.active} onChange={e => setProductForm({...productForm, active: e.target.checked})} />
                          Actif (visible clients)
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: size.sm }}>
                          <input type="checkbox" checked={productForm.featured} onChange={e => setProductForm({...productForm, featured: e.target.checked})} />
                          Mis en avant
                        </label>
                      </div>

                      <div style={{ display: 'flex', gap: sp[2], paddingTop: sp[2], borderTop: `1px solid ${c.border}` }}>
                        {editingProduct && (
                          <button type="button" onClick={async () => {
                            setConfirmDialog({
                              open: true,
                              title: 'Supprimer',
                              message: 'Supprimer ce produit ?',
                              onConfirm: async () => {
                                try {
                                  for (const url of (editingProduct.image_urls || [])) { await deleteProductImage(url) }
                                  await deleteProduct(editingProduct.id)
                                  setShowProductModal(false)
                                  await loadAll()
                                  toast.success(t('toast.productDeleted'))
                                } catch (err) { toast.error(tToast('genericError', { error: err.message })) }
                              }
                            })
                            return
                          }} style={{
                            padding: `10px ${sp[3]}`, background: 'transparent', color: c.red,
                            border: `1px solid ${c.red}33`, fontFamily: f.body, fontSize: size.sm, fontWeight: 700,
                            cursor: 'pointer',
                          }}>
                            Supprimer
                          </button>
                        )}
                        <div style={{ flex: 1 }} />
                        <button type="button" onClick={() => setShowProductModal(false)} style={{
                          padding: `10px ${sp[3]}`, background: 'transparent', color: c.textSecondary,
                          border: `1px solid ${c.border}`, fontFamily: f.body, fontSize: size.sm, fontWeight: 700, cursor: 'pointer',
                        }}>Annuler</button>
                        <button type="submit" style={{
                          padding: `10px ${sp[3]}`, background: c.red, color: c.text,
                          border: 'none', fontFamily: f.body, fontSize: size.sm, fontWeight: 700,
                          cursor: 'pointer', transition: `all 0.35s ${ease.luxury}`,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = c.redDeep }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = c.red }}>
                          {editingProduct ? 'Sauvegarder' : 'Creer le produit'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>

      {/* ══════ ADD SUPPLIER MODAL ══════ */}
      {showAddSupplier && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowAddSupplier(false) }}>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(6, 5, 4, 0.85)', backdropFilter: 'blur(4px)' }} />
          <div style={{ width: 560, maxHeight: '80vh', overflowY: 'auto', position: 'relative', zIndex: 1, background: c.bgElevated, border: `1px solid ${c.gold}40`, boxShadow: '0 32px 64px rgba(6, 5, 4, 0.88)', animation: 'fadeSlideIn 0.2s ease' }}>
            <div style={{ padding: `${sp[3]} ${sp[4]}`, borderBottom: `1px solid ${c.borderSubtle}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, color: c.gold, margin: 0 }}>Nouveau Fournisseur</h3>
              <button onClick={() => setShowAddSupplier(false)} style={{ background: 'none', border: 'none', color: c.textTertiary, cursor: 'pointer' }}><Icon d={icons.close} size={18} /></button>
            </div>
            <form onSubmit={e => {
              e.preventDefault()
              const newSupplier = {
                id: `custom-${Date.now()}`,
                name: supplierForm.name,
                category: supplierForm.category.toLowerCase(),
                city: supplierForm.city,
                province: supplierForm.province,
                specialty: supplierForm.specialty,
                moq: parseInt(supplierForm.moq) || 0,
                priceRange: supplierForm.priceRange,
                leadTime: supplierForm.leadTime,
                contact: { email: supplierForm.email, wechat: supplierForm.wechat },
                email: supplierForm.email,
                phone: supplierForm.phone,
                website: supplierForm.website,
                certifications: supplierForm.certifications ? supplierForm.certifications.split(',').map(s => s.trim()).filter(Boolean) : [],
                notes: supplierForm.notes,
                verified: false,
                custom: true,
              }
              setCustomSuppliers(prev => [...prev, newSupplier])
              setShowAddSupplier(false)
              setSupplierForm({ name: '', category: '', city: '', province: '', specialty: '', moq: '', priceRange: '', leadTime: '', email: '', wechat: '', phone: '', website: '', certifications: '', notes: '' })
              toast.success('Fournisseur ajouté avec succès')
            }} style={{ padding: sp[4], display: 'flex', flexDirection: 'column', gap: sp[2] }}>
              {[
                { key: 'name', label: 'Nom du fournisseur *', placeholder: 'ex: Guangzhou Texprint Co.', required: true },
                { key: 'category', label: 'Catégorie *', placeholder: 'ex: textile, electronique, cosmetique...', required: true },
                { key: 'city', label: 'Ville *', placeholder: 'ex: Guangzhou, Yiwu, Shenzhen...', required: true },
                { key: 'province', label: 'Province', placeholder: 'ex: Guangdong, Zhejiang...' },
                { key: 'specialty', label: 'Spécialité', placeholder: 'Description de leur expertise...' },
                { key: 'moq', label: 'MOQ (quantité min.)', placeholder: 'ex: 500', type: 'number' },
                { key: 'priceRange', label: 'Fourchette de prix', placeholder: 'ex: 3 – 18 €/pièce' },
                { key: 'leadTime', label: 'Délai de livraison', placeholder: 'ex: 25 – 35 jours' },
                { key: 'email', label: 'Email', placeholder: 'contact@fournisseur.com', type: 'email' },
                { key: 'wechat', label: 'WeChat ID', placeholder: 'wechat_id' },
                { key: 'phone', label: 'Téléphone', placeholder: '+86 xxx xxxx xxxx' },
                { key: 'website', label: 'Site web', placeholder: 'www.fournisseur.com' },
                { key: 'certifications', label: 'Certifications (séparées par virgule)', placeholder: 'ISO 9001, CE, HACCP...' },
                { key: 'notes', label: 'Notes internes', placeholder: 'Notes privées sur ce fournisseur...', multiline: true },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ display: 'block', fontFamily: f.mono, fontSize: '9px', color: c.goldMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{field.label}</label>
                  {field.multiline ? (
                    <textarea value={supplierForm[field.key]} onChange={e => setSupplierForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder} rows={3}
                      style={{ width: '100%', padding: `${sp[1]} ${sp[2]}`, background: c.bgCard, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body, fontSize: size.sm, outline: 'none', resize: 'vertical' }} />
                  ) : (
                    <input value={supplierForm[field.key]} onChange={e => setSupplierForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder} type={field.type || 'text'} required={field.required}
                      style={{ width: '100%', padding: `${sp[1]} ${sp[2]}`, background: c.bgCard, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body, fontSize: size.sm, outline: 'none' }} />
                  )}
                </div>
              ))}
              <button type="submit" style={{
                marginTop: sp[2], padding: `${sp[2]} ${sp[4]}`, background: c.teal, color: c.bg,
                border: 'none', fontFamily: f.mono, fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                Ajouter le fournisseur
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══════ EMAIL MODAL ══════ */}
      {showEmailModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowEmailModal(false) }}>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(6, 5, 4, 0.85)', backdropFilter: 'blur(4px)' }} />
          <div style={{ width: 520, position: 'relative', zIndex: 1, background: c.bgElevated, border: `1px solid ${c.gold}40`, boxShadow: '0 32px 64px rgba(6, 5, 4, 0.88)', animation: 'fadeSlideIn 0.2s ease' }}>
            <div style={{ padding: `${sp[3]} ${sp[4]}`, borderBottom: `1px solid ${c.borderSubtle}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: f.display, fontSize: size.lg, fontWeight: 700, color: c.gold, margin: 0 }}>Envoyer un email</h3>
              <button onClick={() => setShowEmailModal(false)} style={{ background: 'none', border: 'none', color: c.textTertiary, cursor: 'pointer' }}><Icon d={icons.close} size={18} /></button>
            </div>
            <div style={{ padding: sp[4], display: 'flex', flexDirection: 'column', gap: sp[2] }}>
              {emailForm.supplierName && <div style={{ fontFamily: f.mono, fontSize: '10px', color: c.teal, marginBottom: sp[1] }}>À: {emailForm.supplierName}</div>}
              <div>
                <label style={{ display: 'block', fontFamily: f.mono, fontSize: '9px', color: c.goldMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Destinataire *</label>
                <input value={emailForm.to} onChange={e => setEmailForm(prev => ({ ...prev, to: e.target.value }))}
                  placeholder="email@fournisseur.com" type="email" required
                  style={{ width: '100%', padding: `${sp[1]} ${sp[2]}`, background: c.bgCard, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body, fontSize: size.sm, outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: f.mono, fontSize: '9px', color: c.goldMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Objet *</label>
                <input value={emailForm.subject} onChange={e => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Demande de cotation — CARAXES" required
                  style={{ width: '100%', padding: `${sp[1]} ${sp[2]}`, background: c.bgCard, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body, fontSize: size.sm, outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: f.mono, fontSize: '9px', color: c.goldMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Message</label>
                <textarea value={emailForm.body} onChange={e => setEmailForm(prev => ({ ...prev, body: e.target.value }))}
                  rows={8}
                  style={{ width: '100%', padding: `${sp[1]} ${sp[2]}`, background: c.bgCard, border: `1px solid ${c.border}`, color: c.text, fontFamily: f.body, fontSize: size.sm, outline: 'none', resize: 'vertical', lineHeight: 1.6 }} />
              </div>
              <div style={{ display: 'flex', gap: sp[2], marginTop: sp[1] }}>
                <button onClick={() => {
                  if (!emailForm.to || !emailForm.subject) { toast.error(t('toast.emailFieldsRequired')); return }
                  const mailtoUrl = `mailto:${emailForm.to}?subject=${encodeURIComponent(emailForm.subject)}&body=${encodeURIComponent(emailForm.body)}`
                  window.open(mailtoUrl)
                  toast.success(t('toast.clientEmailOpened'))
                  setShowEmailModal(false)
                }} style={{
                  flex: 1, padding: `${sp[2]} ${sp[3]}`, background: c.gold, color: c.bg,
                  border: 'none', fontFamily: f.mono, fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                  letterSpacing: '0.06em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}>
                  <Icon d={icons.send} size={14} color={c.bg} /> Ouvrir dans Mail
                </button>
                <button onClick={async () => {
                  if (!emailForm.to || !emailForm.subject) { toast.error(t('toast.emailFieldsRequired')); return }
                  setEmailSending(true)
                  try {
                    await n8nFetch('/send-email', {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ to: emailForm.to, subject: emailForm.subject, body: emailForm.body, from: 'contact@caraxes.fr', supplierName: emailForm.supplierName, timestamp: new Date().toISOString() }),
                    })
                    toast.success(t('toast.emailSentN8N'))
                    setShowEmailModal(false)
                  } catch (err) {
                    toast.warning(t('toast.n8nNotConfirmedMail'))
                  }
                  setEmailSending(false)
                }} disabled={emailSending} style={{
                  flex: 1, padding: `${sp[2]} ${sp[3]}`, background: 'transparent', border: `1px solid ${c.teal}`,
                  color: c.teal, fontFamily: f.mono, fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                  letterSpacing: '0.06em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  opacity: emailSending ? 0.5 : 1,
                }}>
                  <Icon d="M13 2L3 14h9l-1 8 10-12h-9l1-8" size={14} color={c.teal} /> {emailSending ? 'Envoi...' : 'Envoyer via N8N'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
