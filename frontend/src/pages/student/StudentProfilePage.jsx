import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Camera, FileText, Save, Trash2, Upload } from 'lucide-react';
import { profileApi } from '../../api/endpoints';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import PageHeader from '../../components/PageHeader';
import Avatar from '../../components/Avatar';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Field, FormActions, FormGrid, TagInput, TextArea, TextInput } from '../../components/FormField';

/** Student profile editor: academic details, skills, interests and resume. */
export default function StudentProfilePage() {
  useDocumentTitle('My profile');
  const { user, profile, refresh } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);
  const resumeRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [confirmPhoto, setConfirmPhoto] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      university: '',
      department: '',
      degree: '',
      course: '',
      currentSemester: '',
      graduationYear: '',
      skills: [],
      interests: [],
      biography: '',
      location: '',
    },
  });

  useEffect(() => {
    reset({
      name: user?.name || '',
      phone: user?.phone || '',
      university: profile?.university || '',
      department: profile?.department || '',
      degree: profile?.degree || '',
      course: profile?.course || '',
      currentSemester: profile?.currentSemester ?? '',
      graduationYear: profile?.graduationYear ?? '',
      skills: profile?.skills || [],
      interests: profile?.interests || [],
      biography: profile?.biography || '',
      location: profile?.location || '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile]);

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      const payload = {
        name: values.name,
        phone: values.phone || '',
        university: values.university || '',
        department: values.department || '',
        degree: values.degree || '',
        course: values.course || '',
        currentSemester: values.currentSemester === '' ? null : Number(values.currentSemester),
        graduationYear: values.graduationYear === '' ? null : Number(values.graduationYear),
        skills: values.skills,
        interests: values.interests,
        biography: values.biography || '',
        location: values.location || '',
      };
      await profileApi.updateMe(payload);
      await refresh();
      toast.success('Profile saved.');
    } catch (error) {
      toast.error(error.friendlyMessage || 'Unable to save your profile.');
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

  const onResumeChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingResume(true);
    try {
      await profileApi.uploadResume(file);
      await refresh();
      toast.success('Resume uploaded.');
    } catch (error) {
      toast.error(error.friendlyMessage || 'Unable to upload the resume.');
    } finally {
      setUploadingResume(false);
      if (resumeRef.current) resumeRef.current.value = '';
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
      <PageHeader title="My profile" description="Keep your academic details up to date so alumni can help you better." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <form className="card p-6" onSubmit={handleSubmit(onSubmit)}>
            <h2 className="text-base font-semibold text-navy-900">Basic details</h2>
            <div className="mt-5 space-y-4">
              <FormGrid>
                <Field label="Full name" htmlFor="name" required error={errors.name}>
                  <TextInput id="name" error={errors.name} {...register('name', { required: 'Name is required.' })} />
                </Field>
                <Field label="Phone" htmlFor="phone" error={errors.phone}>
                  <TextInput id="phone" placeholder="Optional" error={errors.phone} {...register('phone')} />
                </Field>
              </FormGrid>

              <h2 className="pt-2 text-base font-semibold text-navy-900">Academic details</h2>
              <FormGrid>
                <Field label="University" htmlFor="university" error={errors.university}>
                  <TextInput id="university" error={errors.university} {...register('university')} />
                </Field>
                <Field label="Department" htmlFor="department" error={errors.department}>
                  <TextInput id="department" error={errors.department} {...register('department')} />
                </Field>
                <Field label="Degree" htmlFor="degree" error={errors.degree}>
                  <TextInput id="degree" placeholder="e.g. B.Tech" error={errors.degree} {...register('degree')} />
                </Field>
                <Field label="Course" htmlFor="course" error={errors.course}>
                  <TextInput id="course" error={errors.course} {...register('course')} />
                </Field>
                <Field label="Current semester" htmlFor="currentSemester" error={errors.currentSemester}>
                  <TextInput
                    id="currentSemester"
                    type="number"
                    min={1}
                    max={16}
                    error={errors.currentSemester}
                    {...register('currentSemester', { min: { value: 1, message: 'Minimum is 1.' }, max: { value: 16, message: 'Maximum is 16.' } })}
                  />
                </Field>
                <Field label="Graduation year" htmlFor="graduationYear" error={errors.graduationYear}>
                  <TextInput
                    id="graduationYear"
                    type="number"
                    min={1950}
                    max={2100}
                    error={errors.graduationYear}
                    {...register('graduationYear', {
                      min: { value: 1950, message: 'Minimum is 1950.' },
                      max: { value: 2100, message: 'Maximum is 2100.' },
                    })}
                  />
                </Field>
              </FormGrid>

              <Field label="Skills" htmlFor="skills" hint="Press Enter or use a comma to add a skill.">
                <Controller
                  name="skills"
                  control={control}
                  render={({ field }) => <TagInput id="skills" value={field.value} onChange={field.onChange} placeholder="e.g. React" />}
                />
              </Field>
              <Field label="Interests" htmlFor="interests" error={errors.interests}>
                <Controller
                  name="interests"
                  control={control}
                  render={({ field }) => (
                    <TagInput id="interests" value={field.value} onChange={field.onChange} placeholder="e.g. Machine Learning" />
                  )}
                />
              </Field>

              <Field label="About me" htmlFor="biography" error={errors.biography}>
                <TextArea id="biography" rows={5} error={errors.biography} {...register('biography')} />
              </Field>
              <Field label="Location" htmlFor="location" error={errors.location}>
                <TextInput id="location" placeholder="City, Country" error={errors.location} {...register('location')} />
              </Field>
            </div>

            <FormActions>
              <button type="submit" className="btn-primary" disabled={saving || !isDirty}>
                <Save className="h-4 w-4" aria-hidden="true" />
                {saving ? 'Saving...' : 'Save profile'}
              </button>
            </FormActions>
          </form>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
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

          <div className="card p-6">
            <h2 className="text-base font-semibold text-navy-900">Resume</h2>
            <p className="mt-2 text-sm text-navy-500">
              Upload a resume to apply for jobs in one click.
            </p>
            {profile?.resume ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-navy-700">
                <FileText className="h-4 w-4 text-navy-400" aria-hidden="true" />
                <a href={profile.resume} target="_blank" rel="noreferrer" className="link">
                  View current resume
                </a>
              </p>
            ) : (
              <p className="mt-3 text-sm text-navy-400">No resume uploaded yet.</p>
            )}
            <input ref={resumeRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={onResumeChange} />
            <button
              type="button"
              className="btn-secondary btn-sm mt-3"
              onClick={() => resumeRef.current?.click()}
              disabled={uploadingResume}
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              {uploadingResume ? 'Uploading...' : profile?.resume ? 'Replace resume' : 'Upload resume'}
            </button>
            <p className="mt-2 text-xs text-navy-400">PDF or Word document. Maximum 5 MB.</p>
          </div>
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
