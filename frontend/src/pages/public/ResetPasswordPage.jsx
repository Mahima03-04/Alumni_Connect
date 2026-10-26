import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ShieldCheck } from 'lucide-react';
import { authApi } from '../../api/endpoints';
import { useToast } from '../../hooks/useToast';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { Field, TextInput } from '../../components/FormField';

/** Complete a password reset using the token from the previous step. */
export default function ResetPasswordPage() {
  useDocumentTitle('Set a new password');
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const toast = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: { token, password: '', confirmPassword: '' } });

  const password = watch('password');

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      await authApi.resetPassword({ token: values.token, password: values.password });
      toast.success('Password updated. Please sign in.');
      navigate('/login', { replace: true, state: { message: 'Your password was updated. You can now sign in.' } });
    } catch (error) {
      toast.error(error.friendlyMessage || 'Unable to reset your password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-700">
        <ShieldCheck className="h-5 w-5" aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-xl font-bold text-navy-900">Set a new password</h1>
      <p className="mt-1 text-sm text-navy-500">Choose a strong password you have not used before.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field label="Reset token" htmlFor="token" required error={errors.token}>
          <TextInput
            id="token"
            placeholder="Paste your reset token"
            error={errors.token}
            {...register('token', { required: 'A reset token is required.' })}
          />
        </Field>

        <Field
          label="New password"
          htmlFor="password"
          required
          error={errors.password}
          hint="At least 8 characters, including a letter and a number."
        >
          <TextInput
            id="password"
            type="password"
            autoComplete="new-password"
            error={errors.password}
            {...register('password', {
              required: 'Password is required.',
              minLength: { value: 8, message: 'Password must be at least 8 characters.' },
              validate: {
                hasLetter: (v) => /[A-Za-z]/.test(v) || 'Include at least one letter.',
                hasNumber: (v) => /\d/.test(v) || 'Include at least one number.',
              },
            })}
          />
        </Field>

        <Field label="Confirm new password" htmlFor="confirmPassword" required error={errors.confirmPassword}>
          <TextInput
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword}
            {...register('confirmPassword', {
              required: 'Please confirm your password.',
              validate: (value) => value === password || 'Passwords do not match.',
            })}
          />
        </Field>

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Updating...' : 'Update password'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-navy-500">
        <Link to="/login" className="link">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
