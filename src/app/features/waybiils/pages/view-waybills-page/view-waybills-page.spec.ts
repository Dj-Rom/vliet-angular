import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewWaybillsPage } from './view-waybills-page';

describe('ViewWaybillsPage', () => {
  let component: ViewWaybillsPage;
  let fixture: ComponentFixture<ViewWaybillsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewWaybillsPage],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewWaybillsPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
