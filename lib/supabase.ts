import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
);

export type Meeting = {
  id: string;
  title: string;
  dates: string[];
  start_time: string;
  end_time: string;
  step_minutes: number;
  participants: string[];
  password: string | null;
  created_at: string;
};

export type Response = {
  id: string;
  meeting_id: string;
  name: string;
  available_slots: string[];
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type Place = {
  id: string;
  meeting_id: string;
  submitter_name: string;
  place_name: string;
  url: string;
  image_url: string | null;
  likes_count: number;
  created_at: string;
};
