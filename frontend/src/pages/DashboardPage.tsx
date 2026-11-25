import { useEffect, useState } from 'react';
import api from '../services/api';
import type { DashboardStats, BedItem } from '../types/hostel';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [beds, setBeds] = useState<BedItem[]>([]);

  useEffect(() => {
    Promise.all([api.get<DashboardStats>('/dashboard/stats'), api.get<BedItem[]>('/dashboard/beds')])
      .then(([statsRes, bedsRes]) => {
        setStats(statsRes.data);
        setBeds(bedsRes.data);
      })
      .catch(() => {});
  }, []);

  const cards = [
    { label: 'Total Beds', value: stats?.totalBeds ?? 0 },
    { label: 'Available Beds', value: stats?.availableBeds ?? 0 },
    { label: 'Occupied Beds', value: stats?.occupiedBeds ?? 0 },
    { label: 'Active Bookings', value: stats?.activeBookings ?? 0 },
    { label: 'Total Collected ($)', value: stats?.totalCollected ?? '0.00' },
  ];

  const badgeStyle: Record<string, string> = {
    AVAILABLE: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
    OCCUPIED: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30',
    MAINTENANCE: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Overview</h2>
        <p className="text-sm text-muted-foreground">Live bed occupancy, active stays, and collected revenue</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="mt-1.5 text-2xl font-semibold text-card-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-base font-medium text-card-foreground mb-4">Bed Status Grid</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {beds.map((bed) => (
            <div
              key={bed.id}
              className="rounded-lg border border-border bg-background p-3 flex flex-col justify-between gap-2"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  Room {bed.roomNumber} · {bed.bedLabel}
                </p>
                <p className="text-xs text-muted-foreground">
                  {bed.roomTypeName} · ${bed.pricePerNight}/night
                </p>
              </div>
              <span
                className={`self-start rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                  badgeStyle[bed.status] || ''
                }`}
              >
                {bed.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}