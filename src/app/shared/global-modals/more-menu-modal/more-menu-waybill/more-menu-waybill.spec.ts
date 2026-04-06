import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoreMenuWaybill } from './more-menu-waybill';

describe('MoreMenuWaybill', () => {
  let component: MoreMenuWaybill;
  let fixture: ComponentFixture<MoreMenuWaybill>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoreMenuWaybill],
    }).compileComponents();

    fixture = TestBed.createComponent(MoreMenuWaybill);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
