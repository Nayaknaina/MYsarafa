

// KYC Form Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Add Worker functionality
    const addWorkerBtn = document.getElementById('addWorkerBtn');
    const workersContainer = document.getElementById('workersContainer');
    const numWorkersInput = document.getElementById('numWorkers');
    
    if (addWorkerBtn && workersContainer) {
        addWorkerBtn.addEventListener('click', function() {
            addWorkerField();
        });
    }
    
    // Update number of workers when adding/removing workers
    if (numWorkersInput) {
        numWorkersInput.addEventListener('input', function() {
            const numWorkers = parseInt(this.value) || 0;
            updateWorkersFields(numWorkers);
        });
    }
    
    // KYC Form submission
    const kycForm = document.getElementById('kycForm');
    if (kycForm) {
        // Disabled old submit handler in favor of multi-step handler below
        // kycForm.addEventListener('submit', function(e) {
        //     e.preventDefault();
        //     handleKYCSubmission();
        // });
    }
});