import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectVehicleNumberModal } from './select-vehicle-number-modal';

describe('SelectVehicleNumberPage', () => {
  let component: SelectVehicleNumberModal;
  let fixture: ComponentFixture<SelectVehicleNumberModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectVehicleNumberModal],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectVehicleNumberModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
