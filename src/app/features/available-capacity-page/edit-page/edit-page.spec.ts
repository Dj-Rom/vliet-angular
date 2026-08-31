import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { EditPage } from './edit-page';
import { AvailableCapacityService } from '../../../core/services/available-capacity.service';

describe('EditPage', () => {
  let component: EditPage;
  let fixture: ComponentFixture<EditPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditPage],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'CC' } } }
        },
        {
          provide: AvailableCapacityService,
          useValue: { getTruck: () => ({ canLoad: {}, currentLoaded: {} }) }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
