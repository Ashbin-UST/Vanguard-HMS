import { TestBed } from '@angular/core/testing';

import { AppointmentslistService } from './appointmentslist.service';

describe('AppointmentslistService', () => {
  let service: AppointmentslistService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppointmentslistService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
