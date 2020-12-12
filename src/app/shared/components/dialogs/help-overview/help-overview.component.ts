import {Component, OnInit} from '@angular/core';
import {MarkdownDialogPayload} from "../markdown/markdown.component";
import {DialogService} from "../dialog.service";

@Component({
  selector: 'app-help-overview',
  templateUrl: './help-overview.component.html',
  styleUrls: ['./help-overview.component.scss']
})
export class HelpOverviewComponent implements OnInit {

  public helpItems: MarkdownDialogPayload[] = [
    {
      name: 'Getting Started',
      url: './assets/tutorials/getting_started.md'
    }
  ];

  constructor(private dialogService: DialogService) { }

  ngOnInit(): void {
  }

  openDialog(item: MarkdownDialogPayload) {
    this.dialogService.showMarkdownFile(item)
  }
}
