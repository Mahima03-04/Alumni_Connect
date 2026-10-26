import { useMemo, useState } from 'react';
import { SlidersHorizontal, Users } from 'lucide-react';
import { profileApi } from '../api/endpoints';
import useFetch from '../hooks/useFetch';
import useDebounce from '../hooks/useDebounce';
import PageHeader from './PageHeader';
import SearchBar from './SearchBar';
import FilterSelect from './FilterSelect';
import ProfileCard from './ProfileCard';
import Pagination from './Pagination';
import { CardSkeletonGrid } from './LoadingState';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';

const SORT_OPTIONS = [
  { value: '', label: 'Newest first' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'graduationYear', label: 'Graduation year' },
  { value: 'currentCompany', label: 'Company' },
];

/**
 * Reusable approved-alumni directory with search, filters, sorting and
 * pagination. `basePath` controls where each card links to.
 */
export default function AlumniDirectory({ basePath, title = 'Alumni directory', description = '' }) {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [department, setDepartment] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const debouncedQ = useDebounce(q, 350);

  const metadata = useFetch(() => profileApi.metadata(), []);

  const { data, meta, loading, error, refetch } = useFetch(
    () =>
      profileApi.list({
        q: debouncedQ || undefined,
        department: department || undefined,
        graduationYear: graduationYear || undefined,
        sortBy: sortBy || undefined,
        page,
        limit: 9,
      }),
    [debouncedQ, department, graduationYear, sortBy, page]
  );

  const departmentOptions = useMemo(
    () => (metadata.data?.departments || []).map((value) => ({ value, label: value })),
    [metadata.data]
  );
  const yearOptions = useMemo(
    () => (metadata.data?.graduationYears || []).map((value) => ({ value: String(value), label: String(value) })),
    [metadata.data]
  );

  const resetFilters = () => {
    setQ('');
    setDepartment('');
    setGraduationYear('');
    setSortBy('');
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        icon={Users}
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
            <SearchBar value={q} onChange={(value) => { setQ(value); setPage(1); }} placeholder="Search by name, company, skill..." />
          </div>
          <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
            <FilterSelect
              name="filter-department"
              label=""
              allLabel="All departments"
              value={department}
              onChange={(value) => { setDepartment(value); setPage(1); }}
              options={departmentOptions}
            />
          </div>
          <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
            <FilterSelect
              name="filter-year"
              label=""
              allLabel="All graduation years"
              value={graduationYear}
              onChange={(value) => { setGraduationYear(value); setPage(1); }}
              options={yearOptions}
            />
          </div>
        </div>
        <div className={`mt-3 flex-wrap items-center justify-between gap-3 ${showFilters ? 'flex' : 'hidden md:flex'}`}>
          <FilterSelect
            name="filter-sort"
            label=""
            allLabel="Sort: Newest first"
            value={sortBy}
            onChange={(value) => { setSortBy(value); setPage(1); }}
            options={SORT_OPTIONS.slice(1)}
          />
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
            {data.map((profile) => (
              <ProfileCard key={profile.id || profile.userId} profile={profile} to={`${basePath}/${profile.userId}`} />
            ))}
          </div>
          <Pagination meta={meta} onChange={setPage} className="mt-6" />
        </>
      ) : (
        <EmptyState
          icon={Users}
          title="No alumni found"
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
