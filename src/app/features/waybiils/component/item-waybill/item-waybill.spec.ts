import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemWaybill } from './item-waybill';

describe('ItemWaybill', () => {
  let component: ItemWaybill;
  let fixture: ComponentFixture<ItemWaybill>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemWaybill],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemWaybill);
    component = fixture.componentInstance;
    component.item = { id: 1, dataStart: '2026-08-31T22:00:00', dataFinish: '2026-08-31T23:00:00' };
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
