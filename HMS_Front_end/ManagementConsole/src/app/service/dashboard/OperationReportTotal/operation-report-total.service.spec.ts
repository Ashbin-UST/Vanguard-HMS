import { TestBed } from '@angular/core/testing';

import { OperationReportTotalService } from './operation-report-total.service';

describe('OperationReportTotalService', () => {
  let service: OperationReportTotalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OperationReportTotalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
