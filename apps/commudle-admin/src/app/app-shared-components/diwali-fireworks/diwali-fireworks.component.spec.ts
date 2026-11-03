import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiwaliFireworksComponent } from './diwali-fireworks.component';

describe('DiwaliFireworksComponent', () => {
  let component: DiwaliFireworksComponent;
  let fixture: ComponentFixture<DiwaliFireworksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiwaliFireworksComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DiwaliFireworksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
