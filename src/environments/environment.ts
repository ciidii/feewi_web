import {Environment} from './environment.interface';

export const environment: Environment = {
  production: false,
  apiUrl: '',
  apiVersion: 'v1',
  appName: 'Feewi',
  logLevel: 'debug',
  services: {
    enrollment: '/enrollment/api/v1',
    identity: '/api/v1',
    academic: '/api/v1/academic',
    school: '/api/v1/schools',
    documents: '/documents/api/v1/documents',
    student: '/student/api/v1',
    notifications: '/api/v1/notifications'
  },
  features: {
    enableAnalytics: false,
    enableDebugTools: true,
    enableMockApi: false,
  }
};
