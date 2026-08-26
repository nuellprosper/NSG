/**
 * Universal Deep Linking & Android App Links Handler
 * Base Domain: https://nuellstudyguide.name.ng/
 * Handles /course/:id, /quiz/:id, /tools/:toolId, ?quizId=..., ?courseId=...
 */

import { useEffect, useCallback } from 'react';
import { App } from '@capacitor/app';
import { isNativePlatform } from './platform';

export const APP_BASE_DOMAIN = 'https://nuellstudyguide.name.ng';

export interface ParsedDeepLink {
  rawUrl: string;
  route: string;
  courseId?: string;
  quizId?: string;
  toolId?: string;
  queryParams: Record<string, string>;
}

/**
 * Parses any incoming App Link, Universal Link, or Custom URL Scheme into structured navigation parameters
 */
export function parseUniversalDeepLink(urlStr: string): ParsedDeepLink {
  let cleanUrl = urlStr.trim();

  // Normalize custom schemes (nsg:// or nsgscholar://) to standard domain
  if (cleanUrl.startsWith('nsgscholar://')) {
    cleanUrl = cleanUrl.replace('nsgscholar://', `${APP_BASE_DOMAIN}/`);
  } else if (cleanUrl.startsWith('nsg://')) {
    cleanUrl = cleanUrl.replace('nsg://', `${APP_BASE_DOMAIN}/`);
  }

  let parsed: URL;
  try {
    parsed = new URL(cleanUrl, APP_BASE_DOMAIN);
  } catch (e) {
    parsed = new URL(`${APP_BASE_DOMAIN}/${cleanUrl.replace(/^\/+/, '')}`);
  }

  const pathname = parsed.pathname || '/';
  const queryParams: Record<string, string> = {};
  parsed.searchParams.forEach((val, key) => {
    queryParams[key] = val;
  });

  let courseId = queryParams['courseId'] || queryParams['course'] || undefined;
  let quizId = queryParams['quizId'] || queryParams['quiz'] || undefined;
  let toolId = queryParams['tool'] || undefined;

  // Path-based parsing: /course/:id or /courses/:id
  const coursePathMatch = pathname.match(/^\/courses?\/([a-zA-Z0-9_-]+)/i);
  if (coursePathMatch) {
    courseId = coursePathMatch[1];
  }

  // Path-based parsing: /quiz/:id or /quizzes/:id
  const quizPathMatch = pathname.match(/^\/quizz?e?s?\/([a-zA-Z0-9_-]+)/i);
  if (quizPathMatch) {
    quizId = quizPathMatch[1];
  }

  // Path-based parsing: /tools/:toolId
  const toolMatch = pathname.match(/^\/tools\/([a-zA-Z0-9_-]+)/i);
  if (toolMatch) {
    toolId = toolMatch[1];
  }

  return {
    rawUrl: urlStr,
    route: pathname,
    courseId,
    quizId,
    toolId,
    queryParams
  };
}

/**
 * Generate shareable Universal App Links for Courses, Quizzes, and Tools
 */
export function generateDeepLinkUrl(type: 'course' | 'quiz' | 'tool' | 'grammar', id?: string): string {
  switch (type) {
    case 'course':
      return `${APP_BASE_DOMAIN}/course/${id || ''}`;
    case 'quiz':
      return `${APP_BASE_DOMAIN}/quiz/${id || ''}`;
    case 'grammar':
      return `${APP_BASE_DOMAIN}/tools/grammar`;
    case 'tool':
      return `${APP_BASE_DOMAIN}/tools/${id || ''}`;
    default:
      return APP_BASE_DOMAIN;
  }
}

/**
 * React Hook for Universal Deep Linking & Android App Links
 */
export function useUniversalDeepLinking(onNavigate: (link: ParsedDeepLink) => void) {
  const handleUrl = useCallback((urlStr: string) => {
    if (!urlStr) return;
    console.log('🔗 [Deep Link Caught]:', urlStr);
    const parsed = parseUniversalDeepLink(urlStr);
    onNavigate(parsed);
  }, [onNavigate]);

  useEffect(() => {
    // 1. Native Capacitor listener for when app is launched via App Link
    if (isNativePlatform()) {
      const listenerPromise = App.addListener('appUrlOpen', (data) => {
        if (data?.url) {
          handleUrl(data.url);
        }
      });

      return () => {
        listenerPromise.then(l => l.remove()).catch(() => {});
      };
    }

    // 2. Web browser URL query / path handler on initial page load
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.href;
      const parsed = parseUniversalDeepLink(currentUrl);
      if (parsed.courseId || parsed.quizId || parsed.toolId) {
        handleUrl(currentUrl);
      }
    }
  }, [handleUrl]);
}
