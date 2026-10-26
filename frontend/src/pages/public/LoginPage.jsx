import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { LogIn, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { Field, TextInput } from '../../components/FormField';
import { ROLE_HOME } from '../../utils/constants';

const DEMO_ACCOUNTS = [
  { label: 'Administrator', email: 'admin@alumniconnect.example.com', password: 'AdminDemo@123' },
  { label: 'Approved alumni', email: 'alumni@alumniconnect.example.com', password: 'AlumniDemo@123' },
  { label: 'Student', email: 'student@alumniconnect.example.com', password: 'StudentDemo@123' },
  { label: 'Pending alumni', email: 'pending.alumni@alumniconnect.example.com', password: 'PendingDemo@123' },
];

/** Sign in page with quick demo account fill for local evaluation. */
export default function LoginPage() {
  useDocumentTitle('Sign in');
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    setError,
  } = useForm({ defaultValues: { email: '', password: '' } });

  const destination = location.state?.from?.pathname;

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const session = await login(values);
      toast.success(`Welcome back, ${session.user.name.split(' ')[0]}!`);
      const home = destination || ROLE_HOME[session.user.role] || '/';
      navigate(home, { replace: true });
    } catch (error) {
      const message = error.friendlyMessage || 'Unable to sign in. Please try again.';
      setError('root', { message });
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (account) => {
    setValue('email', account.email);
    setValue('password', account.password);
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-navy-900">Welcome back</h1>
      <p className="mt-1 text-sm text-navy-500">Sign in to your AlumniConnect account.</p>

      {location.state?.message ? (
        <div className="mt-4 rounded-xl border border-royal-200 bg-royal-50 p-3 text-sm text-royal-800">
          {location.state.message}
        </div>
      ) : null}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {errors.root ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errors.root.message}
          </div>
        ) : null}

        <Field label="Email address" htmlFor="email" required error={errors.email}>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" aria-hidden="true" />
            <TextInput
              id="email"
              type="email"
              autoComplete="email"
              className="pl-9"
              placeholder="you@example.com"
              error={errors.email}
              {...register('email', {
                required: 'Email is required.',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address.' },
              })}
            />
          </div>
        </Field>

        <Field label="Password" htmlFor="password" required error={errors.password}>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" aria-hidden="true" />
            <TextInput
              id="password"
              type="password"
              autoComplete="current-password"
              className="pl-9"
              placeholder="Your password"
              error={errors.password}
              {...register('password', { required: 'Password is required.' })}
            />
          </div>
        </Field>

        <div className="flex items-center justify-between">
          <Link to="/forgot-password" className="link text-sm">
            Forgot password?
          </Link>
        </div>

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          <LogIn className="h-4 w-4" aria-hidden="true" />
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-navy-500">
        New here?{' '}
        <Link to="/register" className="link">
          Create an account
        </Link>
      </p>

      <div className="mt-6 rounded-xl border border-navy-100 bg-surface-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">Demo accounts</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => fillDemo(account)}
              className="rounded-lg border border-navy-200 bg-white px-2.5 py-1.5 text-left text-xs font-medium text-navy-600 transition hover:border-royal-300 hover:text-navy-900"
            >
              {account.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-navy-400">
          Credentials shown are for the seeded demonstration database only.
        </p>
      </div>
    </div>
  );
}
