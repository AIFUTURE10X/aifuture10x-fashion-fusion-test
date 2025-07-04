export const enhanceErrorMessage = (errorMessage: string): string => {
  if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
    return "Perfect Corp API endpoint not found. The service may be temporarily unavailable or API endpoints have changed.";
  } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
    return "Authentication failed with Perfect Corp. Please check API credentials or try again later.";
  } else if (errorMessage.includes('timeout') || errorMessage.includes('TIMEOUT')) {
    return "Request timed out. The AI processing is taking longer than expected. Please try again.";
  } else if (errorMessage.toLowerCase().includes("fetch") || errorMessage.includes('network')) {
    return "Unable to connect to the try-on service. Please check your connection and try again.";
  } else if (errorMessage.toLowerCase().includes("file_id") || errorMessage.includes('upload')) {
    return "Image processing failed. The clothing image may need to be re-uploaded or the file format is not supported.";
  } else if (errorMessage.toLowerCase().includes("authentication") || errorMessage.includes('token')) {
    return "Authentication failed. API credentials may be invalid or expired.";
  } else if (errorMessage.includes('endpoint') || errorMessage.includes('service')) {
    return "Perfect Corp service is currently unavailable. Please try again in a few minutes.";
  }
  
  return errorMessage;
};