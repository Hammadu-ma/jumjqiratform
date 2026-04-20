// nav.js - Universal Navigation System for JUMJ Irshad Admin Dashboard
// Handles desktop header navigation and mobile bottom navigation with role-based access
// ENHANCED: Fully responsive with horizontal scroll & adaptive mobile display for many items

import { getCurrentAdminSync } from './auth.js';

/**
 * Navigation Configuration
 * Add all your pages here with their respective icons and display names
 * role: 'all' = visible to everyone, 'super-admin' = only super admins
 */
export const NAVIGATION_ITEMS = [
    { path: 'index.html', name: 'Home', icon: 'fa-home', mobileOnly: false, role: 'all' },
    { path: 'groups.html', name: 'Groups', icon: 'fa-layer-group', mobileOnly: false, role: 'all' },
    { path: 'tables.html', name: 'Tables', icon: 'fa-table', mobileOnly: false, role: 'all' },
    { path: 'exam.html', name: 'Exam', icon: 'fa-quiz', mobileOnly: false, role: 'all' },
    { path: 'analytics.html', name: 'Analytics', icon: 'fa-chart-line', mobileOnly: false, role: 'all' },
    { path: 'import.html', name: 'Import', icon: 'fa-upload', mobileOnly: false, role: 'all' },
    { path: 'secret-keys.html', name: 'Keys', icon: 'fa-key', mobileOnly: false, role: 'super-admin' },
    { path: 'admin-management.html', name: 'Admins', icon: 'fa-user-shield', mobileOnly: false, role: 'super-admin' }
];

// Additional mobile-only items that don't appear in desktop header
const MOBILE_ONLY_ITEMS = [];

/**
 * Get current admin role
 * @returns {string|null} Admin role or null if not logged in
 */
function getCurrentAdminRole() {
    try {
        const admin = getCurrentAdminSync();
        return admin?.role || null;
    } catch (error) {
        console.error("Error getting admin role:", error);
        return null;
    }
}

/**
 * Check if user can see a navigation item based on role
 * @param {Object} item - Navigation item
 * @returns {boolean} True if user can see the item
 */
function canSeeItem(item) {
    if (item.role === 'all') return true;
    const adminRole = getCurrentAdminRole();
    if (item.role === 'super-admin') {
        return adminRole === 'super-admin';
    }
    return true;
}

/**
 * Get current page filename from window location
 * @returns {string} Current page filename
 */
export function getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop();
    return filename || 'index.html';
}

/**
 * Check if current page matches the given path
 * @param {string} path - Page path to check
 * @returns {boolean} True if current page matches
 */
export function isActivePage(path) {
    const currentPage = getCurrentPage();
    const targetPage = path.split('/').pop();
    return currentPage === targetPage;
}

/**
 * Create desktop navigation HTML (role-aware) with horizontal scroll support for many items
 * @returns {string} HTML string for desktop navigation
 */
export function createDesktopNav() {
    const desktopNavItems = NAVIGATION_ITEMS.filter(item => !item.mobileOnly && canSeeItem(item));
    
    if (desktopNavItems.length === 0) return '';
    
    // Wrap desktop nav in a scrollable container for responsiveness with many tabs
    return `
        <div class="desktop-nav-wrapper">
            <div class="desktop-nav-scroll">
                <div class="desktop-nav">
                    ${desktopNavItems.map(item => `
                        <a href="${item.path}" class="nav-link ${isActivePage(item.path) ? 'active' : ''}">
                            <i class="fas ${item.icon}"></i> <span>${item.name}</span>
                        </a>
                    `).join('')}
                </div>
            </div>
            <button class="nav-scroll-btn nav-scroll-left" aria-label="Scroll left"><i class="fas fa-chevron-left"></i></button>
            <button class="nav-scroll-btn nav-scroll-right" aria-label="Scroll right"><i class="fas fa-chevron-right"></i></button>
        </div>
    `;
}

/**
 * Create mobile bottom navigation HTML (role-aware) - enhanced for many items with horizontal scroll
 * @returns {string} HTML string for mobile bottom navigation
 */
export function createMobileNav() {
    const mobileItems = [...NAVIGATION_ITEMS.filter(item => canSeeItem(item)), ...MOBILE_ONLY_ITEMS];
    
    if (mobileItems.length === 0) return '';
    
    return `
        <div class="bottom-nav">
            <div class="bottom-nav-scroll">
                ${mobileItems.map(item => `
                    <button class="nav-item ${isActivePage(item.path) ? 'active' : ''}" onclick="window.location.href='${item.path}'">
                        <i class="fas ${item.icon}"></i>
                        <span>${item.name}</span>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * Inject navigation into the page
 * Looks for elements with IDs 'desktopNavContainer' and 'mobileNavContainer'
 * If not found, creates them at appropriate positions
 */
export function injectNavigation() {
    // Check if desktop nav container exists, if not create it
    let desktopContainer = document.getElementById('desktopNavContainer');
    if (!desktopContainer) {
        // Try to find the header content area
        const headerContent = document.querySelector('.header-content');
        if (headerContent) {
            // Create desktop nav container inside header
            desktopContainer = document.createElement('div');
            desktopContainer.id = 'desktopNavContainer';
            // Insert after logo or at the beginning of header-content
            const logo = headerContent.querySelector('.logo');
            if (logo && logo.nextSibling) {
                headerContent.insertBefore(desktopContainer, logo.nextSibling);
            } else {
                headerContent.appendChild(desktopContainer);
            }
        } else {
            // Create a new header if none exists
            const glassHeader = document.querySelector('.glass-header');
            if (glassHeader) {
                const headerContentDiv = glassHeader.querySelector('.header-content') || glassHeader;
                desktopContainer = document.createElement('div');
                desktopContainer.id = 'desktopNavContainer';
                headerContentDiv.appendChild(desktopContainer);
            }
        }
    }
    
    // Inject desktop nav HTML
    if (desktopContainer) {
        desktopContainer.innerHTML = createDesktopNav();
        // Initialize scroll buttons after desktop nav is rendered
        initDesktopNavScroll();
    }
    
    // Check if mobile nav container exists, if not create it
    let mobileContainer = document.getElementById('mobileNavContainer');
    if (!mobileContainer) {
        mobileContainer = document.createElement('div');
        mobileContainer.id = 'mobileNavContainer';
        document.body.appendChild(mobileContainer);
    }
    
    // Inject mobile nav HTML
    mobileContainer.innerHTML = createMobileNav();
}

/**
 * Initialize desktop navigation scroll buttons functionality
 */
function initDesktopNavScroll() {
    const wrapper = document.querySelector('.desktop-nav-wrapper');
    if (!wrapper) return;
    
    const scrollContainer = wrapper.querySelector('.desktop-nav-scroll');
    const leftBtn = wrapper.querySelector('.nav-scroll-left');
    const rightBtn = wrapper.querySelector('.nav-scroll-right');
    
    if (!scrollContainer) return;
    
    // Function to update scroll buttons visibility
    function updateScrollButtons() {
        if (!leftBtn || !rightBtn) return;
        const scrollLeft = scrollContainer.scrollLeft;
        const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
        
        leftBtn.style.opacity = scrollLeft <= 10 ? '0' : '1';
        leftBtn.style.visibility = scrollLeft <= 10 ? 'hidden' : 'visible';
        rightBtn.style.opacity = maxScroll - scrollLeft <= 10 ? '0' : '1';
        rightBtn.style.visibility = maxScroll - scrollLeft <= 10 ? 'hidden' : 'visible';
    }
    
    // Scroll function
    const scrollAmount = 200;
    if (leftBtn) {
        leftBtn.addEventListener('click', (e) => {
            e.preventDefault();
            scrollContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });
    }
    if (rightBtn) {
        rightBtn.addEventListener('click', (e) => {
            e.preventDefault();
            scrollContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });
    }
    
    // Listen for scroll events
    scrollContainer.addEventListener('scroll', updateScrollButtons);
    window.addEventListener('resize', () => {
        updateScrollButtons();
        // Adjust for responsive layout
        if (window.innerWidth <= 768) {
            scrollContainer.style.scrollBehavior = 'auto';
        } else {
            scrollContainer.style.scrollBehavior = 'smooth';
        }
    });
    
    // Initial update
    setTimeout(updateScrollButtons, 100);
}

/**
 * Add navigation styles to the page - ENHANCED for full responsiveness with many tabs
 */
export function addNavigationStyles() {
    const styleId = 'navigation-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        /* Desktop Navigation Wrapper - fully responsive */
        .desktop-nav-wrapper {
            position: relative;
            display: flex;
            align-items: center;
            max-width: 100%;
            flex: 1;
            min-width: 0; /* Prevent flex overflow */
        }
        
        .desktop-nav-scroll {
            overflow-x: auto;
            overflow-y: hidden;
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
            flex: 1;
            margin: 0 4px;
        }
        
        .desktop-nav-scroll::-webkit-scrollbar {
            height: 4px;
        }
        
        .desktop-nav-scroll::-webkit-scrollbar-track {
            background: var(--border, #e2e8f0);
            border-radius: 4px;
        }
        
        .desktop-nav-scroll::-webkit-scrollbar-thumb {
            background: var(--primary, #10b981);
            border-radius: 4px;
        }
        
        .desktop-nav {
            display: flex;
            gap: 8px;
            background: var(--card-bg, #ffffff);
            padding: 6px;
            border-radius: 60px;
            box-shadow: var(--shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05));
            border: 1px solid var(--border, #e2e8f0);
            width: max-content;
            min-width: 100%;
        }
        
        .nav-scroll-btn {
            background: white;
            border: 1px solid var(--border, #e2e8f0);
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: var(--primary, #10b981);
            transition: all 0.2s;
            box-shadow: var(--shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05));
            flex-shrink: 0;
        }
        
        .nav-scroll-btn:hover {
            background: var(--primary-light, #d1fae5);
            border-color: var(--primary, #10b981);
        }
        
        .nav-link {
            padding: 10px 20px;
            border-radius: 40px;
            text-decoration: none;
            font-weight: 600;
            color: var(--text-secondary, #475569);
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            white-space: nowrap;
        }
        
        /* Responsive text adjustment for desktop nav when screen gets smaller */
        @media (max-width: 1100px) {
            .nav-link {
                padding: 8px 16px;
                font-size: 0.9rem;
            }
        }
        
        @media (max-width: 950px) {
            .nav-link {
                padding: 6px 12px;
                font-size: 0.85rem;
            }
            .nav-link i {
                font-size: 0.9rem;
            }
        }
        
        .nav-link:hover {
            background: var(--primary-light, #d1fae5);
            color: var(--primary-dark, #059669);
        }
        
        .nav-link.active {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        
        /* Mobile Bottom Navigation - Enhanced for many items with horizontal scroll */
        .bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(20px);
            display: none;
            border-top: 1px solid var(--border, #e2e8f0);
            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
            z-index: 200;
            padding: 8px 0;
        }
        
        .bottom-nav-scroll {
            overflow-x: auto;
            overflow-y: hidden;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none; /* Hide scrollbar for cleaner look */
            display: flex;
            justify-content: space-between;
            scroll-behavior: smooth;
            padding: 4px 12px;
        }
        
        .bottom-nav-scroll::-webkit-scrollbar {
            display: none; /* Hide scrollbar on Chrome/Safari */
        }
        
        .nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            background: none;
            border: none;
            cursor: pointer;
            padding: 8px 14px;
            border-radius: 40px;
            transition: all 0.2s;
            color: var(--text-muted, #64748b);
            font-family: inherit;
            flex-shrink: 0;
            min-width: 64px;
        }
        
        .nav-item i {
            font-size: 1.3rem;
        }
        
        .nav-item span {
            font-size: 0.7rem;
            font-weight: 500;
            white-space: nowrap;
        }
        
        .nav-item.active {
            color: var(--primary, #10b981);
            background: var(--primary-light, #d1fae5);
        }
        
        .nav-item:hover {
            background: var(--primary-light, #d1fae5);
        }
        
        /* Responsive adjustments for many tabs on mobile */
        @media (max-width: 480px) {
            .nav-item {
                padding: 6px 10px;
                min-width: 56px;
            }
            .nav-item i {
                font-size: 1.2rem;
            }
            .nav-item span {
                font-size: 0.65rem;
            }
        }
        
        /* Responsive: Hide desktop nav on mobile, show mobile nav */
        @media (max-width: 768px) {
            .desktop-nav-wrapper {
                display: none;
            }
            .bottom-nav {
                display: block;
            }
            body {
                padding-bottom: 70px;
            }
        }
        
        /* Show desktop nav on larger screens */
        @media (min-width: 769px) {
            .desktop-nav-wrapper {
                display: flex;
            }
            .bottom-nav {
                display: none;
            }
        }
        
        /* Ensure header-content has proper spacing and doesn't wrap awkwardly */
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
        }
        
        /* On very large screens, allow more breathing room */
        @media (min-width: 1400px) {
            .desktop-nav .nav-link {
                padding: 12px 28px;
                font-size: 1rem;
            }
        }
        
        /* Admin info header styles */
        .admin-info-header {
            display: flex;
            align-items: center;
            gap: 16px;
            background: var(--primary-light, #d1fae5);
            padding: 6px 20px 6px 16px;
            border-radius: 50px;
            flex-shrink: 0;
        }
        
        .admin-avatar-sm {
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #10b981, #059669);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
        }
        
        .logout-btn {
            background: none;
            border: none;
            color: var(--danger, #ef4444);
            cursor: pointer;
            font-size: 1.2rem;
            padding: 8px;
            border-radius: 30px;
            transition: all 0.2s;
        }
        
        .logout-btn:hover {
            background: #fee2e2;
        }
        
        @media (max-width: 768px) {
            .admin-info-header {
                padding: 4px 12px 4px 8px;
            }
            .admin-avatar-sm {
                width: 28px;
                height: 28px;
                font-size: 0.8rem;
            }
            .logout-btn {
                padding: 4px;
                font-size: 1rem;
            }
        }
        
        /* Hide scroll buttons on touch devices where they might be less useful, but keep functionality */
        @media (max-width: 768px) and (hover: none) {
            .nav-scroll-btn {
                display: none;
            }
            .desktop-nav-scroll {
                margin: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Initialize navigation system
 * Call this function on every page that needs navigation
 * @param {Object} options - Configuration options
 */
export function initNavigation(options = {}) {
    addNavigationStyles();
    injectNavigation();
    
    // Add logout functionality if logout button exists
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        // Remove existing listeners to avoid duplicates
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        newLogoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (window.Auth && typeof window.Auth.logout === 'function') {
                await window.Auth.logout();
            }
            window.location.href = 'admin-login.html';
        });
    }
    
    // Optional: Add resize listener to reinitialize scroll buttons on orientation change
    window.addEventListener('resize', () => {
        if (document.querySelector('.desktop-nav-wrapper')) {
            initDesktopNavScroll();
        }
    });
}

/**
 * Update active navigation item based on current page
 * Call this after dynamic content changes
 */
export function updateActiveNav() {
    const currentPage = getCurrentPage();
    
    // Update desktop nav
    document.querySelectorAll('.desktop-nav .nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.split('/').pop() === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Update mobile nav
    document.querySelectorAll('.bottom-nav .nav-item').forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes(currentPage)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

/**
 * Get navigation HTML as string (for manual insertion)
 * @returns {Object} Object containing desktop and mobile navigation HTML
 */
export function getNavigationHTML() {
    return {
        desktop: createDesktopNav(),
        mobile: createMobileNav()
    };
}

/**
 * Refresh navigation (call after login/role change)
 */
export function refreshNavigation() {
    const desktopContainer = document.getElementById('desktopNavContainer');
    const mobileContainer = document.getElementById('mobileNavContainer');
    
    if (desktopContainer) {
        desktopContainer.innerHTML = createDesktopNav();
        initDesktopNavScroll();
    }
    if (mobileContainer) {
        mobileContainer.innerHTML = createMobileNav();
    }
}

// Default export for convenience
export default {
    NAVIGATION_ITEMS,
    getCurrentPage,
    isActivePage,
    createDesktopNav,
    createMobileNav,
    injectNavigation,
    addNavigationStyles,
    initNavigation,
    updateActiveNav,
    getNavigationHTML,
    refreshNavigation
};
