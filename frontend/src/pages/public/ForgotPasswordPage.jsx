import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { KeyRound } from 'lucide-react';
import { authApi } from '../../api/endpoints';
import { useToast } from '../../hooks/useToast';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { Field, TextInput } from '../../components/FormField';

/**
 * Request a password reset. In this local environment no email is sent; the
 * backend returns a development token which is displayed so the flow can be
 * completed end to end.
 */
export default function ForgotPasswordPage() {
  useDocumentTitle('Forgot password');
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { email: '' } });

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const res = await authApi.forgotPassword(values);
      const devToken = res.data?.data?.devResetToken || null;
      setResult({ message: res.data?.message || 'If an account exists, a reset link was generated.', devToken });
      toast.success('Reset instructions generated.');
    } catch (error) {
      toast.error(error.friendlyMessage || 'Unable to process your request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-royal-50 text-royal-600">
        <KeyRound className="h-5 w-5" aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-xl font-bold text-navy-900">Reset your password</h1>
      <p className="mt-1 text-sm text-navy-500">Enter your account email and we will generate a reset token.</p>

      {result ? (
        <div className="mt-6 space-y-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{result.message}</div>
          {result.devToken ? (
            <div className="rounded-xl border border-navy-200 bg-surface-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">Development reset token</p>
              <code className="mt-1 block break-all rounded-lg bg-white px-2 py-1.5 text-xs text-navy-800">{result.devToken}</code>
              <Link to={`/reset-password?token=${encodeURIComponent(result.devToken)}`} className="btn-primary btn-sm mt-3">
                Continue to reset
              </Link>
            </div>
          ) : null}
        </div>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Field label="Email address" htmlFor="email" required error={errors.email}>
            <TextInput
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              error={errors.email}
              {...register('email', {
                required: 'Email is required.',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address.' },
              })}
            />
          </Field>
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Generating...' : 'Generate reset token'}
          </button>
        </form>
      )}

      <p className="mt-5 text-center text-sm text-navy-500">
        Remembered it?{' '}
        <Link to="/login" className="link">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
