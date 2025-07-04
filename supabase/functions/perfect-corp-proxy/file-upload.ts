
import { tryReferenceUploadPattern, tryMultipartUpload, tryMinimalUpload } from './upload-strategies.ts';
import { validateAccessToken, logUploadStart } from './upload-validation.ts';

export async function uploadUserPhoto(accessToken: string, userPhotoData: ArrayBuffer): Promise<string> {
  console.log('🚀 [Upload Manager] Starting user photo upload process...');
  logUploadStart(accessToken, userPhotoData);
  
  if (accessToken === 'mock_token_for_testing') {
    console.log('🎭 [Upload Manager] Mock mode: Simulating photo upload');
    return 'mock_file_id_12345';
  }
  
  // Enhanced token validation
  validateAccessToken(accessToken);
  
  console.log('🔄 [Upload Manager] Attempting upload with multiple strategies...');
  
  // Strategy 1: Use the enhanced reference upload pattern with File API v1.0
  try {
    console.log('🎯 [Upload Manager] Strategy 1: Reference upload pattern (File API v1.0)');
    const result = await tryReferenceUploadPattern(accessToken, userPhotoData);
    console.log('✅ [Upload Manager] Strategy 1 succeeded with file_id:', result);
    return result;
  } catch (primaryError) {
    console.error('❌ [Upload Manager] Strategy 1 failed:', primaryError.message);
    console.error('📋 [Upload Manager] Strategy 1 error details:', primaryError);
    
    // Strategy 2: Try multipart approach
    try {
      console.log('🔄 [Upload Manager] Strategy 2: Multipart upload approach');
      const result = await tryMultipartUpload(accessToken, userPhotoData);
      console.log('✅ [Upload Manager] Strategy 2 succeeded with file_id:', result);
      return result;
    } catch (secondaryError) {
      console.error('❌ [Upload Manager] Strategy 2 failed:', secondaryError.message);
      console.error('📋 [Upload Manager] Strategy 2 error details:', secondaryError);
      
      // Strategy 3: Last resort with minimal headers
      try {
        console.log('🔄 [Upload Manager] Strategy 3: Minimal headers approach');
        const result = await tryMinimalUpload(accessToken, userPhotoData);
        console.log('✅ [Upload Manager] Strategy 3 succeeded with file_id:', result);
        return result;
      } catch (tertiaryError) {
        console.error('❌ [Upload Manager] All upload strategies failed');
        console.error('📋 [Upload Manager] Complete error summary:', {
          strategy1: primaryError.message,
          strategy2: secondaryError.message,
          strategy3: tertiaryError.message,
          imageSize: userPhotoData.byteLength,
          tokenLength: accessToken.length
        });
        
        // Create a comprehensive error message
        const errorDetails = [
          `Strategy 1 (Reference): ${primaryError.message}`,
          `Strategy 2 (Multipart): ${secondaryError.message}`,
          `Strategy 3 (Minimal): ${tertiaryError.message}`
        ].join(' | ');
        
        throw new Error(`All upload methods failed. Details: ${errorDetails}`);
      }
    }
  }
}
