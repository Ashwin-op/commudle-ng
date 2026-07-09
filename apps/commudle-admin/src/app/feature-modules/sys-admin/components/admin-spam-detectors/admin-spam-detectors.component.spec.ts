import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { SeoService, ToastrService } from '@commudle/shared-services';
import { NbDialogService } from '@commudle/theme';
import { SpamDetectorService } from '../../services/spam-detector.service';
import { AdminSpamDetectorsComponent } from './admin-spam-detectors.component';
import { ISpamDetector } from '@commudle/shared-models';

const buildSpamDetectorFixture: ISpamDetector = {
  id: 1,
  request_sent_at: '2026-07-08T10:00:00Z',
  response_received_at: '2026-07-08T10:01:00Z',
  is_spam: true,
  score: 0.88,
  is_spam_decision: null,
  created_at: '2026-07-08T10:00:00Z',
  updated_at: '2026-07-08T10:01:00Z',
  content_type: 'CommunityBuild',
  content_id: 5,
  community_build: {
    name: 'Demo Build',
    description: 'Build description',
    slug: 'demo-build',
  } as any,
  content_user_preview: null,
  user: {
    id: 10,
    name: 'Build Owner',
    username: 'build-owner',
    blocked: false,
  },
};

const userSpamDetectorFixture: ISpamDetector = {
  id: 2,
  request_sent_at: '2026-07-08T10:00:00Z',
  response_received_at: '2026-07-08T10:01:00Z',
  is_spam: true,
  score: 0.92,
  is_spam_decision: null,
  created_at: '2026-07-08T10:00:00Z',
  updated_at: '2026-07-08T10:01:00Z',
  content_type: 'User',
  content_id: 22,
  community_build: null,
  content_user_preview: {
    name: 'Alice Example',
    username: 'alice',
    designation: 'Developer Advocate',
    location: 'Bengaluru',
    about_me: 'Builder and mentor',
  },
  user: {
    id: 22,
    name: 'Alice Example',
    username: 'alice',
    blocked: false,
    avatar: '',
    photo: null,
  },
};

describe('AdminSpamDetectorsComponent', () => {
  let component: AdminSpamDetectorsComponent;
  let fixture: ComponentFixture<AdminSpamDetectorsComponent>;

  const spamDetectorServiceStub = {
    getSpamResult: jasmine
      .createSpy('getSpamResult')
      .and.returnValue(of({ values: [buildSpamDetectorFixture], total: 1, page: 1, count: 10 })),
    updateSpamDetector: jasmine.createSpy('updateSpamDetector').and.returnValue(of({})),
  };

  const dialogServiceStub = {
    open: jasmine.createSpy('open').and.returnValue({ onClose: of(false) }),
  };

  const seoServiceStub = {
    noIndex: jasmine.createSpy('noIndex'),
    setTitle: jasmine.createSpy('setTitle'),
  };

  const toastrServiceStub = {
    successDialog: jasmine.createSpy('successDialog'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminSpamDetectorsComponent],
      imports: [CommonModule, FormsModule, RouterTestingModule],
      providers: [
        { provide: SpamDetectorService, useValue: spamDetectorServiceStub },
        { provide: NbDialogService, useValue: dialogServiceStub },
        { provide: SeoService, useValue: seoServiceStub },
        { provide: ToastrService, useValue: toastrServiceStub },
        ChangeDetectorRef,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminSpamDetectorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should detect user and build content types correctly', () => {
    expect(component.isCommunityBuildContent(buildSpamDetectorFixture)).toBeTrue();
    expect(component.isUserContent(buildSpamDetectorFixture)).toBeFalse();
    expect(component.isUserContent(userSpamDetectorFixture)).toBeTrue();
    expect(component.isCommunityBuildContent(userSpamDetectorFixture)).toBeFalse();
  });

  it('should return the correct display name for both content types', () => {
    expect(component.getContentDisplayName(buildSpamDetectorFixture)).toBe('Demo Build');
    expect(component.getContentDisplayName(userSpamDetectorFixture)).toBe('Alice Example');
  });

  it('should render community build rows as before', () => {
    component.spamDetectors = [buildSpamDetectorFixture];
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Demo Build');
    expect(fixture.nativeElement.textContent).toContain('Build description');
    expect(fixture.nativeElement.textContent).toContain('View Build');
  });

  it('should render user rows with compact user summary', () => {
    component.spamDetectors = [userSpamDetectorFixture];
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Alice Example');
    expect(fixture.nativeElement.textContent).toContain('Developer Advocate');
    expect(fixture.nativeElement.textContent).toContain('Bengaluru');
    expect(fixture.nativeElement.textContent).toContain('Builder and mentor');
    expect(fixture.nativeElement.textContent).toContain('View Profile');
  });
});
