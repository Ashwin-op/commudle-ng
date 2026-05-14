import { SeoService, ToastrService } from '@commudle/shared-services';
import { Component, Input, OnDestroy, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { EHackathonLocationType, EParticipateTypes, IHackathon } from 'apps/shared-models/hackathon.model';
import { faArrowRight, faFileImage, faLink } from '@fortawesome/free-solid-svg-icons';
import { ICommunity } from '@commudle/shared-models';
import { ICommunityGroup } from 'apps/shared-models/community-group.model';
import { Subscription } from 'rxjs';
import { GooglePlacesAutocompleteService } from 'apps/commudle-admin/src/app/services/google-places-autocomplete.service';

@Component({
  selector: 'commudle-hackathon-control-panel-basic-form',
  templateUrl: './hackathon-control-panel-basic-form.component.html',
  styleUrls: ['./hackathon-control-panel-basic-form.component.scss'],
  standalone: false,
})
export class HackathonControlPanelBasicFormComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() saveButtonText = 'Save';
  hackathonForm: FormGroup;
  locationForm: FormGroup;
  hackathonSlug = '';
  parentId = '';
  parentType = '';
  imagePreview = '';
  tags: string[] = [];
  subscriptions: Subscription[] = [];
  hackathon: IHackathon;
  EParticipateTypes = EParticipateTypes;
  EHackathonLocationType = EHackathonLocationType;

  parent: ICommunity | ICommunityGroup;

  icons = {
    faFileImage,
    faLink,
    faArrowRight,
  };

  isLoading = false;

  tinyMCE = {
    min_height: 300,
    menubar: false,
    convert_urls: false,
    placeholder: 'Write description for hackathon',
    content_style:
      "@import url('https://fonts.googleapis.com/css?family=Inter'); body {font-family: 'Inter'; font-size: 16px !important;}",
    plugins: [
      'emoticons',
      'advlist',
      'lists',
      'autolink',
      'link',
      'charmap',
      'preview',
      'anchor',
      'image',
      'visualblocks',
      'code',
      'charmap',
      'codesample',
      'insertdatetime',
      'table',
      'code',
      'help',
      'wordcount',
      'autoresize',
      'media',
    ],
    toolbar:
      'bold italic backcolor | codesample emoticons | link | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | media code | removeformat | table',
    default_link_target: '_blank',
    branding: false,
    license_key: 'gpl',
  };

  constructor(
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private hackathonService: HackathonService,
    private router: Router,
    private toastrService: ToastrService,
    private seoService: SeoService,
    private googlePlacesAutocompleteService: GooglePlacesAutocompleteService,
  ) {
    this.hackathonForm = this.fb.group({
      name: ['', Validators.required],
      tagline: ['', [Validators.required, Validators.maxLength(250)]],
      description: ['', Validators.required],
      hackathon_theme: '',
      number_of_participants: ['', [Validators.required, Validators.min(1)]],
      participate_types: ['', Validators.required],
      hackathon_location_type: ['', Validators.required],
      min_number_of_teammates: [1],
      max_number_of_teammates: [1],
      banner_image: [null],
    });
    // TODO add validator for min number to be 1
    this.locationForm = this.fb.group({
      name: [''],
      address: ['', Validators.required],
      map_link: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.seoService.noIndex(true);
    this.subscriptions.push(
      this.activatedRoute.parent.paramMap.subscribe((params) => {
        this.hackathonSlug = params.get('hackathon_id');
        if (params.get('community_id')) {
          this.parentId = params.get('community_id');
          this.parentType = 'Kommunity';
        }
        if (params.get('community_group_id')) {
          this.parentId = params.get('community_group_id');
          this.parentType = 'CommunityGroup';
        }
        if (this.hackathonSlug) {
          this.fetchHackathonDetails();
        } else {
          this.seoService.setTitle('New Hackathon');
        }
      }),
    );

    this.subscriptions.push(
      this.hackathonForm.get('hackathon_location_type').valueChanges.subscribe((value) => {
        if (value === EHackathonLocationType.OFFLINE || value === EHackathonLocationType.HYBRID) {
          this.initAutocomplete();
        }
      }),
    );
  }

  ngOnDestroy(): void {
    this.seoService.noIndex(false);
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }

  ngAfterViewInit(): void {
    // Init autocomplete if location type is already set (e.g., editing existing hackathon)
    const locationType = this.hackathonForm.get('hackathon_location_type').value;
    if (locationType === EHackathonLocationType.OFFLINE || locationType === EHackathonLocationType.HYBRID) {
      this.initAutocomplete();
    }
  }

  initAutocomplete() {
    setTimeout(() => {
      const addressInput = document.getElementById('addressInput') as HTMLInputElement;
      if (addressInput) {
        this.googlePlacesAutocompleteService.initAutocomplete(addressInput, 'establishment');
        this.googlePlacesAutocompleteService.placeChanged.subscribe((place: google.maps.places.PlaceResult) => {
          this.onLocationPlaceSelected(place);
        });
      }
    });
  }

  onLocationPlaceSelected(place: google.maps.places.PlaceResult) {
    if (place.formatted_address) {
      this.locationForm.get('address').setValue(place.name + ', ' + place.formatted_address);
    }
    if (place.url) {
      this.locationForm.get('map_link').setValue(place.url);
    }
  }

  fetchHackathonDetails() {
    this.hackathonService.showHackathon(this.hackathonSlug).subscribe((data: IHackathon) => {
      this.hackathon = data;
      // TODO: Add Community Group in Future
      if (data.community) {
        this.parent = data.community;
      }
      this.setMeta();
      this.imagePreview = data.banner_image ? data.banner_image.url : '';
      this.hackathonForm.patchValue({
        name: data.name,
        tagline: data.tagline,
        description: data.description,
        hackathon_theme: data.hackathon_theme,
        number_of_participants: data.number_of_participants,
        participate_types: data.participate_types,
        hackathon_location_type: data.hackathon_location_type,
        min_number_of_teammates: data.min_number_of_teammates,
        max_number_of_teammates: data.max_number_of_teammates,
      });
      if (data.tags) {
        data.tags.map((tag) => this.tags.push(tag));
      }
      if (this.hackathon.location_name) {
        this.locationForm.patchValue({
          name: this.hackathon.location_name,
          address: this.hackathon.location_address,
          map_link: this.hackathon.location_map_link,
        });
        this.initAutocomplete();
      }
    });
  }

  onFileChange(event) {
    const file = (event.target as HTMLInputElement).files[0];
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      this.toastrService.warningDialog('Invalid file type. Please select a JPEG, JPG, or PNG file.');
      return;
    }

    // Validate file size
    const maxSizeInBytes = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSizeInBytes) {
      this.toastrService.warningDialog('File size exceeds 5 MB limit.');

      return;
    }
    this.hackathonForm.patchValue({
      banner_image: file,
    });
    this.hackathonForm.get('banner_image').updateValueAndValidity();

    // Display image preview
    this.previewImage(file);
  }

  previewImage(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeBannerImage() {
    this.imagePreview = '';
    this.hackathonForm.patchValue({
      banner_image: null,
    });
  }

  createOrUpdate() {
    if (this.hackathonSlug) {
      this.update();
    } else {
      this.create();
    }
  }

  create() {
    this.isLoading = true;
    const formData = new FormData();

    Object.keys(this.hackathonForm.value).forEach((key) => {
      const value = this.hackathonForm.value[key];

      if (value instanceof File) {
        formData.append('hackathon[' + key + ']', value, value.name); // Append the file with its name
      } else if (key !== 'banner_image') {
        formData.append('hackathon[' + key + ']', value);
      }
    });

    if (this.locationForm.get('address').value) {
      formData.append('location[name]', this.hackathonForm.get('name').value + '- location');
      formData.append('location[address]', this.locationForm.get('address').value);
    }

    if (this.locationForm.get('map_link').value) {
      formData.append('location[map_link]', this.locationForm.get('map_link').value);
    }

    if (this.tags.length > 0) {
      this.tags.forEach((value) => formData.append('hackathon[tags][]', value));
    }

    this.hackathonService.createHackathon(formData, this.parentId, this.parentType).subscribe(
      (data) => {
        if (data)
          this.router.navigate(['/admin', 'communities', this.parentId, 'hackathon-dashboard', data.slug, 'dates']);
        this.isLoading = false;
      },
      () => {
        this.isLoading = false;
      },
    );
  }

  update() {
    this.isLoading = true;
    const formData = new FormData();

    Object.keys(this.hackathonForm.value).forEach((key) => {
      const value = this.hackathonForm.value[key];

      if (value instanceof File) {
        formData.append('hackathon[' + key + ']', value, value.name); // Append the file with its name
      } else if (key !== 'banner_image') {
        formData.append('hackathon[' + key + ']', value);
      }
    });

    if (this.locationForm.get('address').value) {
      formData.append('location[name]', this.hackathonForm.get('name').value + '- location');
      formData.append('location[address]', this.locationForm.get('address').value);
    }

    if (this.locationForm.get('map_link').value) {
      formData.append('location[map_link]', this.locationForm.get('map_link').value);
    }

    if (this.tags.length > 0) {
      this.tags.forEach((value) => formData.append('hackathon[tags][]', value));
    }

    this.hackathonService.updateHackathon(formData, this.hackathon.slug).subscribe(
      (data) => {
        if (data) this.toastrService.successDialog('Hackathon Details updated');
        this.isLoading = false;
      },
      () => {
        this.isLoading = false;
      },
    );
  }

  setMeta() {
    this.seoService.setTags(
      `Basic Information | Dashboard | ${this.hackathon.name} | ${this.parent.name}`,
      this.hackathon.tagline,
      this.hackathon.banner_image?.i320,
    );
  }

  onTagAdd(value: string) {
    if (!this.tags.includes(value)) {
      const finalValue = value.trim();
      this.tags.push(finalValue);
    }
  }

  onTagDelete(value: string) {
    this.tags = this.tags.filter((tag) => tag !== value);
  }
}
