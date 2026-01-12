-- BBM KPI Dashboard: Granular Settings Schema

-- 1. Branch Settings (Goals & Ratios)
CREATE TABLE IF NOT EXISTS branch_settings (
    branch_id TEXT PRIMARY KEY, -- e.g., 'KNOX', 'NATI'
    yearly_sales JSONB DEFAULT '{}'::jsonb, -- Store map of year -> amount
    monthly_pcts JSONB DEFAULT '[8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.33]'::jsonb,
    profit_goal NUMERIC DEFAULT 25,
    close_rate_dollar NUMERIC DEFAULT 30,
    close_rate_qty NUMERIC DEFAULT 25,
    metadata JSONB DEFAULT '{}'::jsonb, -- Month-specific overrides
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Rep Settings (Visibility & Personal Goals)
CREATE TABLE IF NOT EXISTS rep_settings (
    salesperson_id TEXT, -- Trimmed & Uppercase'd
    branch_id TEXT,      -- e.g., 'KNOX', 'NATI'
    is_visible BOOLEAN DEFAULT true,
    days_worked NUMERIC,
    target_pct NUMERIC DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb, -- Personal goals or month overrides
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (salesperson_id, branch_id)
);

-- 3. Holidays
CREATE TABLE IF NOT EXISTS holidays (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    UNIQUE(date)
);

-- 4. Enable RLS and Grant Permissions
ALTER TABLE branch_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rep_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Access" ON branch_settings;
DROP POLICY IF EXISTS "Public Read Access" ON rep_settings;
DROP POLICY IF EXISTS "Public Read Access" ON holidays;
DROP POLICY IF EXISTS "Anon Upsert Access" ON branch_settings;
DROP POLICY IF EXISTS "Anon Upsert Access" ON rep_settings;
DROP POLICY IF EXISTS "Anon Upsert Access" ON holidays;

CREATE POLICY "Public Read Access" ON branch_settings FOR SELECT TO anon USING (true);
CREATE POLICY "Public Read Access" ON rep_settings FOR SELECT TO anon USING (true);
CREATE POLICY "Public Read Access" ON holidays FOR SELECT TO anon USING (true);

CREATE POLICY "Anon Upsert Access" ON branch_settings FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon Upsert Access" ON rep_settings FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon Upsert Access" ON holidays FOR ALL TO anon USING (true) WITH CHECK (true);

GRANT ALL ON TABLE branch_settings TO anon, authenticated, service_role;
GRANT ALL ON TABLE rep_settings TO anon, authenticated, service_role;
GRANT ALL ON TABLE holidays TO anon, authenticated, service_role;

-- 5. Poke Cache
COMMENT ON TABLE branch_settings IS 'BBM Branch Settings - atomic updates';
COMMENT ON TABLE rep_settings IS 'BBM Rep Settings - atomic updates';
