import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ProjectDataService } from '../../../services/project-data.service';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-project-team',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor, NgIf],
  templateUrl: './project-team.component.html',
  styleUrls: ['./project-team.component.css'],
})
export class ProjectTeamComponent implements OnInit {
  teamForm: FormGroup;
  employees: any[] = [];
  machines: any[] = [];
  assignedEmployees: any[] = [];
  assignedMachines: any[] = [];
  projectId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private projectDataService: ProjectDataService,
    private fb: FormBuilder
  ) {
    this.teamForm = this.fb.group({
      employee: ['', Validators.required],
      machine: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.route.parent?.paramMap.subscribe((params) => {
      this.projectId = params.get('id');
      if (this.projectId) {
        this.loadAssignedMembers();
      } else {
        console.error('No se encontró el ID del proyecto.');
      }
    });

    this.loadEmployees();
    this.loadMachines();
  }

  // Cargar empleados disponibles
  async loadEmployees() {
    if (!this.projectId) return;

    const querySnapshot = await this.projectDataService.getCollection(
      `projects/${this.projectId}/team/members/employees`
    );
    this.employees = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  // Cargar máquinas disponibles
  async loadMachines() {
    if (!this.projectId) return;

    const querySnapshot = await this.projectDataService.getCollection(
      `projects/${this.projectId}/team/members/machines`
    );
    this.machines = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  // Cargar miembros asignados al proyecto
  async loadAssignedMembers() {
    if (!this.projectId) return;

    const employeeSnapshot = await this.projectDataService.getCollection(
      `projects/${this.projectId}/team/members/employees`
    );
    this.assignedEmployees = employeeSnapshot.docs.map((doc) => doc.data());

    const machineSnapshot = await this.projectDataService.getCollection(
      `projects/${this.projectId}/team/members/machines`
    );
    this.assignedMachines = machineSnapshot.docs.map((doc) => doc.data());
  }

  getAssignedMachineName(employeeId: string): string {
    const machine = this.assignedMachines.find(
      (machine) => machine.employeeId === employeeId
    );
    return machine ? machine.name : 'No asignada';
  }

  // Asignar un miembro al proyecto
  async assignTeamMember() {
    if (!this.projectId) return;

    const { employee, machine } = this.teamForm.value;
    const employeeName = this.employees.find((e) => e.id === employee)?.name;
    const machineName = this.machines.find((m) => m.id === machine)?.name;

    if (employeeName && machineName) {
      try {
        await this.projectDataService.addDocumentToCollection(
          `projects/${this.projectId}/team/members/employees`,
          {
            name: employeeName,
            employeeId: employee,
          }
        );

        await this.projectDataService.addDocumentToCollection(
          `projects/${this.projectId}/team/members/machines`,
          {
            name: machineName,
            machineId: machine,
          }
        );

        this.loadAssignedMembers(); // Recargar los miembros asignados
        this.teamForm.reset();
        alert('Miembro del equipo asignado exitosamente.');
      } catch (error) {
        console.error('Error al asignar miembro:', error);
      }
    } else {
      alert('Por favor, selecciona un empleado y una máquina válidos.');
    }
  }
}
