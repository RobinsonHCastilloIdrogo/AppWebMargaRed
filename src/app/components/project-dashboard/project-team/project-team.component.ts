import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../../../services/firebase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Firestore,
  doc,
  setDoc,
  collection,
  addDoc,
  getDocs,
} from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';

interface TeamMember {
  id: string;
  employeeName: string;
  role: string;
  machineName?: string;
}

@Component({
  selector: 'app-project-team',
  templateUrl: './project-team.component.html',
  standalone: true, // Declaración como componente standalone
  imports: [CommonModule, FormsModule], // Importar FormsModule
  styleUrls: ['./project-team.component.css'],
})
export class ProjectTeamComponent implements OnInit {
  teamMembers: TeamMember[] = [];
  employees: any[] = [];
  machines: any[] = [];

  selectedEmployeeId: string = '';
  selectedMachineId: string = '';
  newMemberRole: string = '';
  projectId: string | null = null;

  constructor(
    private firebaseService: FirebaseService,
    private firestore: Firestore,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('id'); // Obtener el ID del proyecto
    if (this.projectId) {
      this.loadEmployees();
      this.loadMachines();
      this.loadTeamMembers();
    }
  }

  // Cargar empleados desde Firebase
  loadEmployees() {
    this.firebaseService.getEmployees().subscribe((employees) => {
      this.employees = employees;
    });
  }

  // Cargar máquinas desde Firebase
  loadMachines() {
    this.firebaseService.getMachines().subscribe((machines) => {
      this.machines = machines;
    });
  }

  // Cargar miembros del equipo desde Firebase
  loadTeamMembers() {
    if (this.projectId) {
      this.firebaseService
        .getData(`projects/${this.projectId}/team`)
        .subscribe((members) => {
          this.teamMembers = members;
        });
    }
  }

  // Agregar un nuevo miembro al equipo
  async addMember() {
    if (this.projectId) {
      try {
        const employeeName = await this.firebaseService.getEmployeeName(
          this.selectedEmployeeId
        );
        const machineName = await this.firebaseService.getMachineName(
          this.selectedMachineId
        );

        const newMember: TeamMember = {
          id: '', // Será generado por Firebase
          employeeName: employeeName || 'Desconocido',
          role: this.newMemberRole,
          machineName: machineName || 'No asignada',
        };

        const teamCollection = collection(
          this.firestore,
          `projects/${this.projectId}/team`
        );
        await addDoc(teamCollection, newMember);
        this.loadTeamMembers(); // Recargar los miembros del equipo
        this.resetForm();
      } catch (error) {
        console.error('Error al agregar miembro:', error);
      }
    }
  }

  // Resetear el formulario
  resetForm() {
    this.selectedEmployeeId = '';
    this.selectedMachineId = '';
    this.newMemberRole = '';
  }

  // Editar un miembro del equipo
  async editMember(member: TeamMember) {
    if (this.projectId) {
      const updatedRole = prompt('Editar rol:', member.role);

      if (updatedRole) {
        const teamMemberDoc = doc(
          this.firestore,
          `projects/${this.projectId}/team/${member.id}`
        );
        await setDoc(teamMemberDoc, { role: updatedRole }, { merge: true });
        console.log('Miembro del equipo actualizado correctamente');
        this.loadTeamMembers();
      }
    }
  }

  // Eliminar un miembro del equipo
  async deleteMember(memberId: string) {
    if (this.projectId) {
      try {
        await this.firebaseService.deleteData(
          `projects/${this.projectId}/team`,
          memberId
        );
        this.loadTeamMembers(); // Recargar los miembros después de eliminar
      } catch (error) {
        console.error('Error al eliminar miembro del equipo:', error);
      }
    }
  }
}
