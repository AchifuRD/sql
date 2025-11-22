-- SQL Server Setup Script for CrossPlatform App
-- Run this script in SQL Server Management Studio (SSMS)

-- Create database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'CrossPlatformDB')
BEGIN
    CREATE DATABASE CrossPlatformDB;
    PRINT 'Database CrossPlatformDB created successfully';
END
ELSE
BEGIN
    PRINT 'Database CrossPlatformDB already exists';
END
GO

-- Use the database
USE CrossPlatformDB;
GO

-- Create ContactSubmissions table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ContactSubmissions' AND xtype='U')
BEGIN
    CREATE TABLE ContactSubmissions (
        id INT PRIMARY KEY IDENTITY(1,1),
        name NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) NOT NULL,
        message NVARCHAR(MAX),
        platform NVARCHAR(50),
        timestamp DATETIME DEFAULT GETDATE(),
        created_at DATETIME DEFAULT GETDATE()
    );
    PRINT 'Table ContactSubmissions created successfully';
END
ELSE
BEGIN
    PRINT 'Table ContactSubmissions already exists';
END
GO

-- Create UserData table for general data storage
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='UserData' AND xtype='U')
BEGIN
    CREATE TABLE UserData (
        id INT PRIMARY KEY IDENTITY(1,1),
        data_key NVARCHAR(255),
        data_value NVARCHAR(MAX),
        platform NVARCHAR(50),
        timestamp DATETIME DEFAULT GETDATE(),
        created_at DATETIME DEFAULT GETDATE()
    );
    PRINT 'Table UserData created successfully';
END
ELSE
BEGIN
    PRINT 'Table UserData already exists';
END
GO

-- Create indexes for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ContactSubmissions_Email')
BEGIN
    CREATE INDEX IX_ContactSubmissions_Email ON ContactSubmissions(email);
    PRINT 'Index on email created';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ContactSubmissions_Platform')
BEGIN
    CREATE INDEX IX_ContactSubmissions_Platform ON ContactSubmissions(platform);
    PRINT 'Index on platform created';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ContactSubmissions_Timestamp')
BEGIN
    CREATE INDEX IX_ContactSubmissions_Timestamp ON ContactSubmissions(timestamp);
    PRINT 'Index on timestamp created';
END
GO

-- Insert sample data (optional)
IF NOT EXISTS (SELECT * FROM ContactSubmissions)
BEGIN
    INSERT INTO ContactSubmissions (name, email, message, platform) VALUES
    ('John Doe', 'john@example.com', 'Great application!', 'Desktop'),
    ('Jane Smith', 'jane@example.com', 'Love the cross-platform support', 'Mobile'),
    ('Bob Johnson', 'bob@example.com', 'Excel integration is amazing', 'Tablet');
    
    PRINT 'Sample data inserted';
END
GO

-- Create stored procedure for querying with filters
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_QueryContacts')
    DROP PROCEDURE sp_QueryContacts;
GO

CREATE PROCEDURE sp_QueryContacts
    @name NVARCHAR(255) = NULL,
    @email NVARCHAR(255) = NULL,
    @platform NVARCHAR(50) = NULL,
    @startDate DATETIME = NULL,
    @endDate DATETIME = NULL
AS
BEGIN
    SELECT * FROM ContactSubmissions
    WHERE 
        (@name IS NULL OR name LIKE '%' + @name + '%')
        AND (@email IS NULL OR email LIKE '%' + @email + '%')
        AND (@platform IS NULL OR platform = @platform)
        AND (@startDate IS NULL OR timestamp >= @startDate)
        AND (@endDate IS NULL OR timestamp <= @endDate)
    ORDER BY timestamp DESC;
END
GO

PRINT 'Stored procedure sp_QueryContacts created';
GO

-- Create view for statistics
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_ContactStats')
    DROP VIEW vw_ContactStats;
GO

CREATE VIEW vw_ContactStats AS
SELECT 
    COUNT(*) as TotalContacts,
    COUNT(DISTINCT platform) as UniquePlatforms,
    MAX(timestamp) as LastSubmission,
    MIN(timestamp) as FirstSubmission
FROM ContactSubmissions;
GO

PRINT 'View vw_ContactStats created';
GO

-- Create function to get platform breakdown
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'TF' AND name = 'fn_GetPlatformBreakdown')
    DROP FUNCTION fn_GetPlatformBreakdown;
GO

CREATE FUNCTION fn_GetPlatformBreakdown()
RETURNS TABLE
AS
RETURN
(
    SELECT 
        platform,
        COUNT(*) as count,
        CAST(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ContactSubmissions) AS DECIMAL(5,2)) as percentage
    FROM ContactSubmissions
    GROUP BY platform
);
GO

PRINT 'Function fn_GetPlatformBreakdown created';
GO

-- Display summary
PRINT '';
PRINT '========================================';
PRINT 'SQL Server Setup Complete!';
PRINT '========================================';
PRINT '';
PRINT 'Database: CrossPlatformDB';
PRINT 'Tables: ContactSubmissions, UserData';
PRINT 'Stored Procedures: sp_QueryContacts';
PRINT 'Views: vw_ContactStats';
PRINT 'Functions: fn_GetPlatformBreakdown';
PRINT '';
PRINT 'Next steps:';
PRINT '1. Update server.js with your SQL Server credentials';
PRINT '2. Run: npm install';
PRINT '3. Run: npm start';
PRINT '';
GO

-- Test queries (optional)
-- SELECT * FROM ContactSubmissions;
-- SELECT * FROM vw_ContactStats;
-- SELECT * FROM fn_GetPlatformBreakdown();
-- EXEC sp_QueryContacts @platform = 'Desktop';
