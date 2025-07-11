import { GoogleLoginForm } from '@src/feature/Google';
import { DashboardLayout } from '@src/Layouts/DashboardLayout';

export default function GooglePage() {
  return (
    <DashboardLayout>
      <GoogleLoginForm />
    </DashboardLayout>
  );
}
