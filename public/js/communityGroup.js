

document.addEventListener('DOMContentLoaded', function () {
    const groupCreateForm = document.getElementById('groupCreateForm');
    const createGroupBtn = document.getElementById('createGroupBtn');
    const formLoader = document.getElementById('formLoader');
    const formError = document.getElementById('formError');
    const coverImageInput = document.getElementById('coverImage');
    const coverImagePreview = document.getElementById('coverImagePreview');
    const groupNamePreview = document.getElementById('groupNamePreview');
    const groupPrivacyPreview = document.getElementById('groupPrivacyPreview');
    const groupDescriptionPreview = document.getElementById('groupDescriptionPreview');
    const groupIdInput = document.getElementById('groupId');

    // Real-time preview for community name
    document.getElementById('communityName').addEventListener('input', function () {
        groupNamePreview.textContent = this.value || 'Community Name';
    });

    // Real-time preview for community type
    document.getElementById('community-type').addEventListener('change', function () {
        const type = this.value ? this.value.charAt(0).toUpperCase() + this.value.slice(1) : 'Community privacy';
        groupPrivacyPreview.textContent = `${type} · 1 member`;
    });

    // Real-time preview for description
    document.getElementById('description').addEventListener('input', function () {
        groupDescriptionPreview.textContent = this.value || 'Community description will appear here...';
    });

    // Real-time preview for cover photo
    if (coverImageInput && coverImagePreview) {
        coverImageInput.addEventListener('change', function () {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    coverImagePreview.src = e.target.result;
                };
                reader.readAsDataURL(file);
            } else {
                coverImagePreview.src = 'Assets/Images/diwali.jpg';
            }
        });
    }

    // Form submission with AJAX
    if (groupCreateForm) {
        groupCreateForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Show loader and disable button
            createGroupBtn.disabled = true;
            formLoader.style.display = 'block';
            formError.style.display = 'none';

            const formData = new FormData(groupCreateForm);
            console.log(formData)
            const groupId = groupIdInput.value;
            console.log(groupId);
            const url = groupId ? `/Groups/update/${groupId}` : `/Groups/create`;
            console.log("url",url)
            try {
                const response = await fetch(url, {
                    method: groupId ? 'PUT' : 'POST',
                    body: formData,
                    credentials: 'include'
                });
                const result = await response.json();

                if (response.ok) {
                    // Update preview section with response data
                    groupNamePreview.textContent = result.group.name;
                    groupPrivacyPreview.textContent = `${result.group.type.charAt(0).toUpperCase() + result.group.type.slice(1)} ·${result.group.total_mem || 1} member${result.group.total_mem > 1 ? 's' : ''}`;
                    groupDescriptionPreview.textContent = result.group.description || 'Community description will appear here...';
                    if (result.group.cover) {
                        coverImagePreview.src = result.group.cover;
                    }

                    // Show success notification
                  showNotification(groupId ? 'Group updated successfully!' : 'Group created successfully!', 'success');

                    // // Reset form
                    //  if(!groupId){
                    //     groupCreateForm.requestFullscreen();
                    //     coverImagePreview.src = './uploads/demo.jpg';
                    //  }
                    
                } else {
                    formError.textContent = result.message || 'Failed to create group';
                    formError.style.display = 'block';
                }
            } catch (error) {
                formError.textContent = 'Error creating group: ' + error.message;
                formError.style.display = 'block';
            } finally {
                createGroupBtn.disabled = false;
                formLoader.style.display = 'none';
            }
        });
    }

    // Profile Modal Logic
    const profileBtn = document.getElementById('profileDetailsBtn');
    const profileModal = document.getElementById('profileModal');
    const closeProfileModal = document.getElementById('closeProfileModal');
    const closeProfileModal2 = document.getElementById('closeProfileModal2');
    const profileForm = document.getElementById('profileForm');

    if (profileBtn && profileModal && closeProfileModal && closeProfileModal2) {
        profileBtn.onclick = () => { profileModal.style.display = 'flex'; };
        closeProfileModal.onclick = () => { profileModal.style.display = 'none'; };
        closeProfileModal2.onclick = () => { profileModal.style.display = 'none'; };
        profileModal.onclick = (e) => {
            if (e.target === profileModal) profileModal.style.display = 'none';
        };
    }

    // Profile Form Submission
    if (profileForm) {
        profileForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const formData = new FormData(profileForm);
            const data = Object.fromEntries(formData);

            try {
                const response = await fetch('/auth/update-profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                    credentials: 'include'
                });

                const result = await response.json();
                if (response.ok) {
                    showNotification('Profile updated successfully!', 'success');
                    profileModal.style.display = 'none';
                } else {
                    showNotification(result.message || 'Failed to update profile', 'error');
                }
            } catch (error) {
                showNotification('Error updating profile: ' + error.message, 'error');
            }
        });
    }

    // Notification Function
    function showNotification(message, type = 'info') {
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
        notification.style.backgroundColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#2f95ff';
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Notification Animations
    const notificationStyles = document.createElement('style');
    notificationStyles.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity :1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(notificationStyles);
});

