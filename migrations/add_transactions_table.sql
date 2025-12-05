-- Add transactions table for payment tracking
-- This is required for Faspay callback to work properly

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'IDR',
  status TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  payment_gateway TEXT NOT NULL,
  gateway_reference TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_gateway_reference ON transactions(gateway_reference);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

COMMENT ON TABLE transactions IS 'Payment transaction records for audit and tracking';
