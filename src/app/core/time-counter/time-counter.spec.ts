import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeCounter } from './time-counter';

describe('TimeCounter', () => {
  let component: TimeCounter;
  let fixture: ComponentFixture<TimeCounter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeCounter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimeCounter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
