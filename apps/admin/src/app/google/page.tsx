import { DashboardLayout } from '@src/Layouts/DashboardLayout';
import { GoogleLoginForm } from '@src/feature/GoogleLogin';

export default function GooglePage() {
  return (
    <DashboardLayout>
      <GoogleLoginForm />
    </DashboardLayout>
  );
}
