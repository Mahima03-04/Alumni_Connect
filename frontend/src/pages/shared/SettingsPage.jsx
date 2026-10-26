import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Camera, KeyRound, LogOut, Save, Trash2, UserCog } from 'lucide-react';
import { profileApi } from '../../api/endpoints';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { ROLE_LABELS, ROLE_HOME } from '../../utils/constants';
import { formatDate } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import Avatar from '../../components/Avatar';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Field, TextInput } from '../../components/FormField';

/** Account settings shared by every role. */
export default function SettingsPage() {
  useDocumentTitle('Settings');
  const { user, profile, role, refresh, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmPhoto, setConfirmPhoto] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({ defaultValues: { name: user?.name || '', phone: user?.phone || '' } });

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      const payload = { name: values.name, phone: values.phone || '' };
      await profileApi.updateMe(payload);
      await refresh();
      toast.success('Settings saved.');
    } catch (error) {
      toast.error(error.friendlyMessage || 'Unable to save your settings.');
    } finally {
      setSaving(false);
    }
  };

  const onPhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await profileApi.uploadPhoto(file);
      await refresh();
      toast.success('Profile photo updated.');
    } catch (error) {
      toast.error(error.friendlyMessage || 'Unable to upload the photo.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removePhoto = async () => {
    try {
      await profileApi.deletePhoto();
      await refresh();
      toast.success('Profile photo removed.');
    } catch (error) {
      toast.error(error.friendlyMessage || 'Unable to remove the photo.');
    } finally {
      setConfirmPhoto(false);
    }
  };

  return (
    <div>
      <PageHeader title="Settings" description="Manage your account details and preferences." icon={UserCog} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h2 className="text-base font-semibold text-navy-900">Profile details</h2>
            <form className="mt-5 space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" htmlFor="name" required error={errors.name}>
                  <TextInput
                    id="name"
                    error={errors.name}
                    {...register('name', { required: 'Name is required.', minLength: { value: 2, message: 'Name is too short.' } })}
                  />
                </Field>
                <Field label="Phone" htmlFor="phone" error={errors.phone}>
                  <TextInput id="phone" placeholder="Optional" error={errors.phone} {...register('phone')} />
                </Field>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="btn-primary" disabled={saving || !isDirty}>
                  <Save className="h-4 w-4" aria-hidden="true" />
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>

          <div className="card mt-6 p-6">
            <h2 className="text-base font-semibold text-navy-900">Profile photo</h2>
            <div className="mt-4 flex items-center gap-4">
              <Avatar src={user?.profilePhoto} name={user?.name} size="lg" />
              <div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn-secondary btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    <Camera className="h-4 w-4" aria-hidden="true" />
                    {uploading ? 'Uploading...' : 'Change photo'}
                  </button>
                  {user?.profilePhoto ? (
                    <button type="button" className="btn-ghost btn-sm text-red-600" onClick={() => setConfirmPhoto(true)}>
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Remove
                    </button>
                  ) : null}
                </div>
                <p className="mt-2 text-xs text-navy-400">JPG, PNG or WebP. Maximum 2 MB.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-base font-semibold text-navy-900">Account</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-navy-400">Email</dt>
                <dd className="truncate font-medium text-navy-800">{user?.email}</dd>
              </div>
              <div>
                <dt className="text-navy-400">Role</dt>
                <dd className="font-medium text-navy-800">{ROLE_LABELS[role] || role}</dd>
              </div>
              <div>
                <dt className="text-navy-400">Account status</dt>
                <dd className="mt-0.5">
                  <StatusBadge status={user?.accountStatus} />
                </dd>
              </div>
              {role === 'alumni' ? (
                <div>
                  <dt className="text-navy-400">Approval status</dt>
                  <dd className="mt-0.5">
                    <StatusBadge status={user?.approvalStatus} />
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-navy-400">Member since</dt>
                <dd className="font-medium text-navy-800">{formatDate(user?.createdAt)}</dd>
              </div>
            </dl>
          </div>

          <div className="card p-6">
            <h2 className="text-base font-semibold text-navy-900">Security</h2>
            <p className="mt-2 text-sm text-navy-500">Reset your password using a secure token.</p>
            <Link to="/forgot-password" className="btn-secondary btn-sm mt-3 w-full">
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              Change password
            </Link>
            <button
              type="button"
              className="btn-ghost btn-sm mt-2 w-full text-red-600 hover:bg-red-50"
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
            <Link to={ROLE_HOME[role] || '/'} className="mt-2 block text-center text-xs text-navy-400 hover:text-navy-700">
              Back to dashboard
            </Link>
          </div>

          {profile && role === 'alumni' && typeof profile.profileCompletion === 'number' ? (
            <div className="card p-6">
              <h2 className="text-base font-semibold text-navy-900">Profile completion</h2>
              <p className="mt-2 text-3xl font-bold text-navy-900">{profile.profileCompletion}%</p>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-navy-100">
                <div className="h-full rounded-full bg-accent-500" style={{ width: `${profile.profileCompletion}%` }} />
              </div>
              <Link to="/alumni/profile" className="link mt-3 inline-block text-sm">
                Complete your profile
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={confirmPhoto}
        title="Remove profile photo?"
        message="Your current photo will be permanently deleted."
        confirmLabel="Remove photo"
        onConfirm={removePhoto}
        onCancel={() => setConfirmPhoto(false)}
      />
    </div>
  );
}
