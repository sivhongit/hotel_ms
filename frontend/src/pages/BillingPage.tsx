import { useEffect, useState, type FormEvent } from 'react';
import api from '../services/api';
import type { InvoiceItem } from '../types/hostel';

export default function BillingPage() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');

  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadInvoices = async () => {
    try {
      const { data } = await api.get<InvoiceItem[]>('/invoices');
      setInvoices(data);
      if (data.length > 0) {
        setSelectedId((prev) => prev || String(data[0].id));
      }
    } catch {
      setError('Failed to load invoices.');
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await api.get<InvoiceItem[]>('/invoices');
        if (active) {
          setInvoices(data);
          if (data.length > 0) {
            setSelectedId((prev) => prev || String(data[0].id));
          }
        }
      } catch {
        if (active) setError('Failed to load invoices.');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handlePay = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSubmitting(true);
    try {
      await api.patch(`/invoices/${Number(selectedId)}/pay`, {
        amount: Number(amount),
        paymentMethod,
      });
      setAmount('');
      setMessage(`Payment recorded for invoice #${selectedId}.`);
      await loadInvoices();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message || 'Could not record payment.';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const statusStyles: Record<string, string> = {
    UNPAID: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30',
    PARTIAL: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30',
    PAID: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Billing & Invoices</h2>
        <p className="text-sm text-muted-foreground">Track room/service charges and record partial or full payments</p>
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
        onSubmit={handlePay}
        className="rounded-xl border border-border bg-card p-5 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end shadow-sm"
      >
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Invoice</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            required
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
          >
            {invoices.map((inv) => (
              <option key={inv.id} value={inv.id}>
                #{inv.id} · {inv.guestName} ({inv.paymentStatus})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Amount ($)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Payment Method</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="CASH">CASH</option>
            <option value="CARD">CARD</option>
            <option value="BANK_TRANSFER">BANK_TRANSFER</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-medium px-4 py-2 text-sm transition cursor-pointer"
        >
          {submitting ? 'Recording...' : 'Record Payment'}
        </button>
      </form>

      <div className="rounded-xl border border-border bg-card overflow-x-auto shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Guest</th>
              <th className="px-4 py-3">Room / Bed</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Paid</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-accent/50">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{inv.id}</td>
                <td className="px-4 py-3 font-medium text-foreground">{inv.guestName}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  Rm {inv.roomNumber} · {inv.bedLabel}
                </td>
                <td className="px-4 py-3 text-foreground">${inv.totalAmount}</td>
                <td className="px-4 py-3 text-emerald-600 dark:text-emerald-300">${inv.paidAmount}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs ${statusStyles[inv.paymentStatus] || ''}`}
                  >
                    {inv.paymentStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}