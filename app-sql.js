// Enhanced app.js with SQL Server backend integration
// This replaces the localStorage with SQL Server API calls

// ===== CONFIGURATION =====
const API_URL = 'http://localhost:3000/api';

// ===== NAVIGATION =====
const navbar = document.getElementById('navbar');
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');

// Mobile menu toggle
menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Smooth scroll and active link
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);

        if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth' });
        }

        menuToggle.classList.remove('active');
        navMenu.classList.remove('active');

        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
    });
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(15, 15, 25, 0.95)';
    } else {
        navbar.style.background = 'rgba(15, 15, 25, 0.8)';
    }
});

// ===== HERO BUTTONS =====
const getStartedBtn = document.getElementById('getStartedBtn');
const learnMoreBtn = document.getElementById('learnMoreBtn');

getStartedBtn.addEventListener('click', () => {
    document.querySelector('#demo').scrollIntoView({ behavior: 'smooth' });
});

learnMoreBtn.addEventListener('click', () => {
    document.querySelector('#features').scrollIntoView({ behavior: 'smooth' });
});

// ===== DEMO VIEWPORT =====
const demoButtons = document.querySelectorAll('.demo-btn');
const demoViewport = document.getElementById('demoViewport');

demoButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        demoButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const viewType = btn.getAttribute('data-view');
        demoViewport.classList.remove('desktop', 'tablet', 'mobile');
        demoViewport.classList.add(viewType);
    });
});

// ===== SQL SERVER DATA CENTRE =====
class SQLDataCentre {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
    }

    // Save data to SQL Server
    async save(data) {
        try {
            const response = await fetch(`${this.apiUrl}/contacts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            return result.success;

        } catch (error) {
            console.error('Error saving to SQL Server:', error);
            return false;
        }
    }

    // Get all data
    async getAll() {
        try {
            const response = await fetch(`${this.apiUrl}/contacts`);
            const result = await response.json();
            return result.success ? result.data : [];

        } catch (error) {
            console.error('Error fetching from SQL Server:', error);
            return [];
        }
    }

    // Query data with filters
    async query(filters = {}) {
        try {
            const response = await fetch(`${this.apiUrl}/contacts/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(filters)
            });

            const result = await response.json();
            return result.success ? result.data : [];

        } catch (error) {
            console.error('Error querying SQL Server:', error);
            return [];
        }
    }

    // Export to CSV
    async downloadCSV() {
        try {
            window.open(`${this.apiUrl}/export/csv`, '_blank');
            console.log('✅ Exporting data from SQL Server...');

        } catch (error) {
            console.error('Error exporting CSV:', error);
        }
    }

    // Get statistics
    async getStats() {
        try {
            const response = await fetch(`${this.apiUrl}/stats`);
            const result = await response.json();
            return result.success ? result.stats : null;

        } catch (error) {
            console.error('Error fetching stats:', error);
            return null;
        }
    }

    // Clear all data
    async clear() {
        try {
            const response = await fetch(`${this.apiUrl}/contacts`, {
                method: 'DELETE'
            });

            const result = await response.json();
            return result.success;

        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }

    // Delete by ID
    async delete(id) {
        try {
            const response = await fetch(`${this.apiUrl}/contacts/${id}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            return result.success;

        } catch (error) {
            console.error('Error deleting record:', error);
            return false;
        }
    }
}

// Initialize SQL data centre
const dataCentre = new SQLDataCentre(API_URL);

// ===== CONTACT FORM =====
const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;

    const formData = {
        name: name,
        email: email,
        message: message,
        platform: getPlatformInfo()
    };

    // Save to SQL Server
    const success = await dataCentre.save(formData);

    if (success) {
        alert('✅ Message sent successfully! Your data has been saved to SQL Server.');
        contactForm.reset();
    } else {
        alert('❌ Error saving data. Please make sure the server is running.');
    }
});

// Helper function to get platform info
function getPlatformInfo() {
    const width = window.innerWidth;

    if (width < 768) {
        return 'Mobile';
    } else if (width < 1024) {
        return 'Tablet';
    } else {
        return 'Desktop';
    }
}

// ===== GLOBAL API FUNCTIONS =====
window.dataCentre = dataCentre;

window.queryData = async (filters) => {
    const data = await dataCentre.query(filters);
    console.table(data);
    return data;
};

window.exportToExcel = async () => {
    await dataCentre.downloadCSV();
};

window.getDataStats = async () => {
    const stats = await dataCentre.getStats();
    console.log('📊 SQL Server Statistics:', stats);
    return stats;
};

window.clearDataCentre = async () => {
    if (confirm('Are you sure you want to clear all data from SQL Server?')) {
        const success = await dataCentre.clear();
        if (success) {
            console.log('✅ Data centre cleared');
        } else {
            console.log('❌ Error clearing data');
        }
    }
};

window.getAllData = async () => {
    const data = await dataCentre.getAll();
    console.table(data);
    return data;
};

// ===== DATA CENTRE UI =====
function createDataCentreUI() {
    if (document.getElementById('dataCentrePanel')) return;

    const panel = document.createElement('div');
    panel.id = 'dataCentrePanel';
    panel.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(15, 15, 25, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        padding: 20px;
        z-index: 999;
        backdrop-filter: blur(20px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        max-width: 320px;
        display: none;
    `;

    panel.innerHTML = `
        <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #fff;">SQL Server Data Centre</h3>
        <div style="display: flex; flex-direction: column; gap: 10px;">
            <button onclick="window.exportToExcel()" style="padding: 10px; background: linear-gradient(135deg, #8b5cf6, #ec4899); border: none; border-radius: 8px; color: white; cursor: pointer; font-weight: 600;">
                📤 Export to Excel
            </button>
            <button onclick="window.getAllData()" style="padding: 10px; background: linear-gradient(135deg, #10b981, #3b82f6); border: none; border-radius: 8px; color: white; cursor: pointer; font-weight: 600;">
                📋 View All Data
            </button>
            <button onclick="window.getDataStats()" style="padding: 10px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; color: white; cursor: pointer; font-weight: 600;">
                📊 View Statistics
            </button>
            <button onclick="window.clearDataCentre()" style="padding: 10px; background: rgba(255, 50, 50, 0.2); border: 1px solid rgba(255, 50, 50, 0.5); border-radius: 8px; color: white; cursor: pointer; font-weight: 600;">
                🗑️ Clear Data
            </button>
            <button onclick="toggleDataCentrePanel()" style="padding: 10px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: white; cursor: pointer; font-weight: 600;">
                ✖️ Close
            </button>
        </div>
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
            <p style="margin: 0; font-size: 12px; color: #888;">Connected to SQL Server</p>
        </div>
    `;

    document.body.appendChild(panel);
}

function createDataCentreButton() {
    const btn = document.createElement('button');
    btn.id = 'dataCentreBtn';
    btn.innerHTML = '🗄️';
    btn.title = 'SQL Server Data Centre';
    btn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #8b5cf6, #ec4899);
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
        z-index: 1000;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    `;

    btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'scale(1.1)';
        btn.style.boxShadow = '0 8px 32px rgba(139, 92, 246, 0.6)';
    });

    btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'scale(1)';
        btn.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.4)';
    });

    btn.addEventListener('click', toggleDataCentrePanel);

    document.body.appendChild(btn);
}

function toggleDataCentrePanel() {
    const panel = document.getElementById('dataCentrePanel');
    const btn = document.getElementById('dataCentreBtn');

    if (panel.style.display === 'none' || panel.style.display === '') {
        panel.style.display = 'block';
        btn.style.display = 'none';
    } else {
        panel.style.display = 'none';
        btn.style.display = 'block';
    }
}

// Initialize UI
createDataCentreUI();
createDataCentreButton();

// ===== ANIMATIONS =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.feature-card, .platform-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// ===== CONSOLE WELCOME MESSAGE =====
console.log('%c🚀 CrossPlatform App - SQL Server Edition!', 'color: #8b5cf6; font-size: 16px; font-weight: bold;');
console.log('%c🗄️ Connected to SQL Server Backend', 'color: #10b981; font-size: 14px; font-weight: bold;');
console.log('%cAvailable Commands:', 'color: #ec4899; font-size: 14px; font-weight: bold;');
console.log('%c- queryData(filters)     : Query SQL Server with filters', 'color: #60a5fa;');
console.log('%c- getAllData()           : Get all data from SQL Server', 'color: #60a5fa;');
console.log('%c- exportToExcel()        : Export data to CSV file', 'color: #60a5fa;');
console.log('%c- getDataStats()         : View SQL Server statistics', 'color: #60a5fa;');
console.log('%c- clearDataCentre()      : Clear all data from SQL Server', 'color: #60a5fa;');
console.log('%c\nExample: queryData({ platform: "Desktop" })', 'color: #a78bfa; font-style: italic;');
