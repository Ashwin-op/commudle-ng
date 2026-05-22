import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { IHackathonTrack, IHackathonUserResponse, IHackathonUserResponsesGroupByTeam } from '@commudle/shared-models';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { IHackathon } from 'apps/shared-models/hackathon.model';

@Component({
  selector: 'commudle-public-hackathon-project-details-form',
  templateUrl: './public-hackathon-project-details-form.component.html',
  styleUrls: ['./public-hackathon-project-details-form.component.scss'],
  standalone: false,
})
export class PublicHackathonProjectDetailsFormComponent implements OnInit {
  @Input() hackathon: IHackathon;
  @Input() hackathonUserResponse: IHackathonUserResponse;
  @Input() team: IHackathonUserResponsesGroupByTeam;
  @Input() hidePreviousButton = false;
  @Input() submitButtonText = 'Next';
  @Output() createOrUpdateProjectDetails = new EventEmitter<any>();
  @Output() previousButtonEvent = new EventEmitter<any>();

  hackathonTracks: IHackathonTrack[];
  hackathonProjectDetailsForm: FormGroup;

  selectedTrackProblemStatements = [];

  constructor(private hackathonService: HackathonService, private fb: FormBuilder) {
    this.hackathonProjectDetailsForm = this.fb.group({
      hackathon_track_id: ['', Validators.required],
      hackathon_problem_statement_id: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.fetchHackathonTracks();
    // team can be IHackathonUserResponsesGroupByTeam (has .hackathon_team) or IHackathonTeam (direct)
    const trackId = (this.team as any)?.hackathon_team?.track?.id ?? (this.team as any)?.track?.id;
    const psId = (this.team as any)?.hackathon_team?.problem_statement?.id ?? (this.team as any)?.problem_statement?.id;
    if (this.team && (trackId || psId)) {
      this.hackathonProjectDetailsForm.patchValue({
        hackathon_track_id: trackId,
        hackathon_problem_statement_id: psId,
      });
    }
  }

  minWordsValidator(minWords: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return { minWords: true };

      const words = control.value.trim().split(/\s+/); // Split by spaces
      return words.length >= minWords ? null : { minWords: { requiredWords: minWords, actualWords: words.length } };
    };
  }

  updateProblemStatement() {
    const selectedTrackId = this.hackathonProjectDetailsForm.get('hackathon_track_id').value;
    const selectedTrack = this.hackathonTracks.find((track) => track.id == selectedTrackId);

    if (selectedTrack) {
      this.selectedTrackProblemStatements = selectedTrack.hackathon_problem_statements || [];
    } else {
      this.selectedTrackProblemStatements = [];
    }

    // Reset problem statement selection when track changes
    this.hackathonProjectDetailsForm.patchValue({ hackathon_problem_statement_id: '' });
  }

  updateProblemStatementForEdit() {
    const selectedTrackId = this.hackathonProjectDetailsForm.get('hackathon_track_id').value;
    const selectedTrack = this.hackathonTracks.find((track) => track.id == selectedTrackId);

    if (selectedTrack) {
      this.selectedTrackProblemStatements = selectedTrack.hackathon_problem_statements || [];
    } else {
      this.selectedTrackProblemStatements = [];
    }
  }

  fetchHackathonTracks() {
    this.hackathonService.pIndexHackathonTracks(this.hackathon.id).subscribe((data: IHackathonTrack[]) => {
      this.hackathonTracks = data.sort((a, b) => a.name.localeCompare(b.name));
      const hackathonTrackIdControl = this.hackathonProjectDetailsForm.get('hackathon_track_id');
      if (hackathonTrackIdControl && this.hackathonTracks.length > 0) {
        // hackathonTrackIdControl.setValidators([Validators.required]);
      } else if (hackathonTrackIdControl) {
        hackathonTrackIdControl.clearValidators();
      }
      hackathonTrackIdControl.updateValueAndValidity();

      // Update problem statements if track is already selected (edit mode)
      if (this.hackathonProjectDetailsForm.get('hackathon_track_id').value) {
        this.updateProblemStatementForEdit();
      }
    });
  }

  submitProjectDetails() {
    this.createOrUpdateProjectDetails.emit(this.hackathonProjectDetailsForm.value);
  }

  previousButton() {
    this.previousButtonEvent.emit();
  }
}
