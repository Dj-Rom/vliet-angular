import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EditClientPage } from './edit-client-page';

describe('EditClientPage', () => {
  let component: EditClientPage;
  let fixture: ComponentFixture<EditClientPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditClientPage],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(EditClientPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
