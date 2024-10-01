import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeListComponent } from './employee-list/employee-list.component';
import { EmployeeModalComponent } from './employee-modal/employee-modal.component';
import { SharedDashboardComponent } from '../shared-dashboard/shared-dashboard.component';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [
    CommonModule,
    EmployeeListComponent,
    EmployeeModalComponent,
    SharedDashboardComponent,
  ],
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.css'],
})
export class EmployeesComponent {
  showModal: boolean = false;

  closeEmployeeModal() {
    this.showModal = false;
  }
}
