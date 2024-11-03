import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  Firestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
} from '@angular/fire/firestore';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-project-team',
  standalone: true,
  imports: [CommonModule, NgIf, FormsModule],
  templateUrl: './project-team.component.html',
  styleUrls: ['./project-team.component.css'],
})
export class ProjectTeamComponent implements OnInit {
  projectId: string | null = null;
  teamMembers: any[] = []; // Almacena los datos de los miembros del equipo
  employees: any[] = []; // Almacena los datos de los empleados
  machines: any[] = []; // Almacena los datos de las máquinas
  isMemberModalOpen: boolean = false;
  isEditMode: boolean = false;
  currentMember: any = {};

  constructor(private route: ActivatedRoute, private firestore: Firestore) {}

  ngOnInit(): void {
    this.projectId = this.route.parent?.snapshot.paramMap.get('id') || null; // Solución al error de tipo
    if (this.projectId) {
      this.loadEmployees(); // Cargar empleados disponibles
      this.loadMachines(); // Cargar máquinas disponibles
      this.loadTeamMembers();
    }
  }

  async loadTeamMembers(): Promise<void> {
    if (!this.projectId) return;

    try {
      // Acceder directamente a la subcolección 'team'
      const teamCollectionRef = collection(
        this.firestore,
        `projects/${this.projectId}/team`
      );
      const teamSnapshot = await getDocs(teamCollectionRef);

      this.teamMembers = teamSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          nombre: data['nombre'] || 'Desconocido',
          rol: data['rol'],
          horaInicio: data['horaInicio'],
          horaFin: data['horaFin'],
          maquina: data['maquina'] ? data['maquina'] : { nombre: 'N/A' },
        };
      });

      console.log('Equipo cargado:', this.teamMembers);
    } catch (error) {
      console.error('Error al cargar los miembros del equipo:', error);
    }
  }

  async loadEmployees(): Promise<void> {
    try {
      const employeesCollectionRef = collection(this.firestore, 'employees');
      const employeesSnapshot = await getDocs(employeesCollectionRef);
      this.employees = employeesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error al cargar los empleados:', error);
    }
  }

  async loadMachines(): Promise<void> {
    try {
      const machinesCollectionRef = collection(this.firestore, 'machines');
      const machinesSnapshot = await getDocs(machinesCollectionRef);
      this.machines = machinesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error al cargar las máquinas:', error);
    }
  }

  openAddMemberModal(): void {
    this.isMemberModalOpen = true;
    this.isEditMode = false;
    this.currentMember = {
      nombre: '',
      rol: '',
      horaInicio: '',
      horaFin: '',
      maquina: { nombre: 'N/A' },
    };
  }

  openEditMemberModal(member: any): void {
    this.isMemberModalOpen = true;
    this.isEditMode = true;

    // Copiar todos los valores del miembro seleccionado
    this.currentMember = { ...member };

    // Obtener el nombre del empleado correspondiente si está en la lista de empleados
    const employee = this.employees.find((emp) => emp.id === member.nombre);
    if (employee) {
      this.currentMember.nombre = employee.id; // Almacena el ID del empleado en lugar del nombre
    }

    // Obtener el nombre de la máquina correspondiente si está en la lista de máquinas
    if (member.maquina && member.maquina.nombre !== 'N/A') {
      const machine = this.machines.find(
        (mac) => mac.nombre === member.maquina.nombre
      );
      if (machine) {
        this.currentMember.maquina = machine;
      }
    }
  }

  closeMemberModal(): void {
    this.isMemberModalOpen = false;
    this.currentMember = {};
  }

  async saveMember(): Promise<void> {
    if (!this.projectId) return;

    try {
      if (this.isEditMode) {
        // Editar miembro existente
        const memberDocRef = doc(
          this.firestore,
          `projects/${this.projectId}/team/${this.currentMember.id}`
        );
        await updateDoc(memberDocRef, {
          nombre: this.currentMember.nombre,
          rol: this.currentMember.rol,
          horaInicio: this.currentMember.horaInicio,
          horaFin: this.currentMember.horaFin,
          maquina: this.currentMember.maquina,
        });
        console.log('Miembro actualizado');
      } else {
        // Agregar nuevo miembro
        const teamCollectionRef = collection(
          this.firestore,
          `projects/${this.projectId}/team`
        );
        await addDoc(teamCollectionRef, {
          nombre: this.currentMember.nombre,
          rol: this.currentMember.rol,
          horaInicio: this.currentMember.horaInicio,
          horaFin: this.currentMember.horaFin,
          maquina: this.currentMember.maquina,
        });
        console.log('Miembro agregado');
      }

      this.loadTeamMembers(); // Recargar los miembros del equipo
      this.closeMemberModal(); // Cerrar el modal
    } catch (error) {
      console.error('Error al guardar el miembro:', error);
    }
  }

  async deleteMember(member: any): Promise<void> {
    if (!this.projectId) return;

    try {
      const memberDocRef = doc(
        this.firestore,
        `projects/${this.projectId}/team/${member.id}`
      );
      await deleteDoc(memberDocRef);
      console.log('Miembro eliminado');
      this.loadTeamMembers(); // Recargar los miembros del equipo
    } catch (error) {
      console.error('Error al eliminar el miembro:', error);
    }
  }

  onRoleChange(): void {
    // Si el rol no es "Operador", limpiar la máquina asignada
    if (this.currentMember.rol !== 'Operador') {
      this.currentMember.maquina = { nombre: 'N/A' };
    }
  }
}
