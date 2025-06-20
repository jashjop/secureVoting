export const validateBnmitEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@bnmit\.in$/;
  return emailRegex.test(email);
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '');
};

export const validateCandidateName = (name: string): boolean => {
  // Only allow alphabets and spaces
  const nameRegex = /^[a-zA-Z\s]+$/;
  return nameRegex.test(name.trim()) && name.trim().length > 0;
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
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
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const isValidElectionDate = (startDate: string, endDate: string): boolean => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  
  return start > now && end > start;
};

export const validateIPAddress = (ip: string): boolean => {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
};

export const detectSuspiciousActivity = (logs: any[]): boolean => {
  // Check for multiple failed login attempts
  const recentFailedLogins = logs.filter(log => 
    log.type === 'invalid_access' && 
    new Date(log.timestamp) > new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
  );
  
  return recentFailedLogins.length > 3;
};

export const validateSessionIntegrity = (session: any): boolean => {
  if (!session || !session.sessionId || !session.voterToken) {
    return false;
  }
  
  // Check if session is expired
  if (new Date(session.expiresAt) < new Date()) {
    return false;
  }
  
  return true;
};