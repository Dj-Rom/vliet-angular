import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadLocation } from './load-location';

describe('LoadLocation', () => {
  let component: LoadLocation;
  let fixture: ComponentFixture<LoadLocation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadLocation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoadLocation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
