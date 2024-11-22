import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import {
  Firestore,
  doc,
  collection,
  getDocs,
  setDoc,
  Timestamp,
  arrayUnion,
  increment,
} from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Machine } from '../../models/machine.model';
import { SharedDashboardComponent } from '../shared-dashboard/shared-dashboard.component';
import Swal from 'sweetalert2';

// Nueva interfaz extendida para incluir projectName
export interface MachineWithProject extends Machine {
  projectName: string; // Nombre del proyecto asociado
}

@Component({
  selector: 'app-fuel-management',
  standalone: true,
  imports: [FormsModule, CommonModule, SharedDashboardComponent],
  templateUrl: './fuel-management.component.html',
  styleUrls: ['./fuel-management.component.css'],
})
export class FuelManagementComponent implements OnInit {
  @Input() machines: MachineWithProject[] = []; // Máquinas cargadas con proyectos asociados
  machineTypes: string[] = [];
  specificMachines: Machine[] = [];
  filteredMachines: MachineWithProject[] = []; // Lista para las máquinas filtradas
  selectedMachine?: MachineWithProject; // Máquina seleccionada para asignar combustible
  fuelAmount: number | null = null; // Inicializado como null
  searchQuery: string = ''; // Variable para el cuadro de búsqueda
  successMessage: string = '';
  errorMessage: string = '';
  fuelMaxLimit: number = 50; // Límite máximo de combustible (en litros).

  constructor(private firestore: Firestore) {}

  ngOnInit(): void {
    this.loadMachines();
  }

  async loadMachines(): Promise<void> {
    try {
      const projectsCollection = collection(this.firestore, '/assignments/2024-11/projects');
      const projectsSnapshot = await getDocs(projectsCollection);
  
      const machinesList: MachineWithProject[] = []; // Lista para todas las máquinas
  
      projectsSnapshot.docs.forEach((projectDoc) => {
        const projectData = projectDoc.data();
        const empleados = projectData['empleados'] || [];
        const projectName = projectData['nombreProyecto'] || 'Sin Proyecto';
  
        // Iterar sobre cada empleado en el proyecto
        empleados.forEach((empleado: any) => {
          const machine = empleado['maquina'];
  
          if (machine && machine.id && machine.nombre) {
            // Verificar si ya existe una máquina con este ID y proyecto en la lista
            const machineExists = machinesList.some(
              (m) => m.id === machine.id && m.projectName === projectName
            );
  
            if (!machineExists) {
              machinesList.push({
                id: machine.id,
                name: machine.nombre,
                quantity: 1,
                status: 'Disponible',
                projectName,
              });
            }
          }
        });
      });
  
      // Actualizar la lista de máquinas en el componente
      this.machines = machinesList;
  
      console.log('Máquinas cargadas:', this.machines);
    } catch (error) {
      console.error('Error al cargar máquinas:', error);
    }
  }
  

  filterMachines(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.filteredMachines = query
      ? this.machines.filter(
          (machine) =>
            machine.name.toLowerCase().includes(query) ||
            machine.id.toLowerCase().includes(query)
        )
      : [];
  }

  selectMachine(machine: MachineWithProject): void {
    this.selectedMachine = machine;
    this.fuelAmount = null; // Limpiar la cantidad de combustible
    this.filteredMachines = []; // Ocultar la lista de máquinas
  }
  
  async assignFuel(): Promise<void> {
    if (this.selectedMachine) {
      // Validar que la cantidad de combustible sea un número válido
      if (
        this.fuelAmount === null ||
        this.fuelAmount <= 0 ||
        isNaN(this.fuelAmount)
      ) {
        Swal.fire({
          title: '¡Advertencia!',
          text: 'La cantidad de combustible debe ser un número mayor que cero.',
          icon: 'warning',
          confirmButtonText: 'Aceptar',
        });
        return;
      }

      // Validar que la cantidad de combustible no exceda el límite máximo
      if (this.fuelAmount > this.fuelMaxLimit) {
        Swal.fire({
          title: '¡Advertencia!',
          text: `La cantidad máxima de combustible por asignación es de ${this.fuelMaxLimit} litros.`,
          icon: 'warning',
          confirmButtonText: 'Aceptar',
        });
        return;
      }

      try {
        const fuelDocRef = doc(
          this.firestore,
          `machines/${this.selectedMachine.name}/fuelAssignments/${this.selectedMachine.id}`
        );

        const newFuelEntry = {
          Combustible: this.fuelAmount,
          Fecha: Timestamp.now(), // Fecha de la asignación individual
        };

        await setDoc(
          fuelDocRef,
          { fuelHistory: arrayUnion(newFuelEntry) },
          { merge: true }
        );

        // Registrar la asignación de combustible en `machineFuelTotals` con fecha completa
        const machineTotalDocRef = doc(
          this.firestore,
          `machineFuelTotals/${this.selectedMachine.id}`
        );
        await setDoc(
          machineTotalDocRef,
          {
            totalFuelAssigned: increment(this.fuelAmount),
            machineType: this.selectedMachine.name,
            dateAssigned: Timestamp.now(), // Almacena la fecha completa de la última asignación
            monthlyTotals: {
              [new Date().toLocaleString('default', { month: 'long' })]:
                increment(this.fuelAmount),
            },
          },
          { merge: true }
        );

        // Mensaje de éxito
        Swal.fire({
          title: '¡Éxito!',
          text: `Combustible asignado a ${this.selectedMachine.name}: ${this.fuelAmount} L`,
          icon: 'success',
          confirmButtonText: 'Aceptar',
        });

        this.resetForm();
      } catch (error) {
        Swal.fire({
          title: '¡Error!',
          text: 'Error al asignar combustible. Intente nuevamente.',
          icon: 'error',
          confirmButtonText: 'Aceptar',
        });
        console.error('Error al asignar combustible:', error);
      }
    }
  }

  private resetForm(): void {
    this.selectedMachine = undefined;
    this.fuelAmount = null;
    this.searchQuery = ''; // Limpia el campo de búsqueda
    this.filteredMachines = []; // Vacía la lista filtrada
  }
}
