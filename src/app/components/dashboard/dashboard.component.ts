import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedDashboardComponent } from '../shared-dashboard/shared-dashboard.component';
import { Chart } from 'chart.js'; // Importar Chart.js

@Component({
  selector: 'app-dashboard', // Cambié 'app-roles' a 'app-dashboard'
  standalone: true,
  imports: [CommonModule, SharedDashboardComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements AfterViewInit {
  ngAfterViewInit(): void {
    this.loadChart(); // Llamar la función del gráfico después de que la vista ha sido inicializada
  }

  // Función para cargar el gráfico
  loadChart(): void {
    const ctx = document.getElementById('attendanceChart') as HTMLCanvasElement;
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['01 Sep', '02 Sep', '03 Sep', '04 Sep', '05 Sep', '06 Sep'], // Días del mes
        datasets: [
          {
            label: 'A tiempo',
            backgroundColor: '#28a745', // Verde para llegadas a tiempo
            data: [50, 40, 55, 30, 45, 50], // Datos de empleados a tiempo
          },
          {
            label: 'Tarde',
            backgroundColor: '#e74c3c', // Rojo para llegadas tarde
            data: [5, 8, 3, 7, 2, 5], // Datos de empleados que llegaron tarde
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Días del Mes',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Número de Empleados',
            },
            beginAtZero: true,
          },
        },
      },
    });
  }
}
