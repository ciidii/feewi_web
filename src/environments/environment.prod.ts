import {Environment} from './environment.interface';

export const environment: Environment = {
  production: true,
  apiUrl: 'https://api.feewi.com',
  apiVersion: 'v1',
  appName: 'Feewi Education',

  logLevel: 'error',
  devTenantSlug: '',
  services: {
    enrollment: '/api/v1/enrollment',
    identity: '/api/v1',
    academic: '/api/v1/academic',
    school: '/api/v1/schools',
    documents: '/documents/api/v1/documents',
    student: '/student/api/v1',
    notifications: '/api/v1/notifications',
    billing: '/api/v1/billing'
    },
  features: {
    enableAnalytics: true,
    enableDebugTools: false,
    enableMockApi: false,
  }
};
