import { ComponentFixture, TestBed } from '@angular/core/testing';

import { _Alert } from './alert';

describe('_Alert', () => {
  let component: _Alert;
  let fixture: ComponentFixture<_Alert>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [_Alert],
    }).compileComponents();

    fixture = TestBed.createComponent(_Alert);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
