export const BLOOD_GROUPS = [
  'A+', 'A-', 
  'B+', 'B-', 
  'AB+', 'AB-', 
  'O+', 'O-'
];

export const BLOOD_GROUP_COMPATIBILITY = {
  'A+': { canDonateTo: ['A+', 'AB+'], canReceiveFrom: ['A+', 'A-', 'O+', 'O-'] },
  'A-': { canDonateTo: ['A+', 'A-', 'AB+', 'AB-'], canReceiveFrom: ['A-', 'O-'] },
  'B+': { canDonateTo: ['B+', 'AB+'], canReceiveFrom: ['B+', 'B-', 'O+', 'O-'] },
  'B-': { canDonateTo: ['B+', 'B-', 'AB+', 'AB-'], canReceiveFrom: ['B-', 'O-'] },
  'AB+': { canDonateTo: ['AB+'], canReceiveFrom: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  'AB-': { canDonateTo: ['AB+', 'AB-'], canReceiveFrom: ['A-', 'B-', 'AB-', 'O-'] },
  'O+': { canDonateTo: ['O+', 'A+', 'B+', 'AB+'], canReceiveFrom: ['O+', 'O-'] },
  'O-': { canDonateTo: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], canReceiveFrom: ['O-'] }
};

export const BLOOD_GROUP_COLORS = {
  'A+': 'bg-red-100 text-red-800',
  'A-': 'bg-red-50 text-red-700',
  'B+': 'bg-blue-100 text-blue-800',
  'B-': 'bg-blue-50 text-blue-700',
  'AB+': 'bg-purple-100 text-purple-800',
  'AB-': 'bg-purple-50 text-purple-700',
  'O+': 'bg-green-100 text-green-800',
  'O-': 'bg-green-50 text-green-700'
};