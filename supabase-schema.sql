-- Create users table (stores custom profiles linked to Supabase Auth)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  name TEXT,
  phone TEXT,
  gender TEXT,
  dob TEXT,
  role TEXT DEFAULT 'user',
  profile_pic TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tickets table
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  event_id TEXT NOT NULL,
  ticket_type TEXT,
  quantity INTEGER,
  total_price NUMERIC,
  status TEXT DEFAULT 'valid',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT,
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Turn on Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Users can read all users (e.g., for reviews), update their own profile
CREATE POLICY "Allow public read access to users" ON public.users FOR SELECT TO public USING (true);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Reviews can be read by anyone, inserted by authenticated users
CREATE POLICY "Allow public read access to reviews" ON public.reviews FOR SELECT TO public USING (true);
CREATE POLICY "Users can insert own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tickets can only be read and inserted by the owner
CREATE POLICY "Users can read own tickets" ON public.tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tickets" ON public.tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
