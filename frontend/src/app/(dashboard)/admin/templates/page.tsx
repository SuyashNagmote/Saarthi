'use client';

import { TopBar } from '@/components/layout/TopBar';
import { EmptyState } from '@/components/common/EmptyState';
import { ClipboardList } from 'lucide-react';

export default function AdminTemplatesPage() {
  return (
    <>
      <TopBar title="Goal Templates" />
      <div className="p-6">
        <div className="card mx-auto max-w-lg">
          <EmptyState
            icon={<ClipboardList size={24} />}
            title="No templates yet"
            description="Goal templates let managers reuse standard goal structures across teams. Contact your administrator to configure templates for your organization."
          />
        </div>
      </div>
    </>
  );
}
