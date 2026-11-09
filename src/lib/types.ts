export type Role = "korisnik" | "instruktor" | "admin";
export type TutorStatus = "na_cekanju" | "odobren" | "odbijen";

export type Profile = {
  id: string;
  role: Role;
  full_name: string;
  birth_date: string;
  email_notifications: boolean;
  is_test: boolean;
  created_at: string;
};

export type Tutor = {
  id: string;
  slug: string;
  display_name: string;
  status: TutorStatus;
  rejection_reason: string | null;
  headline: string | null;
  bio: string | null;
  photo_url: string | null;
  subjects: string[];
  levels: string[];
  modes: string[];
  price_eur: number | null;
  city: string | null;
  county: string | null;
  lat: number | null;
  lng: number | null;
  travel_radius_km: number;
  experience_years: number | null;
  experience: string | null;
  featured_until: string | null;
  rating_avg: number;
  rating_count: number;
  is_test: boolean;
  submitted_at: string | null;
  approved_at: string | null;
  created_at: string;
};

export type SearchResult = Pick<
  Tutor,
  | "id" | "slug" | "display_name" | "headline" | "photo_url" | "subjects" | "levels" | "modes" | "price_eur"
  | "city" | "county" | "experience_years" | "rating_avg" | "rating_count" | "is_test"
> & { is_featured: boolean; distance_km: number | null; total_count: number };

export type Availability = { id?: number; tutor_id?: string; weekday: number; start_time: string; end_time: string };

export type Review = {
  id: string;
  tutor_id: string;
  author_id: string;
  rating: number;
  body: string | null;
  status: "objavljena" | "skrivena";
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

export type ConversationListItem = {
  id: string;
  student_id: string;
  tutor_id: string;
  other_name: string;
  other_photo: string | null;
  tutor_slug: string;
  last_message: string | null;
  last_message_at: string;
  unread: number;
};

export const isFeatured = (t: Pick<Tutor, "featured_until">) =>
  Boolean(t.featured_until && new Date(t.featured_until) > new Date());
