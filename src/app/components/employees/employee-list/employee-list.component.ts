import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeModalComponent } from '../employee-modal/employee-modal.component';
import { Firestore, collectionData, collection } from '@angular/fire/firestore'; // Importar Firestore
import { Observable } from 'rxjs';
import { FirebaseAppModule } from '@angular/fire/app';
import { Employee } from '../../../models/employee.model';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule, EmployeeModalComponent],
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.css'],
})
export class EmployeeListComponent {
  employees$: Observable<Employee[]>; // Observable para los empleados
  searchTerm: string = ''; // Término de búsqueda
  searchDate: string = ''; // Término de búsqueda de fecha
  isModalOpen: boolean = false;

  constructor(private firestore: Firestore) {
    const employeesCollection = collection(this.firestore, 'employees'); // Referencia a la colección 'employees'
    this.employees$ = collectionData(employeesCollection, {
      idField: 'id',
    }) as Observable<Employee[]>; // Obtener los datos de Firestore

    // Mostrar los datos en la consola del navegador para verificar
    this.employees$.subscribe((data) => {
      console.log('Empleados obtenidos:', data); // Mostrar los datos obtenidos
    });
  }

  // Filtrar empleados por nombre y fecha
  filteredEmployees(employees: Employee[] | null) {
    if (!employees || employees.length === 0) {
      return []; // Si no hay empleados, retornar un array vacío
    }

    // Verifica si hay un filtro aplicado y si está afectando la lista
    return employees.filter((employee) => {
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
