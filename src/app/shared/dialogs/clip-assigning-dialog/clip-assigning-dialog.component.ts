import {Component, Inject, OnDestroy, OnInit, TrackByFunction} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {Clip, ClipAssigningMode, Dictionary, MediaType, Screen, UnassignedFilterEnum} from "@memebox/contracts";
import {BehaviorSubject, Observable, Subject} from "rxjs";
import {map, takeUntil, withLatestFrom} from "rxjs/operators";
import {IFilterItem} from "../../components/filter/filter.component";
import {createCombinedFilterItems$, filterClips$} from "../../components/filter/filter.methods";
import {AppQueries} from "../../../../../projects/app-state/src/lib/state/app.queries";
import {AppService} from "../../../../../projects/app-state/src/lib/state/app.service";


export interface ClipAssigningDialogOptions {
  mode: ClipAssigningMode;
  // Multiple, current screen
  screenId?: string;
  // Single, current selected item
  selectedItemId?: string;

  dialogTitle: string;

  showMetaItems: boolean;

  showOnlyUnassignedFilter?: boolean;
  unassignedFilterType?: UnassignedFilterEnum;
}

function unassignedFilterToString(  unassignedFilterType: UnassignedFilterEnum) {
  switch (unassignedFilterType) {
    case UnassignedFilterEnum.Timers: return 'timers';
    case UnassignedFilterEnum.Twitch: return 'twitch';
    case UnassignedFilterEnum.Screens: return 'screens';
  }

  return '';
}

const ignoreMediaTypes = [MediaType.WidgetTemplate, MediaType.PermanentScript];

@Component({
  selector: 'app-clip-assigning-dialog',
  templateUrl: './clip-assigning-dialog.component.html',
  styleUrls: ['./clip-assigning-dialog.component.scss']
})
export class ClipAssigningDialogComponent implements OnInit, OnDestroy {
  MediaType = MediaType;

  // Media - is assigned to - Screen
  //                        - Triggers (Twitch, Timers)
  //                        -

  public filterItems$: Observable<IFilterItem[]> = createCombinedFilterItems$(
    this.appQueries.state$,
    true
  ).pipe(
    map(filterItems => {
      return filterItems.filter(item => {
        if (item.type === 'TAG') {
          return true;
        }


        if (!this.data.showMetaItems) {
          ignoreMediaTypes.push(MediaType.Meta);
        }

        return !ignoreMediaTypes.includes(item.value);
      })
    }),
    map(filterItems => {
      if (this.data.showOnlyUnassignedFilter) {

        return [...filterItems, {
          type: 'SPECIAL',
          value: 'onlyUnassigned',
          label: `not assigned to ${unassignedFilterToString(this.data.unassignedFilterType)}`,
          icon: ''
        }];
      } else {
        return filterItems;
      }
    })
  );

  checkedMap: Dictionary<boolean>;

  public filteredItems$ = new BehaviorSubject<IFilterItem[]>([]);

  public clips$: Observable<Clip[]> = filterClips$(
    this.appQueries.state$,
    this.filteredItems$
  ).pipe(
    map(value => {
      if (this.data.showMetaItems) {
        return value;
      } else {
        return value.filter(c => c.type !== MediaType.Meta)
      }
    }),
    withLatestFrom(this.appQueries.state$, this.filteredItems$),
    map(([items, state, filterItems]) => {
      if (this.data.showOnlyUnassignedFilter && filterItems.some(f => f.value === 'onlyUnassigned')) {
        let isClipAssigned: (str: string) => boolean = null;

        // filter by unassigned
        switch(this.data.unassignedFilterType) {
          case UnassignedFilterEnum.Screens: {
            isClipAssigned = str =>  {
              return Object.values(state.screen).some(s => !!s.clips[str]);
            };

            break;
          }
          case UnassignedFilterEnum.Twitch: {


            isClipAssigned = str =>  {
              return Object.values(state.twitchEvents).some(t => t.clipId === str);
            };
            break;
          }
          case UnassignedFilterEnum.Timers: {
            isClipAssigned = str =>  {
              return Object.values(state.timers).some(t => t.clipId === str);
            };
            break;
          }
        }


        return items.filter(item => {
          const alreadyAssigned = isClipAssigned(item.id);

          return !alreadyAssigned;
        });
      }
       else {
         return items;
      }
    })
  );

  screen$: Observable<Screen> = this.appQueries.screenMap$.pipe(
    map(screenMap => screenMap[this.data.screenId])
  );

  trackByClip: TrackByFunction<Clip> = (index, item) => item.id;

  private destroy$ = new Subject();

  constructor(@Inject(MAT_DIALOG_DATA) public data: ClipAssigningDialogOptions,
              public dialogRef: MatDialogRef<ClipAssigningDialogComponent>,
              private appQueries: AppQueries,
              private appService: AppService) {
  }

  ngOnInit(): void {
    if (this.data.mode === ClipAssigningMode.Multiple) {
      this.screen$.pipe(
        takeUntil(this.destroy$),
      ).subscribe((screen) => {
        this.checkedMap = {};

        Object.keys(screen.clips).forEach(clipId => {
          this.checkedMap[clipId] = true;
        });
      });
    } else {
      this.checkedMap = {};
      this.checkedMap[this.data.selectedItemId] = true;
    }
  }

  clickToSelect(clip: Clip) {
    if (this.data.mode === ClipAssigningMode.Multiple) {

      const isSelected = this.checkedMap[clip.id] || false;


      if (!isSelected) {
        this.appService.addOrUpdateScreenClip(this.data.screenId, {
          id: clip.id,
        });
      } else {
        this.appService.deleteScreenClip(this.data.screenId, clip.id);
      }

      console.info(this.checkedMap, clip, isSelected);
      // this.checkedMap[clip.id] = !isSelected;
    }
    else {
      this.dialogRef.close(clip.id);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
