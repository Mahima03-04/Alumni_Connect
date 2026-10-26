import { Outlet } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';

/** Marketing pages: public header + footer with the routed page in between. */
export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-50">
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
