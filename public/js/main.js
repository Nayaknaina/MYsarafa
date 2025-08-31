document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    const googleSignupBtn = document.getElementById('googleSignupBtn');
  

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(signupForm);
            
         
            const data = {
                f_name: formData.get('f_name'),
                l_name: formData.get('l_name'),
                email: formData.get('email'),
                /* dob: formData.get('dob'),
                country: formData.get('country'),
                state: formData.get('state'),
                city: formData.get('city'),
                pincode: formData.get('pincode'),
                address: formData.get('address'),
                shopname: formData.get('shopname'),
                shopadd: formData.get('shopadd'),
                no_of_emp: parseInt(formData.get('no_of_emp')),
                adhar_no: formData.get('adhar_no'),
                pan_no: formData.get('pan_no'),*/
                password: formData.get('password')
               
            };
            console.log(data);
            try {
                const response = await fetch('/auth/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data),
                    credentials: 'include'
                });

                const result = await response.json();
                
                if (response.ok) {
                    toastr.success('Signup successful! Redirecting to dashboard...');
                    window.location.href = '/user-app/dashboard';
                } else {
                    toastr.error(result.message);
                }
            } catch (error) {
                toastr.error('Error during signup: ' + error.message);
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(loginForm);
            const data = {
                email: formData.get('email'),
                password: formData.get('password')
            };

            try {
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data),
                    credentials: 'include'
                });

                const result = await response.json();
                if (response.ok) {
                    toastr.success('Login successful! Redirecting to dashboard...');
                    window.location.href = '/user-app/dashboard';
                } else {
                    toastr.error(result.message);
                }
            } catch (error) {
                toastr.error('Error during login: ' + error.message);
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('http://localhost:5000/api/logout', {
                    method: 'POST',
                    credentials: 'include'
                });

                if (response.ok) {
                    window.location.href = '/auth/login';
                }
            } catch (error) {
                toastr.error('Error during logout: ' + error.message);
            }
        });
    }

    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => {
            window.location.href = '/auth/google';
        });
    }

    if (googleSignupBtn) {
        googleSignupBtn.addEventListener('click', () => {
            window.location.href = '/auth/google';
        });
    }
    // Update user info in dashboard
    if (document.getElementById('userAvatar')) {
        fetch('http://localhost:5000/api/user', {
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.f_name) {
                document.querySelector('.avatar-user-name').textContent = `${data.f_name} ${data.l_name}`;
                document.querySelector('.avatar-user-email').textContent = data.email;
            }
        })
        .catch(error => console.error('Error fetching user:', error));
    }

  
});