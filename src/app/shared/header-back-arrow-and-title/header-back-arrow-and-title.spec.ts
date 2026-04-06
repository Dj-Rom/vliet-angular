import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderBackArrowAndTitle } from './header-back-arrow-and-title';

describe('HeaderBackArrowAndTitle', () => {
  let component: HeaderBackArrowAndTitle;
  let fixture: ComponentFixture<HeaderBackArrowAndTitle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderBackArrowAndTitle],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderBackArrowAndTitle);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
