import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvailableCapacityModal } from './available-capacity-modal';
import { LoadCalculatorPage } from '../../../features/packaking-manager-page/layout/load-calculator-page';

describe('AvailableCapacityModal', () => {
  let component: AvailableCapacityModal;
  let fixture: ComponentFixture<AvailableCapacityModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvailableCapacityModal],
      providers: [{ provide: LoadCalculatorPage, useValue: {} }]
    }).compileComponents();

    fixture = TestBed.createComponent(AvailableCapacityModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
