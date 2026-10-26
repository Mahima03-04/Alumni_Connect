import AlumniDirectory from '../../components/AlumniDirectory';

/** Student-facing alumni directory (approved alumni only). */
export default function StudentAlumniDirectoryPage() {
  return (
    <AlumniDirectory
      basePath="/student/alumni"
      title="Alumni directory"
      description="Browse and search alumni of the university, then reach out for mentorship."
    />
  );
}
