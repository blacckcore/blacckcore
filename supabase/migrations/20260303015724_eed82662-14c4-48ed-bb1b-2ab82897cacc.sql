
-- Goal types table
CREATE TABLE public.goal_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  icon text NOT NULL DEFAULT 'Target',
  color text NOT NULL DEFAULT '#C0C0C0',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.goal_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own goal_types" ON public.goal_types FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Goals table
CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  goal_type_id uuid REFERENCES public.goal_types(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  progress_type text NOT NULL DEFAULT 'percentage',
  current_value numeric NOT NULL DEFAULT 0,
  target_value numeric NOT NULL DEFAULT 100,
  status text NOT NULL DEFAULT 'in_progress',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own goals" ON public.goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
