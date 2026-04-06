import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AreYourSureModal } from './are-your-sure-modal';

describe('AreYourSureModal', () => {
  let component: AreYourSureModal;
  let fixture: ComponentFixture<AreYourSureModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AreYourSureModal],
    }).compileComponents();

    fixture = TestBed.createComponent(AreYourSureModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
