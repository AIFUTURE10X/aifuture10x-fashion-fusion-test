
export const PERFECTCORP_BASE_URL = 'https://api.perfectcorp.com';
export const PERFECTCORP_AUTH_URL = `${PERFECTCORP_BASE_URL}/s2s/v1.0/client/auth`;
export const PERFECTCORP_FILE_URL = `${PERFECTCORP_BASE_URL}/s2s/v1.0/file`;
export const PERFECTCORP_TRYON_URL = `${PERFECTCORP_BASE_URL}/s2s/v1.0/task/clothes`;

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
