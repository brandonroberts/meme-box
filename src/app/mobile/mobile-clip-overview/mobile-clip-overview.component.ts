import {Component, OnDestroy, OnInit} from '@angular/core';
import {
  ActivityQueries,
  AppQueries,
  AppService,
  ConnectionState,
  SettingsService,
  WebsocketService
} from "@memebox/app-state";
import {Observable, Subject} from "rxjs";
import {Clip, MEDIA_TYPE_INFORMATION} from "@memebox/contracts";
import {map, take, takeUntil, tap} from "rxjs/operators";
import {sortClips} from "@memebox/utils";
import orderBy from 'lodash/orderBy';

// once the tsconfig paths are working for server/app
// extract this to its own "library"
function groupBy<T>(xs: T[], key: keyof T): {[key: string]: T[]} {
  return xs.reduce(function(rv, x) {
    (rv[x[key] as any] = rv[x[key] as any] || []).push(x);
    return rv;
  }, {});
}

interface IGroupedList {
  title: string;
  icon: string;
  clips: Clip[];
  order: number;
}

const SettingMobileColumnSize = 'MOBILE_COLUMN_SIZE';

@Component({
  selector: 'app-mobile-clip-overview',
  templateUrl: './mobile-clip-overview.component.html',
  styleUrls: ['./mobile-clip-overview.component.scss']
})
export class MobileClipOverviewComponent implements OnInit, OnDestroy {

  public currentColumnSize = 50;
  public groupedClipList$: Observable<IGroupedList[]> = this.appQueries.clipList$.pipe(
    tap(allClips => console.info('PRE',{allClips})),
    map(allClips => sortClips(allClips.filter(c => c.showOnMobile))),
    tap(allClips => console.info('POST', {allClips})),
    map(allClips => {
      const groupedDictionary = groupBy(allClips, "type");

      console.info({groupedDictionary});

      const groupedEntries = Object.entries(groupedDictionary)
        .map(([key, clips]) => {
        const mediaType = +key;

        const typeInfo = MEDIA_TYPE_INFORMATION[mediaType];

        return {
          clips: clips,
          icon: typeInfo.icon,
          title: typeInfo.label,
          order: typeInfo.sortOrder
        } as IGroupedList;
      });

      return orderBy(groupedEntries, 'order');
    } )
  );

  connectionState$ = this._wsService.connectionState$;

  ConnectionState = ConnectionState;

  private _destroy$ = new Subject();
  constructor(private appQueries: AppQueries,
              private appService: AppService,
              private _wsService: WebsocketService,
              private _settingsService: SettingsService,
              public activityState: ActivityQueries) {
    const savedColumnSizeStringValue = this._settingsService.loadSetting(SettingMobileColumnSize, '50');

    // refactor later...
    this.currentColumnSize = +savedColumnSizeStringValue;
  }

  ngOnInit(): void {
    this.appService.loadState();

    this._wsService.onOpenConnection$.pipe(
      take(1)
    ).subscribe(value => {
      this._wsService.sendI_Am_OBS('1');
    })

    this._wsService.onUpdateData$.pipe(
      takeUntil(this._destroy$),
    ).subscribe(value => {
      this.appService.loadState();
    });
  }


  onPreview(item: Clip) {
    this._wsService.triggerClipOnScreen(item.id);
  }

  onColumnSizeChanged($event: number) {
    this.currentColumnSize = $event;
    this._settingsService.saveSetting(SettingMobileColumnSize, `${$event}`);
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  reloadPage() {
    location.reload();
  }
}
