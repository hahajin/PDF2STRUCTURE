// src/features/plan-sheets/UnderlayControls.tsx
//
// Per-Plan-Sheet underlay controls: toggle the sheet as an underlay of the
// active base sheet, set its opacity, and drag it into alignment.

import { Layers, Move } from 'lucide-react';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  setAlignStory,
  updateStory,
} from '@/app/store/slices/storySlice';
import { setCurrentPage } from '@/app/store/slices/pdfSlice';
import { selectBasePlanSheet, setActivePlanSheet } from '@/app/store/slices/planSheetSlice';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  addSheetAsUnderlay,
  startAligningSheet,
} from '@/features/stories/underlayActions';
import type { PlanSheet } from './planSheetTypes';

export function UnderlayControls({ sheet }: { sheet: PlanSheet }) {
  const dispatch = useAppDispatch();

  const story = useAppSelector((state) =>
    state.story.stories.find((item) => item.sheetId === sheet.id),
  );
  const baseSheet = useAppSelector(selectBasePlanSheet);
  const isBase = baseSheet?.id === sheet.id;
  const aligning = useAppSelector(
    (state) => !!story && state.story.alignStoryId === story.id,
  );

  const on = !!story?.overlayVisible;
  const opacity = Math.round((story?.overlayOpacity ?? 0.4) * 100);

  const toggle = (value: boolean) => {
    if (!baseSheet) return;
    if (!story) {
      if (value) addSheetAsUnderlay(sheet);
      return;
    }

    if (!value && aligning) dispatch(setAlignStory(null));
    dispatch(updateStory({ id: story.id, changes: { overlayVisible: value } }));
  };

  const alignToBase = () => {
    if (!baseSheet || isBase) return;
    if (aligning) {
      dispatch(setAlignStory(null));
      return;
    }

    // The alignment canvas uses the base floor's page coordinates. Activate it
    // before entering drag mode, without changing which sheet is the base.
    dispatch(setCurrentPage(baseSheet.sourcePage));
    dispatch(setActivePlanSheet(baseSheet.id));
    startAligningSheet(sheet);
  };

  return (
    <div className="mt-1.5 flex items-center gap-2 border-t border-gray-100 pt-1.5">
      <Layers className="h-3 w-3 shrink-0 text-muted-foreground" />

      <Switch
        checked={on}
        onCheckedChange={toggle}
        disabled={!baseSheet}
        title="Show this floor as a transparent overlay on the edited floor"
      />

      <Slider
        className="flex-1"
        min={0}
        max={100}
        step={5}
        disabled={!story || !baseSheet}
        value={[opacity]}
        onValueChange={([value]) =>
          story &&
          dispatch(
            updateStory({
              id: story.id,
              changes: { overlayOpacity: value / 100 },
            }),
          )
        }
      />

      <span className="w-8 text-right text-[10px] text-muted-foreground">
        {opacity}%
      </span>

      <Button
        variant={aligning ? 'default' : 'ghost'}
        size="icon"
        className="h-6 w-6"
        title={isBase ? 'The base floor is the fixed alignment reference' : 'Drag this floor to align it with the fixed base floor'}
        disabled={!baseSheet || isBase}
        onClick={alignToBase}
      >
        <Move className="h-3 w-3" />
      </Button>
    </div>
  );
}
