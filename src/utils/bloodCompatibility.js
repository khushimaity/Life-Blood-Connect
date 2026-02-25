// Blood type compatibility matrix
export const BLOOD_COMPATIBILITY = {
  // Can DONATE to (universal donor)
  'O-': { canDonateTo: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], canReceiveFrom: ['O-'] },
  'O+': { canDonateTo: ['O+', 'A+', 'B+', 'AB+'], canReceiveFrom: ['O-', 'O+'] },
  'A-': { canDonateTo: ['A-', 'A+', 'AB-', 'AB+'], canReceiveFrom: ['O-', 'A-'] },
  'A+': { canDonateTo: ['A+', 'AB+'], canReceiveFrom: ['O-', 'O+', 'A-', 'A+'] },
  'B-': { canDonateTo: ['B-', 'B+', 'AB-', 'AB+'], canReceiveFrom: ['O-', 'B-'] },
  'B+': { canDonateTo: ['B+', 'AB+'], canReceiveFrom: ['O-', 'O+', 'B-', 'B+'] },
  'AB-': { canDonateTo: ['AB-', 'AB+'], canReceiveFrom: ['O-', 'A-', 'B-', 'AB-'] },
  'AB+': { canDonateTo: ['AB+'], canReceiveFrom: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'] } // Universal recipient
};

// Check if donor can donate to patient
export const canDonateTo = (donorBloodGroup, patientBloodGroup) => {
  if (!donorBloodGroup || !patientBloodGroup) return false;
  return BLOOD_COMPATIBILITY[donorBloodGroup]?.canDonateTo.includes(patientBloodGroup) || false;
};

// Check if patient can receive from donor
export const canReceiveFrom = (patientBloodGroup, donorBloodGroup) => {
  if (!patientBloodGroup || !donorBloodGroup) return false;
  return BLOOD_COMPATIBILITY[patientBloodGroup]?.canReceiveFrom.includes(donorBloodGroup) || false;
};

// Get all compatible donors for a patient
export const getCompatibleDonors = (patientBloodGroup, allDonors) => {
  return allDonors.filter(donor => 
    canDonateTo(donor.bloodGroup, patientBloodGroup)
  );
};

// Get all patients a donor can donate to
export const getCompatiblePatients = (donorBloodGroup, allPatients) => {
  return allPatients.filter(patient => 
    canDonateTo(donorBloodGroup, patient.bloodGroup)
  );
};

// Compatibility description
export const getCompatibilityDescription = (donorBlood, patientBlood) => {
  if (donorBlood === patientBlood) {
    return "Perfect match - same blood type";
  }
  
  if (canDonateTo(donorBlood, patientBlood)) {
    return `Compatible - ${donorBlood} can donate to ${patientBlood}`;
  }
  
  return `Incompatible - ${donorBlood} cannot donate to ${patientBlood}`;
};

// Get compatibility color for UI
export const getCompatibilityColor = (donorBlood, patientBlood) => {
  if (!donorBlood || !patientBlood) return 'gray';
  if (donorBlood === patientBlood) return 'green';
  if (canDonateTo(donorBlood, patientBlood)) return 'blue';
  return 'red';
};