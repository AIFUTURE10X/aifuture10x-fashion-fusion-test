
// Input validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): string[] => {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return errors;
};

export const validateFileUpload = (file: File): string[] => {
  const errors: string[] = [];
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (file.size > maxSize) {
    errors.push('File size must be less than 5MB');
  }
  
  if (!allowedTypes.includes(file.type)) {
    errors.push('File must be a JPEG, PNG, or WebP image');
  }
  
  return errors;
};

export const sanitizeInput = (input: string): string => {
  // Remove potentially dangerous characters
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/[<>]/g, '')
              .trim();
};

export const validateClothingItem = (item: {
  name: string;
  brand?: string;
  price?: number;
  garment_category: string;
}): string[] => {
  const errors: string[] = [];
  
  if (!item.name || item.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  if (item.name && item.name.length > 100) {
    errors.push('Name must be less than 100 characters');
  }
  
  if (item.brand && item.brand.length > 50) {
    errors.push('Brand name must be less than 50 characters');
  }
  
  if (item.price !== undefined && (item.price < 0 || item.price > 10000)) {
    errors.push('Price must be between 0 and 10,000');
  }
  
  if (!item.garment_category || item.garment_category.trim().length === 0) {
    errors.push('Category is required');
  }
  
  return errors;
};
