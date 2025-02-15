import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ScreenArrangePreviewComponent} from './screen-arrange-preview.component';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {AutoScaleModule} from '@gewd/components/auto-scale';
import {ClipPreviewModule} from '../../../../../../projects/state-components/src/lib/clip-preview/clip-preview.module';
import {DragResizeMediaModule} from '../drag-resize-media/drag-resize-media.module';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatButtonModule} from '@angular/material/button';
import {PipesModule} from '../../../../../../projects/ui-components/src/lib/pipes/pipes.module';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatDividerModule} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatInputModule} from '@angular/material/input';


@NgModule({
  declarations: [ScreenArrangePreviewComponent],
  exports: [
    ScreenArrangePreviewComponent
  ],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    AutoScaleModule,
    ClipPreviewModule,
    DragResizeMediaModule,
    MatCheckboxModule,
    MatButtonModule,
    PipesModule,
    MatButtonToggleModule,
    ReactiveFormsModule,
    FormsModule,
    MatDividerModule,
    MatIconModule,
    MatTooltipModule,
    MatInputModule
  ]
})
export class ScreenArrangePreviewModule {
}
