const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// PostgreSQL Configuration
// In production (Render), use CONNECTION_STRING
// Locally, use default settings
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/crossplatformdb',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Initialize database connection
async function initializeDatabase() {
    try {
        const client = await pool.connect();
        console.log('✅ Connected to PostgreSQL');
        client.release();
    } catch (err) {
        console.error('❌ PostgreSQL connection error:', err.message);
        console.log('\n📝 For Cloud Deployment (Render):');
        console.log('   - Ensure DATABASE_URL environment variable is set');
        console.log('\n📝 For Local Development:');
        console.log('   - Ensure PostgreSQL is installed and running');
        console.log('   - Create database "crossplatformdb"');
    }
}

// ===== API ROUTES =====

// Health check
app.get('/api/health', async (req, res) => {
    try {
        const client = await pool.connect();
        client.release();
        res.json({
            status: 'OK',
            message: 'Server is running',
            database: 'Connected'
        });
    } catch (err) {
        res.json({
            status: 'OK',
            message: 'Server is running',
            database: 'Disconnected',
            error: err.message
        });
    }
});

// Get all contact submissions
app.get('/api/contacts', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM contact_submissions ORDER BY timestamp DESC');

        res.json({
            success: true,
            count: result.rowCount,
            data: result.rows
        });

    } catch (err) {
        console.error('Error fetching contacts:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// Get contact by ID
app.get('/api/contacts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM contact_submissions WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Contact not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (err) {
        console.error('Error fetching contact:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// Create new contact submission
app.post('/api/contacts', async (req, res) => {
    try {
        const { name, email, message, platform } = req.body;

        // Validation
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                error: 'Name, email, and message are required'
            });
        }

        const query = `
            INSERT INTO contact_submissions (name, email, message, platform)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;

        const values = [name, email, message, platform || 'Unknown'];
        const result = await pool.query(query, values);

        res.status(201).json({
            success: true,
            message: 'Contact submission saved',
            data: result.rows[0]
        });

    } catch (err) {
        console.error('Error creating contact:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// Query contacts with filters
app.post('/api/contacts/query', async (req, res) => {
    try {
        const filters = req.body;

        let query = 'SELECT * FROM contact_submissions WHERE 1=1';
        const values = [];
        let paramCount = 1;

        // Build dynamic query based on filters
        if (filters.name) {
            query += ` AND name ILIKE $${paramCount}`; // ILIKE for case-insensitive
            values.push(`%${filters.name}%`);
            paramCount++;
        }

        if (filters.email) {
            query += ` AND email ILIKE $${paramCount}`;
            values.push(`%${filters.email}%`);
            paramCount++;
        }

        if (filters.platform) {
            query += ` AND platform = $${paramCount}`;
            values.push(filters.platform);
            paramCount++;
        }

        if (filters.startDate) {
            query += ` AND timestamp >= $${paramCount}`;
            values.push(filters.startDate);
            paramCount++;
        }

        if (filters.endDate) {
            query += ` AND timestamp <= $${paramCount}`;
            values.push(filters.endDate);
            paramCount++;
        }

        query += ' ORDER BY timestamp DESC';

        const result = await pool.query(query, values);

        res.json({
            success: true,
            count: result.rowCount,
            filters: filters,
            data: result.rows
        });

    } catch (err) {
        console.error('Error querying contacts:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// Get statistics
app.get('/api/stats', async (req, res) => {
    try {
        // Total count
        const totalResult = await pool.query('SELECT COUNT(*) as total FROM contact_submissions');

        // Platform breakdown
        const platformResult = await pool.query(`
            SELECT platform, COUNT(*) as count 
            FROM contact_submissions 
            GROUP BY platform
        `);

        // Recent submissions (last 7 days)
        const recentResult = await pool.query(`
            SELECT COUNT(*) as recent 
            FROM contact_submissions 
            WHERE timestamp >= NOW() - INTERVAL '7 days'
        `);

        res.json({
            success: true,
            stats: {
                totalRecords: parseInt(totalResult.rows[0].total),
                recentSubmissions: parseInt(recentResult.rows[0].recent),
                platformBreakdown: platformResult.rows
            }
        });

    } catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// Export to CSV
app.get('/api/export/csv', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM contact_submissions ORDER BY timestamp DESC');

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No data to export'
            });
        }

        // Generate CSV
        const headers = Object.keys(result.rows[0]);
        let csv = headers.join(',') + '\n';

        result.rows.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                if (value === null || value === undefined) return '';
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                if (value instanceof Date) {
                    return value.toISOString();
                }
                return value;
            });
            csv += values.join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=contacts_export.csv');
        res.send(csv);

    } catch (err) {
        console.error('Error exporting CSV:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// Delete contact
app.delete('/api/contacts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM contact_submissions WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'Contact deleted successfully'
        });

    } catch (err) {
        console.error('Error deleting contact:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// Clear all data
app.delete('/api/contacts', async (req, res) => {
    try {
        await pool.query('DELETE FROM contact_submissions');

        res.json({
            success: true,
            message: 'All contacts cleared'
        });

    } catch (err) {
        console.error('Error clearing contacts:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, async () => {
    console.log('\n🚀 Cloud-Ready Server Starting...\n');
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`📊 API endpoint: /api`);

    // Initialize database
    await initializeDatabase();
});
