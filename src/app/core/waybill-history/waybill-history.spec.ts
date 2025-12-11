import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaybillHistory } from './waybill-history';

describe('WaybillHistory', () => {
  let component: WaybillHistory;
  let fixture: ComponentFixture<WaybillHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WaybillHistory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WaybillHistory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
