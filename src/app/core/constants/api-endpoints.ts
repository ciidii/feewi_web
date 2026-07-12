/**
 * SOURCE DE VÉRITÉ UNIQUE POUR LES ENDPOINTS API
 * Centralise tous les chemins pour faciliter la maintenance et le versioning.
 * Mis à jour pour API v8 selon ENROLLEMENT_API_ENDPOINTS.md
 */
export const API_ENDPOINTS = {
  ENROLLMENT: {
    PUBLIC: {
      // Config
      SUMMARY: '/public/config/summary',
      DEFAULT_CONFIG: '/public/config/default',
      EFFECTIVE_CONFIG: (levelId: string) => `/public/config/${levelId}`,

      // Admissons / Bundles
      CREATE_BUNDLE: '/public/admissions/bundles',
      GET_BUNDLE: (id: string) => `/public/admissions/bundles/${id}`,
      GET_BUNDLE_BY_REF: (ref: string) => `/public/admissions/bundles/ref/${ref}`,
      ADD_CHILD: (bundleId: string) => `/public/admissions/bundles/${bundleId}/children`,
      UPDATE_PILLAR: (id: string, pillarKey: string) => `/public/admissions/${id}/pillars/${pillarKey}`,
      UPDATE_BUNDLE_PILLAR: (bundleId: string, pillarKey: string) => `/public/admissions/bundles/${bundleId}/pillars/${pillarKey}`,
      RE_ENROLL: '/public/admissions/re-enroll',
      RE_ENROLL_ELIGIBILITY: '/public/admissions/re-enroll/eligibility',
      SUBSCRIPTIONS: (id: string) => `/public/admissions/${id}/subscriptions`,
      DOCUMENTS: (id: string, docCode: string) => `/public/admissions/${id}/documents/${docCode}`,
      MINE: '/public/admissions/mine',
      TRACK: (ref: string) => `/public/admissions/${ref}/track`,
      SUBMIT_ADMISSION: (id: string) => `/public/admissions/${id}/submit`,
      SUBMIT_BUNDLE: (bundleId: string) => `/public/admissions/bundles/${bundleId}/submit`,
      CONFIRM_ADMITTED: (bundleId: string) => `/public/admissions/bundles/${bundleId}/confirm-admitted`,
      CANCEL_ALL: (bundleId: string) => `/public/admissions/bundles/${bundleId}/cancel-all`,
      CANCEL: (id: string) => `/public/admissions/${id}/cancel`,
      DELETE_ADMISSION: (id: string) => `/public/admissions/${id}`,
      DELETE_BUNDLE: (bundleId: string) => `/public/admissions/bundles/${bundleId}`,
    },
    ADMIN: {
      // Configuration
      CONFIG: '/admin/config',
      PORTAL_STATUS: '/admin/config/portal-status',
      YEAR_OVERRIDE: (yearId: string) => `/admin/config/year-overrides/${yearId}`,
      CYCLE_OVERRIDE: (cycleType: string) => `/admin/config/cycle-overrides/${cycleType}`,
      LEVEL_OVERRIDE: (levelId: string) => `/admin/config/level-overrides/${levelId}`,
      CONFIG_RESET: '/admin/config/reset',

      // Admissions
      ADMISSIONS: '/admin/admissions',
      ADMISSION_DETAILS: (id: string) => `/admin/admissions/${id}/details`,
      DIRECT_ENTRY: '/admin/admissions/direct',
      ASSESSMENT: (id: string) => `/admin/admissions/${id}/assessment`,
      RECEIVE_DOCUMENT: (id: string, docCode: string) => `/admin/admissions/${id}/documents/${docCode}/receive`,
      VERIFY: (id: string) => `/admin/admissions/${id}/verify`,
      CANCEL: (id: string) => `/admin/admissions/${id}/cancel`,
      CONFIRM_PAYMENT: (id: string) => `/admin/admissions/${id}/payment/confirm`,
      DASHBOARD_STATS: '/admin/stats/dashboard',

      // Direction
      ADMIT: (id: string) => `/admin/direction/admissions/${id}/admit`,
      VALIDATE: (id: string) => `/admin/direction/admissions/${id}/validate`,
      OVERRULE: (id: string) => `/admin/direction/admissions/${id}/overrule`,
      REJECT: (id: string) => `/admin/direction/admissions/${id}/reject`,
      WAITLIST: (id: string) => `/admin/direction/admissions/${id}/waitlist`,
      BULK_VALIDATE: '/admin/direction/admissions/bulk-validate',
    }
  },

  ACADEMIC: {
    YEARS: '/years',
    CURRENT_YEAR: '/years/current',
    LEVELS: '/levels',
    FILIERES: '/filieres',
    CYCLES: '/cycles',
  },

  SCHOOL: {
    PUBLIC_INFO: (tenantId: string) => `/public/${tenantId}`,
  },

  DOCUMENTS: {
    UPLOAD_TICKET: '/upload-ticket',
    VIEW: (fileId: string) => `/${fileId}/view`,
  }
};
