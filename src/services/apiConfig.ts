import { Capacitor } from '@capacitor/core';

export type RuntimeEnvironment =
  | 'browser-development'
  | 'browser-production'
  | 'capacitor-development'
  | 'capacitor-production';

export interface ApiEnvironmentInfo {
  runtime: RuntimeEnvironment;
  isNative: boolean;
  isDev: boolean;
  configuredBaseUrl?: string;
  resolvedOrigin: string;
}

/**
 * Inspects and returns the runtime environment info strictly distinguishing between:
 * - browser development
 * - browser production
 * - Capacitor development
 * - Capacitor production
 */
export function getApiEnvironment(): ApiEnvironmentInfo {
  const isNative = typeof window !== 'undefined' ? Capacitor.isNativePlatform() : false;
  const isDev = Boolean((import.meta as any).env?.DEV);

  const rawUrl = (
    (import.meta as any).env?.VITE_API_BASE_URL ||
    (import.meta as any).env?.VITE_SERVER_URL ||
    ''
  );
  const configuredBaseUrl = typeof rawUrl === 'string' ? rawUrl.trim().replace(/\/$/, '') : '';

  let runtime: RuntimeEnvironment;
  if (isNative) {
    runtime = isDev ? 'capacitor-development' : 'capacitor-production';
  } else {
    runtime = isDev ? 'browser-development' : 'browser-production';
  }

  const defaultWebOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  return {
    runtime,
    isNative,
    isDev,
    configuredBaseUrl: configuredBaseUrl || undefined,
    resolvedOrigin: configuredBaseUrl || defaultWebOrigin
  };
}

/**
 * Centralized API URL resolution utility.
 * 
 * Safety & Architecture guarantees:
 * - Browser Dev & Prod: Relative paths route cleanly to the same-origin Express/Vite server.
 * - Capacitor Dev: Requires VITE_API_BASE_URL (or VITE_SERVER_URL). Fails safely with clear developer feedback.
 * - Capacitor Prod: STRICTLY FORBIDS silent fallback to relative URLs or localhost origins.
 *   If no valid production API base URL is configured, fails clearly with a developer-facing
 *   configuration error:
 *   "API_BASE_URL is not configured for the native production build."
 */
export function apiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const env = getApiEnvironment();

  if (env.isNative) {
    if (!env.configuredBaseUrl) {
      const errorMsg = `[NSG API Configuration Error]: API_BASE_URL is not configured for the ${
        env.isDev ? 'Capacitor development' : 'native production'
      } build. Please set VITE_API_BASE_URL in your build environment before deploying or running native builds.`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    return `${env.configuredBaseUrl}${cleanPath}`;
  }

  // Web Browser environment:
  // If an external backend proxy or URL is explicitly defined, use it;
  // otherwise keep relative path for same-origin routing.
  if (env.configuredBaseUrl) {
    return `${env.configuredBaseUrl}${cleanPath}`;
  }

  return cleanPath;
}
