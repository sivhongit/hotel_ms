import { useEffect, useState, type FormEvent } from 'react';
import api from '../services/api';
import type { GuestItem } from '../types/hostel';

export default function GuestsPage() {
  const [guests, setGuests] = useState<GuestItem[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadGuests = async () => {
    try {
      const { data } = await api.get<GuestItem[]>('/guests');
      setGuests(data);
    } catch {
      setError('Failed to load guests.');
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await api.get<GuestItem[]>('/guests');
        if (active) setGuests(data);
      } catch {
        if (active) setError('Failed to load guests.');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setIdNumber('');
    setEmergencyContact('');
  };

  const handleStartEdit = (g: GuestItem) => {
    setEditingId(g.id);
    setFirstName(g.firstName);
    setLastName(g.lastName);
    setEmail(g.email || '');
    setPhone(g.phone);
    setIdNumber(g.idNumber);
    setEmergencyContact(g.emergencyContact || '');
    setMessage('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        firstName,
        lastName,
        email: email || undefined,
        phone,
        idNumber,
        emergencyContact: emergencyContact || undefined,
      };

      if (editingId !== null) {
        await api.put(`/guests/${editingId}`, payload);
        setMessage(`Guest #${editingId} updated successfully.`);
      } else {
        await api.post('/guests', payload);
        setMessage('Guest profile created.');
      }

      resetForm();
      await loadGuests();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message || 'Could not save guest.';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Guests</h2>
        <p className="text-sm text-muted-foreground">Register travelers, manage ID/contact details, and update profiles</p>
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
        onSubmit={handleSubmit}
        className="rounded-xl border border-border bg-card p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end shadow-sm"
      >
        <div>
          <label className="block text-xs text-muted-foreground mb-1">First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Last Name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Passport / ID Number</label>
          <input
            type="text"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            required
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Phone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Email (optional)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Emergency Contact (optional)</label>
          <input
            type="text"
            value={emergencyContact}
            onChange={(e) => setEmergencyContact(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-3 flex items-center justify-end gap-3">
          {editingId !== null && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-border bg-background hover:bg-accent text-foreground font-medium px-4 py-2 text-sm transition cursor-pointer"
            >
              Cancel Edit
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-medium px-4 py-2 text-sm transition cursor-pointer"
          >
            {submitting ? 'Saving...' : editingId !== null ? 'Update Guest' : 'Add Guest'}
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-border bg-card overflow-x-auto shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">ID / Passport</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {guests.map((g) => (
              <tr key={g.id} className="hover:bg-accent/50">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{g.id}</td>
                <td className="px-4 py-3 font-medium text-foreground">
                  {g.firstName} {g.lastName}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{g.idNumber}</td>
                <td className="px-4 py-3 text-muted-foreground">{g.phone}</td>
                <td className="px-4 py-3 text-muted-foreground">{g.email || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleStartEdit(g)}
                    className="rounded-md bg-primary/15 border border-primary/30 px-2.5 py-1 text-xs text-primary hover:bg-primary/25 cursor-pointer font-medium"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}