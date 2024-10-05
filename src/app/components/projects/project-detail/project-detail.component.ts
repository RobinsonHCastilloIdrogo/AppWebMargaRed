import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  Firestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
} from '@angular/fire/firestore';
import { Project } from '../../../models/projects.model';
import { Employee } from '../../../models/employee.model';
import { Machine } from '../../../models/machine.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SharedDashboardComponent } from '../../shared-dashboard/shared-dashboard.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedDashboardComponent],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.css'],
})
export class ProjectDetailComponent implements OnInit {
  projectId: string;
  project: Project | null = null;
  employees: Employee[] = [];
  machines: Machine[] = [];
  selectedEmployeeIds: string[] = [];
  selectedMachineIds: string[] = [];
  isModalOpen = false;
  tempEmployeeIds: string[] = [];
  tempMachineIds: string[] = [];
  selectedEmployeeNames: string[] = [];
  selectedMachineNames: string[] = [];

  constructor(private route: ActivatedRoute, private firestore: Firestore) {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
  }

  ngOnInit() {
    this.getProjectDetails()
      .then(() => {
        return Promise.all([this.getEmployees(), this.getMachines()]);
      })
      .then(() => {
        this.filterAssignedEmployeesAndMachines(); // Filtrar empleados y máquinas no asignados
      })
      .catch((error) => console.error('Error al cargar datos:', error));
  }

  updateSelectedNames() {
    // Actualiza los nombres seleccionados en base a los IDs
    this.selectedEmployeeNames = this.selectedEmployeeIds.map((id) =>
      this.getEmployeeName(id)
    );
    this.selectedMachineNames = this.selectedMachineIds.map((id) =>
      this.getMachineName(id)
    );
  }

  async getProjectDetails() {
    const projectDoc = doc(this.firestore, 'projects', this.projectId);
    const projectSnapshot = await getDoc(projectDoc);

    if (projectSnapshot.exists()) {
      this.project = projectSnapshot.data() as Project;
      this.selectedEmployeeIds = this.project.employeeIds || [];
      this.selectedMachineIds = this.project.machineIds || [];
    } else {
      console.error('No se encontró el proyecto');
    }
  }

  getEmployeeName(employeeId: string): string {
    const employee = this.employees.find((emp) => emp.id === employeeId);
    return employee ? employee.name : 'Desconocido';
  }

  getMachineName(machineId: string): string {
    const machine = this.machines.find((mac) => mac.id === machineId);
    return machine ? machine.name : 'Desconocido';
  }

  async getEmployees() {
    const employeeCollection = collection(this.firestore, 'employees');
    const employeeSnapshot = await getDocs(employeeCollection);
    this.employees = employeeSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Employee[];
  }

  async getMachines() {
    const machineCollection = collection(this.firestore, 'machines');
    const machineSnapshot = await getDocs(machineCollection);
    this.machines = machineSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Machine[];
  }

  filterAssignedEmployeesAndMachines() {
    // Filtrar empleados que ya están asignados al proyecto
    this.employees = this.employees.filter(
      (emp) => !this.selectedEmployeeIds.includes(emp.id)
    );

    // Filtrar máquinas que ya están asignadas al proyecto
    this.machines = this.machines.filter(
      (mac) => !this.selectedMachineIds.includes(mac.id)
    );
  }

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  updateSelectedEmployee(event: Event) {
    const selectedOptions = (event.target as HTMLSelectElement).selectedOptions;
    this.tempEmployeeIds = Array.from(selectedOptions).map(
      (option) => option.value
    );
  }

  updateSelectedMachine(event: Event) {
    const selectedOptions = (event.target as HTMLSelectElement).selectedOptions;
    this.tempMachineIds = Array.from(selectedOptions).map(
      (option) => option.value
    );
  }

  async assignAll() {
    await this.assignEmployees();
    await this.assignMachines();

    // Después de asignar, filtrar nuevamente para que no aparezcan empleados o máquinas asignados
    this.filterAssignedEmployeesAndMachines();
  }

  async assignEmployees() {
    if (this.project) {
      const projectDoc = doc(this.firestore, 'projects', this.projectId);
      const updatedEmployeeIds = [
        ...new Set([...this.selectedEmployeeIds, ...this.tempEmployeeIds]),
      ];

      await updateDoc(projectDoc, { employeeIds: updatedEmployeeIds });

      this.selectedEmployeeIds = updatedEmployeeIds;
      this.tempEmployeeIds = []; // Limpiar la lista temporal
      this.updateSelectedNames(); // Actualizar los nombres después de asignar
      this.filterAssignedEmployeesAndMachines(); // Filtrar empleados asignados
      this.closeModal();
    } else {
      console.error('No hay proyecto para asignar empleados.');
    }
  }

  async assignMachines() {
    if (this.project) {
      const projectDoc = doc(this.firestore, 'projects', this.projectId);
      const updatedMachineIds = [
        ...new Set([...this.selectedMachineIds, ...this.tempMachineIds]),
      ];

      await updateDoc(projectDoc, { machineIds: updatedMachineIds });

      this.selectedMachineIds = updatedMachineIds;
      this.tempMachineIds = []; // Limpiar la lista temporal
      this.updateSelectedNames(); // Actualizar los nombres después de asignar
      this.filterAssignedEmployeesAndMachines(); // Filtrar máquinas asignadas
      this.closeModal();
    } else {
      console.error('No hay proyecto para asignar máquinas.');
    }
  }
}
