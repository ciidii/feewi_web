export interface Environment {
  production: boolean;
  apiUrl: string;
  apiVersion: string;
  appName: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  services: {
    enrollment: string;
    identity: string;
    academic: string;
    school: string;
    documents: string;
  };
  features: {
    enableAnalytics: boolean;
    enableDebugTools: boolean;
    enableMockApi: boolean;
  };
}
