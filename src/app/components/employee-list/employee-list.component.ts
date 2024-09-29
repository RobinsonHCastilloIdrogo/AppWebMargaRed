import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeModalComponent } from '../employee-modal/employee-modal.component';

interface Employee {
  dni: string;
  name: string;
  entryDate: string;
  workerType: string;
  position: string;
  area: string;
}

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule, EmployeeModalComponent],
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.css'],
})
export class EmployeeListComponent {
  employees: Employee[] = []; // Lista de empleados
  searchTerm: string = ''; // Término de búsqueda de nombre
  searchDate: string = ''; // Término de búsqueda de fecha
  isModalOpen: boolean = false;

  constructor() {
    this.employees = [
      {
        dni: '12345678',
        name: 'Juan Perez',
        entryDate: '2022-01-15',
        workerType: 'Full-Time',
        position: 'Developer',
        area: 'IT',
      },
      {
        dni: '87654321',
        name: 'Ana Lopez',
        entryDate: '2021-03-20',
        workerType: 'Part-Time',
        position: 'Designer',
        area: 'Marketing',
      },
    ];
  }

  // Filtrar empleados por nombre y fecha
  filteredEmployees() {
    return this.employees.filter((employee) => {
      const matchesName = employee.name
        .toLowerCase()
        .includes(this.searchTerm.toLowerCase());

      const matchesDate =
        !this.searchDate || employee.entryDate === this.searchDate;

      return matchesName && matchesDate;
    });
  }

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }
}
