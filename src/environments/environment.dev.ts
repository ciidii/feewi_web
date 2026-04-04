import { Environment } from './environment.interface';

export const environment: Environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  apiVersion: 'v1',
  appName: 'Feewi Education - LOCAL',
  logLevel: 'debug',
  services: {
    enrollment: '/enrollment/api/v1',
    identity: '/api/v1',
    academic: '/api/v1/academic',
    school: '/api/v1/schools',
    documents: '/documents/api/v1/documents',
    student: '/student/api/v1'
    },
  features: {
    enableAnalytics: false,
    enableDebugTools: true,
    enableMockApi: false,
  }
};
