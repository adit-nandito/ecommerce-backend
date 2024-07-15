CREATE TABLE transactions (
    sku VARCHAR(50) REFERENCES products (sku) ON DELETE CASCADE,
    qty INT NOT NULL
);