import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommudleButtonModule } from './commudle-button.module';

@Component({
  template: `
    <button comButton status="primary" size="small" shape="semi-round">Save</button>
    <a comButton status="danger" [disabled]="true" href="/test">Link</a>
    <button comButton outline status="basic">Outline</button>
    <button comButton status="primary" type="submit">Submit</button>
  `,
  standalone: false,
})
class TestHostComponent {}

describe('ComButtonComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestHostComponent],
      imports: [CommudleButtonModule],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should apply nebular-compatible classes on button', () => {
    const button = fixture.nativeElement.querySelector('button');
    expect(button.className).toContain('com-button');
    expect(button.className).toContain('appearance-filled');
    expect(button.className).toContain('status-primary');
    expect(button.className).toContain('size-small');
    expect(button.className).toContain('shape-semi-round');
  });

  it('should set outline appearance', () => {
    const outlineButton = fixture.nativeElement.querySelectorAll('button')[1];
    expect(outlineButton.className).toContain('appearance-outline');
    expect(outlineButton.className).toContain('status-basic');
  });

  it('should mark disabled anchor as aria-disabled', () => {
    const anchor = fixture.nativeElement.querySelector('a');
    expect(anchor.getAttribute('aria-disabled')).toBe('true');
    expect(anchor.className).toContain('btn-disabled');
  });

  it('should default button type to button when omitted', () => {
    const button = fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('type')).toBe('button');
  });

  it('should preserve explicit type="submit"', () => {
    const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(submitButton.getAttribute('type')).toBe('submit');
  });
});
