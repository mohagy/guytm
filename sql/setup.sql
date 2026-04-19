-- Database setup for Guyana Vehicle Management System (VMS)

CREATE DATABASE IF NOT EXISTS vms_db;
USE vms_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Licensing Officer', 'Vehicle Owner') NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Zones table (Georgetown, etc.)
CREATE TABLE IF NOT EXISTS zones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    reg_number VARCHAR(20) UNIQUE NOT NULL,
    category ENUM('Private', 'Hire Car', 'Motor Bus', 'Lorry', 'Tractor', 'Trailer') NOT NULL,
    make VARCHAR(50),
    model VARCHAR(50),
    year INT,
    business_license_no VARCHAR(50), -- Optional attachment for Taxis/Buses
    reg_date DATE NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Licenses table
CREATE TABLE IF NOT EXISTS licenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    license_no VARCHAR(50) UNIQUE NOT NULL,
    type ENUM('Driver', 'Conductor', 'Road Service', 'Special Hire') NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status ENUM('Active', 'Expired', 'Pending', 'Suspended') DEFAULT 'Pending',
    zone_id INT, -- Relevant for Road Service licenses
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE SET NULL
);

-- Offences table
CREATE TABLE IF NOT EXISTS offences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    officer_id INT NOT NULL,
    section_no VARCHAR(20), -- Section from the Act (e.g. 35, 37)
    description TEXT,
    fine_amount DECIMAL(10,2),
    offence_date DATETIME NOT NULL,
    status ENUM('Paid', 'Unpaid', 'Contested') DEFAULT 'Unpaid',
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (officer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Fitness Certificates (Inspection)
CREATE TABLE IF NOT EXISTS fitness_certs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    result ENUM('Pass', 'Fail') NOT NULL,
    comments TEXT,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Seed data for zones
INSERT IGNORE INTO zones (name) VALUES 
('Georgetown'), 
('New Amsterdam'), 
('Demerara - Division A'), 
('Essequibo - Division B'), 
('Berbice - Division C');

-- Seed data for an initial Admin (password: admin123)
-- In a real system, you would use password_hash() in PHP
INSERT IGNORE INTO users (username, password, role, full_name, email) VALUES 
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'Chief Administrator', 'admin@vms.gov.gy');
