/* ══════════════════════════════════════════════════════════════
   CARAXES Admin — Orchestrator
   ══════════════════════════════════════════════════════════════
   This file was refactored from 8355 lines into modular components.
   Each tab is now its own file under /pages/admin/.
   ══════════════════════════════════════════════════════════════ */
import { lazy, Suspense, useState } from 'react'
import { AdminProvider, useAdmin } from './admin/AdminContext'
import { ConfirmDialog } from '../components/Toast'
import ErrorBoundary from '../components/ErrorBoundary'
import AdminLayout from './admin/AdminLayout'
import OverviewTab from './admin/OverviewTab'
import { c, f, sp } from '../lib/theme'

// Lazy-loaded tabs — only loaded when the user navigates to them
const CommandesTab = lazy(() => import('./admin/CommandesTab'))
const CommandesSidebarLazy = lazy(() => import('./admin/CommandesTab').then(m => ({ default: m.CommandesSidebar })))
const CatalogueTab = lazy(() => import('./admin/CatalogueTab'))
const ExpeditionTab = lazy(() => import('./admin/ExpeditionTab'))
const StockTab = lazy(() => import('./admin/StockTab'))
const BoutiquesTab = lazy(() => import('./admin/BoutiquesTab'))
const VehiculesTab = lazy(() => import('./admin/VehiculesTab'))
const FormationTab = lazy(() => import('./admin/FormationTab'))
const ServicesTab = lazy(() => import('./admin/ServicesTab'))
const LeadsPipelineTab = lazy(() => import('./admin/PipelineTab').then(m => ({ default: m.LeadsPipelineTab })))
const OrdersPipelineTab = lazy(() => import('./admin/PipelineTab').then(m => ({ default: m.OrdersPipelineTab })))
const ClientsTab = lazy(() => import('./admin/ClientsTab'))
const TeamChatTab = lazy(() => import('./admin/TeamChatTab'))
const AuditLogTab = lazy(() => import('./admin/AuditLogTab'))

// Minimal loading fallback
const TabLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: sp[8], color: c.textTertiary, fontFamily: f.mono, fontSize: '11px', letterSpacing: '0.08em' }}>
    Chargement...
  </div>
)

/* ── Tab Router ── */
function AdminContent() {
  const { mainTab, confirmDialog, setConfirmDialog } = useAdmin()

  // ── Commandes tab shared state (sidebar ↔ detail) ──
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [mobileShowDetail, setMobileShowDetail] = useState(false)

  return (
    <AdminLayout
      commandesSidebar={mainTab === 'commandes' ? <Suspense fallback={null}><CommandesSidebarLazy selectedId={selectedOrderId} setSelectedId={setSelectedOrderId} setMobileShowDetail={setMobileShowDetail} mobileShowDetail={mobileShowDetail} /></Suspense> : null}
    >
      {mainTab === 'overview' && <ErrorBoundary name="Overview"><OverviewTab /></ErrorBoundary>}
      <Suspense fallback={<TabLoader />}>
        {mainTab === 'commandes' && <ErrorBoundary name="Commandes"><CommandesTab selectedId={selectedOrderId} setMobileShowDetail={setMobileShowDetail} /></ErrorBoundary>}
        {mainTab === 'catalogue' && <ErrorBoundary name="Catalogue"><CatalogueTab /></ErrorBoundary>}
        {mainTab === 'expedition' && <ErrorBoundary name="Expédition"><ExpeditionTab /></ErrorBoundary>}
        {mainTab === 'stock' && <ErrorBoundary name="Stock"><StockTab /></ErrorBoundary>}
        {mainTab === 'boutiques' && <ErrorBoundary name="Boutiques"><BoutiquesTab /></ErrorBoundary>}
        {mainTab === 'vehicules' && <ErrorBoundary name="Véhicules"><VehiculesTab /></ErrorBoundary>}
        {mainTab === 'formation' && <ErrorBoundary name="Formation"><FormationTab /></ErrorBoundary>}
        {mainTab === 'services' && <ErrorBoundary name="Services"><ServicesTab /></ErrorBoundary>}
        {mainTab === 'pipeline' && <ErrorBoundary name="Pipeline"><LeadsPipelineTab /></ErrorBoundary>}
        {mainTab === 'orders_pipeline' && <ErrorBoundary name="OrdersPipeline"><OrdersPipelineTab /></ErrorBoundary>}
        {mainTab === 'clients' && <ErrorBoundary name="Clients"><ClientsTab /></ErrorBoundary>}
        {mainTab === 'team_chat' && <ErrorBoundary name="TeamChat"><TeamChatTab /></ErrorBoundary>}
        {mainTab === 'audit' && <ErrorBoundary name="Audit"><AuditLogTab /></ErrorBoundary>}
      </Suspense>

      {/* Global confirm dialog */}
      <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog({ open: false })} />
    </AdminLayout>
  )
}

/* ── Entry Point ── */
export default function Admin({ user, profile, onSignOut }) {
  return (
    <AdminProvider user={user} profile={profile} onSignOut={onSignOut}>
      <AdminContent />
    </AdminProvider>
  )
}
