import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoreMenuModal } from './more-menu-modal';

describe('MoreMenu', () => {
  let component: MoreMenuModal;
  let fixture: ComponentFixture<MoreMenuModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoreMenuModal],
    }).compileComponents();

    fixture = TestBed.createComponent(MoreMenuModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
