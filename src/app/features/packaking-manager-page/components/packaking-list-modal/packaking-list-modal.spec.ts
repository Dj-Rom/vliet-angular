import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PackakingListModal } from './packaking-list-modal';

describe('PackakingListModal', () => {
  let component: PackakingListModal;
  let fixture: ComponentFixture<PackakingListModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PackakingListModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PackakingListModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
