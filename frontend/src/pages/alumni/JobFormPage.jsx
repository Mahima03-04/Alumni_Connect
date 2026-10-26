import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { Briefcase, Save } from 'lucide-react';
import { jobApi } from '../../api/endpoints';
import useFetch from '../../hooks/useFetch';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useToast } from '../../hooks/useToast';
import { EMPLOYMENT_TYPES, EXPERIENCE_LEVELS, WORK_MODES } from '../../utils/constants';
import { titleCase } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import {
  Field,
  FormActions,
  FormGrid,
  TagInput,
  TextArea,
  TextInput,
  Select,
} from '../../components/FormField';

const toDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

/**
 * Create / edit form for an alumni job post. Content edits reset the approval
 * status on the server, so we warn the poster before saving.
 */
export default function JobFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  useDocumentTitle(isEdit ? 'Edit job post' : 'Post a job');
  const navigate = useNavigate();
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const { data: job, loading, error, refetch } = useFetch(
    () => (isEdit ? jobApi.get(id) : Promise.resolve({ data: { data: null } })),
    [id, isEdit]
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      company: '',
      description: '',
      location: '',
      workMode: 'onsite',
      employmentType: 'full-time',
      experienceLevel: 'entry',
      skillsRequired: [],
      salaryMin: '',
      salaryMax: '',
      salaryCurrency: 'INR',
      salaryPeriod: 'year',
      openings: 1,
      applicationDeadline: '',
      contactEmail: '',
    },
  });

  const salaryMin = watch('salaryMin');
  const salaryMax = watch('salaryMax');

  useEffect(() => {
    if (!isEdit || !job) return;
    reset({
      title: job.title || '',
      company: job.company || '',
      description: job.description || '',
      location: job.location || '',
      workMode: job.workMode || 'onsite',
      employmentType: job.employmentType || 'full-time',
      experienceLevel: job.experienceLevel || 'entry',
      skillsRequired: job.skillsRequired || [],
      salaryMin: job.salaryMin ?? '',
      salaryMax: job.salaryMax ?? '',
      salaryCurrency: job.salaryCurrency || 'INR',
      salaryPeriod: job.salaryPeriod || 'year',
      openings: job.openings ?? 1,
      applicationDeadline: toDateInput(job.applicationDeadline),
      contactEmail: job.contactEmail || '',
    });
  }, [isEdit, job, reset]);

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      const payload = {
        title: values.title.trim(),
        company: values.company.trim(),
        description: values.description.trim(),
        location: values.location.trim(),
        workMode: values.workMode,
        employmentType: values.employmentType,
        experienceLevel: values.experienceLevel,
        skillsRequired: values.skillsRequired,
        salaryMin: values.salaryMin === '' ? null : Number(values.salaryMin),
        salaryMax: values.salaryMax === '' ? null : Number(values.salaryMax),
        salaryCurrency: values.salaryCurrency || 'INR',
        salaryPeriod: values.salaryPeriod,
        openings: values.openings === '' ? 1 : Number(values.openings),
        applicationDeadline: values.applicationDeadline || null,
        contactEmail: values.contactEmail.trim(),
      };

      if (isEdit) {
        await jobApi.update(id, payload);
        toast.success('Job updated. It will be re-reviewed before it goes live again.');
      } else {
        await jobApi.create(payload);
        toast.success('Job posted. It will appear once an administrator approves it.');
      }
      navigate('/alumni/jobs');
    } catch (err) {
      toast.error(err.friendlyMessage || 'Unable to save the job post.');
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && loading) return <LoadingState label="Loading job post..." />;
  if (isEdit && error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit job post' : 'Post a job'}
        description="Provide clear details so the right students can find and apply."
        icon={Briefcase}
        breadcrumb={[{ label: 'My job posts', to: '/alumni/jobs' }, { label: isEdit ? 'Edit' : 'New' }]}
      />

      <form className="card max-w-3xl p-6" onSubmit={handleSubmit(onSubmit)}>
        <FormGrid>
          <Field label="Job title" htmlFor="title" required error={errors.title}>
            <TextInput
              id="title"
              error={errors.title}
              {...register('title', { required: 'Job title is required.' })}
            />
          </Field>
          <Field label="Company" htmlFor="company" required error={errors.company}>
            <TextInput
              id="company"
              error={errors.company}
              {...register('company', { required: 'Company is required.' })}
            />
          </Field>
        </FormGrid>

        <Field
          label="Job description"
          htmlFor="description"
          required
          className="mt-4"
          error={errors.description}
          hint="At least 30 characters. Describe the role, responsibilities and requirements."
        >
          <TextArea
            id="description"
            rows={8}
            error={errors.description}
            {...register('description', {
              required: 'Job description is required.',
              minLength: { value: 30, message: 'Job description must be at least 30 characters.' },
            })}
          />
        </Field>

        <FormGrid className="mt-4">
          <Field label="Location" htmlFor="location" error={errors.location}>
            <TextInput id="location" placeholder="City or Remote" error={errors.location} {...register('location')} />
          </Field>
          <Field label="Work mode" htmlFor="workMode">
            <Select id="workMode" {...register('workMode')}>
              {WORK_MODES.map((value) => (
                <option key={value} value={value}>
                  {titleCase(value)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Employment type" htmlFor="employmentType">
            <Select id="employmentType" {...register('employmentType')}>
              {EMPLOYMENT_TYPES.map((value) => (
                <option key={value} value={value}>
                  {titleCase(value)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Experience level" htmlFor="experienceLevel">
            <Select id="experienceLevel" {...register('experienceLevel')}>
              {EXPERIENCE_LEVELS.map((value) => (
                <option key={value} value={value}>
                  {titleCase(value)}
                </option>
              ))}
            </Select>
          </Field>
        </FormGrid>

        <Field label="Skills required" htmlFor="skillsRequired" className="mt-4" hint="Press Enter or use a comma to add a skill.">
          <Controller
            name="skillsRequired"
            control={control}
            render={({ field }) => (
              <TagInput id="skillsRequired" value={field.value} onChange={field.onChange} placeholder="e.g. React" />
            )}
          />
        </Field>

        <FormGrid className="mt-4">
          <Field label="Minimum salary" htmlFor="salaryMin" error={errors.salaryMin}>
            <TextInput
              id="salaryMin"
              type="number"
              min="0"
              placeholder="Optional"
              error={errors.salaryMin}
              {...register('salaryMin', { min: { value: 0, message: 'Must be a positive number.' } })}
            />
          </Field>
          <Field
            label="Maximum salary"
            htmlFor="salaryMax"
            error={errors.salaryMax}
            hint={salaryMin && salaryMax && Number(salaryMax) < Number(salaryMin) ? 'Max should be at least the minimum.' : ''}
          >
            <TextInput
              id="salaryMax"
              type="number"
              min="0"
              error={errors.salaryMax}
              {...register('salaryMax', {
                validate: (value) =>
                  value === '' || salaryMin === '' || Number(value) >= Number(salaryMin) ||
                  'Maximum salary must be at least the minimum.',
              })}
            />
          </Field>
          <Field label="Currency" htmlFor="salaryCurrency" error={errors.salaryCurrency}>
            <TextInput id="salaryCurrency" error={errors.salaryCurrency} {...register('salaryCurrency')} />
          </Field>
          <Field label="Salary period" htmlFor="salaryPeriod" error={errors.salaryPeriod}>
            <Select id="salaryPeriod" error={errors.salaryPeriod} {...register('salaryPeriod')}>
              <option value="year">Per year</option>
              <option value="month">Per month</option>
            </Select>
          </Field>
          <Field label="Openings" htmlFor="openings" error={errors.openings}>
            <TextInput
              id="openings"
              type="number"
              min={1}
              max={1000}
              error={errors.openings}
              {...register('openings', { min: { value: 1, message: 'At least one opening.' } })}
            />
          </Field>
          <Field label="Application deadline" htmlFor="applicationDeadline" error={errors.applicationDeadline}>
            <TextInput id="applicationDeadline" type="date" error={errors.applicationDeadline} {...register('applicationDeadline')} />
          </Field>
        </FormGrid>

        <Field label="Contact email" htmlFor="contactEmail" className="mt-4" error={errors.contactEmail}>
          <TextInput
            id="contactEmail"
            type="email"
            placeholder="Optional"
            error={errors.contactEmail}
            {...register('contactEmail', {
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address.' },
            })}
          />
        </Field>

        <FormActions>
          <Link to="/alumni/jobs" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn-primary" disabled={saving}>
            <Save className="h-4 w-4" aria-hidden="true" />
            {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Post job'}
          </button>
        </FormActions>
      </form>
    </div>
  );
}
