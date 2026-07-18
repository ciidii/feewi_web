import {InjectionToken} from '@angular/core';

export const ENVIRONMENT_CONFIG = new InjectionToken<Environment>('ENVIRONMENT_CONFIG');

export interface Environment {
  production: boolean;
  apiUrl: string;
  apiVersion: string;
  appName: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  /** Slug d'école utilisé en dernier recours pour résoudre le tenant public en développement local (pas de sous-domaine sur localhost). */
  devTenantSlug: string;
  services: {
    enrollment: string;
    identity: string;
    academic: string;
    school: string;
    documents: string;
    student: string;
    notifications: string;
    billing: string;
  };
  features: {
    enableAnalytics: boolean;
    enableDebugTools: boolean;
    enableMockApi: boolean;
  };
}
