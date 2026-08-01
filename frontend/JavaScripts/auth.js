document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authError = document.getElementById('auth-error');

    // Toggle between forms
    document.getElementById('show-register').addEventListener('click', () => {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('register-section').style.display = 'block';
        authError.textContent = '';
    });

    document.getElementById('show-login').addEventListener('click', () => {
        document.getElementById('register-section').style.display = 'none';
        document.getElementById('login-section').style.display = 'block';
        authError.textContent = '';
    });

    // Handle Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const identifier = document.getElementById('login-identifier').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: identifier.includes('@') ? identifier : undefined,
                    username: !identifier.includes('@') ? identifier : undefined,
                    password
                })
            });

            const data = await response.json();
            if (response.ok) {
                // The HttpOnly cookie is set automatically by the browser!
                window.location.href = '/index.html';
            } else {
                authError.textContent = data.error || 'Login failed';
            }
        } catch (error) {
            authError.textContent = 'Server error. Please try again later.';
        }
    });

    // Handle Registration
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        try {
            const response = await fetch('/api/users/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();
            if (response.ok) {
                authError.style.color = 'green';
                authError.textContent = 'Registration successful! Please log in.';
                document.getElementById('show-login').click();
            } else {
                authError.style.color = 'red';
                authError.textContent = data.error || 'Registration failed';
            }
        } catch (error) {
            authError.textContent = 'Server error. Please try again later.';
        }
    });
});