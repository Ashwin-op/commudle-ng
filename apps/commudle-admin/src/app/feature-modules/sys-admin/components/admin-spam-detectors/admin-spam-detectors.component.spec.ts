import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { SeoService, ToastrService } from '@commudle/shared-services';
import { SpamDetectorService } from '../../services/spam-detector.service';
import { AdminSpamDetectorsComponent } from './admin-spam-detectors.component';
import { ISpamDetector } from '@commudle/shared-models';

const buildSpamDetectorFixture: ISpamDetector = {
  id: 1,
  request_sent_at: '2026-07-08T10:00:00Z',
  response_received_at: '2026-07-08T10:01:00Z',
  is_spam: true,
  score: 0.88,
  confidence: 0.95,
  decision: 'block',
  reason: 'Commercial link spam',
  spam_signals: ['affiliate link'],
  llm_model: 'gpt-4o-mini',
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
  is_spam: false,
  score: 0.45,
  confidence: 0.72,
  decision: 'review',
  reason: 'Suspicious domain',
  spam_signals: ['disposable_email'],
  llm_model: 'gpt-4o-mini',
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
    getSpamStats: jasmine
      .createSpy('getSpamStats')
      .and.returnValue(of({ total: 2, spam_count: 1, safe_count: 1, pending_decision_count: 2 })),
    getSpamResult: jasmine
      .createSpy('getSpamResult')
      .and.returnValue(of({ values: [buildSpamDetectorFixture], total: 1, page: 1, count: 10 })),
    updateSpamDetector: jasmine.createSpy('updateSpamDetector').and.returnValue(of(buildSpamDetectorFixture)),
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
        { provide: SeoService, useValue: seoServiceStub },
        { provide: ToastrService, useValue: toastrServiceStub },
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

  it('should detect user, build, and review decision states correctly', () => {
    expect(component.isCommunityBuildContent(buildSpamDetectorFixture)).toBeTrue();
    expect(component.isUserContent(buildSpamDetectorFixture)).toBeFalse();
    expect(component.isReviewDecision(buildSpamDetectorFixture)).toBeFalse();

    expect(component.isUserContent(userSpamDetectorFixture)).toBeTrue();
    expect(component.isCommunityBuildContent(userSpamDetectorFixture)).toBeFalse();
    expect(component.isReviewDecision(userSpamDetectorFixture)).toBeTrue();
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
