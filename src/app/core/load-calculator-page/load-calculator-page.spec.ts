import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadCalculatorPage } from './load-calculator-page';

describe('LoadCalculatorPage', () => {
  let component: LoadCalculatorPage;
  let fixture: ComponentFixture<LoadCalculatorPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadCalculatorPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoadCalculatorPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
