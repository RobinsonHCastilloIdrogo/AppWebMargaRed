import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { FirebaseService } from '../../../services/firebase.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-calendar-modal',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './calendar-modal.component.html',
  styleUrls: ['./calendar-modal.component.css'],
})
export class CalendarModalComponent implements OnInit {
  @Input() selectedDate!: string; // Fecha seleccionada
  selectedEmployee!: string; // Empleado seleccionado
  selectedMachine!: string; // Máquina seleccionada
  descripcion!: string; // Descripción de la tarea

  employees: any[] = []; // Lista de empleados
  machines: any[] = []; // Lista de maquinarias

  constructor(
    public modalRef: BsModalRef,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit(): void {
    // Obtener empleados desde el servicio Firebase
    this.firebaseService.getEmployees().subscribe((employees) => {
      this.employees = employees;
      console.log('Empleados:', this.employees); // Verifica si los datos están llegando
    });

    // Obtener maquinarias desde el servicio Firebase
    this.firebaseService.getMachines().subscribe((machines) => {
      this.machines = machines;
      console.log('Maquinarias:', this.machines); // Verifica si los datos están llegando
    });
  }

  // Función para guardar la asignación y cerrar el modal
  guardarAsignacion() {
    const asignacion = {
      date: this.selectedDate,
      empleado: this.selectedEmployee,
      maquina: this.selectedMachine,
      descripcion: this.descripcion,
    };
    console.log(asignacion); // Aquí puedes manejar la lógica de guardado
    this.modalRef.hide(); // Cierra el modal
  }
}
