import { Component, EventEmitter, Input, Output, TemplateRef, ViewChild } from '@angular/core';
import { faEnvelope, faPen, faXmark } from '@fortawesome/free-solid-svg-icons';
import { NbDialogRef, NbDialogService } from '@commudle/theme';
import { DataFormEntityResponseGroupsService } from 'apps/commudle-admin/src/app/services/data-form-entity-response-groups.service';
import { ICommunity } from 'apps/shared-models/community.model';
import { IEvent } from 'apps/shared-models/event.model';
import { EmailerComponent } from 'apps/commudle-admin/src/app/app-shared-components/emailer/emailer.component';
import { EemailTypes } from 'apps/shared-models/enums/email_types.enum';
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
  @Input() event: IEvent;
  @Input() community: ICommunity;
  @Output() editSpeaker = new EventEmitter<IDataFormEntityResponseGroup>();
  @Output() speakerCancelled = new EventEmitter<IDataFormEntityResponseGroup>();

  @ViewChild('cancelDialogTemplate', { static: true }) cancelDialogTemplate: TemplateRef<any>;

  icons = { faEnvelope, faPen, faXmark };
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

  // Same dialog the responses list uses for sending an individual entry pass.
  openEntryPassEmailWindow(speaker: IDataFormEntityResponseGroup) {
    this.dialogService.open(EmailerComponent, {
      context: {
        community: this.community,
        event: this.event,
        eventDataFormEntityGroupId: speaker.event_data_form_entity_group_id,
        mailType: EemailTypes.ENTRY_PASS,
        recipientUsername: speaker.user?.username,
        title: `Send Entry Pass To ${speaker.user?.name}`,
      },
      closeOnBackdropClick: false,
      dialogClass: 'emailer-dialog',
    });
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
