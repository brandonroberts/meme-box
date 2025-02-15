import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MediaOverviewComponent} from './media-overview/media-overview.component';
import {RouterModule, Routes} from '@angular/router';
import {MatCardModule} from '@angular/material/card';
import {MediaInfoComponent} from './media-overview/media-info/media-info.component';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatDialogModule} from '@angular/material/dialog';
import {MatDividerModule} from '@angular/material/divider';
import {ClipTypeModule} from '../../../../projects/state-components/src/lib/clip-type/clip-type.module';
import {MatListModule} from '@angular/material/list';
import {GettingStartedModule} from '../../shared/components/getting-started/getting-started.module';
import {ConfigMediaPathModule} from './media-overview/config-media-path/config-media-path.module';
import {MatChipsModule} from '@angular/material/chips';
import {PipesModule} from '@memebox/ui-components';
import {CardOverviewModule} from '../../shared/components/card-overview/card-overview.module';
import {FilterModule} from '../../shared/components/filter/filter.module';
import {ClipChipsListModule} from '@memebox/state-components';
import {DynamicIframeModule} from '../../shared/components/dynamic-iframe/dynamic-iframe.module';
import {MatTooltipModule} from '@angular/material/tooltip';
import {AutoScaleModule} from '@gewd/components/auto-scale';
import {MediaCardModule} from './media-overview/media-card/media-card.module';
import {GroupByMediaTypePipe} from './media-overview/group-by-media-type.pipe';
import {TranslocoModule} from "@ngneat/transloco";
import {ActionShortcutToolbarModule} from "./media-overview/action-shortcut-toolbar/action-shortcut-toolbar.module";

const routes: Routes = [
  {
    path: '',
    component: MediaOverviewComponent
  }
];

@NgModule({
  declarations: [MediaOverviewComponent, MediaInfoComponent, GroupByMediaTypePipe],
  exports: [MediaOverviewComponent, MediaInfoComponent],
  imports: [
    PipesModule,
    CommonModule,
    RouterModule.forChild(routes),
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatDividerModule,
    ClipTypeModule,
    MatListModule,
    GettingStartedModule,
    ConfigMediaPathModule,
    MatChipsModule,
    CardOverviewModule,
    FilterModule,
    ClipChipsListModule,
    DynamicIframeModule,
    MatTooltipModule,
    AutoScaleModule,
    MediaCardModule,
    TranslocoModule,
    ActionShortcutToolbarModule
  ]
})
export class MediaModule {}
