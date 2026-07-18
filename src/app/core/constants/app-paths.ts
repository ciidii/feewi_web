/**
 * REGISTRE DES CHEMINS FRONTEND (ROUTAGE)
 * Centralise les URLs de l'application pour éviter les chaînes codées en dur.
 * Le portail public n'a plus de segment slug dans l'URL : le tenant est résolu
 * par sous-domaine (prod) ou par query param/config (dev) — voir TenantResolverService.
 */
export const APP_PATHS = {
  // --- PORTAIL PUBLIC (Vitrine + Admissions) ---
  PUBLIC: {
    HOME: '/',
    RESULTS: '/resultats-examens',
    GALLERY: '/galerie',
    PRICING: '/tarifs',
    ADMISSIONS_HOME: '/admissions',
    ADMISSIONS_STEPPER: '/admissions/form-stepper',
    ADMISSIONS_TRACKER: '/admissions/tracker',
    TENANT_NOT_FOUND: '/ecole-introuvable',
  },

  // --- MONDE ADMINISTRATIF (École) ---
  ADMIN: {
    HOME: (slug: string) => `/admin/${slug}/dashboard`,
    DASHBOARD: (slug: string) => `/admin/${slug}/admissions`,
    LIST: (slug: string) => `/admin/${slug}/admissions/list`,
    DIRECT_ENTRY: (slug: string) => `/admin/${slug}/admissions/direct`,
    CONFIG: (slug: string) => `/admin/${slug}/admissions/settings`,
    DETAIL: (slug: string, id: string) => `/admin/${slug}/admissions/${id}`,

    // Autres modules
    STUDENTS: (slug: string) => `/admin/${slug}/students`,
    ACADEMIC: (slug: string) => `/admin/${slug}/classes`,
    STAFF: (slug: string) => `/admin/${slug}/identity/staff`,
  },

  // --- MONDE SAAS ADMIN (Global) ---
  SAAS: {
    DASHBOARD: '/saas/dashboard',
    TENANTS: '/saas/tenants',
    STATS: '/saas/stats',
    AUDIT: '/saas/audit',
  },

  // --- AUTHENTIFICATION ---
  AUTH: {
    LOGIN: '/auth/login',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // --- ERREURS ---
  ERRORS: {
    NOT_FOUND: '/404',
    ACCESS_DENIED: '/403',
    SERVER_ERROR: '/500',
  }
};
