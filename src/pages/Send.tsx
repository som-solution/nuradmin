import { useCallback, useEffect, useState } from 'react';
import {
  api,
  type CreatePaymentRequest,
  type CreatePaymentResponse,
  type QuoteResponse,
  type Recipient,
} from '../lib/api';
import type { ApiError } from '../lib/api';

type Step = 'amount' | 'quote' | 'recipient' | 'pay';

export default function Send() {
  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('GBP');
  const [destinationCurrency, setDestinationCurrency] = useState('KES');
  const [destinationCountry, setDestinationCountry] = useState('KE');
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [paymentResult, setPaymentResult] = useState<CreatePaymentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecipients = useCallback(async () => {
    try {
      const data = await api.get<Recipient[]>('/recipients');
      setRecipients(Array.isArray(data) ? data : []);
    } catch {
      setRecipients([]);
    }
  }, []);

  useEffect(() => {
    if (step === 'recipient' || step === 'pay') loadRecipients();
  }, [step, loadRecipients]);

  const getQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const q: QuoteResponse = await api.post('/send/quote', {
        amount,
        currency,
        destinationCurrency,
        destinationCountry,
      });
      setQuote(q);
      setStep('quote');
    } catch (err) {
      setError((err as ApiError).message ?? 'Failed to get quote');
    } finally {
      setLoading(false);
    }
  };

  const chooseRecipient = () => {
    setStep('recipient');
    setSelectedRecipientId('');
    setPaymentResult(null);
  };

  const createPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote?.quoteId || !selectedRecipientId) return;
    setError(null);
    setLoading(true);
    try {
      const body: CreatePaymentRequest = {
        quoteId: quote.quoteId,
        recipientId: selectedRecipientId,
        idempotencyKey: `send-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        successUrl: `${window.location.origin}/transactions`,
        cancelUrl: `${window.location.origin}/send`,
      };
      const res: CreatePaymentResponse = await api.post('/send/create-payment', body);
      setPaymentResult(res);
      if (res.redirectUrl) {
        window.location.href = res.redirectUrl;
        return;
      }
      if (res.clientSecret) {
        setStep('pay');
      } else {
        setStep('pay');
      }
    } catch (err) {
      setError((err as ApiError).message ?? 'Failed to create payment');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('amount');
    setQuote(null);
    setSelectedRecipientId('');
    setPaymentResult(null);
    setError(null);
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Send money</h1>
      <p className="mb-6 text-slate-600">
        UK → East Africa. Get a quote, choose a recipient, then pay with card or Google Pay (Stripe).
      </p>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {step === 'amount' && (
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">Amount & destination</h2>
          <form onSubmit={getQuote} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Amount</label>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Source currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="GBP">GBP</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Destination currency
              </label>
              <select
                value={destinationCurrency}
                onChange={(e) => setDestinationCurrency(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="KES">KES</option>
                <option value="UGX">UGX</option>
                <option value="TZS">TZS</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Destination country</label>
              <select
                value={destinationCountry}
                onChange={(e) => setDestinationCountry(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="KE">Kenya</option>
                <option value="UG">Uganda</option>
                <option value="TZ">Tanzania</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-teal-600 px-4 py-3 font-medium text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {loading ? 'Getting quote…' : 'Get quote'}
            </button>
          </form>
        </div>
      )}

      {step === 'quote' && quote && (
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">Quote</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-600">You send</dt>
              <dd className="font-medium">
                {quote.sourceAmount} {quote.sourceCurrency}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Recipient gets</dt>
              <dd className="font-medium">
                {quote.destinationAmount} {quote.destinationCurrency}
              </dd>
            </div>
            {quote.fee != null && (
              <div className="flex justify-between">
                <dt className="text-slate-600">Fee</dt>
                <dd className="font-medium">{quote.fee} {quote.sourceCurrency}</dd>
              </div>
            )}
          </dl>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={chooseRecipient}
              className="flex-1 rounded-lg bg-teal-600 px-4 py-3 font-medium text-white hover:bg-teal-700"
            >
              Choose recipient
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {step === 'recipient' && (
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">Choose recipient</h2>
          {recipients.length === 0 ? (
            <p className="text-slate-600">
              No recipients. Add one from the{' '}
              <a href="/recipients" className="text-teal-600 hover:underline">
                Recipients
              </a>{' '}
              page.
            </p>
          ) : (
            <form onSubmit={createPayment} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Recipient</label>
                <select
                  value={selectedRecipientId}
                  onChange={(e) => setSelectedRecipientId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="">Select…</option>
                  {recipients.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} — {r.accountNumber} ({r.currency})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading || !selectedRecipientId}
                  className="flex-1 rounded-lg bg-teal-600 px-4 py-3 font-medium text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  {loading ? 'Creating…' : 'Pay with card'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('quote')}
                  className="rounded-lg border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {step === 'pay' && paymentResult && (
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">Payment</h2>
          {paymentResult.redirectUrl ? (
            <p className="text-slate-600">
              Redirecting to payment…{' '}
              <a href={paymentResult.redirectUrl} className="text-teal-600 hover:underline">
                Click here if not redirected
              </a>
            </p>
          ) : (
            <>
              <p className="text-slate-600">
                Transaction ID: <span className="font-mono text-slate-900">{paymentResult.transactionId}</span>
              </p>
              {paymentResult.clientSecret && (
                <p className="mt-2 text-sm text-slate-600">
                  Use the clientSecret with Stripe.js to confirm the payment on your backend.
                </p>
              )}
            </>
          )}
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
          >
            New transfer
          </button>
        </div>
      )}
    </div>
  );
}
