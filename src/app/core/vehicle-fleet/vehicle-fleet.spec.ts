import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleFleet } from './vehicle-fleet';

describe('VehicleFleet', () => {
  let component: VehicleFleet;
  let fixture: ComponentFixture<VehicleFleet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleFleet]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleFleet);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
