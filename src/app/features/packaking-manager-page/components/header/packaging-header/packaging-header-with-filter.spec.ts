import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PackagingHeaderWithFilter } from './packaging-header-with-filter';

describe('PackakingHeader', () => {
  let component: PackagingHeaderWithFilter;
  let fixture: ComponentFixture<PackagingHeaderWithFilter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PackagingHeaderWithFilter],
    }).compileComponents();

    fixture = TestBed.createComponent(PackagingHeaderWithFilter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
