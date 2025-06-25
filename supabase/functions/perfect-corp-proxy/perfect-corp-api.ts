import { AuthResult } from './types.ts';
import { uploadUserPhoto } from './file-upload.ts';
import { startTryOnTask } from './try-on.ts';
import { pollTaskCompletion } from './polling.ts';
import { downloadResultImage } from './download.ts';

// Re-export functions for backward compatibility
export { uploadUserPhoto, startTryOnTask, pollTaskCompletion, downloadResultImage };

// Keep the authentication function here since it's already in auth.ts
// This is just for backward compatibility
export { authenticateWithPerfectCorp } from './auth.ts';
