import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Firestore, doc, getDocs, getDoc, updateDoc, collection } from '@angular/fire/firestore';
import { Project } from '../../../models/projects.model';
import { Employee } from '../../../models/employee.model';
import { Machine } from '../../../models/machine.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.css'],
})
export class ProjectDetailComponent implements OnInit {
  projectId: string;
  project: Project | null = null; // Detalles del proyecto
  employees: Employee[] = []; // Lista de empleados
  machines: Machine[] = []; // Lista de máquinas
  selectedEmployeeIds: string[] = []; // IDs de empleados seleccionados
  selectedMachineIds: string[] = []; // IDs de máquinas seleccionadas

  selectedEmployeeNames: string[] = []; // Nombres de empleados seleccionados
  selectedMachineNames: string[] = []; // Nombres de máquinas seleccionadas

  constructor(private route: ActivatedRoute, private firestore: Firestore) {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
  }

  ngOnInit() {
    this.getProjectDetails();
    this.getEmployees(); // Obtener empleados
    this.getMachines(); // Obtener máquinas
  }

  async getProjectDetails() {
    const projectDoc = doc(this.firestore, 'projects', this.projectId);
    const projectSnapshot = await getDoc(projectDoc);
    
    if (projectSnapshot.exists()) {
      this.project = projectSnapshot.data() as Project;
      // Obtener IDs de empleados y máquinas asignados si están en el proyecto
      this.selectedEmployeeIds = this.project.employeeIds || [];
      this.selectedMachineIds = this.project.machineIds || [];
      
      // Obtener los nombres de empleados y máquinas asignados
      this.selectedEmployeeNames = this.getSelectedEmployeeNames();
      this.selectedMachineNames = this.getSelectedMachineNames();
    } else {
      console.log('No se encontró el proyecto');
    }
  }

  async getEmployees() {
    // Obtener la lista de empleados desde Firestore y asignarla a this.employees
    const employeeCollection = collection(this.firestore, 'employees');
    const employeeSnapshot = await getDocs(employeeCollection);
    this.employees = employeeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Employee[];
  }

  async getMachines() {
    // Obtener la lista de máquinas desde Firestore y asignarla a this.machines
    const machineCollection = collection(this.firestore, 'machines');
    const machineSnapshot = await getDocs(machineCollection);
    this.machines = machineSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Machine[];
  }

  getSelectedEmployeeNames(): string[] {
    return this.selectedEmployeeIds.map(id => {
      const employee = this.employees.find(emp => emp.id === id);
      return employee ? employee.name : id; // Retorna el nombre o el ID si no se encuentra
    });
  }

  getSelectedMachineNames(): string[] {
    return this.selectedMachineIds.map(id => {
      const machine = this.machines.find(mach => mach.id === id);
      return machine ? machine.name : id; // Retorna el nombre o el ID si no se encuentra
    });
  }

  async assignEmployees() {
    // Actualizar el proyecto con los IDs de los empleados seleccionados
    if (this.project) {
      const projectDoc = doc(this.firestore, 'projects', this.projectId);
      await updateDoc(projectDoc, {
        employeeIds: this.selectedEmployeeIds,
      });
      console.log('Empleados asignados al proyecto');
      // Actualiza los nombres después de la asignación
      this.selectedEmployeeNames = this.getSelectedEmployeeNames();
    }
  }

  async assignMachines() {
    // Actualizar el proyecto con los IDs de las máquinas seleccionadas
    if (this.project) {
      const projectDoc = doc(this.firestore, 'projects', this.projectId);
      await updateDoc(projectDoc, {
        machineIds: this.selectedMachineIds,
      });
      console.log('Máquinas asignadas al proyecto');
      // Actualiza los nombres después de la asignación
      this.selectedMachineNames = this.getSelectedMachineNames();
    }
  }
}
