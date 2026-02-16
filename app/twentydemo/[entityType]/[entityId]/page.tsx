'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { EntityDetailPage } from '../../_components/EntityDetailPage';
import { TwentyDemoShell } from '../../_components/TwentyDemoShell';
import {
  MockRecordDataProvider,
  useRecordData,
} from '../../_providers/RecordDataProvider';
import { VALID_ENTITY_TYPES, ENTITY_CONFIGS } from '../../_data/entityConfigs';
import { type EntityType } from '../../_data/types';
import ThemeProvider from '@/ui/twentycomponents/theme/provider/ThemeProvider';
import { THEME_DARK } from '@/ui/twentycomponents/theme/constants/ThemeDark';

function EntityDetailInner({
  entityType,
  entityId,
}: {
  entityType: EntityType;
  entityId: string;
}) {
  const recordData = useRecordData();
  const config = ENTITY_CONFIGS[entityType];
  const entity = recordData[config.lookupFn](entityId);

  if (!entity) {
    notFound();
  }

  return (
    <TwentyDemoShell>
      <EntityDetailPage
        entityType={entityType}
        entityId={entityId}
        entity={entity}
      />
    </TwentyDemoShell>
  );
}

export default function EntityDetailRoute({
  params,
}: {
  params: Promise<{ entityType: string; entityId: string }>;
}) {
  const { entityType, entityId } = use(params);

  if (!VALID_ENTITY_TYPES.has(entityType)) {
    notFound();
  }

  return (
    <ThemeProvider theme={THEME_DARK}>
      <MockRecordDataProvider>
        <EntityDetailInner
          entityType={entityType as EntityType}
          entityId={entityId}
        />
      </MockRecordDataProvider>
    </ThemeProvider>
  );
}
