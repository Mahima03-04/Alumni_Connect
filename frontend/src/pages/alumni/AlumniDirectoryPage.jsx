import AlumniDirectory from '../../components/AlumniDirectory';

/** Alumni-facing view of the approved alumni directory. */
export default function AlumniDirectoryPage() {
  return (
    <AlumniDirectory
      basePath="/alumni/directory"
      title="Alumni directory"
      description="Find and reconnect with fellow alumni across batches, departments and companies."
    />
  );
}
