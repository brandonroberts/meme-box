import {Component, OnInit} from '@angular/core';
import {WebsocketService} from "../../../../../projects/app-state/src/lib/services/websocket.service";
import {DialogService} from "../../../shared/dialogs/dialog.service";
import {ImportMediaFilesDialogComponent} from "./import-media-files-dialog/import-media-files-dialog.component";
import {ConfigService} from "../../../../../projects/app-state/src/lib/services/config.service";

@Component({
  selector: 'app-persistence-actions',
  templateUrl: './persistence-actions.component.html',
  styleUrls: ['./persistence-actions.component.scss']
})
export class PersistenceActionsComponent implements OnInit {

  constructor(private wsService: WebsocketService,
              private configService: ConfigService,
              private dialog: DialogService) { }

  ngOnInit(): void {

  }

  async deleteAllConfig() {
   const confirmed = await this.dialog.showConfirmationDialog({
      title: 'Are you sure you want to delete all settings?'
    })

    if (confirmed) {
      this.configService.deleteAll();
    }
  }

  importAll() {
    this.dialog.open(ImportMediaFilesDialogComponent);
  }
}
