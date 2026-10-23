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
  },
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
    getSpamStats: jest.fn().mockReturnValue(of({ total: 2, spam_count: 1, safe_count: 1, pending_decision_count: 2 })),
    getSpamResult: jest.fn().mockReturnValue(of({ values: [buildSpamDetectorFixture], total: 1, page: 1, count: 10 })),
    updateSpamDetector: jest.fn().mockReturnValue(of(buildSpamDetectorFixture)),
  };

  const seoServiceStub = {
    noIndex: jest.fn(),
    setTitle: jest.fn(),
  };

  const toastrServiceStub = {
    successDialog: jest.fn(),
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
    component.moment = jest.requireActual('moment');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should detect user, build, and review decision states correctly', () => {
    expect(component.isCommunityBuildContent(buildSpamDetectorFixture)).toBe(true);
    expect(component.isUserContent(buildSpamDetectorFixture)).toBe(false);
    expect(component.isReviewDecision(buildSpamDetectorFixture)).toBe(false);

    expect(component.isUserContent(userSpamDetectorFixture)).toBe(true);
    expect(component.isCommunityBuildContent(userSpamDetectorFixture)).toBe(false);
    expect(component.isReviewDecision(userSpamDetectorFixture)).toBe(true);
  });

  it.each([true, false, null])('should send the selected spam filter %s and reset pagination', async (value) => {
    component.isSpam = value === null ? true : null;
    component.isSpamDecision = false;
    component.contentType = 'CommunityBuild';
    fixture.detectChanges();
    await fixture.whenStable();
    component.page = 3;
    spamDetectorServiceStub.getSpamResult.mockClear();

    const select = fixture.nativeElement.querySelectorAll('.filter-controls select')[1] as HTMLSelectElement;
    select.selectedIndex = value === null ? 0 : value ? 1 : 2;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.isSpam).toBe(value);
    expect(spamDetectorServiceStub.getSpamResult).toHaveBeenLastCalledWith(1, 10, value, false, 'CommunityBuild');
  });

  it.each([true, false, null])('should send the selected admin filter %s and preserve other filters', async (value) => {
    component.isSpam = false;
    component.isSpamDecision = value === null ? true : null;
    component.contentType = 'User';
    fixture.detectChanges();
    await fixture.whenStable();
    component.page = 3;
    spamDetectorServiceStub.getSpamResult.mockClear();

    const select = fixture.nativeElement.querySelectorAll('.filter-controls select')[2] as HTMLSelectElement;
    select.selectedIndex = value === null ? 0 : value ? 1 : 2;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.isSpamDecision).toBe(value);
    expect(spamDetectorServiceStub.getSpamResult).toHaveBeenLastCalledWith(1, 10, false, value, 'User');
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
