// auth.js - Complete Authentication System for Noor Academy Admin Dashboard
// Import this file in all protected pages to verify admin access

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase Configuration (same as your existing config)
const firebaseConfig = {
    apiKey: "AIzaSyAR_g5y04YAGCrTvZCowrE7hw8h7k1du08",
    authDomain: "jujm-qirat.firebaseapp.com",
    projectId: "jujm-qirat",
    storageBucket: "jujm-qirat.firebasestorage.app",
    messagingSenderId: "253413984903",
    appId: "1:253413984903:web:c1577e0fdef1711f960622"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==================== SESSION MANAGEMENT ====================

/**
 * Get current admin session from localStorage
 * @returns {Object|null} Session data or null if not logged in
 */
export function getCurrentSession() {
    try {
        const session = localStorage.getItem('adminSession');
        if (!session) return null;
        
        const sessionData = JSON.parse(session);
        const loginTime = new Date(sessionData.loginTime);
        const now = new Date();
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
        
        // Session expires after 24 hours
        if (hoursDiff > 24) {
            logout();
            return null;
        }
        
        return sessionData;
    } catch (error) {
        console.error("Error getting session:", error);
        return null;
    }
}

/**
 * Check if admin is currently logged in
 * @returns {boolean} True if logged in
 */
export function isLoggedIn() {
    const session = getCurrentSession();
    return session !== null;
}

/**
 * Get current admin info
 * @returns {Object|null} Admin info or null
 */
export function getCurrentAdmin() {
    const session = getCurrentSession();
    if (!session) return null;
    return {
        id: session.adminId,
        name: session.name,
        email: session.email,
        role: session.role
    };
}

/**
 * Logout current admin
 */
export function logout() {
    localStorage.removeItem('adminSession');
    sessionStorage.removeItem('adminLoggedIn');
    
    // Dispatch logout event for any listeners
    window.dispatchEvent(new CustomEvent('admin-logout'));
}

/**
 * Create admin session after successful login
 * @param {Object} adminData - Admin data from database
 * @param {string} adminId - Admin document ID
 */
export function createSession(adminData, adminId) {
    const sessionData = {
        adminId: adminId,
        name: adminData.name,
        email: adminData.email,
        role: adminData.role || 'admin',
        loginTime: new Date().toISOString()
    };
    
    localStorage.setItem('adminSession', JSON.stringify(sessionData));
    sessionStorage.setItem('adminLoggedIn', 'true');
    
    // Dispatch login event
    window.dispatchEvent(new CustomEvent('admin-login', { detail: sessionData }));
}

// ==================== AUTHENTICATION CHECKS ====================

/**
 * Verify admin credentials against database
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 * @returns {Promise<Object>} { success, message, adminData, adminId }
 */
export async function verifyAdminCredentials(email, password) {
    try {
        const q = query(collection(db, "admins"), where('email', '==', email.trim().toLowerCase()));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            return { success: false, message: 'Invalid email or password' };
        }
        
        let adminData = null;
        let adminId = null;
        
        querySnapshot.forEach((docSnap) => {
            adminData = docSnap.data();
            adminId = docSnap.id;
        });
        
        // Simple hash verification (matching registration)
        const hashedInputPassword = btoa(password + 'noor_salt_2024');
        
        if (adminData.password !== hashedInputPassword) {
            return { success: false, message: 'Invalid email or password' };
        }
        
        return { 
            success: true, 
            message: 'Login successful', 
            adminData: adminData, 
            adminId: adminId 
        };
        
    } catch (error) {
        console.error("Verification error:", error);
        return { success: false, message: 'Authentication failed: ' + error.message };
    }
}

/**
 * Check if a specific admin exists by ID
 * @param {string} adminId - Admin document ID
 * @returns {Promise<boolean>} True if admin exists
 */
export async function adminExists(adminId) {
    try {
        const adminRef = doc(db, "admins", adminId);
        const adminSnap = await getDoc(adminRef);
        return adminSnap.exists();
    } catch (error) {
        console.error("Error checking admin:", error);
        return false;
    }
}

/**
 * Validate secret key against database
 * @param {string} secretKey - The secret key to validate
 * @returns {Promise<Object>} { valid, keyInfo }
 */
export async function validateSecretKey(secretKey) {
    try {
        const querySnapshot = await getDocs(collection(db, "secretKeys"));
        let isValid = false;
        let validKey = null;
        
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.secretKey === secretKey && data.isActive !== false) {
                isValid = true;
                validKey = { id: docSnap.id, name: data.name };
            }
        });
        
        return { valid: isValid, keyInfo: validKey };
    } catch (error) {
        console.error("Error validating secret key:", error);
        return { valid: false, keyInfo: null };
    }
}

// ==================== PROTECTED PAGE SETUP ====================

/**
 * Protect a page - redirect to login if not authenticated
 * @param {string} redirectUrl - URL to redirect to if not logged in (default: 'admin-login.html')
 * @returns {boolean} True if authenticated, false otherwise
 */
export function protectPage(redirectUrl = 'admin-login.html') {
    if (!isLoggedIn()) {
        // Save the current page to redirect back after login
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        window.location.href = redirectUrl;
        return false;
    }
    return true;
}

/**
 * Protect page with optional role check
 * @param {string|string[]} allowedRoles - Single role or array of allowed roles
 * @param {string} redirectUrl - URL to redirect to if not authorized
 * @returns {boolean} True if authorized, false otherwise
 */
export function protectPageWithRole(allowedRoles, redirectUrl = 'admin-login.html') {
    if (!isLoggedIn()) {
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        window.location.href = redirectUrl;
        return false;
    }
    
    const admin = getCurrentAdmin();
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!roles.includes(admin.role)) {
        window.location.href = 'unauthorized.html';
        return false;
    }
    
    return true;
}

/**
 * Initialize auth UI components on a page
 * Shows admin name in header, adds logout button functionality
 */
export function initAuthUI() {
    const admin = getCurrentAdmin();
    
    if (admin) {
        // Update admin name display if element exists
        const adminNameElement = document.getElementById('adminNameDisplay');
        if (adminNameElement) {
            adminNameElement.textContent = admin.name;
        }
        
        // Update admin email display if element exists
        const adminEmailElement = document.getElementById('adminEmailDisplay');
        if (adminEmailElement) {
            adminEmailElement.textContent = admin.email;
        }
        
        // Add logout functionality to logout buttons
        const logoutButtons = document.querySelectorAll('.logout-btn, #logoutBtn');
        logoutButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
                window.location.href = 'admin-login.html';
            });
        });
    }
    
    return admin;
}

// ==================== API PROTECTION HELPERS ====================

/**
 * Check if request has valid admin session (for API endpoints)
 * @returns {Object} { authorized, admin, message }
 */
export function checkApiAuth() {
    const admin = getCurrentAdmin();
    if (!admin) {
        return { authorized: false, admin: null, message: 'Unauthorized - Please login' };
    }
    return { authorized: true, admin: admin, message: 'Authorized' };
}

/**
 * Get auth header for fetch requests
 * @returns {Object} Headers object with auth token
 */
export function getAuthHeader() {
    const session = getCurrentSession();
    if (!session) return {};
    
    return {
        'X-Admin-Id': session.adminId,
        'X-Admin-Email': session.email,
        'X-Auth-Token': btoa(`${session.adminId}:${session.loginTime}`)
    };
}

// ==================== SESSION EVENT LISTENERS ====================

/**
 * Set up auto-logout timer based on session expiry
 * @param {number} timeoutMinutes - Minutes until auto-logout (default: 60)
 */
export function setupAutoLogout(timeoutMinutes = 60) {
    let logoutTimer;
    
    function resetTimer() {
        if (logoutTimer) clearTimeout(logoutTimer);
        logoutTimer = setTimeout(() => {
            if (isLoggedIn()) {
                logout();
                alert('Your session has expired. Please login again.');
                window.location.href = 'admin-login.html';
            }
        }, timeoutMinutes * 60 * 1000);
    }
    
    // Reset timer on user activity
    const events = ['mousedown', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
        document.addEventListener(event, resetTimer);
    });
    
    resetTimer();
}

// ==================== REGISTRATION HELPER ====================

/**
 * Register a new admin
 * @param {Object} adminData - Admin data { name, email, password, secretKey }
 * @returns {Promise<Object>} { success, message, adminId }
 */
export async function registerAdmin(adminData) {
    try {
        // Check if email already exists
        const emailQuery = query(collection(db, "admins"), where('email', '==', adminData.email.toLowerCase()));
        const emailSnapshot = await getDocs(emailQuery);
        
        if (!emailSnapshot.empty) {
            return { success: false, message: 'Email already registered' };
        }
        
        // Validate secret key
        const keyValidation = await validateSecretKey(adminData.secretKey);
        if (!keyValidation.valid) {
            return { success: false, message: 'Invalid or expired secret key' };
        }
        
        // Hash password
        const hashedPassword = btoa(adminData.password + 'noor_salt_2024');
        
        // Create admin document
        const newAdmin = {
            name: adminData.name.trim(),
            email: adminData.email.trim().toLowerCase(),
            password: hashedPassword,
            role: 'admin',
            registeredWithKey: keyValidation.keyInfo?.name || 'Unknown Key',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const docRef = await addDoc(collection(db, "admins"), newAdmin);
        
        return { success: true, message: 'Admin registered successfully', adminId: docRef.id };
        
    } catch (error) {
        console.error("Registration error:", error);
        return { success: false, message: 'Registration failed: ' + error.message };
    }
}

// ==================== EXPORT ALL FUNCTIONS ====================

// For use in non-module scripts (global object)
if (typeof window !== 'undefined') {
    window.Auth = {
        getCurrentSession,
        isLoggedIn,
        getCurrentAdmin,
        logout,
        createSession,
        verifyAdminCredentials,
        protectPage,
        protectPageWithRole,
        initAuthUI,
        checkApiAuth,
        getAuthHeader,
        setupAutoLogout,
        validateSecretKey,
        registerAdmin,
        adminExists
    };
}

// Default export for module imports
export default {
    getCurrentSession,
    isLoggedIn,
    getCurrentAdmin,
    logout,
    createSession,
    verifyAdminCredentials,
    protectPage,
    protectPageWithRole,
    initAuthUI,
    checkApiAuth,
    getAuthHeader,
    setupAutoLogout,
    validateSecretKey,
    registerAdmin,
    adminExists
};
