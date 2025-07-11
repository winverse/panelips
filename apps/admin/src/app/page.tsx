'use client';

import { ChannelManager } from '@src/feature/ChannelManager';
import { DashboardLayout } from '@src/Layouts/DashboardLayout';

export default function Home() {
  return (
    <DashboardLayout>
      <ChannelManager />
    </DashboardLayout>
  );
}
