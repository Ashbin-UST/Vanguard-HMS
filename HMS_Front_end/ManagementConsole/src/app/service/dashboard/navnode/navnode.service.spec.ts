import { TestBed } from '@angular/core/testing';

import { NavnodeService } from './navnode.service';

describe('NavnodeService', () => {
  let service: NavnodeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NavnodeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
