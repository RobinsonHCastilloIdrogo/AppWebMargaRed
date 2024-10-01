import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedDashboardComponent } from '../shared-dashboard/shared-dashboard.component';
import { FirebaseService } from '../../services/firebase.service'; // Asegúrate de que esta ruta sea correcta

@Component({
  selector: 'app-assign-resources',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedDashboardComponent],
  templateUrl: './assign-resources.component.html',
  styleUrls: ['./assign-resources.component.css'],
})
export class AssignResourcesComponent implements OnInit {
  employees: any[] = []; // Array para empleados
  machines: any[] = []; // Array para máquinas
  selectedEmployee: string = '';
  selectedMachine: string = '';
  selectedMachineName: string = '';

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit(): void {
    // Obtener empleados y máquinas desde Firebase y suscribirse a los observables
    this.firebaseService.getEmployees().subscribe((employees) => {
      this.employees = employees;
    });

    this.firebaseService.getMachines().subscribe((machines) => {
      this.machines = machines;
    });
  }

  // Función para asignar la máquina
  async handleAssignMachine() {
    if (!this.selectedEmployee || !this.selectedMachine) {
      alert('Por favor selecciona un empleado y una máquina.');
      return;
    }

    alert('Máquina asignada exitosamente.');
    this.selectedEmployee = '';
    this.selectedMachine = '';
  }

  // Función para establecer el nombre de la máquina seleccionada
  setSelectedMachineName(event: any) {
    const machine = this.machines.find(
      (machine) => machine.id === event.target.value
    );
    this.selectedMachineName = machine ? machine.name : '';
  }
}
