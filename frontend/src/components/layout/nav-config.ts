import {
  LayoutDashboard,
  Users,
  Wallet,
  CreditCard,
  Receipt,
  MapPin,
  CalendarClock,
  BarChart3,
  Bell,
  Settings,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Shown in the mobile bottom bar (keep this list short). */
  showInBottomNav?: boolean;
}

export const ADMIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, showInBottomNav: true },
  { href: "/dashboard/members", label: "Members", icon: Users, showInBottomNav: true },
  { href: "/dashboard/deposits", label: "Deposits & Wallet", icon: Wallet },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard, showInBottomNav: true },
  { href: "/dashboard/expenses", label: "Expenses", icon: Receipt },
  { href: "/dashboard/courts", label: "Court Management", icon: MapPin },
  { href: "/dashboard/sessions", label: "Playing Sessions", icon: CalendarClock, showInBottomNav: true },
  { href: "/dashboard/reports", label: "Reports & Analytics", icon: BarChart3 },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export const MEMBER_NAV: NavItem[] = [
  { href: "/member", label: "Overview", icon: LayoutDashboard, showInBottomNav: true },
  { href: "/member/wallet", label: "Wallet", icon: Wallet, showInBottomNav: true },
  { href: "/member/expenses", label: "My Payments", icon: Receipt, showInBottomNav: true },
  { href: "/member/sessions", label: "Schedules", icon: CalendarClock, showInBottomNav: true },
  { href: "/member/notifications", label: "Notifications", icon: Bell },
  { href: "/member/settings", label: "Settings", icon: Settings },
];
