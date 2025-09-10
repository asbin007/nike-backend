-- Add cost_price column to shoes table
ALTER TABLE shoes ADD COLUMN cost_price DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- Add comment to the column
COMMENT ON COLUMN shoes.cost_price IS 'Original cost price of the product for profit calculation';
