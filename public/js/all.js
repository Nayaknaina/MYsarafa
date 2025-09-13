// OTP Input Handler Class (from second code)
class OTPInputHandler {
  constructor(selector) {
    if (selector) {
      this.selector = selector;
      this.inputs = document.querySelectorAll(selector);
      if (this.inputs.length) {
        this.inputIndex = 0;
        this.numericPattern = /^[0-9]$/;
        this.attachEventHandlers();
      } else {
        console.error("No elements found for the provided selector!");
      }
    }
  }

  attachEventHandlers() {
    this.inputs.forEach((input) => {
      input.addEventListener("keydown", this.handleKeyDown.bind(this));
      input.addEventListener("paste", this.handlePaste.bind(this));
    });
  }

  handleKeyDown(e) {
    if (e.ctrlKey || e.metaKey) {
      return;
    } else {
      e.preventDefault();
    }

    this.inputIndex = this.getInputIndex(e.target);

    switch (e.key) {
      case "ArrowLeft":
        this.moveFocusLeft();
        break;
      case "ArrowRight":
        this.moveFocusRight();
        break;
      case "Backspace":
      case "Delete":
        this.inputs[this.inputIndex].value = "";
        if (e.key === "Backspace") {
          this.moveFocusLeft();
        }
        break;
      case "Home":
        this.moveFocus(-this.inputIndex);
        break;
      case "End":
        this.moveFocus(this.inputs.length - this.inputIndex - 1);
        break;
      default:
        if (!this.allFilled() && this.numericPattern.test(e.key)) {
          if (this.isEmptyInput(this.inputIndex)) {
            this.inputs[this.inputIndex].value = e.key;
          }
          if (this.isEmptyInput(this.inputIndex + 1)) {
            this.moveFocusRight();
          }
        }
        break;
    }
  }

  handlePaste(e) {
    e.preventDefault();
    this.inputIndex = this.getInputIndex(e.target);
    const pasteData = e.clipboardData
      .getData("text/plain")
      .slice(0, this.inputs.length - this.inputIndex)
      .split("");

    if (pasteData) {
      if (!pasteData.every((value) => this.numericPattern.test(value))) {
        return;
      }
      pasteData.forEach((value, i) => {
        const targetIndex = this.inputIndex + i;
        if (targetIndex < this.inputs.length) {
          this.setInputValue(targetIndex, value);
        }
      });
    }
  }

  isEmptyInput(inputIndex) {
    return inputIndex < this.inputs.length && this.inputs[inputIndex].value === "";
  }

  setInputValue(inputIndex, value) {
    if (inputIndex >= 0 && inputIndex < this.inputs.length) {
      this.inputs[inputIndex].value = value;
    }
  }

  moveFocus(direction) {
    const nextIndex = Math.min(
      Math.max(this.inputIndex + direction, 0),
      this.inputs.length - 1
    );
    this.inputs[nextIndex].focus();
    this.inputs[nextIndex].select();
  }

  moveFocusLeft() {
    this.moveFocus(-1);
  }

  moveFocusRight() {
    this.moveFocus(1);
  }

  allFilled() {
    return Array.from(this.inputs).every((input) => input.value !== "");
  }

  getInputIndex(input) {
    return Array.from(this.inputs).indexOf(input);
  }

  getOTP() {
    return Array.from(this.inputs)
      .map((input) => input.value)
      .join("");
  }

  onInputEvent(callback) {
    if (!this.selector) {
      console.error("Selector is not defined!");
      return;
    }
    this.inputs.forEach((input) => {
      input.addEventListener("keydown", () => callback(this.getOTP()));
      input.addEventListener("paste", () => callback(this.getOTP()));
    });
  }
}
const searchInput = document.querySelector('.search-input');
const joinBtn = document.querySelector('.join-btn');
const communityDropdown = document.querySelector('.community-name');
const moreDropdown = document.querySelector('.nav-item.dropdown');

// console.log('Community Dropdown Element:', communityDropdown);
// console.log('More Dropdown Element:', moreDropdown);
const verifyMobileModal = document.getElementById('verifyMobileModal');
const verifyMobileForm = document.getElementById('verifyMobileForm');
const sendOtpBtn = document.getElementById('sendOtpBtn');
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
const setPasswordBtn = document.getElementById('setPasswordBtn');
const mobileInput = document.getElementById('mobile_no');
const otpInput = document.getElementById('otp');
const otpLabel = document.getElementById('otp-label');
const passwordError = document.getElementById('passwordError');
const resendOtpBtn = document.getElementById('resendOtpBtn');
const mobileError = document.getElementById('mobileError');
const otpSection = document.getElementById('otpSection');
const resendSection = document.getElementById('resendSection');
const otpModal = document.getElementById('otpModal');
const modalContent = document.getElementById('modalContent');
const successCode = document.getElementById('success-code');
const errorCode = document.getElementById('error-code');
const modalOtpCode = document.getElementById('modalOtpCode');
// const copyCodeBtn = document.getElementById('copyCodeBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const mobileSection = document.getElementById('mobileSection');
const passwordSection = document.getElementById('passwordSection');
const formLoader = document.getElementById('formLoader');
const formError = document.getElementById('formError');

// Members Page Logic
const addMemberModal = document.getElementById('addMemberModal');
const addNewBtn = document.getElementById('addNewBtn');
const closeAddMemberModal = document.getElementById('closeAddMemberModal');
const addMemberForm = document.getElementById('addMemberForm');
const sendInviteBtn = document.getElementById('sendInviteBtn');
const formErrorMember = document.getElementById('formError');
const membersTableBody = document.getElementById('membersTableBody');
const tableLoader = document.getElementById('tableLoader');
const filterBtn = document.getElementById('filterBtn');
const filterForm = document.getElementById('filterForm');
const searchName = document.getElementById('searchName');
const searchGroup = document.getElementById('searchGroup');
const closeInvitationModal = document.getElementById('closeInvitationModal');
  const closeInvitationModalBtn = document.getElementById('closeInvitationModalBtn');
  const copyLinkBtn = document.getElementById('copyLinkBtn');
  const shareBtn = document.getElementById('shareBtn');
  const sharePlatforms = document.getElementById('sharePlatforms');
  const shareWhatsApp = document.getElementById('shareWhatsApp');
  const shareEmail = document.getElementById('shareEmail');
  const shareOther = document.getElementById('shareOther');
  const invitationName = document.getElementById('invitationName');
  const invitationEmail = document.getElementById('invitationEmail');
  const invitationLinkDisplay = document.getElementById('invitationLink');
  const invitationPassword = document.getElementById('invitationPassword');
  const downloadCsvBtn = document.getElementById('downloadCsvBtn');
  const sampleCsvBtn = document.getElementById('sampleCsvBtn');
  const uploadCsvForm = document.getElementById('uploadCsvForm');
  const uploadCsvInput = document.getElementById('csvFileInput');
  const downloadCsvForm = document.getElementById('downloadCsvForm');
  const blacklistForm = document.getElementById('blacklistForm');
  const blacklistReason = document.getElementById('blacklistReason');
  const submitBlacklistBtn = document.getElementById('submitBlacklistBtn');
  const closeBlacklistModal = document.getElementById('closeBlacklistModal');
    const invitationModal = document.getElementById('invitationModal');

    const invitationNameNew = document.getElementById('invitationNameNew');
    const invitationGroupName = document.getElementById('invitationGroupName');
    const invitationGroupNameNew = document.getElementById('invitationGroupNameNew');
    const existingUserMessage = document.getElementById('existingUserMessage');
    const newUserRecipient = document.getElementById('newUserRecipient');
    const newUserGroup = document.getElementById('newUserGroup');
    const invitationLinkLabel = document.getElementById('invitationLinkLabel');
    const invitationPasswordLabel = document.getElementById('invitationPasswordLabel');
    const modalTitle = document.getElementById('modalTitle');
  const blacklistModal = document.getElementById('blacklistModal');
  let currentBlacklistData = {};
// Search Functionality
document.addEventListener('DOMContentLoaded', () => {
  const menuItems = document.querySelectorAll('.menu-item');
  const currentPath = window.location.pathname;

  menuItems.forEach(item => {
    const itemPath = new URL(item.href).pathname;

    // Add active class if href matches current URL
    if (itemPath === currentPath) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
});

searchInput.addEventListener('input', function () {
  const searchTerm = this.value.toLowerCase();
  console.log(`Searching for: ${searchTerm}`);

  // Here you would implement actual search functionality
  // For demo purposes, we'll just log the search term
  if (searchTerm.length > 2) {
    // Simulate search results
    console.log('Search results would appear here');
  }
});

if (joinBtn) {
  joinBtn.addEventListener('click', function () {
    console.log('Join meeting clicked');

    // Simulate joining a meeting
    this.textContent = 'Joining...';
    this.disabled = true;

    setTimeout(() => {
      this.textContent = 'Joined';
      this.style.backgroundColor = '#10b981';

      // Update the status badge
      const statusBadge = document.querySelector('.status-badge.green');
      if (statusBadge) {
        statusBadge.textContent = 'Meeting in progress';
        statusBadge.style.backgroundColor = '#fbbf24';
      }
    }, 2000);
  });
}

// Dropdown Handlers
communityDropdown.addEventListener('click', function () {
  console.log('Community dropdown clicked');
  // Here you would show a dropdown menu
  showDropdown(this, ['Sarafa Community', 'Tech Community', 'Business Community']);
});

moreDropdown.addEventListener('click', function () {
  console.log('More dropdown clicked');
  // Here you would show a dropdown menu
  showDropdown(this, ['Settings', 'Help', 'About', 'Logout']);
});

// Generic Dropdown Function
function showDropdown(element, items) {
  // Remove existing dropdown
  const existingDropdown = document.querySelector('.custom-dropdown');
  if (existingDropdown) {
    existingDropdown.remove();
    return;
  }

  const dropdown = document.createElement('div');
  dropdown.className = 'custom-dropdown';
  dropdown.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 100;
        min-width: 150px;
        margin-top: 4px;
    `;

  items.forEach(item => {
    const dropdownItem = document.createElement('div');
    dropdownItem.style.cssText = `
            padding: 8px 12px;
            cursor: pointer;
            color: #374151;
            border-bottom: 1px solid #f3f4f6;
        `;
    dropdownItem.textContent = item;

    dropdownItem.addEventListener('mouseenter', function () {
      this.style.backgroundColor = '#f3f4f6';
    });

    dropdownItem.addEventListener('mouseleave', function () {
      this.style.backgroundColor = 'transparent';
    });

    dropdownItem.addEventListener('click', function () {
      console.log(`Selected: ${item}`);
      dropdown.remove();
    });

    dropdown.appendChild(dropdownItem);
  });

  // Position dropdown relative to clicked element
  element.style.position = 'relative';
  element.appendChild(dropdown);

  // Close dropdown when clicking outside
  setTimeout(() => {
    document.addEventListener('click', function closeDropdown(e) {
      if (!element.contains(e.target)) {
        dropdown.remove();
        document.removeEventListener('click', closeDropdown);
      }
    });
  }, 0);
}

// Simulate real-time updates
// function simulateRealTimeUpdates() {
//     // Update member count occasionally
//     setInterval(() => {
//         const memberCount = document.querySelector('.stat-number');
//         const currentCount = parseInt(memberCount.textContent);
//         const newCount = currentCount + Math.floor(Math.random() * 3);
//         memberCount.textContent = newCount;
//     }, 30000); // Update every 30 seconds

// Update meeting status
// setTimeout(() => {
//     const statusBadge = document.querySelector('.status-badge.green');
//     if (statusBadge && statusBadge.textContent === 'Starts in 10 minutes') {
//         statusBadge.textContent = 'Starts in 5 minutes';
//         statusBadge.style.backgroundColor = '#fbbf24';
//     }
// }, 10000); // Update after 10 seconds


// Initialize real-time updates
// if (document.querySelector('.stat-number') || document.querySelector('.status-badge.green')) {
//     simulateRealTimeUpdates();
// }

let mobileMenuToggleBtn = null;

function createMobileMenuToggle() {
  const sidebar = document.querySelector('.sidebar');
  const headerLeft = document.querySelector('.header-left');
  if (!sidebar || !headerLeft) return;

  if (window.innerWidth <= 768) {
    if (!mobileMenuToggleBtn) {
      mobileMenuToggleBtn = document.createElement('button');
      mobileMenuToggleBtn.className = 'mobile-menu-toggle-btn';
      mobileMenuToggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
      mobileMenuToggleBtn.style.cssText = `
                background: none;
                color: white;
                border: none;
                padding: 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 20px;
                z-index: 1101;
            `;
      mobileMenuToggleBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        sidebar.classList.toggle('open');
        document.body.classList.toggle('sidebar-open');
      });
      headerLeft.prepend(mobileMenuToggleBtn);
    }
    sidebar.classList.remove('open');
    sidebar.style.display = 'block';
    mobileMenuToggleBtn.style.display = 'block';
  } else {
    if (mobileMenuToggleBtn) {
      mobileMenuToggleBtn.style.display = 'none';
    }
    sidebar.classList.remove('open');
    sidebar.style.display = 'block';
  }
}

window.addEventListener('load', createMobileMenuToggle);
window.addEventListener('resize', createMobileMenuToggle);

document.addEventListener('click', function (e) {
  const sidebar = document.querySelector('.sidebar');
  if (
    sidebar &&
    sidebar.classList.contains('open') &&
    !sidebar.contains(e.target) &&
    (!mobileMenuToggleBtn || (e.target !== mobileMenuToggleBtn && !mobileMenuToggleBtn.contains(e.target)))
  ) {
    sidebar.classList.remove('open');
    document.body.classList.remove('sidebar-open');
  }
});

console.log('Community Dashboard initialized successfully!');

// document.addEventListener('DOMContentLoaded', function () {
//   // console.log('DOMContentLoaded fired');
//   // console.log('kycForm element:', document.getElementById('kycForm'));

//   // Initialize KYC form if on KYC page
//   // if (document.getElementById('kycForm')) {
//   //   console.log('Initializing KYC form...');
//   //   showStep(1);
//   //   updateProgress();

//   //   // Handle form submission
//   //   document.getElementById('kycForm').addEventListener('submit', function (e) {
//   //     e.preventDefault();

//   //     if (validateStep(3)) {
//   //       // Submit the form
//   //       alert('KYC form submitted successfully!');
//   //       // Here you would typically send the data to your server
//   //     }
//   //   });
//   // } else {
//   //   console.log('KYC form not found on this page');
//   // }
// });


const membersTable = document.querySelector('.members-table tbody');

// if (addNewBtn && addMemberModal && closeAddMemberModal && addMemberForm) {
//   addNewBtn.onclick = () => { addMemberModal.style.display = 'flex'; };
//   closeAddMemberModal.onclick = () => { addMemberModal.style.display = 'none'; };
//   addMemberModal.onclick = (e) => {
//     if (e.target === addMemberModal) addMemberModal.style.display = 'none';
//   };

//   addMemberForm.onsubmit = function (e) {
//     e.preventDefault();

//     // Get form values
//     const name = document.getElementById('memberName').value.trim();
//     const mobileNumber = document.getElementById('memberNumber').value.trim();
//     const email = document.getElementById('memberEmail').value.trim();

//     // Validate required fields
//     if (!name || !mobileNumber || !email) {
//       alert('Please fill in all required fields');
//       return;
//     }

//     // Validate email format
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       alert('Please enter a valid email address');
//       return;
//     }

//     // Generate invitation link
//     const invitationLink = generateInvitationLink(name, email);
//   showInvitationModal(name, email, invitationLink);
//     // // Send invitation email
//     // sendInvitationEmail(name, email, invitationLink);

//     // Show success message
//     alert(`Invitation sent successfully to ${email}!`);

//     // Close modal and reset form
//     addMemberModal.style.display = 'none';
//     addMemberForm.reset();
//   };
// }

// Email invitation functions
function generateInvitationLink(name, email) {
  // Generate a unique token for the invitation
  const token = btoa(`${name}-${email}-${Date.now()}`).replace(/[^a-zA-Z0-9]/g, '');
  const baseUrl = window.location.origin + window.location.pathname.replace('Index.html', '');
  return `${baseUrl}signup.html?invite=${token}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`;
}

function sendInvitationEmail(name, email, invitationLink) {
  // Create email content
  const emailSubject = "You're invited to join Sarafa Community!";
  const emailBody = `
Dear ${name},

You have been invited to join the Sarafa Community!

Please click the following link to complete your registration:
${invitationLink}

This invitation link is valid for 7 days.

Best regards,
Sarafa Community Team
  `.trim();

  // Method 1: Try to use mailto link (opens user's default email client)
  const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  // Try to open the default email client
  try {
    window.open(mailtoLink, '_blank');
  } catch (error) {
    console.log('Could not open email client:', error);
  }

  // Method 2: Copy invitation link to clipboard for manual sending
  navigator.clipboard.writeText(invitationLink).then(() => {
    console.log('Invitation link copied to clipboard');
  }).catch(err => {
    console.log('Could not copy to clipboard:', err);
  });

  // Method 3: Show the invitation link in a modal for manual copying
  showInvitationModal(name, email, invitationLink);
}

function showInvitationModal(name, email, invitationLink) {
  // Create modal to show invitation details
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
  `;

  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white;
    padding: 24px;
    border-radius: 8px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
  `;

  modalContent.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h3 style="margin: 0; color: #1f2937;">Invitation Sent Successfully!</h3>
      <button onclick="this.closest('.invitation-modal').remove()" style="
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #6b7280;
      ">&times;</button>
    </div>
    
    <div style="margin-bottom: 16px;">
      <p style="margin: 8px 0; color: #374151;"><strong>Recipient:</strong> ${name} (${email})</p>
      <p style="margin: 8px 0; color: #374151;"><strong>Invitation Link:</strong></p>
      <div class="invitation-link-display">${invitationLink}</div>
    </div>
    
    <div class="invitation-actions">
      <button onclick="copyInvitationLink('${invitationLink}')" class="copy-btn">Copy Link</button>
      
      <button onclick="window.open('mailto:${email}?subject=${encodeURIComponent('You\'re invited to join Sarafa Community!')}&body=${encodeURIComponent(`Dear ${name},\n\nYou have been invited to join the Sarafa Community!\n\nPlease click the following link to complete your registration:\n${invitationLink}\n\nThis invitation link is valid for 7 days.\n\nBest regards,\nSarafa Community Team`)}', '_blank')" class="email-btn">Send Email</button>
      
      <button onclick="this.closest('.invitation-modal').remove()" class="close-btn">Close</button>
    </div>
  `;

  modal.className = 'invitation-modal';
  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // Close modal when clicking outside
  modal.addEventListener('click', function (e) {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

function copyInvitationLink(link) {
  navigator.clipboard.writeText(link).then(() => {
    // Show a more user-friendly notification
    showNotification('Invitation link copied to clipboard!', 'success');
  }).catch(err => {
    console.log('Could not copy to clipboard:', err);
    showNotification('Could not copy to clipboard. Please copy the link manually.', 'error');
  });
}

function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 6px;
    color: white;
    font-weight: 500;
    z-index: 3000;
    animation: slideInRight 0.3s ease-out;
    max-width: 300px;
    word-wrap: break-word;
  `;

  // Set background color based on type
  if (type === 'success') {
    notification.style.backgroundColor = '#10b981';
  } else if (type === 'error') {
    notification.style.backgroundColor = '#ef4444';
  } else {
    notification.style.backgroundColor = '#2f95ff';
  }

  notification.textContent = message;
  document.body.appendChild(notification);

  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease-in';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Add CSS animations for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(notificationStyles);

const func = (a, b) => a + b;



// KYC Step-by-Step Form Functions
let currentStep = 1;
const totalSteps = 3;

function nextStep(step) {
  console.log('nextStep called with step:', step);
  alert('nextStep function called with step: ' + step);

  // Simple validation
  const currentSection = document.querySelector(`[data-step="${step}"]`);
  if (!currentSection) {
    alert('Section not found!');
    return;
  }

  const requiredInputs = currentSection.querySelectorAll('input[required]');
  let hasEmptyField = false;

  requiredInputs.forEach(input => {
    if (!input.value.trim()) {
      input.style.borderColor = 'red';
      hasEmptyField = true;
    } else {
      input.style.borderColor = '#d1d5db';
    }
  });

  if (hasEmptyField) {
    alert('Please fill in all required fields before proceeding.');
    return;
  }

  // Move to next step
  if (step < totalSteps) {
    currentStep = step + 1;

    // Hide all sections
    document.querySelectorAll('.kyc-section').forEach(section => {
      section.style.display = 'none';
    });

    // Show current section
    const nextSection = document.querySelector(`[data-step="${currentStep}"]`);
    if (nextSection) {
      nextSection.style.display = 'block';
    }

    updateProgress();
  }
}

function prevStep(step) {
  if (step > 1) {
    currentStep = step - 1;

    // Hide all sections
    document.querySelectorAll('.kyc-section').forEach(section => {
      section.style.display = 'none';
    });

    // Show current section
    const prevSection = document.querySelector(`[data-step="${currentStep}"]`);
    if (prevSection) {
      prevSection.style.display = 'block';
    }

    updateProgress();
  }
}

function updateProgress() {
  document.querySelectorAll('.progress-step').forEach((step, index) => {
    const stepNumber = index + 1;
    step.classList.remove('active', 'completed');

    if (stepNumber < currentStep) {
      step.classList.add('completed');
    } else if (stepNumber === currentStep) {
      step.classList.add('active');
    }
  });
}

function validateStep(step) {
  const currentSection = document.querySelector(`[data-step="${step}"]`);
  const inputs = currentSection.querySelectorAll('input[required]');

  let isValid = true;

  inputs.forEach(input => {
    if (!input.value.trim()) {
      input.style.borderColor = '#ef4444';
      isValid = false;
    } else {
      input.style.borderColor = '#d1d5db';
    }
  });

  if (!isValid) {
    alert('Please fill in all required fields before proceeding.');
  }

  return isValid;
}

function saveStepData(step) {
  // Save form data to localStorage (optional)
  const currentSection = document.querySelector(`[data-step="${step}"]`);
  const formData = new FormData();

  currentSection.querySelectorAll('input').forEach(input => {
    if (input.value) {
      formData.append(input.name, input.value);
    }
  });

  // You can store this data or send it to server
  console.log(`Step ${step} data saved`);
}

// KYC Form Functionality
document.addEventListener('DOMContentLoaded', function () {
  // Add Worker functionality
  const addWorkerBtn = document.getElementById('addWorkerBtn');
  const workersContainer = document.getElementById('workersContainer');
  const numWorkersInput = document.getElementById('numWorkers');

  if (addWorkerBtn && workersContainer) {
    addWorkerBtn.addEventListener('click', function () {
      addWorkerField();
    });
  }

  // Update number of workers when adding/removing workers
  if (numWorkersInput) {
    numWorkersInput.addEventListener('input', function () {
      const numWorkers = parseInt(this.value) || 0;
      updateWorkersFields(numWorkers);
    });
  }

  // KYC Form submission
  const kycForm = document.getElementById('kycForm');
  if (kycForm) {
    kycForm.addEventListener('submit', function (e) {
      e.preventDefault();
      // handleKYCSubmission();
    });
  }
});

// Function to add a worker field
function addWorkerField() {
  const workersContainer = document.getElementById('workersContainer');
  const workerIndex = workersContainer.children.length;

  const workerField = document.createElement('div');
  workerField.className = 'worker-field';
  workerField.innerHTML = `
        <div class="form-group">
            <label for="workerName${workerIndex}">Worker Name</label>
            <input type="text" id="workerName${workerIndex}" name="workerName${workerIndex}" class="kyc-input" placeholder="Enter worker name">
        </div>
        <div class="form-group">
            <label for="workerPhone${workerIndex}">Phone Number</label>
            <input type="tel" id="workerPhone${workerIndex}" name="workerPhone${workerIndex}" class="kyc-input" placeholder="Enter phone number">
        </div>
        <button type="button" class="remove-worker-btn" onclick="removeWorkerField(this)">
            <i class="fas fa-trash"></i> Remove
        </button>
    `;

  workersContainer.appendChild(workerField);

  // Update the number of workers input
  const numWorkersInput = document.getElementById('numWorkers');
  if (numWorkersInput) {
    numWorkersInput.value = workersContainer.children.length;
  }
}

// Function to remove a worker field
function removeWorkerField(button) {
  const workerField = button.closest('.worker-field');
  workerField.remove();

  // Update the number of workers input
  const workersContainer = document.getElementById('workersContainer');
  const numWorkersInput = document.getElementById('numWorkers');
  if (numWorkersInput && workersContainer) {
    numWorkersInput.value = workersContainer.children.length;
  }
}

// Function to update workers fields based on number input
function updateWorkersFields(numWorkers) {
  const workersContainer = document.getElementById('workersContainer');
  if (!workersContainer) return;

  const currentWorkers = workersContainer.children.length;

  if (numWorkers > currentWorkers) {
    // Add more workers
    for (let i = currentWorkers; i < numWorkers; i++) {
      addWorkerField();
    }
  } else if (numWorkers < currentWorkers) {
    // Remove workers
    const workersToRemove = currentWorkers - numWorkers;
    for (let i = 0; i < workersToRemove; i++) {
      const lastWorker = workersContainer.lastElementChild;
      if (lastWorker) {
        lastWorker.remove();
      }
    }
  }
}

// Function to handle KYC form submission
// function handleKYCSubmission() {
//   // Get form data
//   const formData = new FormData(document.getElementById('kycForm'));
//   const formObject = {};

//   for (let [key, value] of formData.entries()) {
//     formObject[key] = value;
//   }

//   // Validate required fields
//   const requiredFields = ['fullName', 'dob', 'nationality', 'state', 'city', 'postalCode', 'address', 'shopOwner', 'shopName', 'shopAddress', 'aadhaarCard', 'shopLicence', 'panCard'];
//   const missingFields = [];

//   requiredFields.forEach(field => {
//     if (!formObject[field] || formObject[field].trim() === '') {
//       missingFields.push(field);
//     }
//   });

//   if (missingFields.length > 0) {
//     alert('Please fill in all required fields: ' + missingFields.join(', '));
//     return;
//   }

//   // Validate file uploads
//   const fileFields = ['aadhaarCard', 'shopLicence', 'panCard'];
//   const missingFiles = [];

//   fileFields.forEach(field => {
//     const fileInput = document.getElementById(field);
//     if (!fileInput.files || fileInput.files.length === 0) {
//       missingFiles.push(field);
//     }
//   });

//   if (missingFiles.length > 0) {
//     alert('Please upload all required documents: ' + missingFiles.join(', '));
//     return;
//   }

//   // Show success message
//   alert('KYC form submitted successfully! Your application is under review.');

//   // Reset form
//   document.getElementById('kycForm').reset();

//   // Clear workers container
//   const workersContainer = document.getElementById('workersContainer');
//   if (workersContainer) {
//     workersContainer.innerHTML = '';
//   }

//   // Reset number of workers
//   const numWorkersInput = document.getElementById('numWorkers');
//   if (numWorkersInput) {
//     numWorkersInput.value = '';
//   }
// }

// User avatar dropdown logic
const userAvatar = document.getElementById('userAvatar');
const avatarDropdown = document.getElementById('avatarDropdown');

if (userAvatar && avatarDropdown) {
  userAvatar.addEventListener('click', function (event) {
    event.stopPropagation();
    avatarDropdown.style.display = avatarDropdown.style.display === 'block' ? 'none' : 'block';
  });
  document.addEventListener('click', function () {
    avatarDropdown.style.display = 'none';
  });
  // Prevent closing when clicking inside dropdown
  avatarDropdown.addEventListener('click', function (event) {
    event.stopPropagation();
  });
}



document.addEventListener('DOMContentLoaded', function () {
  const profileBtn = document.getElementById('profileDetailsBtn');
  const profileModal = document.getElementById('profileModal');
  const closeProfileModal = document.getElementById('closeProfileModal');

  if (profileBtn && profileModal && closeProfileModal) {
    profileBtn.onclick = () => { profileModal.style.display = 'flex'; };
    closeProfileModal.onclick = () => { profileModal.style.display = 'none'; };
    profileModal.onclick = (e) => {
      if (e.target === profileModal) profileModal.style.display = 'none';
    };
  }
});



// verify mobile number modal and to set new pswd
document.addEventListener('DOMContentLoaded', function () {
  //   if (verifyMobileModal && verifyMobileForm) {
  //     // Prevent modal from being closed
  //     verifyMobileModal.addEventListener('click', (e) => {
  //         if (e.target === verifyMobileModal) {
  //             e.preventDefault();
  //         }
  //     });

  //     if (sendOtpBtn) {
  //         sendOtpBtn.addEventListener('click', async () => {
  //             const mobile_no = mobileInput.value;
  //               console.log("mobile_no",mobile_no)
  //             if (!/^\d{10}$/.test(mobile_no)) {
  //                 mobileError.textContent = 'Please enter a valid 10-digit mobile number';
  //                 mobileError.style.display = 'block';
  //                 return;
  //             }
  //              console.log("we are here")
  //             try {
  //                 const response = await fetch('/auth/send-otp', {
  //                     method: 'POST',
  //                     headers: {
  //                         'Content-Type': 'application/json'
  //                     },
  //                     body: JSON.stringify({ mobile_no }),
  //                     credentials: 'include'
  //                 });

  //                 const result = await response.json();
  //                 if (response.ok) {
  //                     mobileError.style.display = 'none';
  //                     mobileInput.style.display = 'none';
  //                     sendOtpBtn.style.display = 'none';
  //                     otpLabel.style.display = 'block';
  //                     otpInput.style.display = 'block';
  //                     verifyOtpBtn.style.display = 'block';
  //                 } else {
  //                     mobileError.textContent = result.message;
  //                     mobileError.style.display = 'block';
  //                 }
  //             } catch (error) {
  //                 mobileError.textContent = 'Error sending OTP: ' + error.message;
  //                 mobileError.style.display = 'block';
  //             }
  //         });
  //     }

  //     if (verifyOtpBtn) {
  //         verifyOtpBtn.addEventListener('click', async () => {
  //             const otp = otpInput.value;
  //             if (!otp || otp.length !== 6) {
  //                 mobileError.textContent = 'Please enter a valid 6-digit OTP';
  //                 mobileError.style.display = 'block';
  //                 return;
  //             }

  //             try {
  //                 const response = await fetch('/auth/verify-otp', {
  //                     method: 'POST',
  //                     headers: {
  //                         'Content-Type': 'application/json'
  //                     },
  //                     body: JSON.stringify({ otp }),
  //                     credentials: 'include'
  //                 });

  //                 const result = await response.json();
  //                 if (response.ok) {
  //                     mobileError.style.display = 'none';
  //                     window.location.reload(); // Reload to update modal state
  //                 } else {
  //                     mobileError.textContent = result.message;
  //                     mobileError.style.display = 'block';
  //                 }
  //             } catch (error) {
  //                 mobileError.textContent = 'Error verifying OTP: ' + error.message;
  //                 mobileError.style.display = 'block';
  //             }
  //         });
  //     }

  //     if (setPasswordBtn) {
  //         verifyMobileForm.addEventListener('submit', async (e) => {
  //             e.preventDefault();
  //             const password = document.getElementById('newPassword').value;
  //             const confirmPassword = document.getElementById('confirmPassword').value;

  //             if (password !== confirmPassword) {
  //                 passwordError.textContent = 'Passwords do not match';
  //                 passwordError.style.display = 'block';
  //                 return;
  //             }

  //             if (password.length < 6) {
  //                 passwordError.textContent = 'Password must be at least 6 characters';
  //                 passwordError.style.display = 'block';
  //                 return;
  //             }

  //             try {
  //                 const response = await fetch('/auth/set-password', {
  //                     method: 'POST',
  //                     headers: {
  //                         'Content-Type': 'application/json'
  //                     },
  //                     body: JSON.stringify({ password }),
  //                     credentials: 'include'
  //                 });

  //                 const result = await response.json();
  //                 if (response.ok) {
  //                     passwordError.style.display = 'none';
  //                     window.location.reload(); // Reload to close modal
  //                 } else {
  //                     passwordError.textContent = result.message;
  //                     passwordError.style.display = 'block';
  //                 }
  //             } catch (error) {
  //                 passwordError.textContent = 'Error setting password: ' + error.message;
  //                 passwordError.style.display = 'block';
  //             }
  //         });
  //     }
  // }
  if (verifyMobileModal && verifyMobileForm) {
    const otpInput = new OTPInputHandler('.otp-input');

    // Prevent modal from being closed by clicking outside
    verifyMobileModal.addEventListener('click', (e) => {
      if (e.target === verifyMobileModal) {
        e.preventDefault();
      }
    });
    function closeModal() {
      if (modalContent && otpModal) {
        modalContent.classList.remove('scale-100');
        modalContent.classList.add('scale-75');
        setTimeout(() => {
          otpModal.classList.remove('opacity-100', 'visible');
          otpModal.classList.add('opacity-0', 'invisible');
        }, 200);
      }
    }

    fetch('/auth/user', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    })
      .then(response => response.json())
      .then(data => {
        console.log("User status", data.user);
        if (data.user && data.user.mobile_verified && data.user.has_password) {
          verifyMobileModal.style.display = 'none';
        } else {
          verifyMobileModal.style.display = 'flex';
          if (data.user.mobile_verified && !data.user.has_password) {
            mobileSection.classList.add('hidden');
            passwordSection.classList.remove('hidden');
          }
        }
      })
      .catch(error => {
        console.error('Error fetching user status:', error);
      });

    // Enable/disable Send OTP button
    if (mobileInput && sendOtpBtn) {
      mobileInput.addEventListener('input', () => {
        const mobile_no = mobileInput.value;
        sendOtpBtn.disabled = !/^\d{10}$/.test(mobile_no);
      });
    }

    // Send OTP
    if (sendOtpBtn) {
      sendOtpBtn.addEventListener('click', async () => {
        const mobile_no = mobileInput.value;
        if (!/^\d{10}$/.test(mobile_no)) {
          mobileError.textContent = 'Please enter a valid 10-digit mobile number';
          mobileError.style.display = 'block';
          return;
        }

        try {
          sendOtpBtn.disabled = true;
          sendOtpBtn.textContent = 'Sending...';
          const response = await fetch('/auth/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile_no }),
            credentials: 'include'
          });

          const result = await response.json();
          if (response.ok) {
            mobileError.style.display = 'none';
            mobileInput.classList.add('hidden');
            sendOtpBtn.classList.add('hidden');
            otpSection.classList.remove('hidden');
            resendSection.classList.remove('hidden');
            verifyOtpBtn.classList.remove('hidden');
            otpInput.inputs[0].focus();
          } else {
            mobileError.textContent = result.message || 'Failed to send OTP';
            mobileError.style.display = 'block';
          }
        } catch (error) {
          mobileError.textContent = 'Error sending OTP: ' + error.message;
          mobileError.style.display = 'block';
        } finally {
          sendOtpBtn.disabled = false;
          sendOtpBtn.textContent = 'Send OTP';
        }
      });
    }

    // Resend OTP
    if (resendOtpBtn) {
      resendOtpBtn.addEventListener('click', async () => {
        const mobile_no = mobileInput.value;
        if (!/^\d{10}$/.test(mobile_no)) {
          mobileError.textContent = 'Please enter a valid 10-digit mobile number';
          mobileError.style.display = 'block';
          return;
        }

        try {
          resendOtpBtn.disabled = true;
          resendOtpBtn.textContent = 'Resending...';
          const response = await fetch('/auth/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile_no }),
            credentials: 'include'
          });

          const result = await response.json();
          if (response.ok) {
            mobileError.style.display = 'none';
            showNotification('OTP resent successfully!', 'success');
            otpInput.inputs.forEach(input => input.value = '');
            otpInput.inputs[0].focus();
          } else {
            mobileError.textContent = result.message || 'Failed to resend OTP';
            mobileError.style.display = 'block';
          }
        } catch (error) {
          mobileError.textContent = 'Error resending OTP: ' + error.message;
          mobileError.style.display = 'block';
        } finally {
          resendOtpBtn.disabled = false;
          resendOtpBtn.textContent = 'Resend code';
        }
      });
    }

    // Verify OTP
    if (verifyOtpBtn) {
      otpInput.onInputEvent((otpCode) => {
        verifyOtpBtn.disabled = !otpInput.allFilled();
      });

      verifyOtpBtn.addEventListener('click', async () => {
        const otp = otpInput.getOTP();
        if (!otp || otp.length !== 6) {
          mobileError.textContent = 'Please enter a valid 6-digit OTP';
          mobileError.style.display = 'block';
          return;
        }

        try {
          verifyOtpBtn.disabled = true;
          verifyOtpBtn.textContent = 'Verifying...';
          const response = await fetch('/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ otp }),
            credentials: 'include'
          });

          const result = await response.json();
          if (response.ok) {
            mobileError.style.display = 'none';
            modalOtpCode.textContent = otp;
            successCode.classList.remove('hidden');
            errorCode.classList.add('hidden');
            otpModal.classList.remove('opacity-0', 'invisible');
            otpModal.classList.add('opacity-100', 'visible');
            setTimeout(() => {
              modalContent.classList.remove('scale-75');
              modalContent.classList.add('scale-100');
            }, 50);

            // Transition to password section if needed
            setTimeout(() => {
              closeModal();
              if (passwordSection) {
                mobileSection.classList.add('hidden');
                passwordSection.classList.remove('hidden');
              } else {
                verifyMobileModal.style.display = 'none';
              }
            }, 2000);
          } else {
            mobileError.textContent = result.message || 'Invalid OTP';
            mobileError.style.display = 'block';
            modalOtpCode.textContent = otp;
            successCode.classList.add('hidden');
            errorCode.classList.remove('hidden');
            otpModal.classList.remove('opacity-0', 'invisible');
            otpModal.classList.add('opacity-100', 'visible');
            setTimeout(() => {
              modalContent.classList.remove('scale-75');
              modalContent.classList.add('scale-100');
            }, 50);
          }
        } catch (error) {
          mobileError.textContent = 'Error verifying OTP: ' + error.message;
          mobileError.style.display = 'block';
        } finally {
          verifyOtpBtn.disabled = false;
          verifyOtpBtn.textContent = 'Verify Code';
        }
      });
    }

    // OTP Modal Interactions
    if (otpModal && closeModalBtn) {
      const closeModal = () => {
        modalContent.classList.remove('scale-100');
        modalContent.classList.add('scale-75');
        setTimeout(() => {
          otpModal.classList.remove('opacity-100', 'visible');
          otpModal.classList.add('opacity-0', 'invisible');
        }, 200);
      };

      otpModal.addEventListener('click', (e) => {
        if (e.target === otpModal) {
          closeModal();
        }
      });

      closeModalBtn.addEventListener('click', () => {
        closeModal();
        // Transition to password section if mobile is verified but no password
        if (successCode.classList.contains('hidden')) {
          // If error, stay on OTP section
          otpInput.inputs.forEach(input => input.value = '');
          otpInput.inputs[0].focus();
        } else if (passwordSection) {
          mobileSection.classList.add('hidden');
          passwordSection.classList.remove('hidden');
        } else {
          verifyMobileModal.style.display = 'none';
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && otpModal.classList.contains('visible')) {
          closeModal();
          if (successCode.classList.contains('hidden')) {
            otpInput.inputs.forEach(input => input.value = '');
            otpInput.inputs[0].focus();
          } else if (passwordSection) {
            mobileSection.classList.add('hidden');
            passwordSection.classList.remove('hidden');
          } else {
            verifyMobileModal.style.display = 'none';
          }
        }
      });
    }

    // Password Submission
    if (setPasswordBtn) {
      verifyMobileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
          passwordError.textContent = 'Passwords do not match';
          passwordError.style.display = 'block';
          return;
        }

        if (password.length < 6) {
          passwordError.textContent = 'Password must be at least 6 characters';
          passwordError.style.display = 'block';
          return;
        }

        try {
          const response = await fetch('/auth/set-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
            credentials: 'include'
          });

          const result = await response.json();
          if (response.ok) {
            passwordError.style.display = 'none';
            showNotification('Password set successfully!', 'success');
            setTimeout(() => {
              verifyMobileModal.style.display = 'none';
              window.location.reload();
            }, 1500);
          } else {
            passwordError.textContent = result.message || 'Failed to set password';
            passwordError.style.display = 'block';
          }
        } catch (error) {
          passwordError.textContent = 'Error setting password: ' + error.message;
          passwordError.style.display = 'block';
        }
      });
    }
  }




//g-mem


async function populateGroups() {
  try {
    const response = await fetch('/Groups/groups', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    const result = await response.json();
    console.log(result);
    if (response.ok) {
      const groupSelect = document.getElementById('groupSelect');
      groupSelect.innerHTML = '<option value="">Select Group</option>';
      result.groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group._id;
        option.textContent = group.g_name;
        groupSelect.appendChild(option);
      });

        const uploadGroupSelect = document.getElementById('uploadGroupSelect');
        if (uploadGroupSelect) {
          uploadGroupSelect.innerHTML = '<option value="">Select Group</option>';
          result.groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group._id;
            option.textContent = group.g_name;
            uploadGroupSelect.appendChild(option);
          });
        }
        const downloadGroupSelect = document.getElementById('downloadGroupSelect');
      if (downloadGroupSelect) {
        downloadGroupSelect.innerHTML = '<option value="">All Groups</option>';
        result.groups.forEach(group => {
          const option = document.createElement('option');
          option.value = group._id;
          option.textContent = group.g_name;
          downloadGroupSelect.appendChild(option);
        });
      }

    } else {
      showNotification('Failed to load groups', 'error');
    }
  } catch (error) {
    showNotification('Error loading groups: ' + error.message, 'error');
  }
}

async function populateMembers(searchParams = {}) {
  try {
    tableLoader.style.display = 'block';
    membersTableBody.innerHTML = '';
    const url = new URL('/Groups/search-members', window.location.origin);
    if (searchParams.name) url.searchParams.append('name', searchParams.name);
    if (searchParams.groupName) url.searchParams.append('groupName', searchParams.groupName);

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    const result = await response.json();
    console.log("populate members",result);
    if (response.ok && result.success ) {
      if (result.members.length === 0) {
        // Handle case where no groups are owned
        if (result.message === 'You do not own any groups') {
          membersTableBody.innerHTML = '<tr><td colspan="6">You do not have any groups. Please add a group first.</td></tr>';
          showNotification(result.message, 'info');
          return;
        }
        // Handle other cases of empty results (e.g., no matching members)
        membersTableBody.innerHTML = '<tr><td colspan="6">No members found</td></tr>';
        return;
      }
      result.members.forEach((member,index) => {
        const tr = document.createElement('tr');
        const displayName = member.name || '-';
        tr.innerHTML = `
                        <td>${result.members.length - index}</td> 
                        <td>${displayName}${member.blacklistStatus ? ' <span title="Blacklisted: ' + member.blacklistReason + '" style="color:red;">(Blacklisted)</span>' : ''}</td>
                        <td>${member.mobileNumber || '-'}</td>
                        <td>${member.groupName}</td>
                        <td>
                          <div class="action-dropdown">
                            <button class="action-btn">
                              <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <div class="dropdown-menu">
                              <a href="#" class="dropdown-item share-member" data-user-id="${member.userId}" data-group-id="${member.groupId}" data-name="${displayName}" data-email="${member.email || ''}">
                                <i class="fas fa-share"></i> Share
                              </a>
                              <a href="#" class="dropdown-item blacklist-member" data-user-id="${member.userId}" data-group-id="${member.groupId}">
                                <i class="fas fa-ban"></i> Blacklist
                              </a>
                              <a href="#" class="dropdown-item delete-member" data-user-id="${member.userId}" data-group-id="${member.groupId}">
                                <i class="fas fa-trash"></i> Delete
                              </a>
                            </div>
                          </div>
                        </td>
                         <td>
                            <a href="/user-app/user/${member.userId}" class="info-link" title="View Details">
                                <i class="fas fa-info-circle"></i>
                            </a>
                        </td>
                    `;
        membersTableBody.prepend(tr);
      });
    } else {
      showNotification('Failed to load members', 'error');
    }
  } catch (error) {
    showNotification('Error loading members: ' + error.message, 'error');
  } finally {
    tableLoader.style.display = 'none';
  }
}

if (addMemberForm) {
  addMemberForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    sendInviteBtn.disabled = true;
    formLoader.style.display = 'block';
    formErrorMember.style.display = 'none';

    const formData = new FormData(addMemberForm);
    const name = formData.get('memberName').trim();
    const l_name = formData.get('memberl_Name').trim();
    const mobileNumber = formData.get('memberNumber').trim();
    const email = formData.get('memberEmail').trim();
    const groupId = formData.get('groupSelect');
    const category = formData.get('category');

    // Validate required fields
    if (!name || !mobileNumber || !email || !category) {
      formErrorMember.textContent = 'Please fill in all required fields';
      formErrorMember.style.display = 'block';
      sendInviteBtn.disabled = false;
      formLoader.style.display = 'none';
      return;
    }

    

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      formErrorMember.textContent = 'Please enter a valid email address';
      formErrorMember.style.display = 'block';
      sendInviteBtn.disabled = false;
      formLoader.style.display = 'none';
      return;
    }
    if (mobileNumber && !/^\d{10}$/.test(mobileNumber)) {
        formErrorMember.textContent = 'Mobile number must be 10 digits';
        formErrorMember.style.display = 'block';
        sendInviteBtn.disabled = false;
        formLoader.style.display = 'none';
        return;
      }

    const data = {
      groupId,
      memberEmail: email,
      name,
      l_name,
      mobileNumber,
      category
    };
    console.log('addMemberForm data:', data);

    try {
      const response = await fetch('/Groups/add-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });

      const result = await response.json();
      console.log('addGroupMember response:', result);
      if (response.ok) {
          showNotification('Member added successfully!', 'success');
          addMemberModal.style.display = 'none';
          addMemberForm.reset();
          await populateMembers();
          // invitationName.textContent = `${result.member.name} ${result.member.l_name || ''}`.trim();
          // invitationEmail.textContent = email;
          // invitationLinkDisplay.textContent = result.invitationLink;
          // invitationPassword.textContent = result.tempPassword || 'N/A (Existing user)';
          // invitationGroupName.textContent = result.member.groupName;
          // invitationModal.style.display = 'flex';

                   const isExistingUser = result.isExistingUser;
                    if (isExistingUser) {
                        modalTitle.textContent = 'Member Added';
                        invitationName.textContent = `${result.member.name} ${result.member.l_name || ''}`.trim();
                        invitationGroupName.textContent = result.member.groupName || 'MySarafa';
                        existingUserMessage.style.display = 'block';
                        newUserRecipient.style.display = 'none';
                        newUserGroup.style.display = 'none';
                        invitationLinkLabel.style.display = 'none';
                        invitationLinkDisplay.style.display = 'none';
                        invitationPasswordLabel.style.display = 'none';
                        invitationPassword.style.display = 'none';
                        copyLinkBtn.style.display = 'none';
                    } else {
                        modalTitle.textContent = 'Invitation Link Generated';
                        invitationNameNew.textContent = `${result.member.name} ${result.member.l_name || ''}`.trim();
                        invitationEmail.textContent = email;
                        invitationLinkDisplay.textContent = result.invitationLink || 'N/A';
                        invitationPassword.textContent = result.tempPassword || 'N/A';
                        invitationGroupNameNew.textContent = result.member.groupName || 'MySarafa';
                        existingUserMessage.style.display = 'none';
                        newUserRecipient.style.display = 'block';
                        newUserGroup.style.display = 'block';
                        invitationLinkLabel.style.display = 'block';
                        invitationLinkDisplay.style.display = 'block';
                        invitationPasswordLabel.style.display = 'block';
                        invitationPassword.style.display = 'block';
                        copyLinkBtn.style.display = 'inline-block';
                    }

                    invitationModal.style.display = 'flex';
      
      } else {
        formErrorMember.textContent = result.message || 'Failed to add member';
        formErrorMember.style.display = 'block';
      }
    } catch (error) {
      formErrorMember.textContent = 'Error adding member: ' + error.message;
      formErrorMember.style.display = 'block';
    } finally {
      sendInviteBtn.disabled = false;
      formLoader.style.display = 'none';
    }
  });
}

if (addNewBtn && addMemberModal && closeAddMemberModal) {
  addNewBtn.addEventListener('click', () => {
    addMemberModal.style.display = 'flex';
    populateGroups();
  });
  closeAddMemberModal.addEventListener('click', () => {
    addMemberModal.style.display = 'none';
    addMemberForm.reset();
    formErrorMember.style.display = 'none';
  });
  addMemberModal.addEventListener('click', (e) => {
    if (e.target === addMemberModal) {
      addMemberModal.style.display = 'none';
      addMemberForm.reset();
      formErrorMember.style.display = 'none';
    }
  });
}

if (invitationModal && closeInvitationModal && closeInvitationModalBtn) {
        closeInvitationModal.addEventListener('click', () => {
            invitationModal.classList.remove('open');
            setTimeout(() => {
                invitationModal.style.display = 'none';
                sharePlatforms.classList.remove('open');
            }, 300);
        });
        closeInvitationModalBtn.addEventListener('click', () => {
            invitationModal.classList.remove('open');
            setTimeout(() => {
                invitationModal.style.display = 'none';
                sharePlatforms.classList.remove('open');
            }, 300);
        });
        invitationModal.addEventListener('click', (e) => {
            if (e.target === invitationModal) {
                invitationModal.classList.remove('open');
                setTimeout(() => {
                    invitationModal.style.display = 'none';
                    sharePlatforms.classList.remove('open');
                }, 300);
            }
        });
    }

  if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(invitationLinkDisplay.textContent).then(() => {
        showNotification('Invitation link copied to clipboard!', 'success');
      }).catch(err => {
        showNotification('Failed to copy link: ' + err.message, 'error');
      });
    });
  }

  if (shareBtn && sharePlatforms) {
    // shareBtn.addEventListener('click', () => {
    //   sharePlatforms.classList.toggle('open');
    // });
    shareBtn.addEventListener('click', async () => {
            const isExistingUser = existingUserMessage.style.display === 'block';
            const shareData = {
                title: isExistingUser ? 'Member Added to MySarafa' : 'MySarafa Community Invitation',
                text: getShareMessage(isExistingUser),
                url: isExistingUser ? '' : invitationLinkDisplay.textContent
            };

            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                    showNotification('Shared successfully!', 'success');
                } catch (err) {
                    showNotification('Share cancelled or failed: ' + err.message, 'error');
                }
            } else {
                const message = getShareMessage(isExistingUser);
                const textarea = document.createElement('textarea');
                textarea.value = message;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    showNotification('Details copied to clipboard!', 'success');
                } catch (err) {
                    showNotification('Failed to copy details: ' + err.message, 'error');
                }
                document.body.removeChild(textarea);
            }
        });
  }

  if (shareWhatsApp && shareEmail && shareOther) {
  shareWhatsApp.addEventListener('click', (e) => {
            e.preventDefault();
            const isExistingUser = existingUserMessage.style.display === 'block';
            const message = encodeURIComponent(getShareMessage(isExistingUser));
            window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
        });

        shareEmail.addEventListener('click', (e) => {
            e.preventDefault();
            const isExistingUser = existingUserMessage.style.display === 'block';
            const email = invitationEmail.textContent;
            const subject = encodeURIComponent(isExistingUser ? 'Added to MySarafa Group' : 'You\'re invited to join MySarafa Community!');
            const body = encodeURIComponent(getShareMessage(isExistingUser));
            window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
        });

        shareOther.addEventListener('click', (e) => {
            e.preventDefault();
            const isExistingUser = existingUserMessage.style.display === 'block';
            const message = getShareMessage(isExistingUser);
            if (navigator.share) {
                navigator.share({
                    title: isExistingUser ? 'Member Added to MySarafa' : 'MySarafa Community Invitation',
                    text: message,
                    url: isExistingUser ? '' : invitationLinkDisplay.textContent
                }).then(() => {
                    showNotification('Shared successfully!', 'success');
                }).catch(err => {
                    showNotification('Failed to share: ' + err.message, 'error');
                });
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = message;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    showNotification('Details copied to clipboard!', 'success');
                } catch (err) {
                    showNotification('Failed to copy details: ' + err.message, 'error');
                }
                document.body.removeChild(textarea);
            }
        });
  }

  if (sampleCsvBtn) {
    sampleCsvBtn.addEventListener('click', () => {
      const csvContent = 'FirstName,LastName,Email,MobileNumber\nJohn,Doe,john@example.com,1234567890\nJane,Doe,jane@example.com,0987654321\n';
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sample_members.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification('Sample CSV downloaded successfully!', 'success');
    });
  }
  if (uploadCsvBtn && uploadCsvModal && closeUploadModal) {
    uploadCsvBtn.addEventListener('click', () => {
      uploadCsvModal.style.display = 'flex';
      populateGroups();
    });
    closeUploadModal.addEventListener('click', () => {
      uploadCsvModal.style.display = 'none';
    });
    uploadCsvModal.addEventListener('click', (e) => {
      if (e.target === uploadCsvModal) {
        uploadCsvModal.style.display = 'none';
      }
    });
  }

  if (downloadCsvBtn && downloadCsvModal && closeDownloadModal) {
    downloadCsvBtn.addEventListener('click', () => {
      downloadCsvModal.style.display = 'flex';
      populateGroups();
    });
    closeDownloadModal.addEventListener('click', () => {
      downloadCsvModal.style.display = 'none';
      downloadCsvForm.reset();
    });
    downloadCsvModal.addEventListener('click', (e) => {
      if (e.target === downloadCsvModal) {
        downloadCsvModal.style.display = 'none';
        downloadCsvForm.reset();
      }
    });
  }
if (downloadCsvForm) {
    downloadCsvForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const groupId = document.getElementById('downloadGroupSelect').value;
      try {
        const url = `/Groups/download-members-csv${groupId ? `?groupId=${groupId}` : ''}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'text/csv' },
          credentials: 'include'
        });
        if (response.ok) {
          const blob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = groupId ? `group_${groupId}_members.csv` : 'all_members.csv';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(downloadUrl);
          showNotification('Members CSV downloaded successfully!', 'success');
          downloadCsvModal.style.display = 'none';
        } else {
          showNotification('Failed to download CSV', 'error');
        }
      } catch (error) {
        showNotification('Error downloading CSV: ' + error.message, 'error');
      }
    });
  }

  if (uploadCsvForm) {
    uploadCsvForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(uploadCsvForm);
      console.log(formData);
      const groupSelect = document.getElementById('uploadGroupSelect');
     
      // formData.append('groupId', groupSelect.value);
      formData.append('groupSelect', groupSelect.value);


      if (!groupSelect.value) {
        showNotification('Please select a group for CSV upload', 'error');
        return;
      }
      for (let [key, value] of formData.entries()) {
    console.log(key, value);
      }
      try {
        const response = await fetch('/Groups/upload-members-csv', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        const result = await response.json();
        if (response.ok) {
          showNotification(`Members uploaded successfully! Added: ${result.addedMembers.length}, Errors: ${result.errors.length}`, 'success');
          if (result.errors.length) {
            console.log('CSV Upload Errors:', result.errors);
            showNotification('Some members could not be added. Check console for details.', 'error');
          }
          await populateMembers();
          uploadCsvModal.style.display = 'none';
        } else {
          showNotification(result.message || 'Failed to upload CSV', 'error');
        }
      } catch (error) {
        showNotification('Error uploading CSV: ' + error.message, 'error');
      }
    });
  }

  if (blacklistForm) {
    blacklistForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const reason = blacklistReason.value.trim();
      if (!reason) {
        showNotification('Please provide a reason for blacklisting', 'error');
        return;
      }

      try {
        const response = await fetch('/Groups/blacklist-member', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentBlacklistData.userId,
            groupId: currentBlacklistData.groupId,
            reason
          }),
          credentials: 'include'
        });
        const result = await response.json();
        if (response.ok) {
          showNotification('Member blacklisted successfully!', 'success');
          blacklistModal.style.display = 'none';
          blacklistForm.reset();
          await populateMembers();
        } else {
          showNotification(result.message || 'Failed to blacklist member', 'error');
        }
      } catch (error) {
        showNotification('Error blacklisting member: ' + error.message, 'error');
      }
    });
  }

  if (closeBlacklistModal) {
    closeBlacklistModal.addEventListener('click', () => {
      blacklistModal.style.display = 'none';
      blacklistForm.reset();
    });
    blacklistModal.addEventListener('click', (e) => {
      if (e.target === blacklistModal) {
        blacklistModal.style.display = 'none';
        blacklistForm.reset();
      }
    });
  }

if (filterBtn && filterForm) {
  filterBtn.addEventListener('click', () => {
    filterForm.classList.toggle('open');
  });
}

if (searchName && searchGroup) {
  let searchTimeout;
  searchName.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      populateMembers({
        name: searchName.value.trim(),
        groupName: searchGroup.value.trim()
      });
    }, 500);
  });
  searchGroup.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      populateMembers({
        name: searchName.value.trim(),
        groupName: searchGroup.value.trim()
      });
    }, 500);
  });
}

if (membersTableBody) {
    membersTableBody.addEventListener('click', async (e) => {
      const target = e.target.closest('.dropdown-item');
      if (!target) return;
      e.preventDefault();

      const userId = target.dataset.userId;
      const groupId = target.dataset.groupId;

      if (target.classList.contains('share-member')) {
        const name = target.dataset.name;
        const email = target.dataset.email;
        // Fetch member details to get invitation link
        try {
          const response = await fetch(`/Groups/search-members?email=${encodeURIComponent(email)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          });
          const result = await response.json();
          console.log("memebers coming result",result)
          if (response.ok && result.members.length) {
            const member = result.members[0];
            invitationName.textContent = name;
            invitationEmail.textContent = email;
            invitationLinkDisplay.textContent = `${window.location.origin}/signup?invite=${member.invitationToken}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`;
            invitationPassword.textContent = result.tempPassword || 'N/A (Existing user)';

            const groupResponse = await fetch(`/Groups/groups/${groupId}`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include'
            });
            const groupResult = await groupResponse.json();
            if (groupResponse.ok) {
              document.querySelector('#invitationGroupName').textContent = groupResult.group.g_name;
            }
            invitationModal.style.display = 'flex';
          } else {
            showNotification('Failed to load member invitation details', 'error');
          }
        } catch (error) {
          showNotification('Error fetching invitation: ' + error.message, 'error');
        }
      } else if (target.classList.contains('blacklist-member')) {
        currentBlacklistData = { userId, groupId };
        blacklistModal.style.display = 'flex';
      } else if (target.classList.contains('delete-member')) {
        if (confirm('Are you sure you want to remove this member?')) {
          try {
            const response = await fetch('/Groups/remove-member', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, groupId }),
              credentials: 'include'
            });
            const result = await response.json();
            if (response.ok) {
              showNotification('Member removed successfully!', 'success');
              populateMembers();
            } else {
              showNotification(result.message || 'Failed to remove member', 'error');
            }
          } catch (error) {
            showNotification('Error removing member: ' + error.message, 'error');
          }
        }
      }
    });
  }
populateGroups();
if (membersTableBody) {
    populateMembers();
  }

  function getShareMessage(isExistingUser) {
        const name = (isExistingUser ? invitationName : invitationNameNew).textContent || 'User';
        const groupName = (isExistingUser ? invitationGroupName : invitationGroupNameNew).textContent || 'MySarafa';
        if (isExistingUser) {
            return `${name} has been successfully added to the MySarafa group ${groupName}.`;
        }
        const email = invitationEmail.textContent || 'N/A';
        const password = invitationPassword.textContent || 'N/A';
        const link = invitationLinkDisplay.textContent || 'N/A';
        return `Dear ${name},\n\nYou have been added to the MySarafa group ${groupName}.\n\nPlease click the following link to complete your registration:\n${link}\n\nCredentials:\nEmail: ${email}\nPassword: ${password}\n\nThis invitation link is valid for 7 days.\n\nBest regards,\nMySarafa Community Team`;
    }

document.getElementById("shareBtn").addEventListener("click", async () => {
  const shareData = {
    title: "Check this out!",
    text: "I found something useful for you.",
    url: window.location.href
  };

  if (navigator.share) {
    // Mobile or supported browser
    try {
      await navigator.share(shareData);
      console.log("Shared successfully!");
    } catch (err) {
      console.log("Share cancelled or failed:", err);
    }
  } else {
    // Laptop/Desktop fallback → redirect to your sharing page
    window.open("/share-page", "_blank");
  }
});
});


document.querySelector('.toggle-btn').addEventListener('click', function() {
  document.querySelector('.action-menu').classList.toggle('show');
});
