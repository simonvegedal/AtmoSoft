// DOM Elements
const authContainer = document.getElementById('auth-container');
const passwordManager = document.getElementById('password-manager');
const authMessage = document.getElementById('auth-message');

// Auth elements
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');

// Password manager elements
const siteNameInput = document.getElementById('site-name');
const usernameInput = document.getElementById('username');
const sitePasswordInput = document.getElementById('site-password');
const generatePasswordBtn = document.getElementById('generate-password');
const togglePasswordBtn = document.getElementById('toggle-password');
const savePasswordBtn = document.getElementById('save-password');
const searchInput = document.getElementById('search');
const passwordsContainer = document.getElementById('passwords-container');

// Auth event listeners
loginBtn.addEventListener('click', handleLogin);
registerBtn.addEventListener('click', handleRegister);
logoutBtn.addEventListener('click', handleLogout);

// Password manager event listeners
generatePasswordBtn.addEventListener('click', generatePassword);
togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
savePasswordBtn.addEventListener('click', savePassword);
searchInput.addEventListener('input', filterPasswords);

// Check auth state on page load
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        showPasswordManager(user);
        loadPasswords();
    } else {
        // User is signed out
        showAuthForm();
    }
});

// Authentication Functions
function handleLogin() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        showAuthError('Please enter both email and password');
        return;
    }
    
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            clearAuthInputs();
            showAuthError('');
        })
        .catch(error => {
            showAuthError(error.message);
        });
}

function handleRegister() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        showAuthError('Please enter both email and password');
        return;
    }
    
    if (password.length < 6) {
        showAuthError('Password should be at least 6 characters');
        return;
    }
    
    auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
            clearAuthInputs();
            showAuthError('');
        })
        .catch(error => {
            showAuthError(error.message);
        });
}

function handleLogout() {
    auth.signOut()
        .then(() => {
            showAuthForm();
        })
        .catch(error => {
            console.error('Error signing out:', error);
        });
}

function showAuthForm() {
    authContainer.classList.remove('hidden');
    passwordManager.classList.add('hidden');
    logoutBtn.classList.add('hidden');
}

function showPasswordManager(user) {
    authContainer.classList.add('hidden');
    passwordManager.classList.remove('hidden');
    logoutBtn.classList.remove('hidden');
}

function clearAuthInputs() {
    emailInput.value = '';
    passwordInput.value = '';
}

function showAuthError(message) {
    authMessage.textContent = message;
}

// Password Manager Functions
function generatePassword() {
    const length = 16;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=<>?";
    let password = "";
    
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    
    sitePasswordInput.value = password;
}

function togglePasswordVisibility() {
    if (sitePasswordInput.type === 'password') {
        sitePasswordInput.type = 'text';
    } else {
        sitePasswordInput.type = 'password';
    }
}

function savePassword() {
    const siteName = siteNameInput.value.trim();
    const username = usernameInput.value.trim();
    const password = sitePasswordInput.value;
    
    if (!siteName || !username || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    const userId = auth.currentUser.uid;
    const timestamp = firebase.firestore.FieldValue.serverTimestamp();
    
    // Encrypt password (basic encryption - in a real app, use stronger methods)
    const encryptedPassword = encryptPassword(password);
    
    db.collection('users').doc(userId).collection('passwords').add({
        siteName,
        username,
        password: encryptedPassword,
        createdAt: timestamp
    })
    .then(() => {
        clearPasswordInputs();
        loadPasswords();
    })
    .catch(error => {
        console.error('Error saving password:', error);
        alert('Error saving password. Please try again.');
    });
}

function loadPasswords() {
    if (!auth.currentUser) return;
    
    const userId = auth.currentUser.uid;
    
    db.collection('users').doc(userId).collection('passwords')
        .orderBy('siteName')
        .get()
        .then(snapshot => {
            passwordsContainer.innerHTML = '';
            
            if (snapshot.empty) {
                passwordsContainer.innerHTML = '<p>No saved passwords yet. Add one above!</p>';
                return;
            }
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const passwordId = doc.id;
                
                // Decrypt password for display
                const decryptedPassword = decryptPassword(data.password);
                
                createPasswordElement(passwordId, data.siteName, data.username, decryptedPassword);
            });
        })
        .catch(error => {
            console.error('Error loading passwords:', error);
            passwordsContainer.innerHTML = '<p>Error loading passwords. Please try again later.</p>';
        });
}

function createPasswordElement(id, siteName, username, password) {
    const passwordItem = document.createElement('div');
    passwordItem.className = 'password-item';
    passwordItem.dataset.id = id;
    
    const maskedPassword = '•'.repeat(10);
    
    passwordItem.innerHTML = `
        <div class="password-field">
            <strong>Website:</strong> <span>${siteName}</span>
        </div>
        <div class="password-field">
            <strong>Username:</strong> <span>${username}</span>
        </div>
        <div class="password-field">
            <strong>Password:</strong> <span class="password-value">${maskedPassword}</span>
        </div>
        <div class="password-actions">
            <button class="view-btn" data-password="${password}">View</button>
            <button class="copy-btn" data-password="${password}">Copy</button>
            <button class="delete-btn" data-id="${id}">Delete</button>
        </div>
    `;
    
    // Add event listeners
    const viewBtn = passwordItem.querySelector('.view-btn');
    const copyBtn = passwordItem.querySelector('.copy-btn');
    const deleteBtn = passwordItem.querySelector('.delete-btn');
    
    viewBtn.addEventListener('click', toggleViewPassword);
    copyBtn.addEventListener('click', copyPassword);
    deleteBtn.addEventListener('click', deletePassword);
    
    passwordsContainer.appendChild(passwordItem);
}

function toggleViewPassword(e) {
    const passwordValue = e.target.closest('.password-item').querySelector('.password-value');
    const realPassword = e.target.dataset.password;
    
    if (passwordValue.textContent === '•'.repeat(10)) {
        passwordValue.textContent = realPassword;
        e.target.textContent = 'Hide';
    } else {
        passwordValue.textContent = '•'.repeat(10);
        e.target.textContent = 'View';
    }
}

function copyPassword(e) {
    const password = e.target.dataset.password;
    
    navigator.clipboard.writeText(password)
        .then(() => {
            const originalText = e.target.textContent;
            e.target.textContent = 'Copied!';
            
            setTimeout(() => {
                e.target.textContent = originalText;
            }, 1500);
        })
        .catch(err => {
            console.error('Failed to copy:', err);
            alert('Failed to copy password. Please try again.');
        });
}

function deletePassword(e) {
    const passwordId = e.target.dataset.id;
    const userId = auth.currentUser.uid;
    
    if (confirm('Are you sure you want to delete this password?')) {
        db.collection('users').doc(userId).collection('passwords').doc(passwordId).delete()
            .then(() => {
                e.target.closest('.password-item').remove();
                
                // Check if there are no more passwords
                if (passwordsContainer.children.length === 0) {
                    passwordsContainer.innerHTML = '<p>No saved passwords yet. Add one above!</p>';
                }
            })
            .catch(error => {
                console.error('Error deleting password:', error);
                alert('Error deleting password. Please try again.');
            });
    }
}

function filterPasswords() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const passwordItems = passwordsContainer.querySelectorAll('.password-item');
    
    passwordItems.forEach(item => {
        const siteName = item.querySelector('.password-field:nth-child(1) span').textContent.toLowerCase();
        const username = item.querySelector('.password-field:nth-child(2) span').textContent.toLowerCase();
        
        if (siteName.includes(searchTerm) || username.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function clearPasswordInputs() {
    siteNameInput.value = '';
    usernameInput.value = '';
    sitePasswordInput.value = '';
}

// Very basic encryption/decryption functions
// Note: In a real app, use a proper encryption library!
function encryptPassword(password) {
    // This is a very basic encryption for demonstration purposes
    // Do NOT use this in a real app - use a proper encryption method
    return btoa(password); // Base64 encoding
}

function decryptPassword(encryptedPassword) {
    // This is a very basic decryption for demonstration purposes
    // Do NOT use this in a real app - use a proper decryption method
    return atob(encryptedPassword); // Base64 decoding
}