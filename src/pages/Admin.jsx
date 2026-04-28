/* ══════════════════════════════════════════════════════════════
   CARAXES Admin — Orchestrator
   ══════════════════════════════════════════════════════════════
   This file was refactored from 8355 lines into modular components.
   Each tab is now its own file under /pages/admin/.
   ══════════════════════════════════════════════════════════════ */
import { lazy, Suspense } from 'react'
import { AdminProvider, useAdmin } from './admin/AdminContext'
import { ConfirmDialog } from '../components/Toast'
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

// Minimal loading fallback
const TabLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: sp[8], color: c.textTertiary, fontFamily: f.mono, fontSize: '11px', letterSpacing: '0.08em' }}>
    Chargement...
  </div>
)

/* ── Tab Router ── */
function AdminContent() {
  const { mainTab, confirmDialog, setConfirmDialog } = useAdmin()

  return (
    <AdminLayout
      commandesSidebar={mainTab === 'commandes' ? <Suspense fallback={null}><CommandesSidebarLazy /></Suspense> : null}
    >
      {mainTab === 'overview' && <OverviewTab />}
      <Suspense fallback={<TabLoader />}>
        {mainTab === 'commandes' && <CommandesTab />}
        {mainTab === 'catalogue' && <CatalogueTab />}
        {mainTab === 'expedition' && <ExpeditionTab />}
        {mainTab === 'stock' && <StockTab />}
        {mainTab === 'boutiques' && <BoutiquesTab />}
        {mainTab === 'vehicules' && <VehiculesTab />}
        {mainTab === 'formation' && <FormationTab />}
        {mainTab === 'services' && <ServicesTab />}
        {mainTab === 'pipeline' && <LeadsPipelineTab />}
        {mainTab === 'orders_pipeline' && <OrdersPipelineTab />}
        {mainTab === 'clients' && <ClientsTab />}
        {mainTab === 'team_chat' && <TeamChatTab />}
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
