'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { type EntityType, type Company, type Person, type Opportunity } from '../_data/types';
import { ENTITY_CONFIGS } from '../_data/entityConfigs';
import { useRecordData } from '../_providers/RecordDataProvider';
import { RecordDetailBreadcrumb } from './RecordDetailBreadcrumb';
import { ActivityEmptyState } from './ActivityEmptyState';
import { SummaryCard } from '@/ui/twentycomponents/record-show/SummaryCard';
import { FieldsCard } from '@/ui/twentycomponents/record-show/FieldsCard';
import { RecordDetailRelationSection } from '@/ui/twentycomponents/record-show/RecordDetailRelationSection';
import { FieldEditModal } from '@/ui/twentycomponents/record-show/FieldEditModal';

type EntityDetailPageProps = {
  entityType: EntityType;
  entityId: string;
  entity: Company | Person | Opportunity;
};

export const EntityDetailPage = ({
  entityType,
  entityId,
  entity,
}: EntityDetailPageProps) => {
  const router = useRouter();
  const recordData = useRecordData();
  const config = ENTITY_CONFIGS[entityType];

  const [activeTab, setActiveTab] = useState<string>(config.tabs[0]);
  const [activeModalFieldId, setActiveModalFieldId] = useState<string | null>(null);

  // Pagination: get all entities of this type and find prev/next
  const allEntities =
    config.getAllFn === 'companies'
      ? recordData.companies
      : config.getAllFn === 'getAllPeople'
        ? recordData.getAllPeople()
        : recordData.getAllOpportunities();

  const currentIndex = allEntities.findIndex(
    (e: { id: string }) => e.id === entityId,
  );
  const prevEntity = currentIndex > 0 ? allEntities[currentIndex - 1] : null;
  const nextEntity =
    currentIndex < allEntities.length - 1
      ? allEntities[currentIndex + 1]
      : null;

  function handleFieldEdit(fieldId: string, value: unknown) {
    if (entityType === 'company') {
      recordData.updateCompanyField(entityId, fieldId, value);
    }
  }

  function handleModalEdit(fieldId: string) {
    if (config.edit?.modalFields?.has(fieldId)) {
      setActiveModalFieldId(fieldId);
    }
  }

  function handleValueClick(fieldId: string) {
    const urlBuilder = config.edit?.clickableFields?.get(fieldId);
    if (urlBuilder) {
      router.push(urlBuilder(entity));
    }
  }

  const activeModal = activeModalFieldId
    ? config.modals?.find((m) => m.fieldId === activeModalFieldId)
    : null;

  return (
    <div className="flex h-full flex-col bg-[#171717]">
      <RecordDetailBreadcrumb
        name={config.getName(entity)}
        currentIndex={currentIndex === -1 ? 0 : currentIndex}
        totalCount={allEntities.length}
        prevId={prevEntity?.id ?? null}
        nextId={nextEntity?.id ?? null}
        entityIcon={config.icon}
        entityLabel={config.label}
        backHref="/twentydemo"
        linkPrefix={`/twentydemo/${entityType}`}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — 380px fixed */}
        <div className="w-[380px] shrink-0 overflow-y-auto border-r border-[#222222]">
          <SummaryCard
            title={config.getName(entity)}
            avatarUrl={config.getAvatarUrl(entity) ?? null}
            avatarType={config.avatarType}
            avatarPlaceholder={config.getName(entity)}
            createdAt={config.getCreatedAt?.(entity)}
          />

          <FieldsCard
            fields={config.getFields(entity)}
            {...(config.edit
              ? {
                  editableFields: config.edit.editableFields,
                  onFieldEdit: handleFieldEdit,
                  onModalEdit: handleModalEdit,
                  onValueClick: handleValueClick,
                }
              : {})}
          />

          {config.relations.map((rel) => {
            const records = rel.getRecords(entity);
            if (records.length === 0) return null;
            return (
              <RecordDetailRelationSection
                key={rel.title}
                title={rel.title}
                records={records}
                onRecordClick={(id) =>
                  router.push(`/twentydemo/${rel.targetEntityType}/${id}`)
                }
              />
            );
          })}
        </div>

        {/* Right panel — tabs + content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex border-b border-[#222222]">
            {config.tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  tab === activeTab
                    ? 'border-b-2 border-[#ebebeb] text-[#ebebeb]'
                    : 'text-[#818181] hover:text-[#b3b3b3]'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            <ActivityEmptyState />
          </div>
        </div>
      </div>

      {/* Modal (config-driven) */}
      {activeModal && (
        <FieldEditModal
          open
          onOpenChange={(open) => {
            if (!open) setActiveModalFieldId(null);
          }}
          title={activeModal.title}
          schema={activeModal.schema}
          values={activeModal.getValues(entity)}
          onSave={(data) => {
            handleFieldEdit(activeModal.fieldId, data);
          }}
        />
      )}
    </div>
  );
};
