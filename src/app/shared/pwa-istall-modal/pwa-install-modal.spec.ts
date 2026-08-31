import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { PwaInstallModal } from './pwa-install-modal';

describe('PwaInstallModal', () => {
  let component: PwaInstallModal;
  let fixture: ComponentFixture<PwaInstallModal>;

  beforeEach(async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    await TestBed.configureTestingModule({
      imports: [PwaInstallModal],
    }).compileComponents();

    fixture = TestBed.createComponent(PwaInstallModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
