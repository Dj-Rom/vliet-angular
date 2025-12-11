import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Waybill } from './waybill';

describe('Waybill', () => {
  let component: Waybill;
  let fixture: ComponentFixture<Waybill>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Waybill]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Waybill);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
