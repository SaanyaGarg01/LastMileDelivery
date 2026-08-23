import React from 'react';
import { 
  Package, 
  UserCheck, 
  Truck, 
  Navigation, 
  CheckCircle2, 
  AlertTriangle, 
  CalendarClock, 
  Clock 
} from 'lucide-react';

export const STATUS_CONFIG = {
  CREATED: {
    label: 'Created',
    bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    icon: Package,
  },
  ASSIGNED: {
    label: 'Agent Assigned',
    bg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    icon: UserCheck,
  },
  PICKED_UP: {
    label: 'Picked Up',
    bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
    icon: Package,
  },
  IN_TRANSIT: {
    label: 'In Transit',
    bg: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
    icon: Truck,
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for Delivery',
    bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    icon: Navigation,
  },
  DELIVERED: {
    label: 'Delivered',
    bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    icon: CheckCircle2,
  },
  FAILED: {
    label: 'Delivery Failed',
    bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    icon: AlertTriangle,
  },
  RESCHEDULED: {
    label: 'Rescheduled',
    bg: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    icon: CalendarClock,
  },
};

export default function StatusBadge({ status, className = '' }) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    bg: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
    icon: Clock,
  };

  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${config.bg} ${className}`}
    >
      <IconComponent className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </span>
  );
}
