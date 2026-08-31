import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { Profile } from './profile';
import { UpdateService } from '../../core/services/update.service';
import { PwaService } from '../../core/services/pwa.service';

describe('Profile', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [
        { provide: UpdateService, useValue: { isUpdateAvailable: signal(false), isChecking: signal(false) } },
        { provide: PwaService, useValue: { isInstalled: signal(false) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
