import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddNewVehicle } from './add-new-vehicle';

describe('AddNewVehicle', () => {
  let component: AddNewVehicle;
  let fixture: ComponentFixture<AddNewVehicle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddNewVehicle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddNewVehicle);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
