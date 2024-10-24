import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { FirebaseService } from '../../../services/firebase.service';
import { CommonModule } from '@angular/common';

interface Employee {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
}

interface Machine {
  id: string;
  name: string;
}

@Component({
  selector: 'app-calendar-modal',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './calendar-modal.component.html',
  styleUrls: ['./calendar-modal.component.css'],
})
export class CalendarModalComponent implements OnInit {
  @Input() selectedDate!: string;

  isEventSelected: boolean = true;

  // Variables para el Evento
  nombreEvento: string = '';
  selectedEmployee: string = '';
  selectedMachine: string = '';
  horaInicio: string = '';
  horaFin: string = '';
  descripcion: string = '';

  // Variables para el Proyecto
  selectedProject: string = '';
  horaInicioProyecto: string = '';
  horaFinProyecto: string = '';
  descripcionProyecto: string = '';

  employees: Employee[] = [];
  projects: Project[] = [];
  machines: Machine[] = [];

  constructor(
    public modalRef: BsModalRef,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
    this.loadProjects();
    this.loadMachines();
  }

  loadEmployees(): void {
    this.firebaseService.getEmployees().subscribe({
      next: (employees) => (this.employees = employees),
      error: (err) => console.error('Error al cargar empleados:', err),
    });
  }

  loadProjects(): void {
    this.firebaseService.getProjects().subscribe({
      next: (projects) => (this.projects = projects),
      error: (err) => console.error('Error al cargar proyectos:', err),
    });
  }

  loadMachines(): void {
    this.firebaseService.getMachines().subscribe({
      next: (machines) => (this.machines = machines),
      error: (err) => console.error('Error al cargar maquinarias:', err),
    });
  }

  guardarAsignacion(): void {
    if (this.isEventSelected) {
      this.guardarEvento();
    } else {
      this.guardarProyecto();
    }
  }

  private guardarEvento(): void {
    const evento = {
      date: this.selectedDate,
      empleado: this.selectedEmployee,
      maquina: this.selectedMachine,
      horaInicio: this.horaInicio,
      horaFin: this.horaFin,
      nombreEvento: this.nombreEvento?.trim(),
      descripcion: this.descripcion,
    };

    this.firebaseService.addAssignment(evento).then(() => {
      const newEvent = {
        title: evento.nombreEvento || 'Evento sin nombre',
        start: evento.date,
        extendedProps: { ...evento },
      };
      this.firebaseService.emitirEvento(newEvent);
      this.modalRef.hide();
    });
  }

  private guardarProyecto(): void {
    const proyectoSeleccionado = this.projects.find(
      (proj) => proj.id === this.selectedProject
    );

    if (!proyectoSeleccionado) {
      alert('Por favor, selecciona un proyecto válido.');
      return;
    }

    const proyecto = {
      id: this.selectedProject,
      date: this.selectedDate,
      nombreProyecto: proyectoSeleccionado.name,
      horaInicio: this.horaInicioProyecto,
      horaFin: this.horaFinProyecto,
      descripcion: this.descripcionProyecto,
    };

    this.firebaseService.addAssignment(proyecto).then(() => {
      const newEvent = {
        title: proyecto.nombreProyecto,
        start: proyecto.date,
        extendedProps: { ...proyecto },
      };
      this.firebaseService.emitirEvento(newEvent);
      this.modalRef.hide();
    });
  }
}
