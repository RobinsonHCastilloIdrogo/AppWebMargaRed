import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../../../services/firebase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit() {
    this.loadEmployees();
    this.loadMachines();
    this.loadTeamMembers();
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
    this.firebaseService.getData('teamMembers').subscribe((members) => {
      this.teamMembers = members;
    });
  }

  // Agregar un nuevo miembro al equipo
  async addMember() {
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

      await this.firebaseService.addData('teamMembers', newMember);
      this.loadTeamMembers(); // Recargar los miembros del equipo
      this.resetForm();
    } catch (error) {
      console.error('Error al agregar miembro:', error);
    }
  }

  // Resetear el formulario
  resetForm() {
    this.selectedEmployeeId = '';
    this.selectedMachineId = '';
    this.newMemberRole = '';
  }

  // Editar un miembro del equipo
  editMember(member: TeamMember) {
    const updatedRole = prompt('Editar rol:', member.role);

    if (updatedRole) {
      this.firebaseService.updateData('teamMembers', member.id, {
        role: updatedRole,
      });
    }
  }

  // Eliminar un miembro del equipo
  deleteMember(memberId: string) {
    this.firebaseService.deleteData('teamMembers', memberId).then(() => {
      this.loadTeamMembers(); // Recargar los miembros después de eliminar
    });
  }
}
