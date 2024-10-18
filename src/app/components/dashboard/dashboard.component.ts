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

  constructor(private firestore: Firestore) {}

  async ngOnInit() {
    await this.getCounts();
    this.createChart();
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
    // Sumar la cantidad total de máquinas
    this.machinesCount = 0; // Inicializar la cuenta de máquinas
    machinesSnapshot.forEach((doc) => {
      const machineData = doc.data();
      this.machinesCount += machineData['quantity']; // Usar la sintaxis de corchetes para acceder a 'quantity'
    });
  }

  createChart() {
    const ctx = document.getElementById('myPieChart') as HTMLCanvasElement;

    this.chart = new Chart(ctx, {
      type: 'pie', // Tipo de gráfico
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
}
