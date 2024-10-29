import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgFor } from '@angular/common';
import { ProjectDataService } from '../../../services/project-data.service';

@Component({
  selector: 'app-project-team',
  standalone: true,
  templateUrl: './project-team.component.html',
  imports: [NgFor, ReactiveFormsModule],
  styleUrls: ['./project-team.component.css'],
})
export class ProjectTeamComponent implements OnInit {
  teamForm: FormGroup;
  employees: any[] = [];
  machines: any[] = [];
  teamMembers: any[] = []; // Lista de miembros del equipo
  selectedProjectId: string = 'WwuaO1otNfUm0ucepYF3'; // ID del proyecto específico

  constructor(
    private projectDataService: ProjectDataService, // Servicio para Firestore
    private fb: FormBuilder
  ) {
    this.teamForm = this.fb.group({
      employee: ['', Validators.required],
      machine: ['', Validators.required],
    });
  }

  async ngOnInit() {
    await this.loadEmployees();
    await this.loadMachines();
    await this.loadTeamMembers(); // Cargar miembros del equipo desde Firestore
  }

  // Cargar empleados desde Firestore
  async loadEmployees() {
    const querySnapshot = await this.projectDataService.getCollection(
      'employees'
    );
    this.employees = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  // Cargar máquinas desde Firestore
  async loadMachines() {
    const querySnapshot = await this.projectDataService.getCollection(
      'machines'
    );
    this.machines = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  // Cargar miembros del equipo desde la subcolección 'team' en Firestore
  async loadTeamMembers() {
    const querySnapshot = await this.projectDataService.getCollection(
      `projects/${this.selectedProjectId}/team`
    );
    this.teamMembers = querySnapshot.docs.map((doc) => doc.data());
  }

  // Asignar miembro al equipo y guardar en Firestore
  async assignTeamMember() {
    const { employee, machine } = this.teamForm.value;

    // Obtener nombres correspondientes
    const employeeName = this.employees.find((e) => e.id === employee)?.name;
    const machineName = this.machines.find((m) => m.id === machine)?.name;

    if (employeeName && machineName) {
      const newMember = { employeeName, machineName, employeeId: employee };

      // Guardar en Firestore usando el servicio
      await this.projectDataService.addTeamMemberToProject(
        this.selectedProjectId,
        newMember
      );

      // Añadir localmente a la lista
      this.teamMembers.push(newMember);

      // Resetear el formulario
      this.teamForm.reset();
      alert('Miembro del equipo asignado exitosamente.');
    } else {
      alert('Por favor, selecciona un empleado y una máquina válidos.');
    }
  }

  // Eliminar miembro del equipo desde Firestore y de la lista local
  async removeMember(member: any) {
    const isDeleted = await this.projectDataService.deleteTeamMember(
      this.selectedProjectId,
      member.employeeId
    );

    if (isDeleted) {
      // Eliminar de la lista localmente
      this.teamMembers = this.teamMembers.filter((m) => m !== member);
      alert('Miembro eliminado exitosamente.');
    } else {
      alert('Error al eliminar el miembro.');
    }
  }
}
