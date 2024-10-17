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
  selectedEmployee: string = '';
  selectedMachine: string = '';
  descripcion: string = '';
  horaInicio: string = '07:00 AM';
  horaFin: string = '08:00 PM';

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

  guardarAsignacion(): void {
    if (this.validarFormulario()) {
      const asignacion = {
        date: this.selectedDate,
        empleado: this.selectedEmployee,
        maquina: this.selectedMachine,
        descripcion: this.descripcion,
        horaInicio: this.horaInicio,
        horaFin: this.horaFin,
      };
      console.log('Asignación guardada:', asignacion);
      this.modalRef.hide();
    } else {
      alert('Por favor, completa todos los campos y verifica las horas.');
    }
  }

  validarFormulario(): boolean {
    const inicioIndex = this.horasDisponibles.indexOf(this.horaInicio);
    const finIndex = this.horasDisponibles.indexOf(this.horaFin);
    return (
      this.selectedEmployee.trim() !== '' &&
      this.selectedMachine.trim() !== '' &&
      this.descripcion.trim() !== '' &&
      inicioIndex < finIndex
    );
  }
}
