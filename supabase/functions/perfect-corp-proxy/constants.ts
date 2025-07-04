
// Official Perfect Corp API base URLs for endpoint discovery
export const PERFECTCORP_BASE_URLS = [
  'https://yce-api-01.perfectcorp.com',
  'https://yce-api.perfectcorp.com',
  'https://api.perfectcorp.com'
];

// API versions to test during endpoint discovery
export const API_VERSIONS = ['v1', 'v2', ''];

// Primary API base URL (fallback)
export const PERFECTCORP_BASE_URL = PERFECTCORP_BASE_URLS[0];

// Official Perfect Corp API endpoints (based on yce.perfectcorp.com documentation)
export const PERFECTCORP_AUTH_URL = `${PERFECTCORP_BASE_URL}/auth`;
export const PERFECTCORP_FILE_API_URL = `${PERFECTCORP_BASE_URL}/file/clothes`;
export const PERFECTCORP_TRYON_URL = `${PERFECTCORP_BASE_URL}/task/clothes`;

// Helper functions for endpoint discovery
export function getAuthUrl(baseUrl: string, version: string): string {
  return version ? `${baseUrl}/${version}/auth` : `${baseUrl}/auth`;
}

export function getFileApiUrl(baseUrl: string, version: string): string {
  return version ? `${baseUrl}/${version}/file/clothes` : `${baseUrl}/file/clothes`;
}

export function getTryOnUrl(baseUrl: string, version: string): string {
  return version ? `${baseUrl}/${version}/task/clothes` : `${baseUrl}/task/clothes`;
}


export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MIN_IMAGE_SIZE = 1024; // 1KB
export const MAX_POLL_ATTEMPTS = 60; // 60 seconds
export const POLL_INTERVAL = 1000; // 1 second

export const SUPPORTED_IMAGE_FORMATS = ['jpeg', 'jpg', 'png', 'webp'];
export const SUPPORTED_CLOTHING_CATEGORIES = [
  'upper_body',
  'lower_body',
  'full_body',
  'dress',
  'outerwear'
];
