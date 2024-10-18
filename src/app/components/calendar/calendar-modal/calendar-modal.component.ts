import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { FirebaseService } from '../../../services/firebase.service';
import { CommonModule } from '@angular/common';

interface Employee {
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

  nombreEvento: string = ''; // Nuevo campo para el nombre del evento
  selectedEmployee: string = '';
  selectedMachine: string = '';
  descripcion: string = '';
  horaInicio: string = '';
  horaFin: string = '';

  employees: Employee[] = [];
  machines: Machine[] = [];
  horasDisponibles: string[] = [];

  constructor(
    public modalRef: BsModalRef,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
    this.loadMachines();
    this.generarHorasDisponibles();
  }

  // Cargar empleados desde Firebase
  loadEmployees(): void {
    this.firebaseService.getEmployees().subscribe({
      next: (employees) => {
        if (Array.isArray(employees)) {
          this.employees = employees;
          console.log('Empleados cargados:', this.employees);
        } else {
          console.error('Error: Los empleados no son un array.');
        }
      },
      error: (err) => console.error('Error al cargar empleados:', err),
    });
  }

  // Cargar maquinarias desde Firebase
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

  // Genera las horas disponibles entre las 7:00 AM y las 8:00 PM
  generarHorasDisponibles(): void {
    const horas = [];
    let hora = 7;

    while (hora <= 20) {
      const formato12h = hora < 12 ? 'AM' : 'PM';
      const horaFormateada = `${hora > 12 ? hora - 12 : hora}:00 ${formato12h}`;
      horas.push(horaFormateada);
      hora++;
    }
    this.horasDisponibles = horas;
  }

  // Guardar la asignación en Firebase
  // calendar-modal.component.ts
  guardarAsignacion(): void {
    if (this.validarFormulario()) {
      const asignacion = {
        date: this.selectedDate,
        empleado: this.selectedEmployee,
        maquina: this.selectedMachine,
        descripcion: this.descripcion,
        horaInicio: this.horaInicio,
        horaFin: this.horaFin,
        nombreEvento: this.nombreEvento, // Asegúrate de incluir el nombre del evento
      };

      this.firebaseService
        .addAssignment(asignacion)
        .then(() => {
          console.log('Asignación guardada:', asignacion);
          alert('Asignación guardada exitosamente');

          // Actualiza el calendario con el nuevo evento
          const newEvent = {
            title: asignacion.nombreEvento, // Mostrar el nombre del evento
            start: asignacion.date,
            extendedProps: { ...asignacion },
          };

          this.modalRef.hide(); // Cerrar el modal

          // Emitir el evento o actualizar directamente el calendario
          this.firebaseService.emitirEvento(newEvent);
        })
        .catch((error) => {
          console.error('Error al guardar la asignación:', error);
          alert('Error al guardar la asignación. Inténtalo nuevamente.');
        });
    } else {
      alert('Por favor, completa todos los campos y verifica las horas.');
    }
  }

  // Validación del formulario para asegurar que todos los campos están completos
  validarFormulario(): boolean {
    const inicioValido = this.horaInicio < this.horaFin; // Validar orden de las horas
    return (
      this.nombreEvento.trim() !== '' &&
      this.selectedEmployee.trim() !== '' &&
      this.selectedMachine.trim() !== '' &&
      this.descripcion.trim() !== '' &&
      this.horaInicio !== '' &&
      this.horaFin !== '' &&
      inicioValido
    );
  }
}
