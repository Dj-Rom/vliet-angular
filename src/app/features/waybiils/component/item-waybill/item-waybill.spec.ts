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
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
