'use client';

import Link from 'next/link';
import {
  IconBuildingSkyscraper,
  IconChevronLeft,
  IconChevronRight,
  IconHeart,
  IconTrash,
} from '@tabler/icons-react';
import { type IconComponent } from '@/ui/twentycomponents/display/icon/types/IconComponent';

type RecordDetailBreadcrumbProps = {
  name: string;
  currentIndex: number;
  totalCount: number;
  prevId: string | null;
  nextId: string | null;
  entityIcon?: IconComponent;
  entityLabel?: string;
  backHref?: string;
  linkPrefix?: string;
};

export const RecordDetailBreadcrumb = ({
  name,
  currentIndex,
  totalCount,
  prevId,
  nextId,
  entityIcon: EntityIcon = IconBuildingSkyscraper,
  entityLabel = 'Company',
  backHref = '/twentydemo',
  linkPrefix = '/twentydemo',
}: RecordDetailBreadcrumbProps) => (
  <div className="flex items-center justify-between border-b border-[#222222] px-4 py-2.5">
    <div className="flex items-center gap-1.5 text-sm">
      <EntityIcon size={14} className="text-[#818181]" />
      <Link
        href={backHref}
        className="text-[#818181] hover:text-[#b3b3b3] transition-colors"
      >
        {entityLabel}
      </Link>
      <span className="text-[#484848]">/</span>
      <span className="text-[#ebebeb] font-medium">{name}</span>
      <span className="text-xs text-[#666666] ml-1">
        ({currentIndex + 1}/{totalCount})
      </span>
    </div>

    <div className="flex items-center gap-1">
      <button
        type="button"
        className="flex h-7 w-7 items-center justify-center rounded text-[#818181] hover:bg-[#1e1e1e] hover:text-[#b3b3b3] transition-colors"
      >
        <IconHeart size={14} />
      </button>
      <button
        type="button"
        className="flex h-7 w-7 items-center justify-center rounded text-[#818181] hover:bg-[#1e1e1e] hover:text-[#b3b3b3] transition-colors"
      >
        <IconTrash size={14} />
      </button>

      <div className="mx-1 h-4 w-px bg-[#333333]" />

      {prevId ? (
        <Link
          href={`${linkPrefix}/${prevId}`}
          className="flex h-7 w-7 items-center justify-center rounded text-[#818181] hover:bg-[#1e1e1e] hover:text-[#b3b3b3] transition-colors"
        >
          <IconChevronLeft size={14} />
        </Link>
      ) : (
        <div className="flex h-7 w-7 items-center justify-center rounded text-[#333333]">
          <IconChevronLeft size={14} />
        </div>
      )}
      {nextId ? (
        <Link
          href={`${linkPrefix}/${nextId}`}
          className="flex h-7 w-7 items-center justify-center rounded text-[#818181] hover:bg-[#1e1e1e] hover:text-[#b3b3b3] transition-colors"
        >
          <IconChevronRight size={14} />
        </Link>
      ) : (
        <div className="flex h-7 w-7 items-center justify-center rounded text-[#333333]">
          <IconChevronRight size={14} />
        </div>
      )}
    </div>
  </div>
);
