import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditWaybillsPage } from './edit-waybills-page';

describe('EditWaybillsPage', () => {
  let component: EditWaybillsPage;
  let fixture: ComponentFixture<EditWaybillsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditWaybillsPage],
    }).compileComponents();

    fixture = TestBed.createComponent(EditWaybillsPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
