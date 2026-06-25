/**
 * REGISTRE DES CHEMINS FRONTEND (ROUTAGE)
 * Centralise toutes les URLs de l'application pour éviter les chaînes codées en dur.
 * Supporte les URLs dynamiques avec injection de slug (Phase A SaaS).
 */
export const APP_PATHS = {
  // --- MONDE PUBLIC (Parents) ---
  PUBLIC: {
    HOME: (slug: string) => `/admission/${slug}`,
    STEPPER: (slug: string) => `/admission/${slug}/form-stepper`,
    TRACKER: (slug: string, ref: string = '') => `/admission/${slug}/tracker/${ref}`,
    SOFT_ENROLLMENT: (slug: string) => `/admission/${slug}/soft-enrollment`,
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
  }
};
