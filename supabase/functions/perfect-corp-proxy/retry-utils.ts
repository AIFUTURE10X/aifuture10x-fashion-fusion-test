// Enhanced retry logic with exponential backoff

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  context: string = 'operation'
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 [${context}] Attempt ${attempt}/${maxRetries}`);
      return await operation();
    } catch (error) {
      lastError = error;
      console.error(`❌ [${context}] Attempt ${attempt} failed:`, error.message);
      
      // Don't retry on certain types of errors
      if (error.message.includes('401') || error.message.includes('403') || error.message.includes('400')) {
        console.log(`🚫 [${context}] Not retrying due to client error`);
        break;
      }
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        console.log(`⏱️ [${context}] Waiting ${Math.round(delay)}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}