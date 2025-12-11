import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddNameModal } from './add-name-modal';

describe('AddNameModal', () => {
  let component: AddNameModal;
  let fixture: ComponentFixture<AddNameModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddNameModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddNameModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
