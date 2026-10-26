import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { Field, TextInput, Select } from '../../components/FormField';
import { ROLE_HOME } from '../../utils/constants';

/** Self service registration for students and alumni. */
export default function RegisterPage() {
  useDocumentTitle('Create an account');
  const { register: registerUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
  } = useForm({ defaultValues: { name: '', email: '', password: '', confirmPassword: '', role: 'student', phone: '' } });

  const password = watch('password');
  const role = watch('role');

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
        phone: values.phone || undefined,
      };
      const session = await registerUser(payload);
      if (values.role === 'alumni') {
        toast.info('Account created. Your alumni profile is pending administrator approval.');
      } else {
        toast.success('Account created. Welcome to AlumniConnect!');
      }
      navigate(ROLE_HOME[session.user.role] || '/', { replace: true });
    } catch (error) {
      const message = error.friendlyMessage || 'Unable to create your account.';
      setError('root', { message });
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-navy-900">Create your account</h1>
      <p className="mt-1 text-sm text-navy-500">Join the AlumniConnect community in a minute.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {errors.root ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errors.root.message}
          </div>
        ) : null}

        <Field label="Full name" htmlFor="name" required error={errors.name}>
          <TextInput
            id="name"
            autoComplete="name"
            placeholder="Your full name"
            error={errors.name}
            {...register('name', { required: 'Name is required.', minLength: { value: 2, message: 'Name is too short.' } })}
          />
        </Field>

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

        <Field label="I am a" htmlFor="role" required error={errors.role}>
          <Select id="role" error={errors.role} {...register('role', { required: true })}>
            <option value="student">Student</option>
            <option value="alumni">Alumni / graduate</option>
          </Select>
        </Field>

        {role === 'alumni' ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            Alumni accounts require administrator approval before you can post jobs or respond to mentorship requests.
            You can complete your profile while you wait.
          </p>
        ) : null}

        <Field label="Phone (optional)" htmlFor="phone" error={errors.phone}>
          <TextInput id="phone" autoComplete="tel" placeholder="+91 90000 00000" error={errors.phone} {...register('phone')} />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          required
          error={errors.password}
          hint="At least 8 characters, including a letter and a number."
        >
          <TextInput
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Create a password"
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

        <Field label="Confirm password" htmlFor="confirmPassword" required error={errors.confirmPassword}>
          <TextInput
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            error={errors.confirmPassword}
            {...register('confirmPassword', {
              required: 'Please confirm your password.',
              validate: (value) => value === password || 'Passwords do not match.',
            })}
          />
        </Field>

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-navy-500">
        Already have an account?{' '}
        <Link to="/login" className="link">
          Sign in
        </Link>
      </p>
    </div>
  );
}
