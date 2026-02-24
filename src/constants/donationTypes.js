export const DONATION_TYPES = [
  { value: 'Whole Blood', label: 'Whole Blood', minInterval: 56, description: 'Standard blood donation' },
  { value: 'Platelets', label: 'Platelets', minInterval: 7, description: 'For cancer patients and surgeries' },
  { value: 'Plasma', label: 'Plasma', minInterval: 28, description: 'Can be donated frequently' },
  { value: 'Double Red Cells', label: 'Double Red Cells', minInterval: 112, description: 'Double red blood cell donation' },
  { value: 'Auto Donation', label: 'Auto Donation', minInterval: 56, description: 'Donating for yourself before surgery' }
];

export const DONATION_TYPE_COLORS = {
  'Whole Blood': 'bg-red-100 text-red-800',
  'Platelets': 'bg-yellow-100 text-yellow-800',
  'Plasma': 'bg-blue-100 text-blue-800',
  'Double Red Cells': 'bg-purple-100 text-purple-800',
  'Auto Donation': 'bg-gray-100 text-gray-800'
};