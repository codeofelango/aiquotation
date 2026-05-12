-- =========================================================
-- INITIATIVE 1: LEADS & OPPORTUNITY MANAGEMENT (CRM)
-- =========================================================

-- 1.1 Lead Acquisition
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    company_name TEXT,
    source TEXT NOT NULL, -- Website, Tender, Referral, Cold Call
    sector TEXT, -- Commercial, Residential, Healthcare, etc.
    service_type TEXT, -- Hard Services, Soft Services, Integrated FM
    estimated_value NUMERIC(12, 2),
    status TEXT DEFAULT 'New', -- New, Contacted, Qualified, Converted, Disqualified
    qualification_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_to_user_id INTEGER REFERENCES users(id)
);

-- 1.1 Contact Management (Stakeholders)
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    job_title TEXT,
    email TEXT,
    phone TEXT,
    lead_id INTEGER REFERENCES leads(id),
    opportunity_id INTEGER REFERENCES opportunities(id),
    is_primary BOOLEAN DEFAULT FALSE,
    notes TEXT
);

-- 1.2 Activity Tracking
CREATE TABLE IF NOT EXISTS crm_activities (
    id SERIAL PRIMARY KEY,
    activity_type TEXT NOT NULL, -- Meeting, Call, Email, Site Survey
    subject TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'Pending', -- Pending, Completed
    related_lead_id INTEGER REFERENCES leads(id),
    related_opportunity_id INTEGER REFERENCES opportunities(id),
    assigned_to_user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1.2 Competitor Tracking
CREATE TABLE IF NOT EXISTS competitors (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    strengths TEXT,
    weaknesses TEXT
);

CREATE TABLE IF NOT EXISTS opportunity_competitors (
    opportunity_id INTEGER REFERENCES opportunities(id) ON DELETE CASCADE,
    competitor_id INTEGER REFERENCES competitors(id) ON DELETE CASCADE,
    is_incumbent BOOLEAN DEFAULT FALSE,
    win_loss_analysis TEXT,
    PRIMARY KEY (opportunity_id, competitor_id)
);

-- =========================================================
-- INITIATIVE 2: CPQ (CONFIGURE, PRICE, QUOTE) SYSTEM
-- =========================================================

-- 2.1 Master Data - Labor Rates
CREATE TABLE IF NOT EXISTS labor_rates (
    id SERIAL PRIMARY KEY,
    role_name TEXT NOT NULL, -- e.g., HVAC Technician, Cleaning Supervisor
    category TEXT, -- Skilled, Unskilled, Management
    hourly_rate_cost NUMERIC(10, 2) NOT NULL, -- Internal Cost
    monthly_rate_cost NUMERIC(10, 2) NOT NULL,
    hourly_rate_sell NUMERIC(10, 2), -- Standard Sell Rate
    currency TEXT DEFAULT 'USD',
    effective_from DATE DEFAULT CURRENT_DATE,
    active BOOLEAN DEFAULT TRUE
);

-- 2.1 Master Data - Materials & Consumables
CREATE TABLE IF NOT EXISTS consumables (
    id SERIAL PRIMARY KEY,
    sku TEXT UNIQUE,
    name TEXT NOT NULL,
    category TEXT, -- Spares, Chemicals, PPE
    unit_of_measure TEXT, -- Each, Litre, Box
    unit_cost NUMERIC(10, 2) NOT NULL,
    bulk_discount_threshold INTEGER, -- Qty at which discount applies
    bulk_discount_percent NUMERIC(5, 2) DEFAULT 0
);

-- 2.1 Overhead & Margin Controls
CREATE TABLE IF NOT EXISTS margin_rules (
    id SERIAL PRIMARY KEY,
    min_contract_value NUMERIC(12, 2),
    max_contract_value NUMERIC(12, 2),
    min_margin_percent NUMERIC(5, 2) NOT NULL, -- e.g., 15.00 for 15%
    approval_required BOOLEAN DEFAULT TRUE,
    role_required_for_approval TEXT -- e.g., 'Director'
);

-- 2.2 & 2.3 Quotation Versions & CTC
-- Extending the existing quotations table concept
CREATE TABLE IF NOT EXISTS quote_versions (
    id SERIAL PRIMARY KEY,
    quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    
    -- Financial Snapshot
    total_revenue NUMERIC(12, 2),
    total_cost_to_company NUMERIC(12, 2),
    gross_margin_percent NUMERIC(5, 2),
    
    -- Complete Data Snapshot (Items, Labor, Overheads)
    data_snapshot JSONB NOT NULL,
    
    change_log TEXT, -- "Updated labor hours for technicians"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id INTEGER REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_crm_activities_dates ON crm_activities(due_date);
CREATE INDEX IF NOT EXISTS idx_quote_versions_qid ON quote_versions(quotation_id);


-- Seed Labor Rates
INSERT INTO labor_rates (role_name, category, hourly_rate_cost, monthly_rate_cost, hourly_rate_sell, active) VALUES
('HVAC Technician', 'Skilled', 25.00, 4500.00, 45.00, TRUE),
('Electrical Supervisor', 'Management', 35.00, 6000.00, 65.00, TRUE),
('General Cleaner', 'Unskilled', 12.00, 2200.00, 18.00, TRUE),
('Security Guard', 'Unskilled', 14.00, 2500.00, 22.00, TRUE),
('Plumber', 'Skilled', 24.00, 4300.00, 42.00, TRUE),
('Facility Manager', 'Management', 50.00, 9000.00, 95.00, TRUE);

-- Seed Consumables
INSERT INTO consumables (sku, name, category, unit_of_measure, unit_cost, bulk_discount_threshold, bulk_discount_percent) VALUES
('MAT-001', 'Air Filter F7 (600x600)', 'Spares', 'Pcs', 45.00, 50, 10.00),
('MAT-002', 'V-Belt B52', 'Spares', 'Pcs', 15.00, 20, 5.00),
('CHE-101', 'Floor Cleaner Concentrate', 'Chemicals', 'Litre', 12.50, 100, 15.00),
('CHE-102', 'Glass Cleaner', 'Chemicals', 'Litre', 8.00, 50, 5.00),
('PPE-001', 'Safety Gloves (Pair)', 'PPE', 'Pair', 3.50, 200, 10.00),
('LGT-200', 'LED Tube 120cm 18W', 'Lighting', 'Pcs', 6.50, 100, 8.00);