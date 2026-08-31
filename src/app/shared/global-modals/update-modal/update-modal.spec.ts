import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';
import { UpdateModal } from './update-modal';
import { UpdateService } from '../../../core/services/update.service';
import { CommonModule } from '@angular/common';

describe('UpdateModal', () => {
  let component: UpdateModal;
  let fixture: ComponentFixture<UpdateModal>;
  let updateServiceMock: any;

  beforeEach(async () => {
    updateServiceMock = {
      applyUpdate: vi.fn(),
      dismissUpdate: vi.fn(),
      isUpdateAvailable: signal(false)
    };

    await TestBed.configureTestingModule({
      imports: [UpdateModal, CommonModule],
      providers: [
        { provide: UpdateService, useValue: updateServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call applyUpdate on updateService when updateNow is called', () => {
    component.updateNow();
    expect(updateServiceMock.applyUpdate).toHaveBeenCalled();
  });

  it('should call dismissUpdate on updateService when later is called', () => {
    component.later();
    expect(updateServiceMock.dismissUpdate).toHaveBeenCalled();
  });
});
