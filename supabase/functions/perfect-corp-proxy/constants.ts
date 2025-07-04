
// Multiple base URLs to test - Perfect Corp may have changed endpoints
export const PERFECTCORP_BASE_URLS = [
  'https://yce-api-01.perfectcorp.com',
  'https://api.perfectcorp.com', 
  'https://yce-api.perfectcorp.com',
  'https://s2s-api.perfectcorp.com'
];

export const PERFECTCORP_BASE_URL = PERFECTCORP_BASE_URLS[0];

// API endpoints with multiple versions to test
export const API_VERSIONS = ['v1.0', 'v1.1', 'v2.0'];

// Dynamic endpoint generation
export const getAuthUrl = (baseUrl: string, version: string = 'v1.0') => 
  `${baseUrl}/s2s/${version}/client/auth`;

export const getFileApiUrl = (baseUrl: string, version: string = 'v1.0') => 
  `${baseUrl}/s2s/${version}/file`;

export const getTryOnUrl = (baseUrl: string, version: string = 'v1.0') => 
  `${baseUrl}/s2s/${version}/task/clothes-tryon`;

// Legacy constants for backward compatibility
export const PERFECTCORP_AUTH_URL = getAuthUrl(PERFECTCORP_BASE_URL);
export const PERFECTCORP_FILE_API_URL = getFileApiUrl(PERFECTCORP_BASE_URL);
export const PERFECTCORP_USER_PHOTO_URL = getFileApiUrl(PERFECTCORP_BASE_URL);
export const PERFECTCORP_CLOTHING_URL = `${getFileApiUrl(PERFECTCORP_BASE_URL)}/clothes-tryon`;
export const PERFECTCORP_TRYON_URL = getTryOnUrl(PERFECTCORP_BASE_URL);

// Alternative endpoints
export const PERFECTCORP_ALT_FILE_API_URL = getFileApiUrl(PERFECTCORP_BASE_URL, 'v1.1');
export const PERFECTCORP_ALT_TRYON_URL = getTryOnUrl(PERFECTCORP_BASE_URL, 'v1.1');

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
