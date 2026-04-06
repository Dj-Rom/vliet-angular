import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddNewVehicleModal } from './add-new-vehicle-modal';

describe('AddNewVehicle', () => {
  let component: AddNewVehicleModal;
  let fixture: ComponentFixture<AddNewVehicleModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddNewVehicleModal],
    }).compileComponents();

    fixture = TestBed.createComponent(AddNewVehicleModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
