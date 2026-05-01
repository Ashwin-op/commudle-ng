/* eslint-disable @nx/enforce-module-boundaries */
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { NbDialogService } from '@commudle/theme';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

import { IHackathon, IHackathonProblemStatement, IHackathonTrack } from '@commudle/shared-models';
import { HackathonPrizeFormComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-tracks-prizes/hackathon-prize-form/hackathon-prize-form.component';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';

@Component({
  selector: 'commudle-hackathon-control-panel-track',
  templateUrl: './hackathon-control-panel-track.component.html',
  styleUrls: ['./hackathon-control-panel-track.component.scss'],
  standalone: false,
})
export class HackathonControlPanelTrackComponent implements OnInit {
  trackForm: FormGroup;
  hackathon: IHackathon;
  hackathonTracks: IHackathonTrack[];
  hackathonSlug = '';
  isLoading = true;
  currentTrackIndex: number;
  icons = { faPlus };

  tinyMCE = {
    min_height: 200,
    menubar: false,
    convert_urls: false,
    placeholder: 'About',
    content_style:
      "@import url('https://fonts.googleapis.com/css?family=Inter'); body {font-family: 'Inter'; font-size: 16px !important;}",
    plugins: ['emoticons', 'lists', 'preview', 'table', 'autoresize', 'media'],
    toolbar: 'bullist numlist emoticons bold italic | backcolor  media table',
    default_link_target: '_blank',
    branding: false,
    license_key: 'gpl',
  };

  constructor(
    private activatedRoute: ActivatedRoute,
    private nbDialogService: NbDialogService,
    private fb: FormBuilder,
    private hackathonService: HackathonService,
  ) {
    this.trackForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      problem_statements: this.fb.array([]),
    });
  }

  ngOnInit() {
    this.activatedRoute.parent.parent.paramMap.subscribe((params) => {
      this.hackathonSlug = params.get('hackathon_id');
      this.hackathonService.showHackathon(this.hackathonSlug).subscribe((data) => {
        this.hackathon = data;
      });
      this.indexTracks(params.get('hackathon_id'));
    });
  }

  get problemStatements(): FormArray {
    return this.trackForm.get('problem_statements') as FormArray;
  }

  createProblemStatementGroup(ps?: IHackathonProblemStatement, trackIndex?: number): FormGroup {
    const psIndex = this.problemStatements.length + 1;
    const displayId = ps?.display_id || this.generateDisplayId(trackIndex, psIndex);

    return this.fb.group({
      id: [ps?.id || null],
      title: [ps?.title || '', [Validators.minLength(60)]],
      max_teams_limit: [ps?.max_teams_limit || null, [Validators.min(1)]],
      display_id: [{ value: displayId, disabled: true }],
    });
  }

  generateDisplayId(trackIndex?: number, psIndex?: number): string {
    const tIndex = trackIndex !== undefined ? trackIndex + 1 : this.hackathonTracks?.length + 1 || 1;
    return `ps${tIndex}${psIndex || 1}`;
  }

  addProblemStatement(): void {
    this.problemStatements.push(this.createProblemStatementGroup(undefined, this.currentTrackIndex));
  }

  removeProblemStatement(index: number): void {
    this.problemStatements.removeAt(index);
    this.trackForm.markAsDirty();
  }

  openTrackDialogBox(dialog, track?: IHackathonTrack, index?) {
    this.trackForm.reset();
    this.problemStatements.clear();
    this.currentTrackIndex = index;

    if (track) {
      this.trackForm.patchValue({
        name: track.name,
        description: track.description,
      });

      if (track.hackathon_problem_statements?.length) {
        track.hackathon_problem_statements.forEach((ps) => {
          this.problemStatements.push(this.createProblemStatementGroup(ps, index));
        });
      }
    }

    this.nbDialogService.open(dialog, {
      context: { index, track },
    });
  }

  confirmDeleteDialogBox(dialog, trackId, index) {
    this.nbDialogService.open(dialog, {
      context: { index, trackId },
    });
  }

  indexTracks(hackathonId) {
    this.hackathonService.indexTracks(hackathonId).subscribe((data: IHackathonTrack[]) => {
      this.hackathonTracks = data;
      this.isLoading = false;
    });
  }

  createTrack() {
    const formValue = this.trackForm.getRawValue();
    const payload = this.buildTrackPayload(formValue);
    this.hackathonService.createTrack(payload, this.hackathonSlug).subscribe((data) => {
      if (data) this.hackathonTracks.unshift(data);
      this.trackForm.reset();
    });
  }

  updateTrack(trackId, index) {
    const formValue = this.trackForm.getRawValue();
    const payload = this.buildTrackPayload(formValue);
    this.hackathonService.updateTrack(payload, trackId).subscribe((data) => {
      this.hackathonTracks[index] = data;
    });
  }

  destroyTrack(trackId, index) {
    this.hackathonService.destroyTrack(trackId).subscribe((data) => {
      if (data) this.hackathonTracks.splice(index, 1);
    });
  }

  prizeDialogBox(selectedTrackId?: number) {
    const dialogRef = this.nbDialogService.open(HackathonPrizeFormComponent, {
      context: {
        hackathonId: this.hackathon.id,
        selectedTrackId,
      },
    });

    dialogRef.onClose.subscribe((result) => {
      if (result) {
        const trackIndex = this.hackathonTracks.findIndex((t) => t.id === selectedTrackId);
        if (trackIndex > -1) {
          this.hackathonTracks[trackIndex].hackathon_prizes.push(result);
        }
      }
    });
  }

  private buildTrackPayload(formValue) {
    const filteredPS = formValue.problem_statements
      .filter((ps) => ps.title?.trim())
      .map((ps) => ({
        ...(ps.id && { id: ps.id }),
        title: ps.title,
        ...(ps.max_teams_limit && { max_teams_limit: ps.max_teams_limit }),
        ...(ps.display_id && { display_id: ps.display_id }),
      }));

    return {
      name: formValue.name,
      description: formValue.description,
      ...(filteredPS.length && { problem_statements: filteredPS }),
    };
  }
}
