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
import { Firestore, collection, addDoc } from '@angular/fire/firestore';

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
    private fb: FormBuilder,
    private firestore: Firestore
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

  // Cargar empleados desde Firestore sin duplicados
  async loadEmployees() {
    try {
      const querySnapshot = await this.projectDataService.getCollection(
        'employees'
      );
      this.employees = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      this.employees = [
        ...new Map(this.employees.map((item) => [item.id, item])).values(),
      ];
    } catch (error) {
      console.error('Error al cargar empleados:', error);
    }
  }

  // Cargar máquinas desde Firestore sin duplicados
  async loadMachines() {
    try {
      const querySnapshot = await this.projectDataService.getCollection(
        'machines'
      );
      this.machines = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      this.machines = [
        ...new Map(this.machines.map((item) => [item.id, item])).values(),
      ];
    } catch (error) {
      console.error('Error al cargar máquinas:', error);
    }
  }

  // Cargar los miembros asignados al proyecto sin duplicados
  async loadAssignedMembers() {
    if (!this.projectId) return;

    try {
      const employeeSnapshot = await this.projectDataService.getCollection(
        `projects/${this.projectId}/team/members/employees`
      );
      this.assignedEmployees = employeeSnapshot.docs.map((doc) => doc.data());

      const machineSnapshot = await this.projectDataService.getCollection(
        `projects/${this.projectId}/team/members/machines`
      );
      this.assignedMachines = machineSnapshot.docs.map((doc) => doc.data());
    } catch (error) {
      console.error('Error al cargar miembros asignados:', error);
    }
  }

  // Obtener el nombre de la máquina asignada a un empleado
  getAssignedMachineName(employeeId: string): string {
    const machine = this.assignedMachines.find(
      (machine) => machine.employeeId === employeeId
    );
    return machine ? machine.name : 'No asignada';
  }

  // Asignar un miembro al proyecto sin duplicados
  async assignTeamMember() {
    if (!this.projectId) return;

    const { employee, machine } = this.teamForm.value;
    const employeeName = this.employees.find((e) => e.id === employee)?.name;
    const machineName = this.machines.find((m) => m.id === machine)?.name;

    if (employeeName && machineName) {
      try {
        const employeeExists = this.assignedEmployees.some(
          (e) => e.employeeId === employee
        );
        const machineExists = this.assignedMachines.some(
          (m) => m.machineId === machine
        );

        if (!employeeExists) {
          const employeeRef = collection(
            this.firestore,
            `projects/${this.projectId}/team/members/employees`
          );
          await addDoc(employeeRef, {
            name: employeeName,
            employeeId: employee,
          });
        }

        if (!machineExists) {
          const machineRef = collection(
            this.firestore,
            `projects/${this.projectId}/team/members/machines`
          );
          await addDoc(machineRef, {
            name: machineName,
            machineId: machine,
            employeeId: employee, // Relacionar máquina con el empleado
          });
        }

        await this.loadAssignedMembers();
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
