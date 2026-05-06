# Quick Checklist - Audit Build & Bundle CARAXE APP

**Audit Date:** 16 avril 2026  
**Build Status:** ✓ SUCCESS  
**Overall Score:** 6.5/10 → Target: 9/10

---

## PROBLÈMES CRITIQUES - À TRAITER D'URGENCE

### [ ] CRITICAL-001: Admin.jsx (8,169 lignes)
- **Fichier:** `src/pages/Admin.jsx`
- **Taille chunk:** 344 KB (65 KB gzip)
- **Action:** Splitter en 8-12 sous-composants
  - [ ] AdminLayout (header, nav)
  - [ ] OrdersPanel
  - [ ] ClientsPanel
  - [ ] InventoryPanel
  - [ ] DocumentsPanel
  - [ ] AnalyticsPanel
  - [ ] AdminSettingsPanel
  - [ ] MessageCenter
- **Effort:** 2-3 jours
- **Expected:** 344 KB → 60 KB (-82%)
- **Owner:** ___________
- **Started:** ___________
- **Completed:** ___________

### [ ] CRITICAL-002: Index Chunk (415 KB)
- **Fichier:** `vite.config.js` (missing config)
- **Issue:** Pas de code splitting configuré
- **Action:** Ajouter build.rollupOptions.output.manualChunks
  ```javascript
  manualChunks: {
    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
    'supabase-vendor': ['@supabase/supabase-js'],
    'utils': ['src/lib/theme', 'src/lib/i18n']
  }
  ```
- **Effort:** 2 heures
- **Expected:** 415 KB → 250 KB (-40%)
- **Owner:** ___________
- **Started:** ___________
- **Completed:** ___________

---

## PROBLÈMES MAJEURS - Avant Production

### [ ] MAJOR-003: Vulnérabilités Vite/esbuild
- **Issues:** 
  - [ ] GHSA-67mh-4wv8-2f99 (esbuild CSRF dev-server)
  - [ ] GHSA-4w7w-66w2-5vf9 (Vite path traversal)
- **Action:** `npm audit fix --force` (Vite 8.0.8)
- **Risk:** DEV-SERVER ONLY (minimal production risk)
- **Effort:** 4 heures (include testing)
- **Owner:** ___________
- **Started:** ___________
- **Completed:** ___________

### [ ] MAJOR-004: Fichiers Dupliqués
- **Files to delete:**
  - [ ] `src/App 2.jsx`
  - [ ] `src/pages/Admin 2.jsx`
  - [ ] `src/pages/Dashboard 2.jsx`
  - [ ] `src/pages/Login 2.jsx`
- **Action:** `rm src/App\ 2.jsx src/pages/{Admin,Dashboard,Login}\ 2.jsx`
- **Impact:** -697 KB disk space
- **Effort:** 30 minutes
- **Owner:** ___________
- **Started:** ___________
- **Completed:** ___________

### [ ] MAJOR-005: Vite.config Minimal
- **Fichier:** `vite.config.js`
- **Add:** 
  - [ ] build.rollupOptions.output.manualChunks (see CRITICAL-002)
  - [ ] build.chunkSizeWarningLimit = 500
  - [ ] resolve.alias (optional)
- **Effort:** 2 heures
- **Expected:** 30% bundle size reduction
- **Owner:** ___________
- **Started:** ___________
- **Completed:** ___________

---

## PROBLÈMES MINEURS - À Optimiser

### [ ] MINOR-006: LocaleAndPwaControls
- **Fichier:** `src/components/LocaleAndPwaControls.jsx`
- **Issue:** 30 KB, logique couplée (locale + PWA)
- **Action:** Splitter en 2 composants
  - [ ] LocaleSwitcher.jsx (~8 KB)
  - [ ] PWAControls.jsx (~8 KB)
- **Effort:** 4 heures
- **Expected:** -5 KB gzip
- **Priority:** Medium
- **Owner:** ___________
- **Started:** ___________
- **Completed:** ___________

---

## BUILD VALIDATIONS

### Pre-Fix Checklist
- [ ] Build succès actuel: `npm run build` (22.51s, 97 modules)
- [ ] Bundle size current: 924 KB (200 KB gzip)
- [ ] Tests passing: ___________
- [ ] Git status clean: ___________

### Sprint 1 Checklist (2-4 days)
- [ ] Admin.jsx refactoring done
- [ ] Vite code splitting configured
- [ ] Duplicate files deleted
- [ ] Build test successful: `npm run build`
- [ ] Bundle size validated: 415 KB → 250 KB
- [ ] Tests still passing
- [ ] Git commit with detailed message
- [ ] Code review completed

### Sprint 1 Expected Results
```
Before:
  index-yUXhL0QX.js:    415 KB (123 KB gzip)
  Admin-B7VsqxED.js:    344 KB ( 65 KB gzip)
  Total:                924 KB (200 KB gzip)

After Sprint 1:
  index (split):        250 KB ( 75 KB gzip)
  admin (split):         60 KB ( 20 KB gzip)
  Total:                460 KB (115 KB gzip)  ← -50%
```

### Sprint 2 Checklist (2-3 days)
- [ ] Vite upgrade 5 → 8 planned
- [ ] Dependency updates tested
- [ ] Security vulnerabilities fixed
- [ ] LocaleAndPwaControls split done (optional)
- [ ] Bundle analyzer added (vite-bundle-visualizer)
- [ ] Performance monitoring setup

---

## METRICS TO TRACK

### Bundle Size
| Metric | Current | Target | Achieved |
|--------|---------|--------|----------|
| Total assets | 924 KB | 460 KB | _____ |
| Main JS gzip | 123 KB | 75 KB | _____ |
| Admin chunk | 344 KB | 60 KB | _____ |
| Index chunk | 415 KB | 250 KB | _____ |

### Build Performance
| Metric | Current | Target |
|--------|---------|--------|
| Build time | 22.51s | <15s |
| Module count | 97 | 97 |
| Chunk count | 10 | 12-15 |

### Code Quality
| Metric | Current | Target |
|--------|---------|--------|
| Build score | 8/10 | 9/10 |
| Bundle score | 5/10 | 8/10 |
| Architecture score | 4/10 | 7/10 |
| Security score | 6/10 | 9/10 |

---

## COMMUNICATION TEMPLATE

### Status Update Email
```
Subject: Audit Build & Bundle CARAXE - Action Items

Build audit completed on April 16, 2026.

CURRENT STATE:
- Build: ✓ SUCCESS (922 KB assets)
- Score: 6.5/10 (target 9/10)
- Critical issues: 2 (Admin + Index chunk)
- Major issues: 3 (security + config + duplicates)

ACTION ITEMS - SPRINT 1 (2-4 days):
1. Admin.jsx refactoring (2-3 days) → -284 KB
2. Vite code splitting config (2h) → -165 KB  
3. Delete duplicate files (30min) → -697 KB disk
Total potential: -464 KB (-50%)

OWNERS:
- Admin refactoring: [NAME]
- Vite config: [NAME]
- Code review: [NAME]

TIMELINE: Sprint 1 end of week

Questions? See AUDIT_REPORT.md for details.
```

---

## RESOURCES

- Full report: `AUDIT_REPORT.md` (330 lines, FR)
- Structured issues: `AUDIT_ISSUES.json` (145 lines, parseable)
- Quick summary: `AUDIT_SUMMARY.txt` (123 lines, ASCII)
- Excel format: `AUDIT_ISSUES.csv` (8 lines, importable)
- Navigator: `README_AUDIT.md` (172 lines, this doc)

---

## SIGN-OFF

**Audit Completed:** April 16, 2026 ✓  
**Reviewed By:** ___________  
**Date:** ___________  
**Action Items Assigned:** [ ] Yes [ ] No  
**Sprint Planning:** [ ] Done [ ] Pending  

