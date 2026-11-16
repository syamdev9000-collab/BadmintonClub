/**
 * TypeScript types mirroring the backend's Pydantic schemas.
 *
 * Kept hand-written (not generated) for this scaffold — if the API
 * surface grows a lot, consider generating these from
 * GET /openapi.json instead of maintaining them by hand.
 */

export type MemberRole = "admin" | "member";

export interface Member {
  id: number;
  name: string;
  mobile_number: string;
  email: string | null;
  role: MemberRole;
  registration_date: string;
  deposit_balance: string;
  is_active: boolean;
}

export interface DepositInfo {
  deposit_balance: string;
  minimum_required: string;
  is_below_minimum: boolean;
}

export interface Court {
  id: number;
  name: string;
  location: string;
  price_per_hour: string;
  available_timings: string | null;
  contact_number: string | null;
  is_active: boolean;
}

export interface PlayingSession {
  id: number;
  court: Court;
  session_date: string;
  start_time: string;
  end_time: string;
  participant_member_ids: number[];
}

export type ExpenseShareStatus = "pending" | "partial" | "paid";

export interface ExpenseShare {
  id: number;
  member_id: number;
  amount_due: string;
  amount_paid: string;
  status: ExpenseShareStatus;
}

export interface Expense {
  id: number;
  description: string;
  total_amount: string;
  session_id: number | null;
  created_at: string;
  shares: ExpenseShare[];
}

export type TransactionType = "deposit" | "expense_payment" | "refund";
export type TransactionStatus = "pending" | "success" | "failed";
export type PaymentProvider = "phonepe" | "upi_manual" | "cash";

export interface Transaction {
  id: number;
  member_id: number;
  type: TransactionType;
  amount: string;
  status: TransactionStatus;
  provider: PaymentProvider;
  expense_share_id: number | null;
  provider_reference: string | null;
  created_at: string;
}

export type NotificationType =
  | "expense_added"
  | "payment_reminder"
  | "low_deposit"
  | "schedule_update"
  | "general";

export interface ClubNotification {
  id: number;
  member_id: number | null;
  type: NotificationType;
  message: string;
  is_read: boolean;
  created_at: string;
}
