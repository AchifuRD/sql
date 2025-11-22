-- PostgreSQL Setup Script
-- Run this in your cloud database query tool (e.g., Render Dashboard)

-- Create ContactSubmissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message TEXT,
    platform VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create UserData table
CREATE TABLE IF NOT EXISTS user_data (
    id SERIAL PRIMARY KEY,
    data_key VARCHAR(255),
    data_value TEXT,
    platform VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_contact_email ON contact_submissions(email);
CREATE INDEX IF NOT EXISTS idx_contact_platform ON contact_submissions(platform);
CREATE INDEX IF NOT EXISTS idx_contact_timestamp ON contact_submissions(timestamp);

-- Insert Sample Data
INSERT INTO contact_submissions (name, email, message, platform)
VALUES 
('John Doe', 'john@example.com', 'Hello from PostgreSQL!', 'Desktop'),
('Jane Smith', 'jane@mobile.com', 'Testing mobile view', 'Mobile'),
('Bob Johnson', 'bob@tablet.com', 'Tablet works great', 'Tablet');

-- Create View for Stats
CREATE OR REPLACE VIEW vw_contact_stats AS
SELECT
    (SELECT COUNT(*) FROM contact_submissions) as total_records,
    (SELECT COUNT(*) FROM contact_submissions WHERE timestamp >= NOW() - INTERVAL '7 days') as recent_submissions;

-- Function to get platform breakdown
CREATE OR REPLACE FUNCTION get_platform_breakdown()
RETURNS TABLE (platform VARCHAR, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT cs.platform, COUNT(*) as count
    FROM contact_submissions cs
    GROUP BY cs.platform;
END;
$$ LANGUAGE plpgsql;
