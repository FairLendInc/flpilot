import { IconNotes } from '@tabler/icons-react';

export const ActivityEmptyState = () => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#1e1e1e]">
      <IconNotes size={20} className="text-[#818181]" />
    </div>
    <p className="text-sm font-medium text-[#818181]">No activity yet</p>
    <p className="mt-1 max-w-[240px] text-xs text-[#666666]">
      There is no activity associated with this record.
    </p>
  </div>
);
