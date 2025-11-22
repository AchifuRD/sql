# CrossPlatform App with SQL Server Backend

A modern, cross-platform web application with SQL Server database integration and Excel compatibility.

## 🚀 Features

- ✅ **Cross-Platform** - Works on PC, Phone, Tablet, and Laptop
- 🗄️ **SQL Server Backend** - Enterprise-grade database storage
- 📊 **Excel Integration** - Import/Export CSV files
- 🔍 **Advanced Querying** - SQL-powered data filtering
- 📈 **Real-time Statistics** - Dashboard analytics
- 🎨 **Modern UI** - Beautiful glassmorphism design
- 🌐 **REST API** - Full CRUD operations

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **SQL Server** (2016 or higher) - [Download](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)
- **SQL Server Management Studio (SSMS)** - [Download](https://docs.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms)

## 🛠️ Installation

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Setup SQL Server Database

1. Open **SQL Server Management Studio (SSMS)**
2. Connect to your SQL Server instance
3. Open the file `sql-setup.sql`
4. Execute the script (F5)

This will create:
- Database: `CrossPlatformDB`
- Tables: `ContactSubmissions`, `UserData`
- Stored Procedures, Views, and Functions

### Step 3: Configure Server

Edit `server.js` and update the SQL Server configuration:

```javascript
const sqlConfig = {
    user: 'your_username',          // Your SQL Server username
    password: 'your_password',      // Your SQL Server password
    server: 'localhost',            // Your SQL Server address
    database: 'CrossPlatformDB',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};
```

### Step 4: Update HTML File

In `index.html`, change the script reference from `app.js` to `app-sql.js`:

```html
<!-- Change this line at the bottom of index.html -->
<script src="app-sql.js"></script>
```

## 🎯 Running the Application

### Start the Server

```bash
npm start
```

The server will start on `http://localhost:3000`

### Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/contacts` | Get all contacts |
| GET | `/api/contacts/:id` | Get contact by ID |
| POST | `/api/contacts` | Create new contact |
| POST | `/api/contacts/query` | Query with filters |
| GET | `/api/stats` | Get statistics |
| GET | `/api/export/csv` | Export to CSV |
| DELETE | `/api/contacts/:id` | Delete contact |
| DELETE | `/api/contacts` | Clear all data |

## 💻 Usage Examples

### Browser Console Commands

```javascript
// Query all data
await queryData({})

// Filter by platform
await queryData({ platform: "Desktop" })

// Filter by name
await queryData({ name: "John" })

// Get all data
await getAllData()

// Export to Excel
await exportToExcel()

// View statistics
await getDataStats()

// Clear all data
await clearDataCentre()
```

### API Usage (JavaScript)

```javascript
// Create new contact
const response = await fetch('http://localhost:3000/api/contacts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello!',
        platform: 'Desktop'
    })
});

// Query with filters
const response = await fetch('http://localhost:3000/api/contacts/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        platform: 'Mobile',
        startDate: '2025-01-01'
    })
});
```

### SQL Queries (SSMS)

```sql
-- View all contacts
SELECT * FROM ContactSubmissions;

-- Get statistics
SELECT * FROM vw_ContactStats;

-- Platform breakdown
SELECT * FROM fn_GetPlatformBreakdown();

-- Query with stored procedure
EXEC sp_QueryContacts @platform = 'Desktop';

-- Filter by date range
SELECT * FROM ContactSubmissions
WHERE timestamp >= '2025-01-01'
ORDER BY timestamp DESC;
```

## 📊 Excel Integration

### Export to Excel

1. Click the **🗄️ Data Centre** button
2. Click **"📤 Export to Excel"**
3. Open the downloaded CSV file in Excel

### Import from Excel

1. Save your Excel file as CSV
2. Use the API or console commands to import

## 🔧 Development

### Run with Auto-Reload

```bash
npm run dev
```

This uses `nodemon` to automatically restart the server when files change.

## 📁 Project Structure

```
crossplatform-app/
├── index.html          # Main HTML file
├── index.css           # Styles
├── app.js              # Client-side JS (localStorage version)
├── app-sql.js          # Client-side JS (SQL Server version)
├── server.js           # Express server with SQL Server
├── sql-setup.sql       # Database setup script
├── package.json        # Node.js dependencies
└── README.md           # This file
```

## 🔒 Security Notes

- Change default SQL Server credentials
- Use environment variables for sensitive data
- Enable SSL/TLS in production
- Implement authentication for API endpoints
- Validate and sanitize all inputs

## 🐛 Troubleshooting

### Cannot connect to SQL Server

1. Ensure SQL Server is running
2. Check firewall settings
3. Verify SQL Server authentication mode (Mixed Mode)
4. Update connection string in `server.js`

### Port 3000 already in use

Change the port in `server.js`:
```javascript
const PORT = 3001; // or any available port
```

### Database not found

Run the `sql-setup.sql` script in SSMS to create the database.

## 📝 License

MIT License - feel free to use this project for any purpose.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ using Node.js, Express, and SQL Server**
