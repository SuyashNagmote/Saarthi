'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * ExportButton — CSV/Excel download trigger with loading state per §7.2
 */
export function ExportButton({
  onExport,
  label = 'Export',
  format = 'xlsx',
}: {
  onExport: (format: string) => Promise<void>;
  label?: string;
  format?: 'csv' | 'xlsx';
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await onExport(format);
      toast.success(`${label} downloaded successfully`);
    } catch {
      toast.error(`Failed to download ${label.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="btn-secondary flex items-center gap-2"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
      {loading ? 'Exporting…' : label}
    </button>
  );
}
