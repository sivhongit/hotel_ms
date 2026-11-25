import { useEffect, useState, type FormEvent } from 'react';
import api from '../services/api';
import type { BedItem, BookingItem, BookingStatus, GuestItem } from '../types/hostel';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [guests, setGuests] = useState<GuestItem[]>([]);
  const [beds, setBeds] = useState<BedItem[]>([]);

  const [guestId, setGuestId] = useState<string>('');
  const [bedId, setBedId] = useState<string>('');
  const [checkIn, setCheckIn] = useState<string>('2026-11-23');
  const [checkOut, setCheckOut] = useState<string>('2026-11-25');

  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const [bookingsRes, guestsRes, bedsRes] = await Promise.all([
        api.get<BookingItem[]>('/bookings'),
        api.get<GuestItem[]>('/guests'),
        api.get<BedItem[]>('/dashboard/beds'),
      ]);
      setBookings(bookingsRes.data);
      setGuests(guestsRes.data);
      setBeds(bedsRes.data);

      if (guestsRes.data.length > 0 && !guestId) {
        setGuestId(String(guestsRes.data[0].id));
      }
      const firstAvailable = bedsRes.data.find((b) => b.status === 'AVAILABLE') || bedsRes.data[0];
      if (firstAvailable && !bedId) {
        setBedId(String(firstAvailable.id));
      }
    } catch {
      setError('Failed to load bookings data.');
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSubmitting(true);
    try {
      await api.post('/bookings', {
        guestId: Number(guestId),
        bedId: Number(bedId),
        checkIn,
        checkOut,
      });
      setMessage('Booking created.');
      await loadData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message || 'Could not create booking (check for date overlap or bed status).';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: number, status: BookingStatus) => {
    setMessage('');
    setError('');
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      setMessage(`Booking #${id} updated to ${status}.`);
      await loadData();
    } catch {
      setError(`Failed to update booking #${id} status.`);
    }
  };

  const statusStyles: Record<BookingStatus, string> = {
    CONFIRMED: 'bg-primary/15 text-primary border-primary/30',
    CHECKED_IN: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
    CHECKED_OUT: 'bg-muted text-muted-foreground border-border',
    CANCELED: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Bookings</h2>
        <p className="text-sm text-muted-foreground">Allocate beds safely and manage check-ins or check-outs</p>
      </div>

      {message && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-600 dark:text-emerald-300">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-300">
          {error}
        </div>
      )}

      <form
        onSubmit={handleCreate}
        className="rounded-xl border border-border bg-card p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end shadow-sm"
      >
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Guest</label>
          <select
            value={guestId}
            onChange={(e) => setGuestId(e.target.value)}
            required
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
          >
            {guests.map((g) => (
              <option key={g.id} value={g.id}>
                {g.firstName} {g.lastName} ({g.idNumber})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Bed</label>
          <select
            value={bedId}
            onChange={(e) => setBedId(e.target.value)}
            required
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
          >
            {beds.map((b) => (
              <option key={b.id} value={b.id}>
                Rm {b.roomNumber} · {b.bedLabel} ({b.status})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Check-In</label>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            required
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Check-Out</label>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            required
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-medium px-4 py-2 text-sm transition cursor-pointer"
        >
          {submitting ? 'Saving...' : 'Create Booking'}
        </button>
      </form>

      <div className="rounded-xl border border-border bg-card overflow-x-auto shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Guest</th>
              <th className="px-4 py-3">Room / Bed</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {bookings.map((bk) => (
              <tr key={bk.id} className="hover:bg-accent/50">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{bk.id}</td>
                <td className="px-4 py-3 font-medium text-foreground">{bk.guestName}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  Rm {bk.roomNumber} · {bk.bedLabel}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {bk.checkIn.slice(0, 10)} → {bk.checkOut.slice(0, 10)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      statusStyles[bk.status] || ''
                    }`}
                  >
                    {bk.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  {bk.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleStatusChange(bk.id, 'CHECKED_IN')}
                      className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-xs text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/25 cursor-pointer"
                    >
                      Check In
                    </button>
                  )}
                  {bk.status === 'CHECKED_IN' && (
                    <button
                      onClick={() => handleStatusChange(bk.id, 'CHECKED_OUT')}
                      className="rounded-md bg-primary/15 border border-primary/30 px-2.5 py-1 text-xs text-primary hover:bg-primary/25 cursor-pointer"
                    >
                      Check Out
                    </button>
                  )}
                  {(bk.status === 'CONFIRMED' || bk.status === 'CHECKED_IN') && (
                    <button
                      onClick={() => handleStatusChange(bk.id, 'CANCELED')}
                      className="rounded-md bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 text-xs text-rose-600 dark:text-rose-300 hover:bg-rose-500/25 cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}