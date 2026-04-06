import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PwaIstallModal } from './pwa-istall-modal';

describe('PwaIstallModal', () => {
  let component: PwaIstallModal;
  let fixture: ComponentFixture<PwaIstallModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PwaIstallModal],
    }).compileComponents();

    fixture = TestBed.createComponent(PwaIstallModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
