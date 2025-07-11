'use client';

import { ChannelManager } from '@src/feature/Channel';
import { DashboardLayout } from '@src/Layouts/DashboardLayout';

export default function Home() {
  return (
    <DashboardLayout>
      <ChannelManager />
    </DashboardLayout>
  );
}
