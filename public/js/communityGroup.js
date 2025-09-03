

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

    const communityTypeSelect = document.getElementById('community-type');
    const privacyModal = document.getElementById('privacyModal');
    const yesBtn = document.getElementById('yesBtn');
    const noBtn = document.getElementById('noBtn');
    const questionFormModal = document.getElementById('questionFormModal');
    const questionForm = document.getElementById('questionForm');
    const questionText = document.getElementById('questionText');
    const questionTypeSelect = document.getElementById('questionTypeSelect');
    const optionsSection = document.getElementById('optionsSection');
    const closeQuestionModal = document.getElementById('closeQuestionModal');
    const cancelQuestionBtn = document.getElementById('cancelQuestionBtn');
    const deleteQuestionBtn = document.getElementById('deleteQuestionBtn');
    const addAnotherQuestionBtn = document.getElementById('addAnotherQuestionBtn');
    const questionsDisplayModal = document.getElementById('questionsDisplayModal');
    const closeQuestionsDisplayModal = document.getElementById('closeQuestionsDisplayModal');
    const cancelQuestionsBtn = document.getElementById('cancelQuestionsBtn');
    const createQuestionBtn = document.getElementById('createQuestionBtn');
    let questions = []; // Initialize with empty array or server-side questions if provided

    // Real-time preview for community name
    document.getElementById('communityName').addEventListener('input', function () {
        groupNamePreview.textContent = this.value || 'Community Name';
    });

    // Real-time preview for community type
    // document.getElementById('community-type').addEventListener('change', function () {
    //     const type = this.value ? this.value.charAt(0).toUpperCase() + this.value.slice(1) : 'Community privacy';
    //     groupPrivacyPreview.textContent = `${type} · 1 member`;
    // });
    document.getElementById('community-type').addEventListener('change', function () {
        console.log("[communityTypeSelect] value =", this.value);
        const type = this.value ? this.value.charAt(0).toUpperCase() + this.value.slice(1) : 'Community privacy';
        groupPrivacyPreview.textContent = `${type} · 1 member`;
        if (this.value === 'private') {
            console.log("[communityTypeSelect] Showing privacyModal");
            privacyModal.style.display = 'flex';
        }
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
            for (const [key, value] of formData.entries()) {
                console.log(`  ${key}:`, value);
            }
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
                    if (!groupId) {
                    groupCreateForm.reset(); 
                    coverImagePreview.src = '/assets/images/demo.jpg'; 
                    groupNamePreview.textContent = '';
                    groupPrivacyPreview.textContent = '';
                    groupDescriptionPreview.textContent = 'Community description will appear here...';
                      }
                    
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



    // New Modal and Question Handling Logic
  

    // Show/hide options section based on question type
    function updateOptionsSection() {
        const type = questionTypeSelect.value;
        optionsSection.style.display = type === 'text' ? 'none' : 'block';
        document.querySelectorAll('#optionInputs .option-input').forEach(input => {
            input.required = type !== 'text';
        });
    }

    // Add new option input
    window.addOption = function () {
        const optionInputs = document.getElementById('optionInputs');
        const newOption = document.createElement('div');
        newOption.className = 'option-input-row';
        newOption.innerHTML = `
            <input type="text" class="option-input" placeholder="Write your answer" required>
            <button type="button" class="remove-option-btn" onclick="removeOption(this)">×</button>
        `;
        optionInputs.appendChild(newOption);
    };

    // Remove option input
    window.removeOption = function (btn) {
        if (document.querySelectorAll('#optionInputs .option-input-row').length > 1) {
            btn.parentElement.remove();
        } else {
            showNotification('At least one option is required for checkbox or multiple choice questions.', 'error');
        }
    };

    // Show privacy modal when selecting private community
    if (communityTypeSelect) {
        communityTypeSelect.addEventListener('change', function () {
            console.log("[communityTypeSelect] value =", this.value);
            const type = this.value ? this.value.charAt(0).toUpperCase() + this.value.slice(1) : 'Community privacy';
            groupPrivacyPreview.textContent = `${type} · 1 member`;
            if (this.value === 'private') {
                  console.log("[communityTypeSelect] Showing privacyModal");
                privacyModal.style.display = 'flex';
            }
        });
    }

    // Privacy modal buttons
    if (yesBtn) {
        yesBtn.addEventListener('click', function () {
            privacyModal.style.display = 'none';
            questionFormModal.style.display = 'flex';
            questionForm.reset();
            updateOptionsSection();
            deleteQuestionBtn.style.display = 'none';
            document.getElementById('modalTitle').textContent = 'Create Question';
        });
    }

    if (noBtn) {
        noBtn.addEventListener('click', function () {
            privacyModal.style.display = 'none';
            questionsDisplayModal.style.display = 'flex';
        });
    }

    // Question form modal
    if (questionTypeSelect) {
        questionTypeSelect.addEventListener('change', updateOptionsSection);
    }

    if (closeQuestionModal) {
        closeQuestionModal.addEventListener('click', function () {
            questionFormModal.style.display = 'none';
            questionsDisplayModal.style.display = 'flex';
        });
    }

    if (cancelQuestionBtn) {
        cancelQuestionBtn.addEventListener('click', function () {
            questionFormModal.style.display = 'none';
            questionsDisplayModal.style.display = 'flex';
        });
    }

    if (addAnotherQuestionBtn) {
        addAnotherQuestionBtn.addEventListener('click', function () {
            questionForm.dispatchEvent(new Event('submit'));
            questionForm.reset();
            updateOptionsSection();
            document.getElementById('modalTitle').textContent = 'Create Question';
        });
    }

    // Questions display modal
    if (closeQuestionsDisplayModal) {
        closeQuestionsDisplayModal.addEventListener('click', function () {
            questionsDisplayModal.style.display = 'none';
        });
    }

    if (cancelQuestionsBtn) {
        cancelQuestionsBtn.addEventListener('click', function () {
            questionsDisplayModal.style.display = 'none';
        });
    }

    if (createQuestionBtn) {
        createQuestionBtn.addEventListener('click', function () {
            questionsDisplayModal.style.display = 'none';
            questionFormModal.style.display = 'flex';
            questionForm.reset();
            updateOptionsSection();
            document.getElementById('modalTitle').textContent = 'Create Question';
        });
    }

    // Handle question form submission
    if (questionForm) {
      questionForm.addEventListener('submit', function (e) {
            e.preventDefault();
            console.log("[questionForm] Submitting question form");
            const question = {
                questionText: questionText.value,
                questionType: questionTypeSelect.value,
                options: questionTypeSelect.value !== 'text' ? Array.from(document.querySelectorAll('.option-input')).map(input => input.value).filter(v => v) : []
            };
            console.log("[questionForm] Built question object:", question);
            if (!question.questionText) {
                showNotification('Question text is required.', 'error');
                console.log("[questionForm] Validation failed: Question text missing");
                return;
            }
            if (question.questionType !== 'text' && question.options.length < 1) {
                showNotification('At least one option is required for checkbox or multiple choice questions.', 'error');
                console.log("[questionForm] Validation failed: Options missing for non-text question");
                return;
            }
            questions.push(question);
            console.log("[questionForm] Updated questions array:", questions);
            updateQuestionsDisplay();
            questionsDisplayModal.style.display = 'flex';
            questionFormModal.style.display = 'none';
            questionForm.reset();
            document.getElementById('questionsInput').value = JSON.stringify(questions);
            console.log("[questionForm] Set questionsInput value:", document.getElementById('questionsInput').value);
        });
    }

    // Update questions display
    function updateQuestionsDisplay() {
       //  console.log("[updateQuestionsDisplay] Editing question at index =", idx, questions[idx]);
        const questionsList = document.getElementById('questionsList');
        questionsList.innerHTML = '';
        questions.forEach((q, index) => {
            const questionItem = document.createElement('div');
            questionItem.className = 'question-item';
            questionItem.setAttribute('data-question-id', index);
            questionItem.innerHTML = `<p><strong>${q.questionText}</strong> (${q.questionType})</p>`;
            if (q.options.length) {
                const ul = document.createElement('ul');
                q.options.forEach(opt => {
                    const li = document.createElement('li');
                    li.textContent = opt;
                    ul.appendChild(li);
                });
                questionItem.appendChild(ul);
            }
            questionItem.addEventListener('click', function () {
                const idx = this.getAttribute('data-question-id');
                const question = questions[idx];
                questionText.value = question.questionText;
                questionTypeSelect.value = question.questionType;
                updateOptionsSection();
                document.getElementById('optionInputs').innerHTML = '';
                question.options.forEach(opt => {
                    const optionDiv = document.createElement('div');
                    optionDiv.className = 'option-input-row';
                    optionDiv.innerHTML = `
                        <input type="text" class="option-input" value="${opt}" required>
                        <button type="button" class="remove-option-btn" onclick="removeOption(this)">×</button>
                    `;
                    document.getElementById('optionInputs').appendChild(optionDiv);
                });
                deleteQuestionBtn.style.display = 'inline-block';
                deleteQuestionBtn.onclick = function () {
                    questions.splice(idx, 1);
                    updateQuestionsDisplay();
                    questionFormModal.style.display = 'none';
                    questionsDisplayModal.style.display = 'flex';
                    document.getElementById('questionsInput').value = JSON.stringify(questions);
                };
                document.getElementById('modalTitle').textContent = 'Edit Question';
                questionFormModal.style.display = 'flex';
                questionsDisplayModal.style.display = 'none';
            });
            questionsList.appendChild(questionItem);
        });
    }

    // Initialize questions display
    updateOptionsSection && updateOptionsSection();
    updateQuestionsDisplay();
    console.log("[INIT] Questions initialized:", questions);
});

