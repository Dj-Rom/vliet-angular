import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvailableCapacityModal } from './available-capacity-modal';

describe('AvailableCapacityModal', () => {
  let component: AvailableCapacityModal;
  let fixture: ComponentFixture<AvailableCapacityModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvailableCapacityModal],
    }).compileComponents();

    fixture = TestBed.createComponent(AvailableCapacityModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
