const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// SQL Server Configuration
const sqlConfig = {
    user: 'app_user',
    password: 'pass123',
    server: 'localhost',
    port: 56771,
    database: 'CrossPlatformDB',
    options: {
        encrypt: true,
        trustServerCertificate: true,
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// Database connection pool
let pool;

// Initialize database connection
async function initializeDatabase() {
    try {
        pool = await sql.connect(sqlConfig);
        console.log('✅ Connected to SQL Server');

        // Create tables if they don't exist
        await createTables();

    } catch (err) {
        console.error('❌ SQL Server connection error:', err);
        console.log('\n📝 Please update the SQL Server configuration in server.js');
        console.log('   - Update username, password, and server address');
        console.log('   - Make sure SQL Server is running');
        console.log('   - Create database "CrossPlatformDB" or update the name\n');
    }
}

// Create database tables
async function createTables() {
    try {
        const request = pool.request();

        // Create ContactSubmissions table
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ContactSubmissions' AND xtype='U')
            CREATE TABLE ContactSubmissions (
                id INT PRIMARY KEY IDENTITY(1,1),
                name NVARCHAR(255) NOT NULL,
                email NVARCHAR(255) NOT NULL,
                message NVARCHAR(MAX),
                platform NVARCHAR(50),
                timestamp DATETIME DEFAULT GETDATE(),
                created_at DATETIME DEFAULT GETDATE()
            )
        `);

        // Create UserData table for general data storage
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='UserData' AND xtype='U')
            CREATE TABLE UserData (
                id INT PRIMARY KEY IDENTITY(1,1),
                data_key NVARCHAR(255),
                data_value NVARCHAR(MAX),
                platform NVARCHAR(50),
                timestamp DATETIME DEFAULT GETDATE(),
                created_at DATETIME DEFAULT GETDATE()
            )
        `);

        console.log('✅ Database tables created/verified');

    } catch (err) {
        console.error('❌ Error creating tables:', err);
    }
}

// ===== API ROUTES =====

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server is running',
        database: pool ? 'Connected' : 'Disconnected'
    });
});

// Get all contact submissions
app.get('/api/contacts', async (req, res) => {
    try {
        const request = pool.request();
        const result = await request.query('SELECT * FROM ContactSubmissions ORDER BY timestamp DESC');

        res.json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
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
        const request = pool.request();
        request.input('id', sql.Int, req.params.id);

        const result = await request.query('SELECT * FROM ContactSubmissions WHERE id = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Contact not found'
            });
        }

        res.json({
            success: true,
            data: result.recordset[0]
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

        const request = pool.request();
        request.input('name', sql.NVarChar, name);
        request.input('email', sql.NVarChar, email);
        request.input('message', sql.NVarChar, message);
        request.input('platform', sql.NVarChar, platform || 'Unknown');

        const result = await request.query(`
            INSERT INTO ContactSubmissions (name, email, message, platform)
            OUTPUT INSERTED.*
            VALUES (@name, @email, @message, @platform)
        `);

        res.status(201).json({
            success: true,
            message: 'Contact submission saved',
            data: result.recordset[0]
        });

    } catch (err) {
        console.error('Error creating contact:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// Query contacts with filters (Excel-like)
app.post('/api/contacts/query', async (req, res) => {
    try {
        const filters = req.body;

        let query = 'SELECT * FROM ContactSubmissions WHERE 1=1';
        const request = pool.request();

        // Build dynamic query based on filters
        if (filters.name) {
            query += ' AND name LIKE @name';
            request.input('name', sql.NVarChar, `%${filters.name}%`);
        }

        if (filters.email) {
            query += ' AND email LIKE @email';
            request.input('email', sql.NVarChar, `%${filters.email}%`);
        }

        if (filters.platform) {
            query += ' AND platform = @platform';
            request.input('platform', sql.NVarChar, filters.platform);
        }

        if (filters.startDate) {
            query += ' AND timestamp >= @startDate';
            request.input('startDate', sql.DateTime, filters.startDate);
        }

        if (filters.endDate) {
            query += ' AND timestamp <= @endDate';
            request.input('endDate', sql.DateTime, filters.endDate);
        }

        query += ' ORDER BY timestamp DESC';

        const result = await request.query(query);

        res.json({
            success: true,
            count: result.recordset.length,
            filters: filters,
            data: result.recordset
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
        const request = pool.request();

        // Total count
        const totalResult = await request.query('SELECT COUNT(*) as total FROM ContactSubmissions');

        // Platform breakdown
        const platformResult = await request.query(`
            SELECT platform, COUNT(*) as count 
            FROM ContactSubmissions 
            GROUP BY platform
        `);

        // Recent submissions (last 7 days)
        const recentResult = await request.query(`
            SELECT COUNT(*) as recent 
            FROM ContactSubmissions 
            WHERE timestamp >= DATEADD(day, -7, GETDATE())
        `);

        res.json({
            success: true,
            stats: {
                totalRecords: totalResult.recordset[0].total,
                recentSubmissions: recentResult.recordset[0].recent,
                platformBreakdown: platformResult.recordset
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

// Export to CSV (Excel-compatible)
app.get('/api/export/csv', async (req, res) => {
    try {
        const request = pool.request();
        const result = await request.query('SELECT * FROM ContactSubmissions ORDER BY timestamp DESC');

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No data to export'
            });
        }

        // Generate CSV
        const headers = Object.keys(result.recordset[0]);
        let csv = headers.join(',') + '\n';

        result.recordset.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                if (value === null || value === undefined) return '';
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
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
        const request = pool.request();
        request.input('id', sql.Int, req.params.id);

        await request.query('DELETE FROM ContactSubmissions WHERE id = @id');

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
        const request = pool.request();
        await request.query('DELETE FROM ContactSubmissions');

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
    console.log('\n🚀 CrossPlatform Server Starting...\n');
    console.log(`📡 Server running on: http://localhost:${PORT}`);
    console.log(`📊 API endpoint: http://localhost:${PORT}/api`);
    console.log(`🌐 Web app: http://localhost:${PORT}\n`);

    // Initialize database
    await initializeDatabase();

    console.log('\n✅ Server ready!\n');
    console.log('Available API endpoints:');
    console.log('  GET    /api/health          - Health check');
    console.log('  GET    /api/contacts        - Get all contacts');
    console.log('  GET    /api/contacts/:id    - Get contact by ID');
    console.log('  POST   /api/contacts        - Create new contact');
    console.log('  POST   /api/contacts/query  - Query with filters');
    console.log('  GET    /api/stats           - Get statistics');
    console.log('  GET    /api/export/csv      - Export to CSV');
    console.log('  DELETE /api/contacts/:id    - Delete contact');
    console.log('  DELETE /api/contacts        - Clear all data\n');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down server...');
    if (pool) {
        await pool.close();
        console.log('✅ Database connection closed');
    }
    process.exit(0);
});
