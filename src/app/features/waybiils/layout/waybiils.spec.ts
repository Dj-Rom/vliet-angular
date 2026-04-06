import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Waybiils } from './waybiils';

describe('Waybiils', () => {
  let component: Waybiils;
  let fixture: ComponentFixture<Waybiils>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Waybiils],
    }).compileComponents();

    fixture = TestBed.createComponent(Waybiils);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
