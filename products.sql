CREATE TABLE products (
    title VARCHAR(255) NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    image TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT
);