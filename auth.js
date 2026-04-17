// auth.js - Complete Authentication System with Activity Logging
// Import this file in all protected pages to verify admin access

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, getDoc, query, where, orderBy, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const adminsCollection = collection(db, "admins");
const activityCollection = collection(db, "adminActivities");
const secretKeysCollection = collection(db, "secretKeys");

// ==================== ACTIVITY LOGGING ====================

/**
 * Log admin activity to Firestore
 * @param {string} adminId - Admin document ID
 * @param {string} adminName - Admin full name
 * @param {string} action - Action type (LOGIN, LOGOUT, CREATE, UPDATE, DELETE, VIEW, EXPORT, IMPORT)
 * @param {string} details - Detailed description of the action
 * @param {Object} additionalData - Optional additional data (IP, userAgent, etc.)
 * @returns {Promise<void>}
 */
export async function logActivity(adminId, adminName, action, details, additionalData = {}) {
    try {
        const activityData = {
            adminId: adminId,
            adminName: adminName,
            action: action,
            details: details,
            timestamp: new Date(),
            userAgent: navigator.userAgent,
            ...additionalData
        };
        await addDoc(activityCollection, activityData);
        console.log(`Activity logged: ${action} - ${details}`);
    } catch (error) {
        console.error("Failed to log activity:", error);
    }
}

/**
 * Get activity logs for a specific admin
 * @param {string} adminId - Admin document ID
 * @param {number} limit - Maximum number of logs to return
 * @returns {Promise<Array>} Array of activity logs
 */
export async function getAdminActivities(adminId, limit = 50) {
    try {
        const q = query(activityCollection, where('adminId', '==', adminId), orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        const activities = [];
        snapshot.forEach((doc) => {
            activities.push({ id: doc.id, ...doc.data() });
        });
        return activities.slice(0, limit);
    } catch (error) {
        console.error("Error getting activities:", error);
        return [];
    }
}

/**
 * Get all activity logs (for super admins)
 * @param {number} limit - Maximum number of logs to return
 * @returns {Promise<Array>} Array of all activity logs
 */
export async function getAllActivities(limit = 100) {
    try {
        const q = query(activityCollection, orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        const activities = [];
        snapshot.forEach((doc) => {
            activities.push({ id: doc.id, ...doc.data() });
        });
        return activities.slice(0, limit);
    } catch (error) {
        console.error("Error getting all activities:", error);
        return [];
    }
}

/**
 * Get recent activities within a time range
 * @param {number} hours - Hours to look back
 * @returns {Promise<Array>} Array of recent activities
 */
export async function getRecentActivities(hours = 24) {
    try {
        const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
        const q = query(activityCollection, orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        const activities = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            const timestamp = data.timestamp?.toDate?.() || new Date(data.timestamp);
            if (timestamp >= cutoffTime) {
                activities.push({ id: doc.id, ...data });
            }
        });
        return activities;
    } catch (error) {
        console.error("Error getting recent activities:", error);
        return [];
    }
}

/**
 * Get activity statistics (counts by action type)
 * @returns {Promise<Object>} Statistics object
 */
export async function getActivityStats() {
    try {
        const snapshot = await getDocs(activityCollection);
        const stats = {
            total: 0,
            byAction: {
                LOGIN: 0,
                LOGOUT: 0,
                CREATE: 0,
                UPDATE: 0,
                DELETE: 0,
                VIEW: 0,
                EXPORT: 0,
                IMPORT: 0
            }
        };
        snapshot.forEach((doc) => {
            const data = doc.data();
            stats.total++;
            if (stats.byAction[data.action] !== undefined) {
                stats.byAction[data.action]++;
            }
        });
        return stats;
    } catch (error) {
        console.error("Error getting activity stats:", error);
        return { total: 0, byAction: {} };
    }
}

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
 * Logout current admin and record the action
 */
export async function logout() {
    const admin = getCurrentAdmin();
    if (admin) {
        await logActivity(admin.id, admin.name, 'LOGOUT', 'Admin logged out');
    }
    localStorage.removeItem('adminSession');
    sessionStorage.removeItem('adminLoggedIn');
    sessionStorage.removeItem('redirectAfterLogin');
    
    // Dispatch logout event for any listeners
    window.dispatchEvent(new CustomEvent('admin-logout'));
}

/**
 * Create admin session after successful login and log the action
 * @param {Object} adminData - Admin data from database
 * @param {string} adminId - Admin document ID
 */
export async function createSession(adminData, adminId) {
    const sessionData = {
        adminId: adminId,
        name: adminData.name,
        email: adminData.email,
        role: adminData.role || 'admin',
        loginTime: new Date().toISOString()
    };
    
    localStorage.setItem('adminSession', JSON.stringify(sessionData));
    sessionStorage.setItem('adminLoggedIn', 'true');
    
    // Log login activity
    await logActivity(adminId, adminData.name, 'LOGIN', `Admin logged in from ${navigator.userAgent}`);
    
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
        const q = query(adminsCollection, where('email', '==', email.trim().toLowerCase()));
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
            // Log failed login attempt
            await logActivity(adminId, adminData.name, 'LOGIN_FAILED', `Failed login attempt for ${email}`);
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
        const querySnapshot = await getDocs(secretKeysCollection);
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
 * @returns {Object|null} Current admin or null
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
        
        // Update admin role display if element exists
        const adminRoleElement = document.getElementById('adminRoleDisplay');
        if (adminRoleElement) {
            adminRoleElement.textContent = admin.role;
        }
        
        // Add logout functionality to logout buttons with activity logging
        const logoutButtons = document.querySelectorAll('.logout-btn, #logoutBtn');
        logoutButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                await logout();
                window.location.href = 'admin-login.html';
            });
        });
    }
    
    return admin;
}

// ==================== ADMIN MANAGEMENT FUNCTIONS ====================

/**
 * Get all admins (for super admin panel)
 * @returns {Promise<Array>} List of all admins
 */
export async function getAllAdmins() {
    try {
        const snapshot = await getDocs(adminsCollection);
        const admins = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            admins.push({
                id: doc.id,
                name: data.name,
                email: data.email,
                role: data.role || 'admin',
                createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt)
            });
        });
        return admins;
    } catch (error) {
        console.error("Error getting admins:", error);
        return [];
    }
}

/**
 * Update admin information with activity logging
 * @param {string} adminId - Admin ID to update
 * @param {Object} updateData - Data to update
 * @param {string} updaterId - ID of admin performing the update
 * @param {string} updaterName - Name of admin performing the update
 * @returns {Promise<boolean>} Success status
 */
export async function updateAdmin(adminId, updateData, updaterId, updaterName) {
    try {
        const adminRef = doc(db, "admins", adminId);
        const oldAdmin = await getDoc(adminRef);
        const oldData = oldAdmin.data();
        
        await updateDoc(adminRef, {
            ...updateData,
            updatedAt: new Date()
        });
        
        // Log the update action
        const changes = [];
        if (updateData.name && updateData.name !== oldData.name) changes.push(`name: ${oldData.name} → ${updateData.name}`);
        if (updateData.role && updateData.role !== oldData.role) changes.push(`role: ${oldData.role} → ${updateData.role}`);
        if (updateData.email && updateData.email !== oldData.email) changes.push(`email: ${oldData.email} → ${updateData.email}`);
        
        await logActivity(updaterId, updaterName, 'UPDATE', `Updated admin ${oldData.name}: ${changes.join(', ')}`);
        return true;
    } catch (error) {
        console.error("Error updating admin:", error);
        return false;
    }
}

/**
 * Delete admin with activity logging
 * @param {string} adminId - Admin ID to delete
 * @param {string} deleterId - ID of admin performing the deletion
 * @param {string} deleterName - Name of admin performing the deletion
 * @returns {Promise<boolean>} Success status
 */
export async function deleteAdmin(adminId, deleterId, deleterName) {
    try {
        const adminRef = doc(db, "admins", adminId);
        const admin = await getDoc(adminRef);
        const adminData = admin.data();
        
        await deleteDoc(adminRef);
        
        await logActivity(deleterId, deleterName, 'DELETE', `Deleted admin ${adminData?.name || adminId}`);
        return true;
    } catch (error) {
        console.error("Error deleting admin:", error);
        return false;
    }
}

// ==================== PAGE VIEW TRACKING ====================

/**
 * Track page view for analytics
 * @param {string} pageName - Name of the page being viewed
 */
export async function trackPageView(pageName) {
    const admin = getCurrentAdmin();
    if (admin) {
        await logActivity(admin.id, admin.name, 'VIEW', `Viewed page: ${pageName}`);
    }
}

// ==================== EXPORT FUNCTIONS ====================

/**
 * Log export action
 * @param {string} exportType - Type of export (CSV, Excel, PDF, Word)
 * @param {number} recordCount - Number of records exported
 */
export async function logExport(exportType, recordCount) {
    const admin = getCurrentAdmin();
    if (admin) {
        await logActivity(admin.id, admin.name, 'EXPORT', `Exported ${recordCount} records as ${exportType}`);
    }
}

/**
 * Log import action
 * @param {number} recordCount - Number of records imported
 * @param {string} source - Source file type
 */
export async function logImport(recordCount, source) {
    const admin = getCurrentAdmin();
    if (admin) {
        await logActivity(admin.id, admin.name, 'IMPORT', `Imported ${recordCount} records from ${source}`);
    }
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
        logoutTimer = setTimeout(async () => {
            if (isLoggedIn()) {
                await logout();
                alert('Your session has expired. Please login again.');
                window.location.href = 'admin-login.html';
            }
        }, timeoutMinutes * 60 * 1000);
    }
    
    // Reset timer on user activity
    const events = ['mousedown', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
        document.addEventListener(event, resetTimer);
    });
    
    resetTimer();
}

// ==================== REGISTRATION HELPER ====================

/**
 * Register a new admin with activity logging
 * @param {Object} adminData - Admin data { name, email, password, secretKey }
 * @param {string} registrarId - ID of admin performing registration (if any)
 * @param {string} registrarName - Name of admin performing registration
 * @returns {Promise<Object>} { success, message, adminId }
 */
export async function registerAdmin(adminData, registrarId = null, registrarName = null) {
    try {
        // Check if email already exists
        const emailQuery = query(adminsCollection, where('email', '==', adminData.email.toLowerCase()));
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
        
        const docRef = await addDoc(adminsCollection, newAdmin);
        
        // Log registration
        if (registrarId && registrarName) {
            await logActivity(registrarId, registrarName, 'CREATE', `Registered new admin: ${adminData.name} (${adminData.email})`);
        } else {
            // Self-registration
            await logActivity(docRef.id, adminData.name, 'CREATE', `Self-registration completed`);
        }
        
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
        adminExists,
        logActivity,
        getAdminActivities,
        getAllActivities,
        getRecentActivities,
        getActivityStats,
        getAllAdmins,
        updateAdmin,
        deleteAdmin,
        trackPageView,
        logExport,
        logImport
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
    adminExists,
    logActivity,
    getAdminActivities,
    getAllActivities,
    getRecentActivities,
    getActivityStats,
    getAllAdmins,
    updateAdmin,
    deleteAdmin,
    trackPageView,
    logExport,
    logImport
};
