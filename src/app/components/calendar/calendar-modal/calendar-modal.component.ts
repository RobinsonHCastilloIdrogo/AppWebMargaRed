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

  // Controla si se asigna un evento o un proyecto
  isEventSelected: boolean = true;

  // Variables para el Evento
  nombreEvento: string = '';
  selectedEmployee: string = '';
  selectedMachine: string = ''; // Variable para la maquinaria
  horaInicio: string = '';
  horaFin: string = '';
  descripcion: string = '';

  // Variables para el Proyecto
  selectedProject: string = '';
  nombreProyecto: string = ''; // Nuevo campo para el nombre del proyecto
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
    this.loadMachines(); // Cargar las máquinas
  }

  loadEmployees(): void {
    this.firebaseService.getEmployees().subscribe({
      next: (employees) => {
        if (Array.isArray(employees)) {
          this.employees = employees;
        } else {
          console.error('Error: Los empleados no son un array.');
        }
      },
      error: (err) => console.error('Error al cargar empleados:', err),
    });
  }

  loadProjects(): void {
    this.firebaseService.getProjects().subscribe({
      next: (projects) => {
        if (Array.isArray(projects)) {
          // Aseguramos que el mapeo de los proyectos sea correcto
          this.projects = projects.map((doc: any) => ({
            id: doc.id,
            name: doc.name || 'Proyecto sin nombre', // Validar nombre del proyecto
          }));
          console.log('Proyectos cargados:', this.projects);
        } else {
          console.error('Error: Los proyectos no son un array.');
        }
      },
      error: (err) => console.error('Error al cargar proyectos:', err),
    });
  }

  loadMachines(): void {
    this.firebaseService.getMachines().subscribe({
      next: (machines) => {
        if (Array.isArray(machines)) {
          this.machines = machines;
          console.log('Maquinarias cargadas:', this.machines);
        } else {
          console.error('Error: Las maquinarias no son un array.');
        }
      },
      error: (err) => console.error('Error al cargar maquinarias:', err),
    });
  }

  // Actualiza el nombre del proyecto al seleccionarlo
  onProjectSelect(): void {
    const proyectoSeleccionado = this.projects.find(
      (proj) => proj.id === this.selectedProject
    );

    if (proyectoSeleccionado) {
      this.nombreProyecto = proyectoSeleccionado.name; // Actualiza el campo de nombre del proyecto
    } else {
      this.nombreProyecto = ''; // Limpia el campo si no hay proyecto seleccionado
    }
  }

  guardarAsignacion(): void {
    if (this.isEventSelected) {
      this.guardarEvento(); // Llamada específica para evento
    } else {
      this.guardarProyecto(); // Llamada específica para proyecto
    }
  }

  // Función para guardar eventos
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

    console.log('Evento preparado para guardar:', evento);

    this.firebaseService.addAssignment(evento).then(() => {
      const newEvent = {
        title: evento.nombreEvento || 'Evento sin nombre',
        start: evento.date,
        extendedProps: {
          empleado: this.selectedEmployee,
          maquina: this.selectedMachine,
          descripcion: this.descripcion,
        },
      };

      console.log('Evento enviado:', newEvent);
      this.firebaseService.emitirEvento(newEvent);
      this.modalRef.hide(); // Cierra el modal después de guardar
    });
  }

  // Función para guardar proyectos
  private guardarProyecto(): void {
    const proyectoSeleccionado = this.projects.find(
      (proj) => proj.id === this.selectedProject
    );

    if (!proyectoSeleccionado) {
      alert('Por favor, selecciona un proyecto válido.');
      return;
    }

    const proyecto = {
      id: this.selectedProject, // ID del proyecto
      date: this.selectedDate,
      nombreProyecto: this.nombreProyecto,
      horaInicio: this.horaInicioProyecto,
      horaFin: this.horaFinProyecto,
      descripcion: this.descripcionProyecto,
    };

    console.log('Proyecto preparado para guardar:', proyecto); // Verificar en consola

    this.firebaseService.addAssignment(proyecto).then(() => {
      const newEvent = {
        title: proyecto.nombreProyecto, // Asegúrate de que el nombre esté presente
        start: proyecto.date,
        extendedProps: { ...proyecto },
      };

      console.log('Evento de proyecto creado:', newEvent); // Verifica en consola
      this.firebaseService.emitirEvento(newEvent);
      this.modalRef.hide();
    });
  }
}
