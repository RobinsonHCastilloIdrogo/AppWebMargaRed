// dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { Chart, registerables } from 'chart.js';
import { SharedDashboardComponent } from '../shared-dashboard/shared-dashboard.component';

Chart.register(...registerables); // Registrar los componentes de Chart.js

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  imports: [SharedDashboardComponent],
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  employeesCount: number = 0;
  machinesCount: number = 0;
  projectsCount: number = 0;
  chart: any;
  lineChart: any; // Añadir variable para el gráfico de líneas

  constructor(private firestore: Firestore) {}

  async ngOnInit() {
    await this.getCounts();
    this.createChart();
    this.createLineChart(); // Llamar a la función para crear el gráfico de líneas
  }

  async getCounts() {
    const employeesCollection = collection(this.firestore, '/employees');
    const machinesCollection = collection(this.firestore, '/machines');
    const projectsCollection = collection(this.firestore, '/projects');

    const employeesSnapshot = await getDocs(employeesCollection);
    const machinesSnapshot = await getDocs(machinesCollection);
    const projectsSnapshot = await getDocs(projectsCollection);

    this.employeesCount = employeesSnapshot.size;
    this.projectsCount = projectsSnapshot.size;
    this.machinesCount = 0; // Inicializar la cuenta de máquinas
    machinesSnapshot.forEach((doc) => {
      const machineData = doc.data();
      this.machinesCount += machineData['quantity']; // Usar la sintaxis de corchetes para acceder a 'quantity'
    });
  }

  createChart() {
    const ctx = document.getElementById('myPieChart') as HTMLCanvasElement;

    this.chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Empleados', 'Máquinas'],
        datasets: [
          {
            label: 'Cantidad',
            data: [this.employeesCount, this.machinesCount],
            backgroundColor: [
              'rgba(0, 123, 255, 0.8)', // Color para empleados
              'rgba(255, 0, 0, 0.8)', // Color para máquinas
            ],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Cantidad de Empleados y Máquinas',
          },
        },
      },
    });
  }

  createLineChart() {
    const ctx = document.getElementById('myLineChart') as HTMLCanvasElement;

    // Datos ficticios de litros de combustible a lo largo de seis meses
    const labels = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    const data = [300, 400, 250, 500, 450, 600, 700, 800, 650, 900, 750, 1000]; // Cantidad de litros

    this.lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Litros de Combustible',
            data: data,
            backgroundColor: 'rgba(0, 123, 255, 0.2)',
            borderColor: 'rgba(0, 123, 255, 1)',
            borderWidth: 2,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Consumo de Combustible a lo Largo del Tiempo',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
          x: {
            beginAtZero: true,
          },
        },
      },
    });
  }
}
