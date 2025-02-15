import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild
} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {
  Clip,
  FileInfo,
  MEDIA_TYPE_INFORMATION,
  MEDIA_TYPE_INFORMATION_ARRAY,
  MediaType,
  MetaTriggerTypes,
  Tag
} from "@memebox/contracts";
import {FormBuilder, FormControl, Validators} from "@angular/forms";
import {AppQueries, AppService, SnackbarService} from "@memebox/app-state";
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  pairwise,
  shareReplay,
  startWith,
  take,
  takeUntil
} from "rxjs/operators";
import {BehaviorSubject, combineLatest, Observable, Subject} from "rxjs";
import {COMMA, ENTER} from "@angular/cdk/keycodes";
import {MatAutocomplete, MatAutocompleteSelectedEvent} from "@angular/material/autocomplete";
import {MatChipInputEvent} from "@angular/material/chips";
import {DialogService} from "../dialog.service";
import {
  applyDynamicIframeContentToClipData,
  applyScriptConfigToClipData,
  clipDataToDynamicIframeContent,
  clipDataToScriptConfig,
  DynamicIframeContent,
  ScriptConfig
} from "@memebox/utils";
import {jsCodemirror} from "../../../core/codemirror.extensions";
import {Clipboard} from "@angular/cdk/clipboard";
import {DialogData} from "../dialog.contract";

const DEFAULT_PLAY_LENGTH = 2500;
const META_DELAY_DEFAULT = 750;

const INITIAL_CLIP: Partial<Clip> = {
  tags: [],
  type: MediaType.Picture,
  name: 'Media Filename',
  volumeSetting: 10,
  playLength: DEFAULT_PLAY_LENGTH,
  clipLength: DEFAULT_PLAY_LENGTH, // TODO once its possible to get the data from the clip itself
  metaDelay: META_DELAY_DEFAULT,
  metaType: MetaTriggerTypes.Random,

  showOnMobile: true,

  fromTemplate: ""
};

interface MediaTypeButton {
  type: MediaType;
  name: string;
  icon: string;
}
// TODO REFACTOR!!!!
// TODO maybe use "TYPES WITH PATH"
// TODO extract these informs to the media dictionary?
// TODO REFACTOR use an interface of possible enable/disable of config controls
// TODO hide tag selection for types that cant use it anyway

const MEDIA_TYPES_WITHOUT_PATH = [
  MediaType.Widget,
  MediaType.WidgetTemplate,
  MediaType.Meta,
  MediaType.Script,
  MediaType.PermanentScript
];
const MEDIA_TYPES_WITHOUT_PLAYTIME = [
  MediaType.Meta,
  MediaType.WidgetTemplate,
  MediaType.Script,
  MediaType.PermanentScript
];
const MEDIA_TYPES_WITH_REQUIRED_PLAYLENGTH = [MediaType.Widget, MediaType.Picture, MediaType.IFrame];

export interface MediaEditDialogPayload {
  actionToEdit: Partial<Clip>,
  defaults?: Partial<Clip>
}

@Component({
  selector: "app-media-edit",
  templateUrl: "./media-edit.component.html",
  styleUrls: ["./media-edit.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MediaEditComponent
  implements OnInit, OnDestroy,  DialogData<MediaEditDialogPayload>
{
  public isEditMode = false;
  public actionToEdit: Clip;

  public form = new FormBuilder().group({
    id: "",
    name: "",
    type: 0,
    volumeSetting: 0,
    clipLength: 0,
    playLength: [0, Validators.min(0)],
    path: "",
    previewUrl: "",

    metaType: 0,
    metaDelay: 0,

    fromTemplate: ""
  });

  currentMediaType$ = new BehaviorSubject(INITIAL_CLIP.type);

  availableMediaFiles$ = combineLatest([
    this.appQuery.currentMediaFile$.pipe(filter((files) => !!files)),
    this.currentMediaType$,
  ]).pipe(
    map(([mediaFiles, currentFileType]) => {
      return mediaFiles.filter((m) => m.fileType === currentFileType);
    })
  );

  public jsExtensions = jsCodemirror;
  MEDIA_TYPES_WITHOUT_PATH = MEDIA_TYPES_WITHOUT_PATH;
  MEDIA_TYPES_WITHOUT_PLAYTIME = MEDIA_TYPES_WITHOUT_PLAYTIME;
  MEDIA_TYPES_WITH_REQUIRED_PLAYLENGTH = MEDIA_TYPES_WITH_REQUIRED_PLAYLENGTH;
  MEDIA_TYPE_INFORMATION = MEDIA_TYPE_INFORMATION;

  mediaTypeList: MediaTypeButton[] = MEDIA_TYPE_INFORMATION_ARRAY
    .map((value) => {
      return {
        icon: value.icon,
        name: value.translationKey,
        type: +value.mediaType
      }
    });


  availableScreens$ = this.appQuery.screensList$;
  selectedScreenId = '';
  showOnMobile = true;

  // region Tag specific

  // current available tags in memebox / state
  availableTags$ = this.appQuery.tagList$;

  // Current Tags assigned to this clip
  currentTags$ = new BehaviorSubject<Tag[]>([]);

  // Current custom HTML Content?
  currentHtmlConfig: DynamicIframeContent = null;
  currentHtmlToPreview$ = new BehaviorSubject<DynamicIframeContent>(null);
  triggerHtmlRefresh$ = new Subject();

  currentScript: ScriptConfig = null;

  // Get all clips that have the assigned tags
  taggedClips$ = combineLatest([
    this.currentTags$,
    this.appQuery.clipList$
  ]).pipe(
    map(([currentTags, allClips]) => {
      if (currentTags.length === 0) {
        return [];
      }

      const currentTagsSet = new Set(currentTags.map(t => t.id));

      return allClips.filter(c => c.id !== this.actionToEdit.id && c.tags?.some(t => currentTagsSet.has(t)));
    })
  )


  widgetTemplates$ = this.appQuery.clipList$.pipe(
    map(( allMedias) => {
      return allMedias.filter(c => c.type === MediaType.WidgetTemplate);
    }),
    shareReplay(1)
  );


separatorKeysCodes: number[] = [ENTER, COMMA];
  tagFormCtrl = new FormControl();  // needed in form?!

  // current "filtered" tags
  filteredTags$: Observable<Tag[]>;

  @ViewChild('tagInput') tagInput: ElementRef<HTMLInputElement>;
  @ViewChild('auto') matAutocomplete: MatAutocomplete;

  // endregion

  private _destroy$ = new Subject();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: MediaEditDialogPayload,
    private dialogRef: MatDialogRef<any>,
    private appService: AppService,
    private appQuery: AppQueries,
    private dialogService: DialogService,
    private cd: ChangeDetectorRef,
    private clipboard: Clipboard,
    private snackbar: SnackbarService
  ) {
    const defaultValues = Object.assign({}, INITIAL_CLIP, this.data?.defaults ?? {});

    this.actionToEdit = Object.assign({}, defaultValues, {
      ...this.data?.actionToEdit,
      extended: {
        ...this.data?.actionToEdit?.extended
      }
    }) as Clip;

    this.isEditMode = !!this.data?.actionToEdit;


    if (this.actionToEdit.type === MediaType.Widget
      || this.actionToEdit.type === MediaType.IFrame) {
      this.currentHtmlConfig = clipDataToDynamicIframeContent(this.actionToEdit);
      this.executeHTMLRefresh();
    }

    if ([MediaType.Script, MediaType.PermanentScript].includes(this.actionToEdit.type)) {
      this.currentScript = clipDataToScriptConfig(this.actionToEdit);
    }

    this.showOnMobile = this.actionToEdit.showOnMobile;

    this.currentMediaType$.next(this.actionToEdit.type);
  }

  get MediaType() {
    return MediaType;
  }

  ngOnInit(): void {
    this.form.reset(this.actionToEdit);
    this.appService.listFiles();

    this.form.valueChanges
      .pipe(
        map((value) => value.type as MediaType),
        startWith(this.form.value.type),
        distinctUntilChanged(),
        pairwise(),
        takeUntil(this._destroy$)
      )
      .subscribe(([prev, next]) => {
        this.currentMediaType$.next(next);

        this.form.patchValue({
          path: "",
          previewUrl: "",
        });

        if ([MediaType.Audio, MediaType.Video].includes(next) ) {
          this.form.patchValue({
            playLength: undefined
          });
        }

        if (MEDIA_TYPES_WITH_REQUIRED_PLAYLENGTH.includes(next)) {
          this.form.patchValue({
            playLength: DEFAULT_PLAY_LENGTH
          });
        }

        if (MEDIA_TYPES_WITHOUT_PATH.includes(prev)) {
          console.info('adding validators');
          this.form.controls['path'].setValidators([
            Validators.required,
          ]);
        }

        if (MEDIA_TYPES_WITHOUT_PATH.includes(next)){
          console.info('clearing validators');
          this.form.controls['path'].clearValidators();
        }
      });

    this.availableTags$.pipe(
      take(1)
    ).subscribe(allTags => {
      this.currentTags$.next(allTags.filter(tag => this.actionToEdit.tags.includes(tag.id)));
    });

    this.filteredTags$ = combineLatest([
      this.tagFormCtrl.valueChanges.pipe(
        startWith(null)
      ),
      this.availableTags$,
      this.currentTags$
    ]).pipe(
      map(([tagInputValue, allTags, currentTags]) => this._filter(tagInputValue, allTags, currentTags))
    );

    this.triggerHtmlRefresh$.pipe(
      debounceTime(1000),
      takeUntil(this._destroy$)
    ).subscribe( () => {
      this.executeHTMLRefresh();
    });


    if (this.actionToEdit.fromTemplate) {
      this.onTemplateChanged(this.actionToEdit.fromTemplate);
    }
  }

  async save() {
    if (!this.form.valid) {
      // highlight hack
      this.form.markAllAsTouched();
      console.info(this.form);

      for (const [ctrlName, ctrl] of Object.entries(this.form.controls)) {
        console.info(ctrlName, ctrl.valid);
      }

      return;
    }

    const { value } = this.form;

    const valueAsClip: Clip = {
      ...this.actionToEdit, // base props that are not in the form
      ...value
    };

    const tagsToAssign = this.currentTags$.value;

    for (const tag of tagsToAssign) {
      if (!tag.id) {
        await this.appService.addOrUpdateTag(tag)
      }
    }

    valueAsClip.tags = tagsToAssign.map(tag => tag.id)

    valueAsClip.showOnMobile = this.showOnMobile;

    await this.appService.addOrUpdateClip(valueAsClip);

    if (this.selectedScreenId && valueAsClip.type !== MediaType.Meta) {
      this.appService.addOrUpdateScreenClip(this.selectedScreenId, {
        id: valueAsClip.id,
      });
    }

    this.dialogRef.close();
  }

  onChange($event: FileInfo) {
    this.form.patchValue({
      path: $event.apiUrl,
      name: $event.fileName
    });

    this.markForCheck();
  }

  markForCheck() {
    this.cd.markForCheck();
  }

  updateMediaType(value: MediaType): void {
    this.actionToEdit.type = value;
    this.form.patchValue({ type: value });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  // region Tag specific methods

  // remove this clip
  removeTag(tag: Tag) {
    const currentTags = this.currentTags$.value;

    const index = currentTags.indexOf(tag);

    if (index >= 0) {
      currentTags.splice(index, 1);
    }

    this.currentTags$.next(currentTags);
  }

  // Add an existing Tag to this media-clip
  selectedNewTag($event: MatAutocompleteSelectedEvent) {
    const currentTags = this.currentTags$.value;
    currentTags.push($event.option.value);

    this.tagInput.nativeElement.value = '';
    this.tagFormCtrl.setValue(null);

    this.currentTags$.next(currentTags);
  }

  // Enters a completely new tag to this media-clip
  enterNewTag($event: MatChipInputEvent) {
    const input = $event.input;
    const value = $event.value;

    const currentTags = this.currentTags$.value;


    // Add our tag
    if ((value || '').trim()) {
      currentTags.push({
        color: '',
        id: '',
        name: value.trim()
      } as Tag);
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }

    this.tagFormCtrl.setValue(null);
    this.currentTags$.next(currentTags);
  }

  private _filter(value: string, allTags: Tag[], currentTags: Tag[]): Tag[] {
    const currentTagsSet = new Set(currentTags.map(t => t.id));

    // Ignore current selected tags
    const remainingTags = allTags.filter(t => !currentTagsSet.has(t.id))

    if (typeof value === 'string') {
      const filterValue = value.toLowerCase();

      return remainingTags.filter(tag => tag.name.toLowerCase().indexOf(filterValue) === 0);
    }

    return remainingTags;
  }

  // endregion

  async editHTML() {
    const dynamicIframeContent = clipDataToDynamicIframeContent(this.actionToEdit);

    const dialogResult = await this.dialogService.showWidgetEdit({
      mediaId: this.actionToEdit.id,
      name: this.actionToEdit.name,
      iframePayload: dynamicIframeContent
    });

    if (dialogResult) {
      applyDynamicIframeContentToClipData(dialogResult, this.actionToEdit);

      this.currentHtmlConfig = dialogResult;
      this.executeHTMLRefresh();
      this.cd.detectChanges();
    }
  }

  triggerHTMLRefresh() {
    this.triggerHtmlRefresh$.next();
  }

  executeHTMLRefresh () {
    const currentExtendedValues = this.actionToEdit.extended;

    const updatedHtmlDataset: DynamicIframeContent  = {
      ...this.currentHtmlConfig,
      variables: currentExtendedValues
    };

    this.currentHtmlToPreview$.next(updatedHtmlDataset);
  }

  async onTemplateChanged(mediaId: string) {
    console.info({mediaId});

    const templates = await this.widgetTemplates$.pipe(
      take(1)
    ).toPromise();

    const template = templates.find(t => t.id === mediaId);

    this.currentHtmlConfig = clipDataToDynamicIframeContent(template);
    this.executeHTMLRefresh();
    this.cd.detectChanges();
  }

  async editScript() {
    const scriptConfig = clipDataToScriptConfig(this.actionToEdit);

    const dialogResult = await this.dialogService.showScriptEdit({
      mediaId: this.actionToEdit.id,
      name: this.actionToEdit.name,
      scriptConfig,
      actionType: this.actionToEdit.type
    });

    if (dialogResult) {
      applyScriptConfigToClipData(dialogResult, this.actionToEdit);

      this.currentScript = dialogResult;
      this.cd.detectChanges();
    }
  }

  async copyIdToClipboard() {
    if (this.clipboard.copy(this.actionToEdit.id)) {
      this.snackbar.normal("The Action ID was copied to the clipboard");
    }
  }

  async makeScreenshot(videoElement: HTMLVideoElement) {
    videoElement.controls = false;

    const WANTED_WIDTH = 320;
    const RATIO_TO_CHANGE = videoElement.videoWidth / WANTED_WIDTH;

    var canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth / RATIO_TO_CHANGE;
    canvas.height = videoElement.videoHeight / RATIO_TO_CHANGE;

    var ctx = canvas.getContext('2d');

    // ctx.scale(0.5,0.5);
    //draw image to canvas. scale to target dimensions
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    //convert to desired file format
    var dataPath = canvas.toDataURL('image/jpeg'); // can also use 'image/png'

    this.form.patchValue({
      previewUrl: dataPath
    });

    /* DEBUG Created Image
    var w = window.open("", "_black");
    var image = new Image();
    image.src = dataPath

    w.document.write(image.outerHTML);
*/

      videoElement.controls = true;
    }

  onVideoLoaded($event: Event, videoElement: HTMLVideoElement) {
    console.info('onVideoLoaded', $event);
    if (!this.form.value.previewUrl) {
      setTimeout(() => {
        this.makeScreenshot(videoElement);
      }, 1500);
    }
  }

  onSourceChange($event: Event, videoElement: HTMLVideoElement) {
    console.info($event);


  }
}
