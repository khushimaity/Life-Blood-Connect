// Debug imports - check what's actually being imported
import * as bloodGroups from './bloodGroups.js';
console.log('Blood groups import:', bloodGroups);

// ONLY named exports - no default export
export { 
  BLOOD_GROUPS, 
  BLOOD_GROUP_COMPATIBILITY, 
  BLOOD_GROUP_COLORS 
} from './bloodGroups.js';

export { 
  CENTER_TYPES, 
  CENTER_CATEGORIES 
} from './centerTypes.js';

export { 
  DONATION_TYPES, 
  DONATION_TYPE_COLORS 
} from './donationTypes.js';

export { 
  GENDER_OPTIONS 
} from './genderOptions.js';

export { 
  REQUEST_PRIORITIES, 
  PRIORITY_ORDER 
} from './priorities.js';

export { 
  REQUEST_REASONS, 
  REASON_COLORS 
} from './requestReasons.js';

export { 
  REQUEST_STATUSES, 
  DONATION_STATUSES, 
  INVENTORY_STATUSES 
} from './statuses.js';

// Constants
export const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'];
export const INDIAN_STATES = ['Kerala', 'Tamil Nadu', 'Karnataka', 'Other'];
export const KERALA_DISTRICTS = ['Kollam', 'Ernakulam', 'Thiruvananthapuram'];
export const COLLEGES = ['TKM College of Engineering', 'CET'];
export const YEARS_OF_STUDY = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
export const USER_ROLES = { DONOR: 'donor', ADMIN: 'admin' };

// API Base URL - Use environment variable with fallback
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Blood type compatibility matrix - define it here directly to avoid import issues
export const BLOOD_COMPATIBILITY = {
  'A+': { canDonateTo: ['A+', 'AB+'], canReceiveFrom: ['A+', 'A-', 'O+', 'O-'] },
  'A-': { canDonateTo: ['A+', 'A-', 'AB+', 'AB-'], canReceiveFrom: ['A-', 'O-'] },
  'B+': { canDonateTo: ['B+', 'AB+'], canReceiveFrom: ['B+', 'B-', 'O+', 'O-'] },
  'B-': { canDonateTo: ['B+', 'B-', 'AB+', 'AB-'], canReceiveFrom: ['B-', 'O-'] },
  'AB+': { canDonateTo: ['AB+'], canReceiveFrom: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  'AB-': { canDonateTo: ['AB+', 'AB-'], canReceiveFrom: ['A-', 'B-', 'AB-', 'O-'] },
  'O+': { canDonateTo: ['O+', 'A+', 'B+', 'AB+'], canReceiveFrom: ['O+', 'O-'] },
  'O-': { canDonateTo: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], canReceiveFrom: ['O-'] }
};