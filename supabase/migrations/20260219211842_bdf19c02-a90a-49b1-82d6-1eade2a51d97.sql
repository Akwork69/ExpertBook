
-- Categories enum
CREATE TYPE expert_category AS ENUM ('Technology', 'Business', 'Health', 'Education', 'Finance', 'Legal', 'Marketing', 'Design');

-- Booking status enum
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed');

-- Experts table
CREATE TABLE public.experts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category expert_category NOT NULL,
  bio TEXT,
  experience_years INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC(2,1) NOT NULL DEFAULT 0.0,
  avatar_url TEXT,
  hourly_rate INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Time slots table
CREATE TABLE public.time_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expert_id UUID NOT NULL REFERENCES public.experts(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_booked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(expert_id, slot_date, start_time)
);

-- Bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expert_id UUID NOT NULL REFERENCES public.experts(id) ON DELETE CASCADE,
  time_slot_id UUID NOT NULL REFERENCES public.time_slots(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  notes TEXT,
  status booking_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hard stop for duplicate bookings on the same slot
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_time_slot_unique UNIQUE (time_slot_id);

-- Enable RLS
ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: experts are public read
CREATE POLICY "Experts are publicly readable" ON public.experts FOR SELECT USING (true);

-- RLS Policies: time_slots are public read
CREATE POLICY "Time slots are publicly readable" ON public.time_slots FOR SELECT USING (true);

-- RLS Policies: bookings - anyone can insert
CREATE POLICY "Anyone can create bookings" ON public.bookings FOR INSERT WITH CHECK (true);

-- RLS Policies: bookings - read by email (client sends email filter)
CREATE POLICY "Bookings readable by email" ON public.bookings FOR SELECT USING (true);

-- RLS Policies: bookings - update status
CREATE POLICY "Bookings status can be updated" ON public.bookings FOR UPDATE USING (true) WITH CHECK (true);

-- Enable realtime for time_slots
ALTER PUBLICATION supabase_realtime ADD TABLE public.time_slots;

-- Race-safe, atomic slot lock before booking insert
CREATE OR REPLACE FUNCTION public.lock_slot_for_booking()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.time_slots
  SET is_booked = true
  WHERE id = NEW.time_slot_id
    AND expert_id = NEW.expert_id
    AND is_booked = false;

  IF NOT FOUND THEN
    IF EXISTS (
      SELECT 1
      FROM public.time_slots
      WHERE id = NEW.time_slot_id
        AND expert_id = NEW.expert_id
    ) THEN
      RAISE EXCEPTION 'This time slot is already booked';
    ELSE
      RAISE EXCEPTION 'Invalid expert_id and time_slot_id combination';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER lock_slot_before_booking
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.lock_slot_for_booking();

-- Index for performance
CREATE INDEX idx_time_slots_expert_date ON public.time_slots(expert_id, slot_date);
CREATE INDEX idx_bookings_email ON public.bookings(customer_email);
CREATE INDEX idx_bookings_time_slot ON public.bookings(time_slot_id);
