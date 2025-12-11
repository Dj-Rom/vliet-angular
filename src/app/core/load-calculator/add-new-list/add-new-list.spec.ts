import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddNewList } from './add-new-list';

describe('AddNewList', () => {
  let component: AddNewList;
  let fixture: ComponentFixture<AddNewList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddNewList]
    })
    .compileComponents();
    fixture = TestBed.createComponent(AddNewList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
