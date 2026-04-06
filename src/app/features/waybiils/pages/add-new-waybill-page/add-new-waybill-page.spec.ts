import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddNewWaybillPage } from './add-new-waybill-page';

describe('AddNewWaybillPage', () => {
  let component: AddNewWaybillPage;
  let fixture: ComponentFixture<AddNewWaybillPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddNewWaybillPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AddNewWaybillPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
