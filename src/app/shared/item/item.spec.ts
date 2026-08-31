import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Item } from './item';
import { LoadCalculatorPage } from '../../features/packaking-manager-page/layout/load-calculator-page';

describe('Item', () => {
  let component: Item;
  let fixture: ComponentFixture<Item>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Item],
      providers: [{ provide: LoadCalculatorPage, useValue: {} }]
    }).compileComponents();

    fixture = TestBed.createComponent(Item);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
