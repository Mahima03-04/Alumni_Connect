import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SlidersHorizontal, Briefcase } from 'lucide-react';
import { jobApi } from '../../api/endpoints';
import useFetch from '../../hooks/useFetch';
import useDebounce from '../../hooks/useDebounce';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { EMPLOYMENT_TYPES, EXPERIENCE_LEVELS, WORK_MODES } from '../../utils/constants';
import { titleCase } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import JobCard from '../../components/JobCard';
import SearchBar from '../../components/SearchBar';
import FilterSelect from '../../components/FilterSelect';
import { TextInput } from '../../components/FormField';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import { CardSkeletonGrid } from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';

const SORT_OPTIONS = [
  { value: 'recent', label: 'Newest first' },
  { value: 'deadline', label: 'Closing soon' },
  { value: 'title', label: 'Title (A-Z)' },
];

/** Student job board with search, filters and sorting. */
export default function JobBoardPage() {
  useDocumentTitle('Job board');
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [location, setLocation] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [showFilters, setShowFilters] = useState(false);
  const debouncedQ = useDebounce(q, 350);

  const { data, meta, loading, error, refetch } = useFetch(
    () =>
      jobApi.list({
        q: debouncedQ || undefined,
        location: location || undefined,
        workMode: workMode || undefined,
        employmentType: employmentType || undefined,
        experienceLevel: experienceLevel || undefined,
        sortBy,
        page,
        limit: 9,
      }),
    [debouncedQ, location, workMode, employmentType, experienceLevel, sortBy, page]
  );

  const resetFilters = () => {
    setQ('');
    setLocation('');
    setWorkMode('');
    setEmploymentType('');
    setExperienceLevel('');
    setSortBy('recent');
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="Job board"
        description="Opportunities posted by approved alumni, reviewed by the administrator."
        icon={Briefcase}
        actions={
          <button type="button" className="btn-secondary btn-sm lg:hidden" onClick={() => setShowFilters((v) => !v)}>
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filters
          </button>
        }
      />

      <div className="card mb-6 p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <SearchBar value={q} onChange={(value) => { setQ(value); setPage(1); }} placeholder="Search title, company or skill..." />
          </div>
          <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
            <label className="sr-only" htmlFor="job-location">
              Location
            </label>
            <TextInput
              id="job-location"
              placeholder="City or remote"
              value={location}
              onChange={(event) => { setLocation(event.target.value); setPage(1); }}
            />
          </div>
          <FilterSelect
            name="job-sort"
            label=""
            allLabel=""
            value={sortBy}
            onChange={(value) => { setSortBy(value || 'recent'); setPage(1); }}
            options={SORT_OPTIONS}
          />
        </div>
        <div className={`mt-3 gap-3 sm:grid-cols-3 ${showFilters ? 'grid' : 'hidden md:grid'}`}>
          <FilterSelect
            name="work-mode"
            label=""
            allLabel="All work modes"
            value={workMode}
            onChange={(value) => { setWorkMode(value); setPage(1); }}
            options={WORK_MODES.map((value) => ({ value, label: titleCase(value) }))}
          />
          <FilterSelect
            name="employment-type"
            label=""
            allLabel="All employment types"
            value={employmentType}
            onChange={(value) => { setEmploymentType(value); setPage(1); }}
            options={EMPLOYMENT_TYPES.map((value) => ({ value, label: titleCase(value) }))}
          />
          <FilterSelect
            name="experience-level"
            label=""
            allLabel="All experience levels"
            value={experienceLevel}
            onChange={(value) => { setExperienceLevel(value); setPage(1); }}
            options={EXPERIENCE_LEVELS.map((value) => ({ value, label: titleCase(value) }))}
          />
        </div>
        <div className="mt-3 flex justify-end">
          <button type="button" className="btn-ghost btn-sm" onClick={resetFilters}>
            Reset filters
          </button>
        </div>
      </div>

      {loading ? (
        <CardSkeletonGrid count={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : data?.length ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((job) => {
              const id = job.id || job._id;
              return (
                <JobCard
                  key={id}
                  job={job}
                  to={`/student/jobs/${id}`}
                  footer={
                    job.myApplicationStatus ? (
                      <StatusBadge status={job.myApplicationStatus} label={`Applied: ${titleCase(job.myApplicationStatus)}`} />
                    ) : (
                      <Link to={`/student/jobs/${id}`} className="btn-primary btn-sm">
                        View &amp; apply
                      </Link>
                    )
                  }
                />
              );
            })}
          </div>
          <Pagination meta={meta} onChange={setPage} className="mt-6" />
        </>
      ) : (
        <EmptyState
          icon={Briefcase}
          title="No jobs found"
          description="Try adjusting your search terms or clearing the filters."
          action={
            <button type="button" className="btn-secondary btn-sm" onClick={resetFilters}>
              Clear filters
            </button>
          }
        />
      )}
    </div>
  );
}
