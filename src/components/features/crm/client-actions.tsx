// =============================================================================
// Client Actions — Client Component (Sidebar actions: favorite, archive, stage, tags)
// =============================================================================

'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  toggleFavorite,
  archiveClient,
  moveClientPipeline,
  tagClient,
} from '@/actions/crm';

interface Props {
  clientId: string;
  isFavorite: boolean;
  isArchived: boolean;
  currentStage: string;
  allTags: Array<Record<string, unknown>>;
  currentTagIds: string[];
}

const STAGES = [
  { key: 'lead' },
  { key: 'in_negotiation' },
  { key: 'active_deal' },
  { key: 'completed' },
  { key: 'repeat' },
] as const;

export function ClientActions({ clientId, isFavorite, isArchived, currentStage, allTags, currentTagIds }: Props) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('features.clientActions');

  function handleFavorite() {
    startTransition(() => { toggleFavorite(clientId, !isFavorite); });
  }

  function handleArchive() {
    startTransition(() => { archiveClient(clientId, !isArchived); });
  }

  function handleStageChange(stage: string) {
    startTransition(() => { moveClientPipeline(clientId, stage); });
  }

  function handleTagToggle(tagId: string) {
    const newTags = currentTagIds.includes(tagId)
      ? currentTagIds.filter(t => t !== tagId)
      : [...currentTagIds, tagId];
    startTransition(() => { tagClient(clientId, newTags); });
  }

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <Card className="p-4 space-y-3">
        <h3 className="font-bold text-sm">{t('quickActions')}</h3>
        <div className="space-y-2">
          <Button
            variant={isFavorite ? 'secondary' : 'outline'}
            size="sm"
            className="w-full"
            onClick={handleFavorite}
            disabled={isPending}
          >
            {isFavorite ? t('removeFavorite') : t('addFavorite')}
          </Button>
          <Button
            variant={isArchived ? 'outline' : 'ghost'}
            size="sm"
            className="w-full"
            onClick={handleArchive}
            disabled={isPending}
          >
            {isArchived ? t('unarchive') : t('archiveClient')}
          </Button>
        </div>
      </Card>

      {/* Pipeline Stage */}
      <Card className="p-4 space-y-3">
        <h3 className="font-bold text-sm">{t('pipelineStage')}</h3>
        <div className="space-y-1">
          {STAGES.map(stage => (
            <button
              key={stage.key}
              onClick={() => handleStageChange(stage.key)}
              disabled={isPending || currentStage === stage.key}
              className={`w-full text-start rounded-md px-3 py-1.5 text-xs transition-colors ${
                currentStage === stage.key
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              {t(`stages.${stage.key}`)}
            </button>
          ))}
        </div>
      </Card>

      {/* Tags */}
      {allTags.length > 0 && (
        <Card className="p-4 space-y-3">
          <h3 className="font-bold text-sm">{t('tags')}</h3>
          <div className="flex flex-wrap gap-1">
            {allTags.map(tag => {
              const isActive = currentTagIds.includes(tag.id as string);
              return (
                <button
                  key={tag.id as string}
                  onClick={() => handleTagToggle(tag.id as string)}
                  disabled={isPending}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-opacity ${
                    isActive ? 'opacity-100' : 'opacity-40 hover:opacity-70'
                  }`}
                  style={{ backgroundColor: `${tag.color as string}20`, color: tag.color as string }}
                >
                  {tag.name as string}
                </button>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
