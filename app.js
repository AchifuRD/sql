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

        // Close mobile menu
        menuToggle.classList.remove('active');
        navMenu.classList.remove('active');

        // Update active link
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
        // Remove active class from all buttons
        demoButtons.forEach(b => b.classList.remove('active'));

        // Add active class to clicked button
        btn.classList.add('active');

        // Get view type
        const viewType = btn.getAttribute('data-view');

        // Remove all view classes
        demoViewport.classList.remove('desktop', 'tablet', 'mobile');

        // Add selected view class
        demoViewport.classList.add(viewType);
    });
});

// ===== CONTACT FORM =====
const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;

    // Store in local data centre
    const formData = {
        id: Date.now(),
        name: name,
        email: email,
        message: message,
        timestamp: new Date().toISOString(),
        platform: getPlatformInfo()
    };

    // Save to local storage (data centre)
    saveToDataCentre(formData);

    // Show success message
    alert('Message sent successfully! Your data has been saved to the local data centre.');

    // Reset form
    contactForm.reset();
});

// ===== LOCAL DATA CENTRE =====
class LocalDataCentre {
    constructor() {
        this.storageKey = 'crossplatform_data';
        this.initializeStorage();
    }

    initializeStorage() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
    }

    // Save data
    save(data) {
        const allData = this.getAll();
        allData.push(data);
        localStorage.setItem(this.storageKey, JSON.stringify(allData));
        return true;
    }

    // Get all data
    getAll() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : [];
    }

    // Query data (Excel-like filtering)
    query(filters = {}) {
        let data = this.getAll();

        // Apply filters
        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                data = data.filter(item => {
                    if (typeof item[key] === 'string') {
                        return item[key].toLowerCase().includes(filters[key].toLowerCase());
                    }
                    return item[key] === filters[key];
                });
            }
        });

        return data;
    }

    // Export to CSV (Excel-compatible)
    exportToCSV() {
        const data = this.getAll();

        if (data.length === 0) {
            return 'No data available';
        }

        // Get headers
        const headers = Object.keys(data[0]);

        // Create CSV content
        let csv = headers.join(',') + '\n';

        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                // Escape commas and quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csv += values.join(',') + '\n';
        });

        return csv;
    }

    // Download CSV file
    downloadCSV(filename = 'data_export.csv') {
        const csv = this.exportToCSV();
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Import from CSV
    importFromCSV(csvContent) {
        const lines = csvContent.split('\n');
        const headers = lines[0].split(',');

        const data = [];

        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;

            const values = lines[i].split(',');
            const row = {};

            headers.forEach((header, index) => {
                row[header.trim()] = values[index] ? values[index].trim() : '';
            });

            data.push(row);
        }

        // Save imported data
        data.forEach(item => this.save(item));

        return data.length;
    }

    // Clear all data
    clear() {
        localStorage.setItem(this.storageKey, JSON.stringify([]));
    }

    // Get statistics
    getStats() {
        const data = this.getAll();
        return {
            totalRecords: data.length,
            lastUpdated: data.length > 0 ? data[data.length - 1].timestamp : null,
            platforms: this.getPlatformBreakdown(data)
        };
    }

    getPlatformBreakdown(data) {
        const breakdown = {};
        data.forEach(item => {
            const platform = item.platform || 'Unknown';
            breakdown[platform] = (breakdown[platform] || 0) + 1;
        });
        return breakdown;
    }
}

// Initialize data centre
const dataCentre = new LocalDataCentre();

// Helper function to save to data centre
function saveToDataCentre(data) {
    return dataCentre.save(data);
}

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

// ===== EXCEL QUERY INTERFACE =====
// Add query interface to console
window.dataCentre = dataCentre;

// Console helper functions
window.queryData = (filters) => {
    console.table(dataCentre.query(filters));
    return dataCentre.query(filters);
};

window.exportToExcel = () => {
    dataCentre.downloadCSV();
    console.log('Data exported to CSV (Excel-compatible)');
};

window.getDataStats = () => {
    const stats = dataCentre.getStats();
    console.log('Data Centre Statistics:', stats);
    return stats;
};

window.clearDataCentre = () => {
    if (confirm('Are you sure you want to clear all data?')) {
        dataCentre.clear();
        console.log('Data centre cleared');
    }
};

window.importFromExcel = () => {
    const input = document.getElementById('csvFileInput');
    if (!input) {
        // Create input if it doesn't exist
        const newInput = document.createElement('input');
        newInput.type = 'file';
        newInput.id = 'csvFileInput';
        newInput.accept = '.csv';
        newInput.style.display = 'none';
        document.body.appendChild(newInput);
    }

    const fileInput = document.getElementById('csvFileInput');
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const csv = event.target.result;
                const count = dataCentre.importFromCSV(csv);
                alert(`✅ Successfully imported ${count} records from Excel!`);
                console.log(`Imported ${count} records from ${file.name}`);

                // Show stats after import
                window.getDataStats();
            } catch (error) {
                alert('❌ Error importing file. Please make sure it\'s a valid CSV file.');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
    };

    fileInput.click();
};

// ===== INTERSECTION OBSERVER FOR ANIMATIONS =====
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

// Observe feature cards
document.querySelectorAll('.feature-card, .platform-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// ===== FILE UPLOAD FOR CSV IMPORT =====
function createDataCentreUI() {
    // Check if UI already exists
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
        max-width: 300px;
        display: none;
    `;

    panel.innerHTML = `
        <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #fff;">Data Centre</h3>
        <div style="display: flex; flex-direction: column; gap: 10px;">
            <input type="file" id="csvFileInput" accept=".csv" style="display: none;">
            <button onclick="window.importFromExcel()" style="padding: 10px; background: linear-gradient(135deg, #10b981, #3b82f6); border: none; border-radius: 8px; color: white; cursor: pointer; font-weight: 600;">
                📥 Import from Excel/CSV
            </button>
            <button onclick="window.exportToExcel()" style="padding: 10px; background: linear-gradient(135deg, #8b5cf6, #ec4899); border: none; border-radius: 8px; color: white; cursor: pointer; font-weight: 600;">
                📤 Export to Excel
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
    `;

    document.body.appendChild(panel);
}

// Create floating action button
function createDataCentreButton() {
    const btn = document.createElement('button');
    btn.id = 'dataCentreBtn';
    btn.innerHTML = '📊';
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

// Initialize data centre UI
createDataCentreUI();
createDataCentreButton();

// ===== CONSOLE WELCOME MESSAGE =====
console.log('%c🚀 CrossPlatform App - Data Centre Ready!', 'color: #8b5cf6; font-size: 16px; font-weight: bold;');
console.log('%cAvailable Commands:', 'color: #ec4899; font-size: 14px; font-weight: bold;');
console.log('%c- queryData(filters)     : Query data with Excel-like filters', 'color: #60a5fa;');
console.log('%c- exportToExcel()        : Export data to CSV file', 'color: #60a5fa;');
console.log('%c- getDataStats()         : View data statistics', 'color: #60a5fa;');
console.log('%c- clearDataCentre()      : Clear all stored data', 'color: #60a5fa;');
console.log('%c\nExample: queryData({ platform: "Desktop" })', 'color: #a78bfa; font-style: italic;');
