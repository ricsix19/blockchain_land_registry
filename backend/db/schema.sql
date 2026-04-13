CREATE DATABASE IF NOT EXISTS land_registry_db;
USE land_registry_db;



CREATE TABLE users (
    wallet_address VARCHAR(42) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    tax_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE properties_meta (
    property_id INT PRIMARY KEY,
    physical_address TEXT NOT NULL,
    square_meters INT NOT NULL,
    property_type VARCHAR(50) DEFAULT 'Lakóingatlan',
    notes TEXT
);