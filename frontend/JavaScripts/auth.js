<<<<<<< HEAD
// frontend/JavaScripts/auth.js

// Change this to your live domain when you deploy!
const API_BASE_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {

    // 1. AUTO-REDIRECT: If already logged in, bounce to dashboard
    try {
        const checkAuth = await fetch(`${API_BASE_URL}/api/users/profile`, {
            method: 'GET',
            credentials: 'include'
        });

        if (checkAuth.ok) {
            window.location.replace('/index.html'); // Overwrite history
            return; // Stop the rest of the script
        }
    } catch (error) {
        // Just fail silently and let them log in
    }

=======
document.addEventListener('DOMContentLoaded', () => {
>>>>>>> 0d0d44c7c3e2025f66a6e27d6935d18f421f7a4a
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
<<<<<<< HEAD
            const response = await fetch(`${API_BASE_URL}/api/users/login`, {
=======
            const response = await fetch('/api/users/login', {
>>>>>>> 0d0d44c7c3e2025f66a6e27d6935d18f421f7a4a
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: identifier.includes('@') ? identifier : undefined,
                    username: !identifier.includes('@') ? identifier : undefined,
                    password
<<<<<<< HEAD
                }),
                credentials: 'include' // Make sure cookies are allowed!
=======
                })
>>>>>>> 0d0d44c7c3e2025f66a6e27d6935d18f421f7a4a
            });

            const data = await response.json();
            if (response.ok) {
<<<<<<< HEAD
                // USE REPLACE INSTEAD OF HREF
                window.location.replace('/index.html');
=======
                // The HttpOnly cookie is set automatically by the browser!
                window.location.href = '/index.html';
>>>>>>> 0d0d44c7c3e2025f66a6e27d6935d18f421f7a4a
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
<<<<<<< HEAD
            const response = await fetch(`${API_BASE_URL}/api/users/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
                credentials: 'include'
=======
            const response = await fetch('/api/users/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
>>>>>>> 0d0d44c7c3e2025f66a6e27d6935d18f421f7a4a
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