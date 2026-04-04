import { Environment } from './environment.interface';

export const environment: Environment = {
  production: true,
  apiUrl: 'https://api.feewi.com',
  apiVersion: 'v1',
  appName: 'Feewi Education',
  logLevel: 'error',
  services: {
    enrollment: '/enrollment/api/v1',
    identity: '/api/v1',
    academic: '/api/v1/academic',
    school: '/api/v1/schools',
    documents: '/documents/api/v1/documents',
    student: '/student/api/v1'
  },
  features: {
    enableAnalytics: true,
    enableDebugTools: false,
    enableMockApi: false,
  }
};
