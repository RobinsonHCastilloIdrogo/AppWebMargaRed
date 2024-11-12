import { Component, OnInit } from '@angular/core';
import {
  Firestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
} from '@angular/fire/firestore';
import { SharedDashboardComponent } from '../shared-dashboard/shared-dashboard.component';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { query, where } from 'firebase/firestore';
import { ProjectDetailsComponent } from '../project-dashboard/project-details/project-details.component';
import {
  ApexChart,
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexDataLabels,
  ApexLegend,
  ApexAxisChartSeries,
  ApexXAxis,
  ApexTitleSubtitle,
  ApexYAxis,
  ApexStroke,
  ApexMarkers,
  ApexFill,
} from 'ng-apexcharts';
import { NgApexchartsModule } from 'ng-apexcharts';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  imports: [
    SharedDashboardComponent,
    NgIf,
    NgFor,
    DatePipe,
    FormsModule,
    NgApexchartsModule, // Añadir aquí
  ],
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  projectsInProgress: number = 0;
  projectsCompleted: number = 0;
  employeesCount: number = 0;
  machinesCount: number = 0;
  projectsCount: number = 0;
  totalAssignedMachines: number = 0;
  resources: { id: string; name: string }[] = [];
  events: {
    id: string;
    name: string;
    date: Date;
    horaInicio: string;
    horaFin: string;
  }[] = [];
  chart: any;
  showLogoutModal: boolean = false;

  selectedResource: string = 'default';
  assignedMachines: any[] = [];
  monthlyFuelData: number[] = new Array(12).fill(0);

  // Inicializar lineChartOptions
  lineChartOptions: {
    series: ApexAxisChartSeries;
    chart: ApexChart;
    xaxis: ApexXAxis;
    yaxis: ApexYAxis | ApexYAxis[];
    title: ApexTitleSubtitle;
    stroke: ApexStroke; // Added stroke
    markers: ApexMarkers; // Added markers
    colors: string[]; // Added colors
    fill: ApexFill; // Added fill
  } = {
    series: [
      {
        name: 'Litros de Combustible',
        data: this.monthlyFuelData,
      },
      {
        name: 'Costo Total',
        data: this.monthlyFuelData.map((litros) => litros * 4.91),
      },
    ],
    chart: {
      type: 'line',
      height: '100%',
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          pan: false,
          reset: true,
        },
      },
    },
    title: {
      text: 'Consumo de Combustible a lo Largo del Tiempo',
      align: 'left',
    },
    xaxis: {
      categories: [
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
      ],
      title: {
        text: 'Meses', // Subtítulo para el eje X
      },
    },
    yaxis: [
      {
        title: {
          text: 'Combustible (L)', // Subtítulo para el eje Y izquierdo
          style: {
            color: '#008FFB', // Cambia el color aquí
            fontSize: '14px',
            fontWeight: 'bold',
          },
        },
        labels: {
          style: {
            colors: '#008FFB', // Coincide con el color del título
          },
          formatter: function (val) {
            return val.toFixed(0); // Mostrar valores enteros
          },
        },
      },
      {
        opposite: true, // Muestra este eje Y al lado derecho
        title: {
          text: 'Costo Total', // Subtítulo para el eje Y derecho
          style: {
            color: '#00E396', // Cambia el color aquí
            fontSize: '14px',
            fontWeight: 'bold',
          },
        },
        labels: {
          style: {
            colors: '#00E396', // Coincide con el color del título
          },
          formatter: function (val) {
            return `$${val.toFixed(2)}`;
          },
        },
      },
    ],
    stroke: {
      width: 3, // Width of the line
      curve: 'smooth', // Smooth curve
    },
    markers: {
      size: 5, // Marker size
      colors: ['#008FFB', '#00E396'], // Marker colors for each series
      strokeWidth: 2, // Stroke width for markers
    },
    colors: ['#008FFB', '#00E396'], // Line colors for the two series
    fill: {
      opacity: 0.5, // Semi-transparent fill
    },
  };

  pieChartOptions: {
    series: number[];
    chart: {
      type: 'donut'; // Cambiado de 'pie' a 'donut'
      height: number;
    };
    labels: string[];
    responsive: ApexResponsive[];
    legend: ApexLegend;
    dataLabels: ApexDataLabels; // Agregado para el número en el centro
    fill: any; // Añadir configuración para el centro
  } = {
    series: [], // Esto se actualizará con los datos de las máquinas
    chart: {
      type: 'donut', // Cambiado de pie a donut
      height: 350,
    },
    labels: [], // Esto se actualizará con las etiquetas de las máquinas
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 200,
          },
          legend: {
            position: 'bottom',
          },
        },
      },
    ],
    legend: {
      position: 'top',
      horizontalAlign: 'center',
    },
    dataLabels: {
      enabled: true, // Habilitar la visualización de números en el centro
      style: {
        fontSize: '24px', // Tamaño del número
        fontWeight: 'bold', // Peso de la fuente
        colors: ['#000'], // Color del número
      },
      formatter: function (val: any, opts: any) {
        // Aquí mostramos la cantidad de máquinas
        const machineQuantity = opts.w.globals.series[opts.seriesIndex];
        return machineQuantity.toFixed(0); // Muestra la cantidad como número entero
      },
    },
    fill: {
      type: 'solid', // Establecer tipo de relleno sólido para el donut
      opacity: 1, // Total opacidad para el centro
    },
  };
  totalMachines: any;

  constructor(
    private firestore: Firestore,
    private dashboardService: DashboardService
  ) {}

  async ngOnInit() {
    await this.getCounts();
    await this.loadEvents();
    await this.loadProjects();
    await this.loadMonthlyFuelTotals(); // Cargar datos de combustible mensual
    this.initializeLineChart();

    // Suscribirse a los observables para el conteo de proyectos
    this.dashboardService.projectsInProgress$.subscribe((count) => {
      this.projectsInProgress = count;
    });
    this.dashboardService.projectsCompleted$.subscribe((count) => {
      this.projectsCompleted = count;
    });

    // Cargar el gráfico por defecto si no se selecciona un recurso
    if (this.selectedResource === 'default') {
      this.loadDefaultPieChart();
    }

    // Cargar el conteo inicial de proyectos
    this.dashboardService.loadProjectStatusCounts();
  }

  // Método para cargar el gráfico de dona por defecto con proyectos y máquinas
  loadDefaultPieChart() {
    // Si no hay proyectos, mostramos un gráfico vacío
    if (this.resources.length === 0) {
      const defaultProjects = [{ name: 'No hay proyectos', quantity: 0 }];
      this.assignedMachines = defaultProjects;
      this.totalAssignedMachines = 0;
    } else {
      // Si hay proyectos, asignamos la cantidad de máquinas en cada uno
      const defaultProjects = this.resources.map(async (project) => {
        console.log(`Cargando máquinas para el proyecto: ${project.name}`);

        // Usamos la ruta correcta para acceder a los equipos del proyecto
        const teamCollection = collection(
          this.firestore,
          `projects/${project.id}/team` // Ruta correcta
        );
        const teamSnapshot = await getDocs(teamCollection);

        // Contamos el número de equipos (máquinas) asignadas a este proyecto
        const machineCount = teamSnapshot.docs.filter((doc) => {
          const machineName =
            doc.data()['maquina']?.nombre ?? 'Maquina sin nombre';
          return machineName !== 'Maquina sin nombre'; // Excluir máquinas sin nombre
        }).length;

        console.log(
          `Máquinas encontradas para el proyecto ${project.name}: ${machineCount}`
        );

        return {
          name: project.name,
          quantity: machineCount, // Cantidad de máquinas asignadas (en este caso equipos)
        };
      });

      // Esperamos a que todas las promesas sean resueltas
      Promise.all(defaultProjects)
        .then((projectsWithMachineCount) => {
          console.log(
            'Proyectos con las máquinas asignadas:',
            projectsWithMachineCount
          );

          // Asignamos los proyectos con sus respectivas cantidades de máquinas
          this.assignedMachines = projectsWithMachineCount;
          this.totalAssignedMachines = projectsWithMachineCount.reduce(
            (total, project) => total + project.quantity,
            0
          );

          // Si no se obtienen proyectos con máquinas asignadas, aseguramos que se agregue un valor predeterminado
          if (this.assignedMachines.length === 0) {
            this.assignedMachines = [
              { name: 'No hay máquinas asignadas', quantity: 0 },
            ];
          }

          // Actualizamos el gráfico con los nuevos datos
          this.updatePieChart();
        })
        .catch((error) => {
          console.error('Error al cargar las máquinas:', error);
        });
    }
  }

  async getCounts() {
    const employeesCollection = collection(this.firestore, '/employees');
    const machinesCollection = collection(this.firestore, '/machines');
    const projectsCollection = collection(this.firestore, '/projects');

    const employeesSnapshot = await getDocs(employeesCollection);
    const machinesSnapshot = await getDocs(machinesCollection);
    const projectsSnapshot = await getDocs(projectsCollection);

    this.employeesCount = employeesSnapshot.size;
    this.machinesCount = 0;

    machinesSnapshot.forEach((doc) => {
      const machineData = doc.data();
      this.machinesCount += machineData['quantity'];
    });

    // Calcular el total de proyectos
    this.projectsCount = projectsSnapshot.size;

    // No contar aquí los proyectos 'en curso' o 'finalizados'. Deja que lo haga el servicio DashboardService.
  }

  async loadEvents() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const path = `assignments/${year}-${month}/events`;

    try {
      const eventsCollection = collection(this.firestore, path);
      const eventsSnapshot = await getDocs(eventsCollection);

      this.events = eventsSnapshot.docs.map((doc) => {
        const data = doc.data();
        const employees = data['empleados'] || [];
        const firstEmployee = employees[0] || {};
        const horaInicio = firstEmployee['horaInicio'] || '00:00';
        const horaFin = firstEmployee['horaFin'] || '00:00';

        return {
          id: doc.id,
          name: data['nombre'] || 'Evento sin nombre',
          date: data['fecha'] ? new Date(data['fecha']) : new Date(),
          horaInicio: horaInicio,
          horaFin: horaFin,
        };
      });
    } catch (error) {
      console.error('Error al cargar eventos:', error);
    }
  }

  async loadProjects() {
    try {
      const projectsCollection = collection(this.firestore, '/projects');
      const snapshot = await getDocs(projectsCollection);

      if (!snapshot.empty) {
        this.resources = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data()['name'] || 'Proyecto sin nombre',
        }));

        // Resetear contadores
        this.projectsInProgress = 0;
        this.projectsCompleted = 0;

        // Iterar sobre los proyectos para verificar el estado
        for (const projectDoc of snapshot.docs) {
          const projectId = projectDoc.id;
          const detailsCollection = collection(
            this.firestore,
            `/projects/${projectId}/details`
          );
          const detailsSnapshot = await getDocs(detailsCollection);

          if (!detailsSnapshot.empty) {
            detailsSnapshot.docs.forEach((detailDoc) => {
              const status = detailDoc.data()['status'];
              if (status === 'en curso') {
                this.projectsInProgress++;
              } else if (status === 'finalizado') {
                this.projectsCompleted++;
              }
            });
          }
        }

        // Actualizar el número total de proyectos
        this.projectsCount = snapshot.size;
      }
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
    }
  }

  async loadMonthlyFuelTotals() {
    try {
      const monthlyFuelCollection = collection(
        this.firestore,
        'monthlyFuelTotals'
      );
      const monthlyFuelSnapshot = await getDocs(monthlyFuelCollection);

      monthlyFuelSnapshot.forEach((doc) => {
        const month = doc.id;
        const totalFuel = doc.data()['totalFuel'] ?? 0;

        const monthIndex = this.getMonthIndex(month);
        if (monthIndex !== -1) {
          this.monthlyFuelData[monthIndex] = totalFuel;
        }
      });
    } catch (error) {
      console.error('Error al cargar los totales de combustible:', error);
    }
  }

  getMonthIndex(month: string): number {
    const monthMapping: { [key: string]: number } = {
      enero: 0,
      febrero: 1,
      marzo: 2,
      abril: 3,
      mayo: 4,
      junio: 5,
      julio: 6,
      agosto: 7,
      septiembre: 8,
      octubre: 9,
      noviembre: 10,
      diciembre: 11,
    };
    return monthMapping[month.toLowerCase()] ?? -1;
  }

  initializeLineChart() {
    const monthlyCostData = this.monthlyFuelData.map((litros) => litros * 4.91);

    // Encuentra el valor máximo entre las dos series
    const maxValue = Math.max(
      Math.max(...this.monthlyFuelData), // Valor máximo de Litros de Combustible
      Math.max(...monthlyCostData) // Valor máximo de Costo Total
    );

    // Configura las series
    this.lineChartOptions.series = [
      {
        name: 'Litros de Combustible',
        data: this.monthlyFuelData,
        type: 'line',
      },
      {
        name: 'Costo Total',
        data: monthlyCostData,
        type: 'line',
      },
    ];

    // Configura el eje X (categorías del gráfico)
    this.lineChartOptions.xaxis = {
      categories: [
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
      ],
    };

    // Configura los ejes Y para que tengan el mismo rango
    this.lineChartOptions.yaxis = [
      {
        title: {
          text: 'Combustible (L)',
          style: {
            color: '#008FFB',
            fontSize: '14px',
            fontWeight: 'bold',
          },
        },
        min: 0, // Valor mínimo
        max: maxValue, // Valor máximo calculado
        labels: {
          style: {
            colors: '#008FFB', // Coincide con el color del título
          },
          formatter: function (val) {
            return val.toFixed(0); // Mostrar valores enteros
          },
        },
      },
      {
        opposite: true, // Coloca este eje Y en el lado derecho
        title: {
          text: 'Costo Total',
          style: {
            color: '#00E396',
            fontSize: '14px',
            fontWeight: 'bold',
          },
        },
        labels: {
          style: {
            colors: '#00E396', // Coincide con el color del título
          },
          formatter: function (val) {
            return `$${val.toFixed(2)}`;
          },
        },
      },
    ];

    // Configura la visualización del gráfico (sin necesidad de yAxisIndex en las series)
    this.lineChartOptions.chart = {
      type: 'line',
      height: '100%',
    };
  }

  onResourceChange() {
    if (this.selectedResource === 'default') {
      // Cargar el gráfico predeterminado cuando se seleccione "General"
      this.loadDefaultPieChart();
    } else {
      // Cargar máquinas asignadas para el recurso seleccionado
      this.loadAssignedMachines();
    }
  }

  async loadAssignedMachines() {
    if (!this.selectedResource) return;

    try {
      const machinesCollection = collection(
        this.firestore,
        `projects/${this.selectedResource}/team`
      );
      const snapshot = await getDocs(machinesCollection);

      const assignedMachines = snapshot.docs
        .map((doc) => {
          const machineName =
            doc.data()['maquina']?.nombre ?? 'Maquina sin nombre';

          // Excluir máquinas sin nombre
          if (machineName === 'Maquina sin nombre') {
            return null; // No contar esta máquina
          }

          return {
            name: machineName,
            quantity: 1,
          };
        })
        .filter((machine) => machine !== null); // Filtra las máquinas con 'null'

      const machinesSnapshot = await getDocs(
        collection(this.firestore, 'machines')
      );

      const groupedMachines: { [key: string]: number } = {};

      assignedMachines.forEach((assignedMachine) => {
        let updatedName = assignedMachine.name;

        machinesSnapshot.docs.forEach((machineDoc) => {
          const machineData = machineDoc.data();
          const machineList = machineData['maquinas'] || [];

          if (machineList.includes(assignedMachine.name)) {
            updatedName = machineDoc.id;
          }
        });

        if (groupedMachines[updatedName]) {
          groupedMachines[updatedName] += 1;
        } else {
          groupedMachines[updatedName] = 1;
        }
      });

      const updatedMachines = Object.keys(groupedMachines).map((key) => ({
        name: key,
        quantity: groupedMachines[key],
      }));

      this.assignedMachines = updatedMachines;

      // Calcular el total de máquinas asignadas
      this.totalAssignedMachines = updatedMachines.reduce(
        (total, machine) => total + machine.quantity,
        0
      );

      this.updatePieChart();
    } catch (error) {
      console.error('Error al cargar máquinas asignadas:', error);
    }
  }

  updatePieChart() {
    const labels = this.assignedMachines.map((machine) => machine.name);
    const data = this.assignedMachines.map((machine) => machine.quantity);

    this.pieChartOptions = {
      ...this.pieChartOptions, // Conserva la configuración previa
      series: data, // Actualiza los datos del gráfico
      labels: labels, // Actualiza las etiquetas
    };
  }

  // Métodos para el modal de cierre de sesión
  closeLogoutModal() {
    this.showLogoutModal = false;
  }

  logout() {
    // Agregar lógica para cerrar sesión
    console.log('Sesión cerrada');
  }
}
