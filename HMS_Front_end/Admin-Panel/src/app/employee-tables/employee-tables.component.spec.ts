import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeTablesComponent } from './employee-tables.component';

describe('EmployeeTablesComponent', () => {
  let component: EmployeeTablesComponent;
  let fixture: ComponentFixture<EmployeeTablesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeTablesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeTablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
