import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoreMenu } from './more-menu';

describe('MoreMenu', () => {
  let component: MoreMenu;
  let fixture: ComponentFixture<MoreMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoreMenu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MoreMenu);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
