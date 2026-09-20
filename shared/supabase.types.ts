// Bootstrap schema contract for local preparation. Replace it with the exact CLI output by
// running `pnpm supabase:types` after the first local migration is applied.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type PlatformRole = "superadmin" | "admin" | "customer";
export type MembershipStatus = "active" | "invited" | "suspended";
export type DriverReviewStatus = "pending" | "approved" | "rejected" | "suspended";
export type VerificationStatus = "pending" | "approved" | "rejected" | "expired";
export type RideStatus =
  | "requested"
  | "matched"
  | "driver_en_route"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled";
export type PaymentReferenceStatus =
  | "not_required"
  | "pending"
  | "authorized"
  | "captured"
  | "failed"
  | "refunded";

type Row = Record<string, Json | undefined>;
type Table<T> = {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
  Relationships: [];
};

type SiteRow = {
  id: string;
  slug: string;
  name: string;
  public_url: string | null;
  admin_path: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string;
  avatar_path: string | null;
  platform_role: PlatformRole;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

type MembershipRow = {
  site_id: string;
  user_id: string;
  site_role: PlatformRole;
  status: MembershipStatus;
  created_at: string;
  updated_at: string;
};

type RiderRow = {
  site_id: string;
  user_id: string;
  phone: string | null;
  preferred_island: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  accessibility_notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type DriverRow = {
  id: string;
  site_id: string;
  user_id: string;
  review_status: DriverReviewStatus;
  driver_type: "taxi" | "rideshare";
  public_display_name: string | null;
  license_reference: string | null;
  rating_average: number;
  is_online: boolean;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
};

type RideRequestRow = {
  id: string;
  site_id: string;
  rider_id: string;
  service_area_id: string;
  fare_quote_id: string | null;
  ride_type: "standard" | "premium" | "shared";
  status: RideStatus;
  pickup_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  dropoff_address: string;
  dropoff_latitude: number;
  dropoff_longitude: number;
  rider_note: string | null;
  requested_at: string;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

type RideRow = {
  id: string;
  site_id: string;
  request_id: string;
  rider_id: string;
  driver_id: string;
  vehicle_id: string;
  fare_quote_id: string | null;
  status: RideStatus;
  currency_code: string;
  fare_amount: number | null;
  tip_amount: number;
  matched_at: string;
  arrived_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      sites: Table<SiteRow>;
      profiles: Table<ProfileRow>;
      site_memberships: Table<MembershipRow>;
      rider_profiles: Table<RiderRow>;
      driver_profiles: Table<DriverRow>;
      driver_verifications: Table<{
        id: string; site_id: string; driver_id: string; verification_type: string;
        status: VerificationStatus; document_path: string | null; expires_on: string | null;
        reviewer_id: string | null; reviewer_note: string | null; reviewed_at: string | null;
        created_at: string; updated_at: string;
      }>;
      vehicles: Table<{
        id: string; site_id: string; driver_id: string; make: string; model: string;
        model_year: number; color: string; plate_number: string; seats: number;
        photo_path: string | null; is_active: boolean; created_at: string; updated_at: string;
      }>;
      service_areas: Table<{
        id: string; site_id: string; slug: string; name: string; island_code: string;
        timezone: string; currency_code: string; boundary: Json; fare_rules: Json;
        is_active: boolean; created_at: string; updated_at: string;
      }>;
      fare_quotes: Table<{
        id: string; site_id: string; rider_id: string; service_area_id: string;
        ride_type: string; currency_code: string; amount: number; distance_km: number | null;
        duration_minutes: number | null; pricing_snapshot: Json; expires_at: string; created_at: string;
      }>;
      ride_requests: Table<RideRequestRow>;
      rides: Table<RideRow>;
      ride_status_events: Table<{
        id: number; site_id: string; ride_id: string; status: RideStatus;
        actor_user_id: string | null; note: string | null; metadata: Json; created_at: string;
      }>;
      payment_references: Table<{
        id: string; site_id: string; ride_id: string; rider_id: string; provider: string;
        provider_reference: string; status: PaymentReferenceStatus; currency_code: string;
        amount: number; provider_metadata: Json; created_at: string; updated_at: string;
      }>;
      ratings: Table<{
        id: string; site_id: string; ride_id: string; reviewer_id: string;
        reviewee_id: string; rating: number; comment: string | null; created_at: string;
      }>;
      saved_places: Table<{
        id: string; site_id: string; user_id: string; label: string; address: string;
        latitude: number; longitude: number; created_at: string; updated_at: string;
      }>;
      favorite_drivers: Table<{
        site_id: string; rider_id: string; driver_id: string; created_at: string;
      }>;
      earning_entries: Table<{
        id: string; site_id: string; driver_id: string; ride_id: string | null;
        entry_type: string; amount: number; currency_code: string; description: string | null;
        occurred_at: string; created_at: string;
      }>;
      payout_ledger: Table<{
        id: string; site_id: string; driver_id: string; status: string; amount: number;
        currency_code: string; period_start: string; period_end: string;
        provider_reference: string | null; approved_by: string | null; approved_at: string | null;
        paid_at: string | null; created_at: string; updated_at: string;
      }>;
      notifications: Table<{
        id: string; site_id: string; recipient_id: string; channel: string; status: string;
        template_key: string | null; subject: string | null; body: string;
        provider_reference: string | null; deduplication_key: string | null;
        scheduled_at: string | null; sent_at: string | null; failed_at: string | null;
        failure_reason: string | null; created_at: string;
      }>;
      site_settings: Table<Row>;
      seo_settings: Table<Row>;
      email_settings: Table<Row>;
      email_templates: Table<Row>;
      automated_responses: Table<Row>;
      email_outbox: Table<Row>;
      email_delivery_events: Table<Row>;
      impersonation_grants: Table<Row>;
      audit_log: Table<Row>;
    };
    Views: Record<never, never>;
    Functions: {
      current_platform_role: { Args: Record<never, never>; Returns: PlatformRole };
      is_site_admin: { Args: { target_site_id: string }; Returns: boolean };
      is_site_member: { Args: { target_site_id: string }; Returns: boolean };
      is_superadmin: { Args: Record<never, never>; Returns: boolean };
    };
    Enums: {
      platform_role: PlatformRole;
      membership_status: MembershipStatus;
      driver_review_status: DriverReviewStatus;
      verification_status: VerificationStatus;
      ride_status: RideStatus;
      payment_reference_status: PaymentReferenceStatus;
    };
    CompositeTypes: Record<never, never>;
  };
};
