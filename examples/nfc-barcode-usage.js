/**
 * NFC & Barcode Workflow Examples
 * 
 * This file demonstrates how to use the NFC read/write operations
 * and web-based data retrieval workflow.
 */

// ============================================
// Example 1: Generate QR Code URL for User
// ============================================
async function generateQRCodeForUser(userID, baseURL = 'https://api.yourdomain.com') {
  const response = await fetch(`${baseURL}/api/app/wristband/qr-url/${userID}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${yourAuthToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('QR Code URL:', result.data.qrCodeURL);
    console.log('QR Code Content:', result.data.qrCodeContent);
    
    // Use this URL to generate a QR code
    // The QR code can contain either:
    // 1. The full URL: result.data.qrCodeURL
    // 2. Just the user ID: result.data.qrCodeContent
    
    return result.data.qrCodeURL;
  }
}

// ============================================
// Example 2: Write to NFC Tag
// ============================================
async function writeToNFCTag(userID, qrCode, localData) {
  const nfcData = {
    userID: userID,
    qrCode: qrCode,
    localData: localData, // KCAD Data for offline access
    timestamp: new Date().toISOString()
  };
  
  // Write nfcData to NFC tag using NFC library
  // Example using Web NFC API:
  try {
    const ndef = new NDEFReader();
    await ndef.write({
      records: [
        {
          recordType: "text",
          data: JSON.stringify(nfcData)
        }
      ]
    });
    
    console.log('NFC tag written successfully');
    return true;
  } catch (error) {
    console.error('NFC write error:', error);
    return false;
  }
}

// ============================================
// Example 3: Read from NFC Tag
// ============================================
async function readFromNFCTag() {
  try {
    const ndef = new NDEFReader();
    await ndef.scan();
    
    ndef.onreading = (event) => {
      const { serialNumber, records } = event;
      
      for (const record of records) {
        if (record.recordType === "text") {
          const textDecoder = new TextDecoder();
          const nfcData = JSON.parse(textDecoder.decode(record.data));
          
          console.log('NFC Data:', nfcData);
          
          // Use the userID to fetch user profile from web
          fetchUserProfile(nfcData.userID);
        }
      }
    };
  } catch (error) {
    console.error('NFC read error:', error);
  }
}

// ============================================
// Example 4: Scan QR Code and Fetch User Profile
// ============================================
async function scanQRCodeAndFetchProfile(qrCodeContent, baseURL = 'https://api.yourdomain.com') {
  // qrCodeContent can be either:
  // 1. Full URL: https://api.yourdomain.com/api/app/public/user/abc123xyz456
  // 2. Just user ID: abc123xyz456
  
  let userID;
  let fetchURL;
  
  if (qrCodeContent.startsWith('http')) {
    // Full URL provided
    fetchURL = qrCodeContent;
    userID = qrCodeContent.split('/').pop();
  } else {
    // Just user ID provided
    userID = qrCodeContent;
    fetchURL = `${baseURL}/api/app/public/user/${userID}`;
  }
  
  try {
    const response = await fetch(fetchURL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('User Profile:', result.data);
      
      // Display user information
      displayUserProfile(result.data);
      
      return result.data;
    } else {
      console.error('Error:', result.message);
      return null;
    }
  } catch (error) {
    console.error('Fetch error:', error);
    return null;
  }
}

// ============================================
// Example 5: Display User Profile
// ============================================
function displayUserProfile(profileData) {
  const { user, medical, emergencyContacts, wristband } = profileData;
  
  console.log('=== USER PROFILE ===');
  console.log('Name:', user.Username);
  console.log('Email:', user.Email);
  console.log('Phone:', user.PhoneNumber);
  console.log('Photo:', user.PhotoURL);
  
  console.log('\n=== MEDICAL INFO ===');
  console.log('Blood Type:', medical?.BloodType);
  console.log('Height:', medical?.Height);
  console.log('Weight:', medical?.Weight);
  console.log('Conditions:', medical?.MedicalConditions);
  console.log('Allergies:', medical?.Allergies);
  console.log('Medications:', medical?.Medications);
  console.log('Emergency Instructions:', medical?.EmergencyInstructions);
  
  console.log('\n=== EMERGENCY CONTACTS ===');
  emergencyContacts.forEach((contact, index) => {
    console.log(`Contact ${index + 1}:`);
    console.log('  Name:', contact.ContactName);
    console.log('  Phone:', contact.phoneNumbers.join(', '));
    console.log('  Relationship:', contact.relationship);
    console.log('  Primary:', contact.isPrimary ? 'Yes' : 'No');
    console.log('  Notes:', contact.notes);
  });
  
  console.log('\n=== WRISTBAND INFO ===');
  console.log('Band ID:', wristband?.BandID);
  console.log('Serial Number:', wristband?.SerialNumber);
  console.log('QR Code:', wristband?.QRCode);
  console.log('NFC Tag:', wristband?.NFCTag);
}

// ============================================
// Example 6: Complete Workflow
// ============================================
async function completeWorkflow() {
  // Step 1: Get authenticated user's ID
  const userID = 'abc123xyz456'; // From authentication
  
  // Step 2: Generate QR code URL
  const qrCodeURL = await generateQRCodeForUser(userID);
  
  // Step 3: Write to NFC tag
  await writeToNFCTag(userID, 'QR123456', {
    name: 'John Doe',
    bloodType: 'A+',
    allergies: ['Penicillin']
  });
  
  // Step 4: Simulate scanning QR code
  await scanQRCodeAndFetchProfile(qrCodeURL);
  
  // Step 5: Simulate reading NFC tag
  await readFromNFCTag();
}

// ============================================
// Example 7: Emergency Responder Workflow
// ============================================
async function emergencyResponderWorkflow(qrCodeOrBarcode) {
  // Step 1: Scan barcode/QR code
  const scannedData = qrCodeOrBarcode;
  
  // Step 2: Fetch user profile
  const profile = await scanQRCodeAndFetchProfile(scannedData);
  
  if (!profile) {
    console.log('Unable to retrieve user profile');
    return;
  }
  
  // Step 3: Display critical information
  console.log('=== EMERGENCY INFORMATION ===');
  console.log('Patient:', profile.user.Username);
  console.log('Blood Type:', profile.medical?.BloodType);
  console.log('Allergies:', profile.medical?.Allergies);
  console.log('Emergency Instructions:', profile.medical?.EmergencyInstructions);
  
  // Step 4: Call primary emergency contact
  const primaryContact = profile.emergencyContacts.find(c => c.isPrimary);
  if (primaryContact) {
    console.log('\n=== CALL PRIMARY CONTACT ===');
    console.log('Name:', primaryContact.ContactName);
    console.log('Phone:', primaryContact.phoneNumbers[0]);
    console.log('Relationship:', primaryContact.relationship);
  }
  
  // Step 5: Log the access for safety
  console.log('\n=== ACCESS LOGGED ===');
  console.log('User ID:', profile.userID);
  console.log('Accessed At:', profile.accessedAt);
}

// ============================================
// Example 8: Hospital Admission Workflow
// ============================================
async function hospitalAdmissionWorkflow(qrCodeOrBarcode) {
  // Step 1: Scan patient's barcode/QR code
  const profile = await scanQRCodeAndFetchProfile(qrCodeOrBarcode);
  
  if (!profile) {
    console.log('Unable to retrieve patient information');
    return;
  }
  
  // Step 2: Display complete medical history
  console.log('=== PATIENT MEDICAL HISTORY ===');
  console.log('Patient:', profile.user.Username);
  console.log('Date of Birth:', profile.user.DateOfBirth);
  console.log('Gender:', profile.user.Gender);
  console.log('National ID:', profile.user.NationalID);
  
  console.log('\n=== MEDICAL CONDITIONS ===');
  if (profile.medical?.MedicalConditions) {
    profile.medical.MedicalConditions.forEach(condition => {
      console.log('-', condition);
    });
  }
  
  console.log('\n=== ALLERGIES ===');
  if (profile.medical?.Allergies) {
    profile.medical.Allergies.forEach(allergy => {
      console.log('-', allergy);
    });
  }
  
  console.log('\n=== MEDICATIONS ===');
  if (profile.medical?.Medications) {
    profile.medical.Medications.forEach(medication => {
      console.log('-', medication);
    });
  }
  
  console.log('\n=== SURGERIES ===');
  if (profile.medical?.Surgeries) {
    profile.medical.Surgeries.forEach(surgery => {
      console.log('-', surgery);
    });
  }
  
  // Step 3: Display emergency contacts
  console.log('\n=== EMERGENCY CONTACTS ===');
  profile.emergencyContacts.forEach(contact => {
    console.log(`${contact.isPrimary ? '[PRIMARY]' : '[SECONDARY]'} ${contact.ContactName}`);
    console.log(`  Phone: ${contact.phoneNumbers.join(', ')}`);
    console.log(`  Relationship: ${contact.relationship}`);
  });
}

// ============================================
// Export functions for use in other modules
// ============================================
module.exports = {
  generateQRCodeForUser,
  writeToNFCTag,
  readFromNFCTag,
  scanQRCodeAndFetchProfile,
  displayUserProfile,
  completeWorkflow,
  emergencyResponderWorkflow,
  hospitalAdmissionWorkflow
};
