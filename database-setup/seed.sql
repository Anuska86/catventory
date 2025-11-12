-- Tabla 'clients'
CREATE TABLE clients (
    client_id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    vat_number VARCHAR(255) UNIQUE,
    billing_address VARCHAR(255),
    delivery_address VARCHAR(255),
    country VARCHAR(255)
);
-- Tabla 'warehouses'
CREATE TABLE warehouses (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    country VARCHAR(255)
);
-- Tabla 'suppliers'
CREATE TABLE suppliers (
    supplier_id VARCHAR(255) PRIMARY KEY
);
-- Tabla 'products'
CREATE TABLE products (
    sku VARCHAR(255) PRIMARY KEY,
    brand VARCHAR(255),
    category VARCHAR(255),
    color VARCHAR(255),
    depth INTEGER,
    description TEXT,
    ean VARCHAR(255) UNIQUE,
    height INTEGER,
    min_threshold INTEGER,
    model VARCHAR(255),
    photo_url TEXT,
    product_variant VARCHAR(255),
    weight INTEGER,
    width INTEGER
);
-- Tabla de unión 'supplier_warehouse'
CREATE TABLE supplier_warehouse (
    supplier_id VARCHAR(255) REFERENCES suppliers(supplier_id),
    warehouse_country VARCHAR(255),
    warehouse_name VARCHAR(255),
    quantity INTEGER,
    blocked_quantity INTEGER,
    PRIMARY KEY (supplier_id, warehouse_country)
);
-- Tabla de unión 'transport_options'
CREATE TABLE transport_options (
    supplier_id VARCHAR(255) REFERENCES suppliers(supplier_id),
    warehouse_country VARCHAR(255),
    name VARCHAR(255),
    sla INTEGER,
    unit_price DECIMAL(10, 2),
    FOREIGN KEY (supplier_id, warehouse_country) REFERENCES supplier_warehouse(supplier_id, warehouse_country),
    PRIMARY KEY (supplier_id, warehouse_country, name)
);
-- Tabla 'orders'
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    client_id VARCHAR(255) REFERENCES clients(client_id),
    creation_date TIMESTAMP WITH TIME ZONE,
    currency VARCHAR(10),
    po_number VARCHAR(255) UNIQUE,
    status VARCHAR(50),
    selected_warehouse VARCHAR(255),
    total_blocked_amount DECIMAL(10, 2)
);
-- Tabla de unión 'orders_products'
CREATE TABLE orders_products (
    order_id INTEGER REFERENCES orders(order_id),
    ean VARCHAR(255),
    sku VARCHAR(255),
    description TEXT,
    quantity INTEGER,
    unit_price DECIMAL(10, 2),
    is_blocked BOOLEAN,
    PRIMARY KEY (order_id, ean)
);
-- Tabla 'invoices'
CREATE TABLE invoices (
    invoice_number INTEGER PRIMARY KEY,
    client_id VARCHAR(255) REFERENCES clients(client_id),
    name VARCHAR(255),
    email VARCHAR(255),
    billing_address VARCHAR(255),
    delivery_address VARCHAR(255),
    financial_status VARCHAR(50),
    shipping_status VARCHAR(50),
    total_blocked_amount DECIMAL(10, 2),
    payment_due_dates INTEGER,
    creation_date TIMESTAMP WITH TIME ZONE,
    vat_number VARCHAR(255),
    scps TEXT[],
    ean_list JSONB
);

-- Datos para 'clients'
INSERT INTO clients (client_id, name, email, vat_number, billing_address, delivery_address, country) VALUES
('CV3owsT0wfslnYU', 'Haruba Elec', 'test@gmail.com', 'BE0363269255', 'Billing 1', 'Address 1', 'Belgium'),
('XJ9klsT0abc123YU', 'SolarNova Ltd', 'contact@solarnova.com', 'DE123456789', 'Solar Street 42', 'Warehouse 5', 'Germany'),
('MN7pqrT0xyz789YU', 'TechHive Inc', 'info@techhive.io', 'FR987654321', 'Tech Park 9', 'Logistics Hub 3', 'France'),
('TR8xyzT0new456YU', 'GreenTech Solutions', 'hello@greentech.sol', 'NL1122334455', 'Eco Tower 21', 'Green Depot 7', 'Netherlands'),
('LK9abcT0new789YU', 'Photonix GmbH', 'sales@photonix.de', 'DE9988776655', 'Photonix HQ', 'Photonix Warehouse', 'Germany');
-- Datos para 'warehouses'
INSERT INTO warehouses (id, name, address, country) VALUES
('wh-germany-hamburg', 'Hamburg Warehouse', 'Holtenklinker Str. 65, 21029 Hamburg', 'Germany'),
('wh-poland-warsaw', 'Warsaw Logistics Hub', 'Kwiatowa 78, 00-001 Warsaw', 'Poland'),
('wh-italy-rome', 'Rome Fulfillment Center', 'Via dei Fori Imperiali 1, 00184 Rome', 'Italy'),
('wh-spain-madrid', 'Madrid Distribution Center', 'Calle de Alcalá 49, 28014 Madrid', 'Spain'),
('wh-spain-barcelona', 'Barcelona Storage Facility', 'Carrer de la Marina 16, 08005 Barcelona', 'Spain'),
('wh-belgium-brussels', 'Brussels Distribution Center', 'Rue de la Loi 16, 1000 Brussels', 'Belgium'),
('wh-belgium-antwerp', 'Antwerp Warehouse', 'Noorderlaan 12, 2030 Antwerp', 'Belgium');
-- Datos para 'products'
INSERT INTO products (sku, brand, category, color, depth, description, ean, height, min_threshold, model, photo_url, product_variant, weight, width) VALUES
('PETLIBRO-black-F-P', 'PETLIBRO', 'electronics', 'black', 67, 'The PETLIBRO Automatic Cat Feeder is an advanced electronic device designed for the modern pet owner. This sleek black feeder ensures freshness preservation for your pet''s food. With a SKU of "PETLIBRO-black-F-P," this product is ideal for keeping your pet fed on a schedule while you''re away. The unit has dimensions of 67 inches deep, 55 inches high, and 45 inches wide, and weighs 586g.', '0799455612766', 55, 788, 'Automatic', 'https://m.media-amazon.com/images/I/71o4Rw9o-%2BL._AC_SY679_.jpg', 'Freshness Preservation', 586, 45),
('Govee-RGBIC-LS', 'Govee', 'electronics', 'rgb', 10, 'Smart light strip with Wi-Fi and Bluetooth connectivity, perfect for creating custom ambiance in any room.', '0810052981069', 25, 200, 'RGBIC', 'https://m.media-amazon.com/images/I/719S20myWEL._AC_SX342_SY445_QL70_ML2_.jpg', 'LED Light Strip', 350, 100),
('Anker-Black-WC', 'Anker', 'accessories', 'black', 30, 'High-speed charging port with multiple USB-C and USB-A slots. Perfect for travel and home use.', '0848061034458', 15, 50, 'PowerPort', 'https://m.media-amazon.com/images/I/51pnxBW4oGL._AC_SY300_SX300_QL70_ML2_.jpg', 'Wall Charger', 150, 25),
('Bose-White-NC-HP', 'Bose', 'audio', 'white', 10, 'Noise-cancelling headphones with superior sound quality and comfort. Ideal for travel or quiet work.', '0799455612888', 20, 30, 'QuietComfort', 'https://m.media-amazon.com/images/I/61EmutePDGL._AC_SY300_SX300_QL70_ML2_.jpg', 'Headphones', 250, 15),
('Logitech-Gray-MX3S', 'Logitech', 'peripherals', 'gray', 12, 'Ergonomic wireless mouse with advanced customization and long battery life.', '0978553210987', 7, 100, 'MX Master 3S', 'https://m.media-amazon.com/images/I/61cMv9CWAML._AC_UL480_FMwebp_QL65_.jpg', 'Wireless Mouse', 141, 8.4);
-- Datos para 'suppliers'
INSERT INTO suppliers (supplier_id) VALUES
('SupplierA'), ('SupplierB'), ('SupplierC');
-- Datos para 'supplier_warehouse'
INSERT INTO supplier_warehouse (supplier_id, warehouse_country, warehouse_name, quantity, blocked_quantity) VALUES
('SupplierA', 'germany', 'Warehouse B', 591, 0),
('SupplierA', 'holand', 'Warehouse A', 493, 0),
('SupplierB', 'germany', 'Warehouse C', 320, 0),
('SupplierB', 'poland', 'Anker Hub', 80, 0),
('SupplierB', 'germany', 'Anker Europe', 120, 0),
('SupplierC', 'poland', 'Warehouse D', 150, 0),
('SupplierC', 'germany', 'Govee Warehouse', 450, 0);
-- Datos para 'transport_options'
INSERT INTO transport_options (supplier_id, warehouse_country, name, sla, unit_price) VALUES
('SupplierA', 'germany', 'truck', 7, 36.6),
('SupplierA', 'germany', 'plane', 2, 55.0),
('SupplierA', 'holand', 'truck', 5, 23.6),
('SupplierA', 'holand', 'train', 4, 28.0),
('SupplierA', 'holand', 'plane', 1, 40.5),
('SupplierB', 'germany', 'truck', 6, 25.1),
('SupplierB', 'germany', 'plane', 2, 45.9),
('SupplierB', 'germany', 'ship', 10, 15.0),
('SupplierB', 'poland', 'truck', 3, 19.99),
('SupplierB', 'poland', 'plane', 1, 25.0),
('SupplierB', 'germany', 'train', 4, 21.5),
('SupplierB', 'germany', 'plane', 2, 30.0),
('SupplierC', 'poland', 'truck', 4, 22.9),
('SupplierC', 'poland', 'plane', 1, 38.4),
('SupplierC', 'germany', 'truck', 5, 39.99),
('SupplierC', 'germany', 'plane', 2, 59.99);
-- Datos para 'orders'
INSERT INTO orders (client_id, creation_date, currency, po_number, status, selected_warehouse, total_blocked_amount) VALUES
('CV3owsT0wfslnYU', '2025-08-14 12:18:15', '€', 'PONXEKBXHY', 'billing', 'germany', 324.64),
('XJ9klsT0abc123YU', '2025-08-15 09:30:00', '€', 'POABC123456', 'processing', 'france', 145.49),
('TR8xyzT0new456YU', '2025-08-16 11:15:00', '€', 'POGREEN456', 'processing', 'netherlands', 89.97),
('LK9abcT0new789YU', '2025-08-16 14:45:00', '€', 'POPHOTON789', 'billing', 'germany', 299.95),
('MN7pqrT0xyz789YU', '2025-06-20 10:00:00', '€', 'POJUNE001', 'processing', 'france', 129.99),
('TR8xyzT0new456YU', '2025-07-10 14:30:00', '€', 'POJULY002', 'billing', 'netherlands', 89.97),
('XJ9klsT0abc123YU', '2025-09-05 09:00:00', '€', 'POSEPT003', 'processing', 'germany', 299.95),
('CV3owsT0wfslnYU', '2025-03-18 16:45:00', '€', 'POSEPT004', 'billing', 'germany', 156.72);
-- Datos para 'orders_products'
INSERT INTO orders_products (order_id, ean, sku, description, quantity, unit_price, is_blocked) VALUES
(1, '055543211463', 'BAGAIL-White-O-B', 'The BAGAIL Cubes Luggage Organizer Bag...', 1, 89.56, TRUE),
(1, '7123533789123', 'REVLON-White-S-G-P', 'The REVLON High-Speed Hair Dryer...', 3, 78.36, TRUE),
(2, '1234567890123', 'LOGITECH-Black-MX-M', 'MX Master 3 ergonomic mouse', 1, 99.99, TRUE),
(2, '9876543210987', 'ANKER-Blue-Power-B', 'Anker Power Bank 20000mAh', 1, 45.5, TRUE),
(3, '3216549870123', 'PHILIPS-Black-Hue-B', 'Philips Hue Smart Bulb', 3, 29.99, TRUE),
(4, '4567891234567', 'BOSE-Black-QC45-H', 'Bose QuietComfort 45 Headphones', 1, 299.95, TRUE),
(5, '7894561237890', 'SAMSUNG-White-T5-S', 'Samsung T5 SSD 1TB', 1, 129.99, TRUE),
(6, '3216549870123', 'PHILIPS-Black-Hue-B', 'Philips Hue Smart Bulb', 3, 29.99, TRUE),
(7, '4567891234567', 'BOSE-Black-QC45-H', 'Bose QuietComfort 45 Headphones', 1, 299.95, TRUE),
(8, '055543211463', 'BAGAIL-White-O-B', 'Cubes Luggage Organizer', 1, 89.56, TRUE),
(8, '7123533789123', 'REVLON-White-S-G-P', 'High-Speed Hair Dryer', 1, 67.16, TRUE);
-- Datos para 'invoices'
INSERT INTO invoices (invoice_number, client_id, name, email, billing_address, delivery_address, financial_status, shipping_status, total_blocked_amount, payment_due_dates, creation_date, vat_number, scps, ean_list) VALUES
(4, 'CV3owsT0wfslnYU', 'Haruba Elec', 'test@gmail.com', 'Billing 1', 'Address 1', 'pending', 'send', 559.72, 30, '2025-08-14 12:46:27', 'BE0363269255', '{"HARCV3ows7438e416-72025-08-14101749_7", "HARCV3ows3fc9f68d-92025-08-14101815_7"}', NULL),
(5, 'MN7pqrT0xyz789YU', 'TechHive Inc', 'info@techhive.io', 'Tech Park 9', 'Logistics Hub 3', 'paid', 'delivered', 145.49, 15, '2025-08-15 10:00:00', 'FR987654321', '{"TECHMN7pqr123456-2025-08-15100000_8"}', NULL),
(6, 'TR8xyzT0new456YU', 'GreenTech Solutions', 'hello@greentech.sol', 'Eco Tower 21', 'Green Depot 7', 'pending', 'send', 89.97, 30, '2025-08-16 12:00:00', 'NL1122334455', '{"GREENTR8xyz2025-08-16111500_9"}', NULL),
(7, 'LK9abcT0new789YU', 'Photonix GmbH', 'sales@photonix.de', 'Photonix HQ', 'Photonix Warehouse', 'paid', 'delivered', 299.95, 15, '2025-08-16 15:00:00', 'DE9988776655', '{"PHOTOLK9abc2025-08-16144500_10"}', NULL);