
import { tryReferenceUploadPattern, tryMultipartUpload, tryMinimalUpload } from './upload-strategies.ts';
import { validateAccessToken, logUploadStart } from './upload-validation.ts';

export async function uploadUserPhoto(accessToken: string, userPhotoData: ArrayBuffer): Promise<string> {
  logUploadStart(accessToken, userPhotoData);
  
  if (accessToken === 'mock_token_for_testing') {
    console.log('🎭 Mock mode: Simulating photo upload');
    return 'mock_file_id_12345';
  }
  
  // Enhanced token validation
  validateAccessToken(accessToken);
  
  // Strategy 1: Use the exact same endpoint that works for reference uploads
  try {
    console.log('🎯 Strategy 1: Using reference upload pattern (/s2s/v1.0/file)');
    return await tryReferenceUploadPattern(accessToken, userPhotoData);
  } catch (primaryError) {
    console.log('❌ Strategy 1 failed:', primaryError.message);
    
    // Strategy 2: Try with different content type
    try {
      console.log('🔄 Strategy 2: Trying with multipart/form-data');
      return await tryMultipartUpload(accessToken, userPhotoData);
    } catch (secondaryError) {
      console.log('❌ Strategy 2 failed:', secondaryError.message);
      
      // Strategy 3: Last resort with minimal headers
      try {
        console.log('🔄 Strategy 3: Minimal headers approach');
        return await tryMinimalUpload(accessToken, userPhotoData);
      } catch (tertiaryError) {
        console.log('❌ All upload strategies failed');
        console.error('Strategy 1 error:', primaryError.message);
        console.error('Strategy 2 error:', secondaryError.message);
        console.error('Strategy 3 error:', tertiaryError.message);
        
        throw new Error(`All upload methods failed. Last error: ${tertiaryError.message}`);
      }
    }
  }
}
