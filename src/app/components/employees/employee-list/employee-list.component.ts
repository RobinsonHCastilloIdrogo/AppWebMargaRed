import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeModalComponent } from '../employee-modal/employee-modal.component';
import {
  Firestore,
  collectionData,
  collection,
  doc,
  deleteDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Employee } from '../../../models/employee.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule, EmployeeModalComponent],
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.css'],
})
export class EmployeeListComponent {
  employees$: Observable<Employee[]>;
  searchTerm: string = '';
  isModalOpen: boolean = false;
  selectedEmployee: Employee | null = null;

  constructor(private firestore: Firestore) {
    const employeesCollection = collection(this.firestore, 'employees');
    this.employees$ = collectionData(employeesCollection, {
      idField: 'id',
    }) as Observable<Employee[]>;

    this.employees$.subscribe((data) => {
      console.log('Empleados obtenidos:', data);
    });
  }

  filteredEmployees(employees: Employee[] | null) {
    if (!employees || employees.length === 0) {
      return [];
    }
  
    return employees.filter((employee) => {
      const searchTermLower = this.searchTerm.toLowerCase();
  
      // Verificar si el searchTerm coincide con nombre, dni o id (sin importar mayúsculas/minúsculas)
      const matchesName = employee.name.toLowerCase().includes(searchTermLower);
      const matchesDni = employee.dni.toLowerCase().includes(searchTermLower);
      const matchesId = employee.id.toLowerCase().includes(searchTermLower); // Si 'id' es un string, si es otro tipo de dato ajusta según sea necesario
  
      return matchesName || matchesDni || matchesId;
    });
  }  

  openModal() {
    this.selectedEmployee = null; // Reinicia el empleado seleccionado
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedEmployee = null;
  }

  openEditModal(employee: Employee) {
    this.selectedEmployee = employee;
    this.isModalOpen = true;
  }

  confirmDelete(employeeId: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esto!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, borrar!',
      cancelButtonText: 'Cancelar', 
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteEmployee(employeeId);
        Swal.fire('Eliminado!', 'El empleado ha sido eliminado.', 'success');
      }
    });
  }

  deleteEmployee(employeeId: string) {
    const employeeDocRef = doc(this.firestore, `employees/${employeeId}`);
    deleteDoc(employeeDocRef)
      .then(() => {
        console.log('Empleado eliminado:', employeeId);
      })
      .catch((err) => {
        console.error('Error al eliminar empleado:', err);
      });
  }
}
