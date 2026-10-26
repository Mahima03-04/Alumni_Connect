import { useEffect, useRef, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Briefcase, Camera, Plus, Save, Trash2 } from 'lucide-react';
import { profileApi } from '../../api/endpoints';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import PageHeader from '../../components/PageHeader';
import Avatar from '../../components/Avatar';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Checkbox, Field, FormActions, FormGrid, TagInput, TextArea, TextInput } from '../../components/FormField';

const toDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

/** Alumni profile editor: professional details, experience and mentoring. */
export default function AlumniProfilePage() {
  useDocumentTitle('My profile');
  const { user, profile, refresh } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
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
      graduationYear: '',
      batch: '',
      currentCompany: '',
      jobTitle: '',
      skills: [],
      biography: '',
      linkedinUrl: '',
      location: '',
      openToMentorship: true,
      mentorshipAreas: [],
      workExperience: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
  control,
  name: 'workExperience',
});

  useEffect(() => {
    reset({
      name: user?.name || '',
      phone: user?.phone || '',
      university: profile?.university || '',
      department: profile?.department || '',
      degree: profile?.degree || '',
      course: profile?.course || '',
      graduationYear: profile?.graduationYear ?? '',
      batch: profile?.batch || '',
      currentCompany: profile?.currentCompany || '',
      jobTitle: profile?.jobTitle || '',
      skills: profile?.skills || [],
      biography: profile?.biography || '',
      linkedinUrl: profile?.linkedinUrl || '',
      location: profile?.location || '',
      openToMentorship: profile?.openToMentorship ?? true,
      mentorshipAreas: profile?.mentorshipAreas || [],
      workExperience: (profile?.workExperience || []).map((item) => ({
        company: item.company || '',
        title: item.title || '',
        from: item.from ? new Date(item.from).toISOString().slice(0, 10) : '',
        to: item.to ? new Date(item.to).toISOString().slice(0, 10) : '',
        current: Boolean(item.current),
        description: item.description || '',
      })),
    });
  }, [user, profile, reset]);

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
        graduationYear: values.graduationYear === '' ? null : Number(values.graduationYear),
        batch: values.batch || '',
        currentCompany: values.currentCompany || '',
        jobTitle: values.jobTitle || '',
        skills: values.skills,
        biography: values.biography || '',
        linkedinUrl: values.linkedinUrl || '',
        location: values.location || '',
        openToMentorship: Boolean(values.openToMentorship),
        mentorshipAreas: values.mentorshipAreas,
        workExperience: (values.workExperience || []).map((item) => ({
          company: item.company,
          title: item.title,
          from: item.from ? new Date(item.from).toISOString() : null,
          to: item.current || !item.to ? null : new Date(item.to).toISOString(),
          current: Boolean(item.current),
          description: item.description || '',
        })),
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

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileRef2 = fileRef;

  const onPhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setUploading(true);
    try {
      await profileApi.uploadPhoto(file);
      await refresh();
      toast.success('Profile photo updated.');
    } catch (error) {
      toast.error(error.friendlyMessage || 'Unable to upload the photo.');
    } finally {
      setUploading(false);
      setUploadingPhoto(false);
      if (fileRef2.current) fileRef2.current.value = '';
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
      <PageHeader
        title="My profile"
        description="Keep your professional details current so students can find and approach you."
      />

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

              <h2 className="pt-2 text-base font-semibold text-navy-900">Education</h2>
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
                <Field label="Batch" htmlFor="batch" error={errors.batch}>
                  <TextInput id="batch" placeholder="e.g. 2015-2019" error={errors.batch} {...register('batch')} />
                </Field>
              </FormGrid>

              <h2 className="pt-2 text-base font-semibold text-navy-900">Professional</h2>
              <FormGrid>
                <Field label="Current company" htmlFor="currentCompany" error={errors.currentCompany}>
                  <TextInput id="currentCompany" error={errors.currentCompany} {...register('currentCompany')} />
                </Field>
                <Field label="Job title" htmlFor="jobTitle" error={errors.jobTitle}>
                  <TextInput id="jobTitle" error={errors.jobTitle} {...register('jobTitle')} />
                </Field>
              </FormGrid>
              <Field label="LinkedIn URL" htmlFor="linkedinUrl" error={errors.linkedinUrl}>
                <TextInput
                  id="linkedinUrl"
                  placeholder="https://linkedin.com/in/username"
                  error={errors.linkedinUrl}
                  {...register('linkedinUrl', {
                    pattern: { value: /^https?:\/\//i, message: 'Enter a full URL starting with http(s)://' },
                  })}
                />
              </Field>
              <Field label="Location" htmlFor="location" error={errors.location}>
                <TextInput id="location" placeholder="City, Country" error={errors.location} {...register('location')} />
              </Field>
            </div>

            <h2 className="mt-6 text-base font-semibold text-navy-900">Work experience</h2>
            <div className="mt-4 space-y-4">
              {fields.length ? (
                fields.map((field, index) => (
                  <div key={field.id} className="rounded-xl border border-navy-100 p-4">
                    <div className="flex items-center justify-between">
                      <p className="flex items-center gap-2 text-sm font-semibold text-navy-800">
                        <Briefcase className="h-4 w-4 text-navy-400" aria-hidden="true" />
                        Role {index + 1}
                      </p>
                      <button
                        type="button"
                        className="btn-ghost btn-sm text-red-600 hover:bg-red-50"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Remove
                      </button>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <Field label="Company" htmlFor={`workExperience.${index}.company`} required>
                        <TextInput
                          id={`workExperience.${index}.company`}
                          {...register(`workExperience.${index}.company`, { required: 'Company is required.' })}
                        />
                      </Field>
                      <Field label="Job title" htmlFor={`workExperience.${index}.title`} required>
                        <TextInput
                          id={`workExperience.${index}.title`}
                          {...register(`workExperience.${index}.title`, { required: 'Job title is required.' })}
                        />
                      </Field>
                      <Field label="From" htmlFor={`workExperience.${index}.from`}>
                        <TextInput id={`workExperience.${index}.from`} type="date" {...register(`workExperience.${index}.from`)} />
                      </Field>
                      <Field label="To" htmlFor={`workExperience.${index}.to`}>
                        <TextInput id={`workExperience.${index}.to`} type="date" {...register(`workExperience.${index}.to`)} />
                      </Field>
                    </div>
                    <div className="mt-3">
                      <Checkbox label="I currently work here" {...register(`workExperience.${index}.current`)} />
                    </div>
                    <Field label="Description" htmlFor={`workExperience.${index}.description`} className="mt-3">
                      <TextArea id={`workExperience.${index}.description`} rows={3} {...register(`workExperience.${index}.description`)} />
                    </Field>
                  </div>
                ))
              ) : (
                <p className="text-sm text-navy-400">No work experience added yet.</p>
              )}
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() =>
                  append({ company: '', title: '', from: '', to: '', current: false, description: '' })
                }
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add experience
              </button>
            </div>

            <h2 className="mt-6 text-base font-semibold text-navy-900">Skills and mentoring</h2>
            <div className="mt-4 space-y-4">
              <Field label="Skills" htmlFor="skills" hint="Press Enter or use a comma to add a skill.">
                <Controller
                  name="skills"
                  control={control}
                  render={({ field }) => <TagInput id="skills" value={field.value} onChange={field.onChange} placeholder="e.g. React" />}
                />
              </Field>
              <Field label="Mentorship areas" htmlFor="mentorshipAreas" hint="Topics you are happy to mentor students on.">
                <Controller
                  name="mentorshipAreas"
                  control={control}
                  render={({ field }) => (
                    <TagInput id="mentorshipAreas" value={field.value} onChange={field.onChange} placeholder="e.g. Career planning" />
                  )}
                />
              </Field>
              <Checkbox
                label="I am open to mentoring students"
                {...register('openToMentorship')}
              />
              <Field label="Biography" htmlFor="biography" error={errors.biography}>
                <TextArea id="biography" rows={5} error={errors.biography} {...register('biography')} />
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
            <h2 className="text-base font-semibold text-navy-900">Approval status</h2>
            <p className="mt-2 text-sm text-navy-500">
              Only approved alumni appear in the directory or can post jobs. Contact an administrator if your profile
              still shows as pending.
            </p>
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
