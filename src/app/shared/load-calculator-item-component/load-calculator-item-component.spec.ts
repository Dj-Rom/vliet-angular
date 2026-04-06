import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadCalculatorItemComponent } from './load-calculator-item-component';

describe('LoadCalculatorItemComponent', () => {
  let component: LoadCalculatorItemComponent;
  let fixture: ComponentFixture<LoadCalculatorItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadCalculatorItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadCalculatorItemComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
