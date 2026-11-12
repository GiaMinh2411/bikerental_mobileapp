export type Station = {
  id: number;
  name: string;
  address: string;
  image_path: string;
  _count?: { bikes: number };
};
export type Bike = {
  id: number;
  station_id: number;
  price_per_hour: number;
  status: string;
  station: Station;
  model?: Model;
};
export type Model = {
  id: number;
  name: string;
  description: string;
  specifications: string;
  type: { id: number; name: string };
  images: { path: string; alt_text: string }[];
  bikes: Bike[];
  matched_rate?: number;
  min_price?: number;
  rating_average?: number | null;
  review_count?: number;
  demo_review_count?: number;
};
export type User = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role?: "USER" | "ADMIN";
};
export type Rental = {
  id: number;
  status: string;
  payment_status: string;
  planned_start_at: string;
  planned_end_at: string;
  actual_start_at: string | null;
  actual_end_at: string | null;
  hourly_rate: number;
  estimated_total: number;
  final_total: number | null;
  estimated_subtotal?: number;
  estimated_discount?: number;
  final_subtotal?: number | null;
  final_discount?: number | null;
  coupon_code?: string | null;
  review?: {
    id: number;
    rating: number;
    content: string;
    created_at: string;
  } | null;
  events?: { id: number; kind: string; note: string; created_at: string }[];
  bike: Bike & { model: Model };
  pickup: Station;
};
export type Booking = {
  model_id: number;
  station_id: number;
  start: string;
  end: string;
  coupon_code?: string;
  request_key?: string;
};
export type PageData<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
};
