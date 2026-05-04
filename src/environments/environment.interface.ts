import {InjectionToken} from '@angular/core';

export const ENVIRONMENT_CONFIG = new InjectionToken<Environment>('ENVIRONMENT_CONFIG');

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
    student: string;
  };
  features: {
    enableAnalytics: boolean;
    enableDebugTools: boolean;
    enableMockApi: boolean;
  };
}
