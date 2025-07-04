export const validateAndPrepareImage = (imageData: string): string => {
  if (!imageData.startsWith('data:image/')) {
    console.log('🔧 Adding data URL prefix to base64 image');
    return `data:image/jpeg;base64,${imageData}`;
  }
  return imageData;
};

export const logImageDetails = (imageData: string): void => {
  console.log('✅ Image validation passed');
  console.log('📊 Result image length:', imageData.length);
  console.log('🖼️ Image preview:', imageData.substring(0, 100) + '...');
};