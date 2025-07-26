/*
 * User management script for login and registration.
 * Handles showing/hiding forms, submitting credentials to serverless
 * functions, storing the logged in user in localStorage, and
 * redirecting to the main application page.
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const registerCard = document.getElementById('register-card');
  const showRegister = document.getElementById('show-register');
  const showLogin = document.getElementById('show-login');

  // Switch to registration form
  if (showRegister) {
    showRegister.addEventListener('click', (e) => {
      e.preventDefault();
      loginForm.parentElement.classList.add('hidden');
      registerCard.classList.remove('hidden');
    });
  }
  // Switch back to login form
  if (showLogin) {
    showLogin.addEventListener('click', (e) => {
      e.preventDefault();
      registerCard.classList.add('hidden');
      loginForm.parentElement.classList.remove('hidden');
    });
  }

  // Handle login submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value;
      try {
        const res = await fetch('/.netlify/functions/loginUser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        const json = await res.json();
        if (res.ok && json.token) {
          localStorage.setItem('currentUser', JSON.stringify(json));
          // Redirect to main page
          window.location.href = 'index.html';
        } else {
          alert(json.error || 'Login failed');
        }
      } catch (err) {
        console.error(err);
        alert('Login failed');
      }
    });
  }

  // Handle registration submission
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('register-username').value.trim();
      const password = document.getElementById('register-password').value;
      const role = document.getElementById('register-role').value;
      try {
        const res = await fetch('/.netlify/functions/registerUser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, role }),
        });
        const json = await res.json();
        if (res.ok) {
          alert('Registration successful. Please login.');
          // Switch back to login
          registerCard.classList.add('hidden');
          loginForm.parentElement.classList.remove('hidden');
        } else {
          alert(json.error || 'Registration failed');
        }
      } catch (err) {
        console.error(err);
        alert('Registration failed');
      }
    });
  }
});