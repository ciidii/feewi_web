import {Environment} from './environment.interface';

export const environment: Environment = {
  production: false,
  apiUrl: '',
  apiVersion: 'v1',
  appName: 'Feewi',
  logLevel: 'debug',
  devTenantSlug: 'all-cycle',
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
    enableAnalytics: false,
    enableDebugTools: true,
    enableMockApi: false,
  }
};
