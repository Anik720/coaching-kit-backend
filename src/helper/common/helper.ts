// common/utils/helpers.ts

/**
 * Generate a random 6-digit registration ID
 */
export function generateRegistrationId(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Validate Bangladeshi mobile number
 */
export function isValidBangladeshiMobile(mobile: string): boolean {
  const regex = /^01[3-9]\d{8}$/;
  return regex.test(mobile);
}

/**
 * Calculate age from birth date
 */
export function calculateAge(birthDate: Date): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Format date to DD/MM/YYYY
 */
export function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}