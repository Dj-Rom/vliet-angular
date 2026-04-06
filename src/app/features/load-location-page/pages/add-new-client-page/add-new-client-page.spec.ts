import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddNewClientPage } from './add-new-client-page';

describe('AddNewClientPage', () => {
  let component: AddNewClientPage;
  let fixture: ComponentFixture<AddNewClientPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddNewClientPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AddNewClientPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
