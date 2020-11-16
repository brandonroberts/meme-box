import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder} from '@angular/forms';
import {Observable, Subject} from 'rxjs';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {Clip, Dictionary, Twitch, TwitchEventTypes, TwitchTypesArray} from '@memebox/contracts';
import {AppService} from '../../../../state/app.service';
import {AppQueries} from '../../../../state/app.queries';
import {SnackbarService} from '../../../../core/services/snackbar.service';
import {DialogService} from "../dialog.service";

// TODO better class/interface name?
const INITIAL_TWITCH: Partial<Twitch> = {
  name: '',
  event: TwitchEventTypes.message,
  contains: '',
  active: true,
  roles: []
};

interface TwitchLevelEntry {
  label: string;
  type: string;
}

const TWITCH_LEVELS: TwitchLevelEntry[] = [
  {
    type: 'broadcaster',
    label: 'Broadcaster'
  },
  {
    type: 'moderator',
    label: 'Moderator'
  },
  {
    type: 'vip',
    label: 'VIP'
  },
  {
    type: 'founder',
    label: 'Founder'
  },
  {
    type: 'subscriber',
    label: 'Subscriber'
  },
  {
    type: 'user',
    label: 'User'
  }
];

@Component({
  selector: 'app-twitch-edit',
  templateUrl: './twitch-edit.component.html',
  styleUrls: ['./twitch-edit.component.scss']
})
export class TwitchEditComponent implements OnInit, OnDestroy {
  public form = new FormBuilder().group({
    id: "",
    name: "",
    event: "",
    clipId: "",
    contains: "",
    minAmount: undefined,
    maxAmount: undefined
  });

  twitchEvents = TwitchTypesArray;
  TWITCH_LEVELS = TWITCH_LEVELS;

  twitchEventTypes = TwitchEventTypes;

  clipDictionary$: Observable<Dictionary<Clip>> = this.appQuery.clipMap$;


  private _destroy$ = new Subject();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Twitch,
    private dialogRef: MatDialogRef<any>,
    private matDialog: MatDialog,
    private appService: AppService,
    private appQuery: AppQueries,
    private snackBar: SnackbarService,
    private dialogService: DialogService
  ) {
    // Todo find a better to get defaults & stuff
    this.data = Object.assign({}, {...INITIAL_TWITCH}, {
      ...this.data
    });
    this.data.roles = [...this.data.roles];
    console.info({data: this.data});
  }

  async save() {
    if (!this.form.valid) {
      // highlight hack
      this.form.markAllAsTouched();
      return;
    }


    const {value} = this.form;

    const newTwitchValue: Twitch = {
      ...this.data,
      ...value
    };

    console.info(newTwitchValue);
    await this.appService.addOrUpdateTwitchEvent(newTwitchValue);

    // todo refactor "better way?" to trigger those snackbars
    this.snackBar.normal(`Twitch "${newTwitchValue.name}" ${newTwitchValue.id ? 'updated' : 'added'}`);

    this.dialogRef.close();


  }

  ngOnInit(): void {
    this.form.reset(this.data);
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  async selectEventClip() {
    const clipId = await this.dialogService.showClipSelectionDialog(
      this.form.value.clipId, this.data.name
    )

    if (clipId) {
      console.info({clipId});

      this.form.patchValue({
        clipId
      });
    }
  }

  toggleRole(role: string) {


    if (this.data.roles.includes(role)) {
      const indexOfRole = this.data.roles.indexOf(role);

      this.data.roles.splice(indexOfRole, 1);
    } else {
      this.data.roles.push(role);
    }
  }
}
