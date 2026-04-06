import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvailableCapacity } from './available-capacity';

describe('AvailableCapacity', () => {
  let component: AvailableCapacity;
  let fixture: ComponentFixture<AvailableCapacity>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvailableCapacity],
    }).compileComponents();

    fixture = TestBed.createComponent(AvailableCapacity);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
