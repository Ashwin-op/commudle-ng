import { Component, EventEmitter, Input, Output, TemplateRef, ViewChild } from '@angular/core';
import { faPen, faXmark } from '@fortawesome/free-solid-svg-icons';
import { NbDialogRef, NbDialogService } from '@commudle/theme';
import { DataFormEntityResponseGroupsService } from 'apps/commudle-admin/src/app/services/data-form-entity-response-groups.service';
import { IDataFormEntityResponseGroup } from 'apps/shared-models/data_form_entity_response_group.model';
import { LibToastLogService } from 'apps/shared-services/lib-toastlog.service';

@Component({
  selector: 'app-manually-added-speakers',
  templateUrl: './manually-added-speakers.component.html',
  styleUrls: ['./manually-added-speakers.component.scss'],
  standalone: false,
})
export class ManuallyAddedSpeakersComponent {
  @Input() speakers: IDataFormEntityResponseGroup[] = [];
  @Output() editSpeaker = new EventEmitter<IDataFormEntityResponseGroup>();
  @Output() speakerCancelled = new EventEmitter<IDataFormEntityResponseGroup>();

  @ViewChild('cancelDialogTemplate', { static: true }) cancelDialogTemplate: TemplateRef<any>;

  icons = { faPen, faXmark };
  isCancelling = false;

  private dialogRef: NbDialogRef<any>;

  constructor(
    private dialogService: NbDialogService,
    private dataFormEntityResponseGroupsService: DataFormEntityResponseGroupsService,
    private toastLogService: LibToastLogService,
  ) {}

  isCancelled(speaker: IDataFormEntityResponseGroup): boolean {
    return speaker.registration_status?.name === 'cancelled';
  }

  confirmCancel(speaker: IDataFormEntityResponseGroup) {
    this.dialogRef = this.dialogService.open(this.cancelDialogTemplate, { context: { speaker } });
  }

  cancelSpeaker(speaker: IDataFormEntityResponseGroup) {
    this.isCancelling = true;
    this.dataFormEntityResponseGroupsService.cancelManuallyAddedSpeaker(speaker.id).subscribe({
      next: (updated) => {
        this.isCancelling = false;
        this.toastLogService.successDialog('Speaker cancelled');
        this.speakerCancelled.emit(updated);
        this.dialogRef.close();
      },
      error: () => (this.isCancelling = false),
    });
  }
}
