import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaybiilsPage } from './waybiils';

describe('WaybiilsPage', () => {
  let component: WaybiilsPage;
  let fixture: ComponentFixture<WaybiilsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WaybiilsPage],
    }).compileComponents();

    fixture = TestBed.createComponent(WaybiilsPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
