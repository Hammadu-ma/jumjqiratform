// nav.js - Universal Navigation System for Noor Academy Admin Dashboard
// Handles desktop header navigation and mobile bottom navigation

/**
 * Navigation Configuration
 * Add all your pages here with their respective icons and display names
 */
const NAVIGATION_ITEMS = [
    { path: 'index.html', name: 'Home', icon: 'fa-home', mobileOnly: false },
    { path: 'groups.html', name: 'Groups', icon: 'fa-layer-group', mobileOnly: false },
    { path: 'tables.html', name: 'Tables', icon: 'fa-table', mobileOnly: false },
    { path: 'analytics.html', name: 'Analytics', icon: 'fa-chart-line', mobileOnly: false },
    { path: 'import.html', name: 'Import', icon: 'fa-upload', mobileOnly: false },
    { path: 'secret-keys.html', name: 'Keys', icon: 'fa-key', mobileOnly: false },
    { path: 'admin-management.html', name: 'Admins', icon: 'fa-user-shield', mobileOnly: false }
];

// Additional mobile-only items that don't appear in desktop header
const MOBILE_ONLY_ITEMS = [
    // Add any mobile-specific navigation items here if needed
];

// Combine all navigation items for mobile
const ALL_MOBILE_ITEMS = [...NAVIGATION_ITEMS.filter(item => !item.mobileOnly), ...MOBILE_ONLY_ITEMS];

/**
 * Get current page filename from window location
 * @returns {string} Current page filename
 */
function getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop();
    return filename || 'index.html';
}

/**
 * Check if current page matches the given path
 * @param {string} path - Page path to check
 * @returns {boolean} True if current page matches
 */
function isActivePage(path) {
    const currentPage = getCurrentPage();
    const targetPage = path.split('/').pop();
    return currentPage === targetPage;
}

/**
 * Create desktop navigation HTML
 * @returns {string} HTML string for desktop navigation
 */
function createDesktopNav() {
    const desktopNavItems = NAVIGATION_ITEMS.filter(item => !item.mobileOnly);
    
    return `
        <div class="desktop-nav">
            ${desktopNavItems.map(item => `
                <a href="${item.path}" class="nav-link ${isActivePage(item.path) ? 'active' : ''}">
                    <i class="fas ${item.icon}"></i> ${item.name}
                </a>
            `).join('')}
        </div>
    `;
}

/**
 * Create mobile bottom navigation HTML
 * @returns {string} HTML string for mobile bottom navigation
 */
function createMobileNav() {
    return `
        <div class="bottom-nav">
            ${ALL_MOBILE_ITEMS.map(item => `
                <button class="nav-item ${isActivePage(item.path) ? 'active' : ''}" onclick="window.location.href='${item.path}'">
                    <i class="fas ${item.icon}"></i>
                    <span>${item.name}</span>
                </button>
            `).join('')}
        </div>
    `;
}

/**
 * Inject navigation into the page
 * Looks for elements with IDs 'desktopNavContainer' and 'mobileNavContainer'
 * If not found, creates them at appropriate positions
 */
function injectNavigation() {
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
 * Add navigation styles to the page
 */
function addNavigationStyles() {
    const styleId = 'navigation-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        /* Desktop Navigation */
        .desktop-nav {
            display: flex;
            gap: 8px;
            background: var(--card-bg, #ffffff);
            padding: 6px;
            border-radius: 60px;
            box-shadow: var(--shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05));
            border: 1px solid var(--border, #e2e8f0);
        }
        
        .nav-link {
            padding: 10px 24px;
            border-radius: 40px;
            text-decoration: none;
            font-weight: 600;
            color: var(--text-secondary, #475569);
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
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
        
        /* Mobile Bottom Navigation */
        .bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(20px);
            display: flex;
            justify-content: space-around;
            align-items: center;
            padding: 12px 20px 20px;
            border-top: 1px solid var(--border, #e2e8f0);
            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
            z-index: 200;
        }
        
        .nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            background: none;
            border: none;
            cursor: pointer;
            padding: 8px 16px;
            border-radius: 40px;
            transition: all 0.2s;
            color: var(--text-muted, #64748b);
            font-family: inherit;
        }
        
        .nav-item i {
            font-size: 1.4rem;
        }
        
        .nav-item span {
            font-size: 0.7rem;
            font-weight: 500;
        }
        
        .nav-item.active {
            color: var(--primary, #10b981);
            background: var(--primary-light, #d1fae5);
        }
        
        .nav-item:hover {
            background: var(--primary-light, #d1fae5);
        }
        
        /* Responsive: Hide desktop nav on mobile, show mobile nav */
        @media (max-width: 768px) {
            .desktop-nav {
                display: none;
            }
            .bottom-nav {
                display: flex;
            }
            body {
                padding-bottom: 80px;
            }
        }
        
        /* Show desktop nav on larger screens */
        @media (min-width: 769px) {
            .desktop-nav {
                display: flex;
            }
            .bottom-nav {
                display: none;
            }
        }
        
        /* Ensure header-content has proper spacing */
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
        }
        
        /* Admin info header styles */
        .admin-info-header {
            display: flex;
            align-items: center;
            gap: 16px;
            background: var(--primary-light, #d1fae5);
            padding: 6px 20px 6px 16px;
            border-radius: 50px;
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
    `;
    document.head.appendChild(style);
}

/**
 * Initialize navigation system
 * Call this function on every page that needs navigation
 * @param {Object} options - Configuration options
 * @param {boolean} options.addAuth - Whether to add authentication elements
 */
function initNavigation(options = {}) {
    addNavigationStyles();
    injectNavigation();
    
    // Add logout functionality if logout button exists
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (window.Auth && typeof window.Auth.logout === 'function') {
                await window.Auth.logout();
            }
            window.location.href = 'admin-login.html';
        });
    }
}

/**
 * Update active navigation item based on current page
 * Call this after dynamic content changes
 */
function updateActiveNav() {
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
function getNavigationHTML() {
    return {
        desktop: createDesktopNav(),
        mobile: createMobileNav()
    };
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        NAVIGATION_ITEMS,
        getCurrentPage,
        isActivePage,
        createDesktopNav,
        createMobileNav,
        injectNavigation,
        addNavigationStyles,
        initNavigation,
        updateActiveNav,
        getNavigationHTML
    };
}

// Make available globally for non-module scripts
if (typeof window !== 'undefined') {
    window.Nav = {
        initNavigation,
        updateActiveNav,
        getNavigationHTML,
        NAVIGATION_ITEMS
    };
    
    // Auto-initialize when DOM is ready if body has data-auto-nav attribute
    document.addEventListener('DOMContentLoaded', () => {
        if (document.body.hasAttribute('data-auto-nav')) {
            initNavigation();
        }
    });
}
