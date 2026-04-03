/**
 * SOURCE DE VÉRITÉ UNIQUE POUR LES ENDPOINTS API
 * Centralise tous les chemins pour faciliter la maintenance et le versioning.
 */
export const API_ENDPOINTS = {
  ENROLLMENT: {
    PUBLIC: {
      SUMMARY: '/public/config/summary',
      EFFECTIVE_CONFIG: (levelId?: string) => 
        levelId ? `/public/config/${levelId}` : '/public/config/default',
      CREATE: '/public/applications',
      RE_ENROLL: '/public/applications/re-enroll',
      CANDIDATE: (id: string) => `/public/applications/${id}/candidate`,
      GUARDIANS: (id: string) => `/public/applications/${id}/guardians`,
      CUSTOM_FIELDS: (id: string) => `/public/applications/${id}/custom-fields`,
      SUBSCRIPTIONS: (id: string) => `/public/applications/${id}/subscriptions`,
      DOCUMENTS: (id: string, docCode: string) => `/public/applications/${id}/documents/${docCode}`,
      SUBMIT: (id: string) => `/public/applications/${id}/submit`,
      CANCEL: (id: string) => `/public/applications/${id}/cancel`,
      TRACK: (ref: string) => `/public/applications/${ref}/track`,
    },
    ADMIN: {
      APPLICATIONS: '/admin/applications',
      APPLICATIONS_SEARCH: '/admin/applications/search',
      APPLICATION_DETAILS: (id: string) => `/admin/applications/${id}/details`,
      CONFIG: '/admin/config',
      PORTAL_STATUS: '/admin/config/portal-status',
      LEVEL_OVERRIDE: (levelId: string) => `/admin/config/level-overrides/${levelId}`,
      RECEIVE_DOCUMENT: (appId: string, docCode: string) => 
        `/admin/applications/${appId}/documents/${docCode}/receive`,
      LINK_DOCUMENT: (appId: string, docCode: string) => 
        `/admin/applications/${appId}/documents/${docCode}`,
      VERIFY_APPLICATION: (appId: string) => `/admin/applications/${appId}/verify`,
      SUBMIT_ASSESSMENT: (appId: string) => `/admin/applications/${appId}/assessment`,
      UPDATE_TRACKER_MSG: (appId: string) => `/admin/applications/${appId}/tracker-message`,
      
      // API DIRECTION
      VALIDATE_ADMISSION: (appId: string) => `/admin/direction/applications/${appId}/validate`,
      REJECT_ADMISSION: (appId: string) => `/admin/direction/applications/${appId}/reject`,
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
