import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IUser, ICommunity, IHackathon, IHackathonJudge, EHackathonJudgeType } from '@commudle/shared-models';
import { NbDialogService } from '@commudle/theme';
import { AppUsersService } from 'apps/commudle-admin/src/app/services/app-users.service';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { SearchService } from 'apps/commudle-admin/src/app/feature-modules/search/services/search.service';
import { faFileImage, faXmark } from '@fortawesome/free-solid-svg-icons';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ICommunityGroup } from 'apps/shared-models/community-group.model';
import { SeoService, countries_details } from '@commudle/shared-services';

@Component({
  selector: 'commudle-hackathon-control-panel-speaker-judge',
  templateUrl: './hackathon-control-panel-speaker-judge.component.html',
  styleUrls: ['./hackathon-control-panel-speaker-judge.component.scss'],
  standalone: false,
})
export class HackathonControlPanelSpeakerJudgeComponent implements OnInit, OnDestroy {
  fetchSpeakerJudge: FormGroup;
  speakerRegistrationForm: FormGroup;
  imageUrl: string;
  imageBlob: Blob;
  judges: IHackathonJudge[];
  icons = {
    faFileImage,
    faXmark,
  };
  hackathonSlug = '';
  profileExist = false;
  userSuggestions: IUser[] = [];
  isSelectingUser = false;
  EHackathonJudgeType = EHackathonJudgeType;
  subscriptions: Subscription[] = [];
  parent: ICommunity | ICommunityGroup;
  hackathon: IHackathon;
  countries = countries_details;

  @ViewChild('judgeForm', { static: true }) judgeFormDialog: TemplateRef<any>;

  constructor(
    private fb: FormBuilder,
    private hackathonService: HackathonService,
    private dialogService: NbDialogService,
    private appUsersService: AppUsersService,
    private searchService: SearchService,
    private activatedRoute: ActivatedRoute,
    private seoService: SeoService,
  ) {
    this.fetchSpeakerJudge = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });

    this.speakerRegistrationForm = this.fb.group({
      name: ['', Validators.required],
      about: ['', Validators.required],
      email: ['', Validators.required],
      company: ['', Validators.required],
      designation: ['', Validators.required],
      username: [''],
      twitter: ['', this.urlValidator],
      linkedin: ['', this.urlValidator],
      website: ['', this.urlValidator],
      user_id: [''],
      judge_type: ['', Validators.required],
      phone: [''],
      phone_country_code: ['91'],
    });
  }

  ngOnInit() {
    this.seoService.noIndex(true);
    this.subscriptions.push(
      this.activatedRoute.parent.parent.paramMap.subscribe((params) => {
        this.hackathonSlug = params.get('hackathon_id');
        this.indexJudges(params.get('hackathon_id'));
        this.fetchHackathonDetails(params.get('hackathon_id'));
      }),
    );
    this.setupUsernameAutocomplete();
  }

  ngOnDestroy(): void {
    this.seoService.noIndex(false);
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }

  fetchHackathonDetails(hackathonId) {
    this.subscriptions.push(
      this.hackathonService.showHackathon(hackathonId).subscribe((data) => {
        this.hackathon = data;
        if (data.community) {
          this.parent = data.community;
        }
        if (data.community_group) {
          this.parent = data.community_group;
        }
        this.setMeta();
      }),
    );
  }

  urlValidator(control) {
    if (control.value && !/^https?:\/\//.test(control.value)) {
      return { invalidUrl: true };
    }
    return null;
  }

  indexJudges(hackathonId) {
    this.hackathonService.indexJudge(hackathonId).subscribe((data: IHackathonJudge[]) => {
      this.judges = data;
    });
  }

  fetchSpeakerJudgeDetails() {
    this.profileExist = false;
    const email = this.fetchSpeakerJudge.get('email').value?.toLowerCase();

    this.hackathonService.check_duplicate_judge(email, this.hackathonSlug).subscribe((data) => {
      this.appUsersService.getProfileByEmail(data).subscribe((userData: IUser) => {
        const judgeType = this.speakerRegistrationForm.controls['judge_type'].value;

        if (userData) {
          this.loadUserProfile(userData, judgeType);
        } else {
          this.speakerRegistrationForm.patchValue({
            email: email,
            judge_type: judgeType,
          });
        }
        this.dialogService.open(this.judgeFormDialog).onClose.subscribe(() => this.resetSpeakerRegistrationForm());
        this.fetchSpeakerJudge.reset();
      });
    });
  }

  loadUserProfile(userData: IUser, judgeType: string) {
    this.speakerRegistrationForm.reset();
    this.profileExist = true;

    if (
      userData.photo?.url &&
      (userData.photo.url.startsWith('http://') || userData.photo.url.startsWith('https://'))
    ) {
      this.imageUrl = userData.photo.url;
    } else {
      this.imageUrl = '';
    }

    this.speakerRegistrationForm.patchValue({
      name: userData.name,
      about: userData.about_me,
      email: userData.email,
      designation: userData.designation,
      twitter: userData.twitter || '',
      linkedin: userData.linkedin || '',
      website: userData.personal_website || '',
      username: userData.username,
      user_id: userData.id,
      judge_type: judgeType,
      phone: userData.phone || '',
      phone_country_code: userData.phone_country_code || '',
    });
  }

  openEditJudgeDialogBox(dialog, judge: IHackathonJudge, index) {
    this.speakerRegistrationForm.patchValue({
      name: judge.name,
      about: judge.about,
      email: judge.email,
      designation: judge.designation,
      twitter: judge.twitter ? judge.twitter : '',
      linkedin: judge.linkedin ? judge.linkedin : '',
      website: judge.website ? judge.website : '',
      username: judge.username,
      company: judge.company,
      judge_type: judge.judge_type,
      phone: judge.phone || '',
      phone_country_code: judge.phone_country_code || '91',
    });
    this.imageUrl = judge.photo?.url;

    this.dialogService
      .open(dialog, {
        context: { index: index, judge: judge },
      })
      .onClose.subscribe(() => this.resetSpeakerRegistrationForm());
  }

  createJudge() {
    const formData = new FormData();

    Object.entries(this.speakerRegistrationForm.value).forEach(([key]) => {
      let value = this.speakerRegistrationForm.value[key];
      if (key === 'email' && value) {
        value = value.toLowerCase();
      }
      formData.append('hackathon_judge[' + key + ']', value);
    });

    if (this.imageUrl.length > 0) {
      if (this.imageBlob) {
        formData.append('profile_image', this.imageBlob);
      } else {
        formData.append('fetch_from_user', true.toString());
      }
    }

    this.hackathonService.createJudge(formData, this.hackathonSlug).subscribe((data: IHackathonJudge) => {
      if (data) {
        this.judges.unshift(data);
      }
      this.resetSpeakerRegistrationForm();
    });
  }

  onImageChange(event: any) {
    this.imageBlob = null;
    const file = event.target.files[0];

    if (file) {
      this.imageBlob = file;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imageUrl = '';
        this.imageUrl = e.target.result;
      };

      reader.readAsDataURL(file);
    }
  }

  updateJudge(JudgeId, index) {
    const formData = new FormData();

    Object.entries(this.speakerRegistrationForm.value).forEach(([key]) => {
      let value = this.speakerRegistrationForm.value[key];
      if (key === 'email' && value) {
        value = value.toLowerCase();
      }
      formData.append('hackathon_judge[' + key + ']', value);
    });

    if (this.imageUrl.length > 0) {
      if (this.imageBlob) {
        formData.append('profile_image', this.imageBlob);
      }
    }

    this.hackathonService.updateJudge(formData, JudgeId).subscribe((data: IHackathonJudge) => {
      this.judges[index] = data;
      this.resetSpeakerRegistrationForm();
    });
  }

  removeBannerImage() {
    this.imageUrl = '';
    this.imageBlob = null;
  }

  confirmDeleteDialogBox(dialog, judgeId, index) {
    this.dialogService.open(dialog, {
      context: { index: index, judgeId: judgeId },
    });
  }

  destroyJudge(JudgeId, index) {
    this.hackathonService.destroyJudge(JudgeId).subscribe((data) => {
      if (data) this.judges.splice(index, 1);
    });
  }

  setupUsernameAutocomplete() {
    this.subscriptions.push(
      this.fetchSpeakerJudge
        .get('email')
        .valueChanges.pipe(debounceTime(300), distinctUntilChanged())
        .subscribe((value) => {
          if (!this.isSelectingUser && value && value.length > 2) {
            this.searchUsers(value);
          } else {
            this.userSuggestions = [];
          }
        }),
    );
  }

  searchUsers(query: string) {
    this.searchService.getSearchResultsByScope(query, 1, 5, 'User').subscribe((data) => {
      this.userSuggestions = (data.results as IUser[]) || [];
    });
  }

  selectUser(selectedValue: any) {
    const email = selectedValue;
    if (email) {
      this.userSuggestions = [];
      this.isSelectingUser = true;

      this.hackathonService.check_duplicate_judge(email, this.hackathonSlug).subscribe((data) => {
        this.appUsersService.getProfileByEmail(data).subscribe((userData: IUser) => {
          const judgeType = this.speakerRegistrationForm.controls['judge_type'].value;

          if (userData) {
            this.loadUserProfile(userData, judgeType);
          } else {
            this.speakerRegistrationForm.patchValue({
              email: email,
              judge_type: judgeType,
            });
          }
          this.dialogService.open(this.judgeFormDialog).onClose.subscribe(() => this.resetSpeakerRegistrationForm());
          this.isSelectingUser = false;
        });
      });
    }
  }

  setMeta() {
    this.seoService.setTitle(`Judges, Speakers & Mentors | Dashboard | ${this.hackathon.name} | ${this.parent.name}`);
  }

  resetSpeakerRegistrationForm() {
    this.speakerRegistrationForm.reset();
    this.speakerRegistrationForm.patchValue({
      email: '',
      judge_type: '',
      phone_country_code: '91',
    });
    this.fetchSpeakerJudge.patchValue({
      email: '',
    });
    this.imageUrl = '';
    this.imageBlob = null;
    this.profileExist = false;
  }
}
