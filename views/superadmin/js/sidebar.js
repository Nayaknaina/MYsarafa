/* =========================================
   MySarafa SuperAdmin - Sidebar JS
   ========================================= */


/* =========================================
   Load Sidebar
   ========================================= */

async function loadSidebar() {

    try {

        const response = await fetch('sidebar.html');

        if (!response.ok) {
            throw new Error('Failed to load sidebar');
        }

        const sidebarHTML = await response.text();

        const container = document.getElementById('sidebar-container');

        if (!container) {
            console.error('Sidebar container not found');
            return;
        }

        container.innerHTML = sidebarHTML;

        // Set active menu after sidebar is loaded
        setActiveSidebarLink();

        // Make sure correct state is applied
        handleSidebarResize();

    } catch (error) {

        console.error('Sidebar loading error:', error);

    }
}


/* =========================================
   Open / Close Sidebar
   ========================================= */

function toggleSidebar() {

    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const hamburger = document.getElementById('sidebarToggle');

    if (!sidebar) return;

    const isOpen = sidebar.classList.contains('sidebar-open');

    if (isOpen) {

        // Close Sidebar
        sidebar.classList.remove('sidebar-open');

        if (overlay) {
            overlay.classList.add('hidden');
        }

        // Show hamburger
        if (hamburger) {
            hamburger.classList.remove('hidden');
        }

    } else {

        // Open Sidebar
        sidebar.classList.add('sidebar-open');

        if (overlay) {
            overlay.classList.remove('hidden');
        }

        // Hide hamburger
        if (hamburger) {
            hamburger.classList.add('hidden');
        }
    }
}


/* =========================================
   Close Sidebar
   ========================================= */

function closeSidebar() {

    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const hamburger = document.getElementById('sidebarToggle');

    if (!sidebar) return;

    sidebar.classList.remove('sidebar-open');

    if (overlay) {
        overlay.classList.add('hidden');
    }

    if (hamburger && window.innerWidth < 1024) {
        hamburger.classList.remove('hidden');
    }
}


/* =========================================
   Active Sidebar Link
   ========================================= */

function setActiveSidebarLink() {

    const currentPage = window.location.pathname
        .split('/')
        .pop()
        .toLowerCase();

    const links = document.querySelectorAll('#sidebar .nav-link');

    links.forEach(link => {

        const href = link.getAttribute('href');

        if (!href) return;

        const linkPage = href
            .split('/')
            .pop()
            .toLowerCase();

        if (linkPage === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }

    });
}


/* =========================================
   Resize Handler
   ========================================= */

function handleSidebarResize() {

    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const hamburger = document.getElementById('sidebarToggle');

    if (!sidebar) return;

    if (window.innerWidth >= 1024) {

        // Desktop
        sidebar.classList.remove('sidebar-open');

        if (overlay) {
            overlay.classList.add('hidden');
        }

        if (hamburger) {
            hamburger.classList.add('hidden');
        }

    } else {

        // Tablet + Mobile
        sidebar.classList.remove('sidebar-open');

        if (overlay) {
            overlay.classList.add('hidden');
        }

        if (hamburger) {
            hamburger.classList.remove('hidden');
        }
    }
}

function handleLogout() {
    localStorage.clear();
    window.location.href = 'login.html';
}
/* =========================================
   Close Sidebar When Clicking Outside
   ========================================= */

document.addEventListener('click', function (event) {

    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const hamburger = document.getElementById('sidebarToggle');

    if (!sidebar) return;

    // Only for tablet/mobile
    if (window.innerWidth >= 1024) return;

    const isSidebarOpen = sidebar.classList.contains('sidebar-open');

    if (!isSidebarOpen) return;

    // Don't close when clicking inside sidebar
    if (sidebar.contains(event.target)) return;

    // Don't close when clicking hamburger
    if (hamburger && hamburger.contains(event.target)) return;

    closeSidebar();
});


/* =========================================
   Window Resize
   ========================================= */

window.addEventListener('resize', handleSidebarResize);


/* =========================================
   Page Load
   ========================================= */

document.addEventListener('DOMContentLoaded', function () {

    loadSidebar();

});
