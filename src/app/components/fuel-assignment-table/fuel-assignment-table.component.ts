import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  Timestamp,
  getDocs,
  getDoc,
  doc,
  where,
  query,
} from '@angular/fire/firestore';
import { SharedDashboardComponent } from '../shared-dashboard/shared-dashboard.component';
import { CommonModule } from '@angular/common';
import html2canvas from 'html2canvas';  // Importa la librería html2canvas
import * as XLSX from 'xlsx';  // Importa la librería xlsx
import * as FileSaver from 'file-saver';  // Para exportar CSV
import jsPDF from 'jspdf';  // Para PDF
import 'jspdf-autotable';  // Importa el complemento para autoTable
import { FormsModule } from '@angular/forms';

interface FuelRecord {
  machineId: string;
  machineType: string;
  totalFuelAssigned: number;
  dateAssigned?: Timestamp; // Asegúrate de que el tipo coincide con el tipo de Firestore
  monthlyTotals: { [month: string]: number };
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: any;
  }
}

interface FuelHistoryEntry {
  Combustible: number; // Cantidad de combustible en litros
  Fecha: Timestamp;    // Fecha del registro de combustible (usando Timestamp de Firestore)
}

interface MachineFuelHistory {
  machineId: string;
  fuelHistory: FuelHistoryEntry[];
}


interface TeamMember {
  machineId: string;
  employeeName: string;
  projectName: string;  // Nueva propiedad para almacenar el nombre del proyecto
}

@Component({
  selector: 'app-fuel-assignment-table',
  standalone: true,
  imports: [SharedDashboardComponent, CommonModule, FormsModule],
  templateUrl: './fuel-assignment-table.component.html',
  styleUrls: ['./fuel-assignment-table.component.css'],
})
export class FuelAssignmentTableComponent implements OnInit {
  fuelRecords: FuelRecord[] = [];
  teamMembers: TeamMember[] = [];  // Aquí almacenaremos los miembros del equipo con la información de la máquina y el empleado.
  totalFuel: number = 0;
  totalCost: number = 0;
  loading: boolean = true;
  showExportMenu: boolean = false; // Para mostrar u ocultar el menú de exportación
  modalVisible: boolean = false;
  modalFuelHistory: any[] = [];
  selectedMachineId: string = '';
  filteredFuelRecords: FuelRecord[] = []; // Nueva propiedad para los registros filtrados
  filterDate: Date = new Date(); // Fecha del filtro, por defecto hoy
  filterMonth: string = ''; // Filtro por mes (formato: 'YYYY-MM')
  filterType: 'day' | 'month' = 'day'; // Tipo de filtro: 'day' o 'month'

  @ViewChild('table', { static: false }) table: any;  // Referencia a la tabla
  @ViewChild('exportMenu', { static: false }) exportMenu!: ElementRef;

  constructor(private firestore: Firestore, private elementRef: ElementRef) {}

  ngOnInit(): void {
    this.loadFuelRecords();
    this.loadTeamMembers();
  }

  private async loadFuelRecords(): Promise<void> {
    this.fuelRecords = []; // Reiniciar registros
    console.log('Iniciando carga de datos desde fuelAssignments...');
  
    try {
      const machinesCollection = collection(this.firestore, 'machines');
      const machinesSnapshot = await getDocs(machinesCollection);
  
      for (const machineDoc of machinesSnapshot.docs) {
        const machineId = machineDoc.id;
        console.log(`Procesando máquina: ${machineId}`);
  
        // Subcolección fuelAssignments
        const fuelAssignmentsCollection = collection(
          this.firestore,
          `machines/${machineId}/fuelAssignments`
        );
        const fuelAssignmentsSnapshot = await getDocs(fuelAssignmentsCollection);
  
        fuelAssignmentsSnapshot.forEach((doc) => {
          const data = doc.data();
          const fuelHistory = data['fuelHistory'] || [];
          console.log(`Historial de combustible para ${doc.id}:`, fuelHistory);
  
          // Agregar cada entrada del historial como un registro individual
          fuelHistory.forEach((entry: any) => {
            this.fuelRecords.push({
              machineId: doc.id,
              machineType: machineId,
              totalFuelAssigned: entry['Combustible'] || 0,
              dateAssigned: entry['Fecha'], // Fecha de la entrada del historial
              monthlyTotals: {}, // Objeto vacío por defecto
            });
          });
        });
      }
  
      console.log('Registros cargados:', this.fuelRecords);
      this.applyFilters(); // Aplicar filtros después de cargar los datos
    } catch (error) {
      console.error('Error al cargar datos desde fuelAssignments:', error);
    }
  }

  applyFilters(): void {
    if (this.filterType === 'day') {
      this.applyDateFilter();
    } else if (this.filterType === 'month') {
      this.applyMonthFilter();
    }
    this.updateTotals(); // Recalcular totales después del filtrado
  }
  
  updateTotals(): void {
    this.totalFuel = this.filteredFuelRecords.reduce((sum, record) => sum + record.totalFuelAssigned, 0);
    this.totalCost = this.totalFuel * 4.91;
    console.log(`Total combustible: ${this.totalFuel}, Costo: S/${this.totalCost.toFixed(2)}`);
  }
  
  updateColumnValues(): void {
    this.filteredFuelRecords = this.filteredFuelRecords.map((record) => {
      // Si necesitas aplicar algún cálculo adicional, hazlo aquí.
      // Por ejemplo: Podrías recalcular el total asignado basado en otra lógica.
      return {
        ...record,
        totalFuelAssigned: record.totalFuelAssigned, // Esto puede incluir lógica adicional si es necesario
      };
    });
  }
  
  private applyDateFilter(): void {
    const filterDateStr = this.filterDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    const filtered = this.fuelRecords.filter((record) => {
      if (record.dateAssigned) {
        const recordDateStr = record.dateAssigned.toDate().toISOString().split('T')[0];
        return recordDateStr === filterDateStr; // Coincide con la fecha seleccionada
      }
      return false;
    });
  
    this.filteredFuelRecords = this.groupByMachineAndDate(filtered); // Agrupamos por máquina y fecha
    console.log('Registros filtrados y agrupados por día:', this.filteredFuelRecords);
  }
  
  private applyMonthFilter(): void {
    const filterMonthStr = this.filterMonth; // Ya está en formato YYYY-MM
    const filtered = this.fuelRecords.filter((record) => {
      if (record.dateAssigned) {
        const recordMonthStr = record.dateAssigned.toDate().toISOString().substring(0, 7); // Formato YYYY-MM
        return recordMonthStr === filterMonthStr;
      }
      return false;
    });
  
    this.filteredFuelRecords = this.groupByMachineAndMonth(filtered); // Agrupamos por máquina y mes
    console.log('Registros filtrados y agrupados por mes:', this.filteredFuelRecords);
  }  

  // Cambiar entre filtro por día y filtro por mes
  setFilterType(type: 'day' | 'month'): void {
    this.filterType = type;
    this.applyFilters(); // Aplicar el filtro correspondiente
  }

  onFilterDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const newDate = input.valueAsDate;
    if (newDate) {
      this.filterDate = newDate;
      this.applyFilters();
    }
  }
  
  onFilterMonthChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const newMonth = input.value;
    if (newMonth) {
      this.filterMonth = newMonth;
      this.applyFilters();
    }
  }
  
  async viewDetails(machineId: string, filterDate: string | undefined): Promise<void> {
    if (!filterDate) {
      console.error('Fecha no válida para ver los detalles.');
      return;
    }
  
    const details = this.fuelRecords.filter((record) => {
      if (record.machineId === machineId && record.dateAssigned) {
        const recordDateStr = record.dateAssigned.toDate().toISOString().split('T')[0];
        return recordDateStr === filterDate; // Coincide con la máquina y el día
      }
      return false;
    });
  
    console.log('Detalles para la máquina:', machineId, 'en el día:', filterDate, details);
  
    // Mostramos los detalles en un modal
    this.modalFuelHistory = details;
    this.modalVisible = true;
  }
  
  
  closeModal(): void {
    this.modalVisible = false;
    this.modalFuelHistory = [];
  }
  

  // Nueva función para cargar los miembros del equipo
  private async loadTeamMembers(): Promise<void> {
    const projectsCollection = collection(this.firestore, 'projects');
    const querySnapshot = await getDocs(projectsCollection);

    querySnapshot.forEach(async (docSnap) => {
      const projectName = docSnap.data()?.['name'];  // Obtener el nombre del proyecto
      const teamCollection = collection(docSnap.ref, 'team');
      const teamSnapshot = await getDocs(teamCollection);

      teamSnapshot.forEach((teamDoc) => {
        const teamData = teamDoc.data();
        if (teamData?.['maquina']?.id) {
          this.teamMembers.push({
            machineId: teamData['maquina'].id,
            employeeName: teamData['nombre'], // El nombre del empleado está en el campo "nombre"
            projectName: projectName || 'Proyecto',  // Agregar el nombre del proyecto
          });
        }
      });
    });
  }

  getEmployeeName(machineId: string): string {
    const member = this.teamMembers.find(
      (teamMember) => teamMember.machineId === machineId
    );
    return member ? member.employeeName : 'Emplead@';
  }

  getProjectName(machineId: string): string {
    const member = this.teamMembers.find(
      (teamMember) => teamMember.machineId === machineId
    );
    return member ? member.projectName : 'Proyecto';
  }

  formatDate(timestamp: Timestamp): string {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
  

  getMonths(record: FuelRecord): string[] {
    return record.monthlyTotals ? Object.keys(record.monthlyTotals) : [];
  }

 // Mostrar/ocultar el menú de exportación
 toggleExportMenu(event: Event): void {
  event.stopPropagation(); // Evita que el clic cierre inmediatamente el menú
  this.showExportMenu = !this.showExportMenu;
}

formatHour(hour: string): string {
  const [hourStr, minuteStr] = hour.split(":");
  const hourInt = parseInt(hourStr, 10);
  const minuteInt = parseInt(minuteStr, 10);
  
  const suffix = hourInt >= 12 ? 'PM' : 'AM';
  let formattedHour = hourInt % 12;
  if (formattedHour === 0) {
    formattedHour = 12; // Para mostrar 12 en vez de 0
  }

  const formattedMinute = minuteInt < 10 ? `0${minuteInt}` : minuteInt;

  return `${formattedHour}:${formattedMinute} ${suffix}`;
}

private groupByMachineAndDate(records: FuelRecord[]): FuelRecord[] {
  const grouped: { [key: string]: FuelRecord } = {};

  records.forEach((record) => {
    if (record.dateAssigned) {
      const dateKey = record.dateAssigned.toDate().toISOString().split('T')[0]; // Formato YYYY-MM-DD
      const key = `${record.machineId}_${dateKey}`;

      if (!grouped[key]) {
        grouped[key] = {
          ...record,
          totalFuelAssigned: record.totalFuelAssigned, // Inicializamos el combustible
        };
      } else {
        grouped[key].totalFuelAssigned += record.totalFuelAssigned; // Sumamos el combustible
      }
    }
  });

  return Object.values(grouped); // Retornamos un array con los registros agrupados
}

private groupByMachineAndMonth(records: FuelRecord[]): FuelRecord[] {
  const grouped: { [key: string]: FuelRecord } = {};

  records.forEach((record) => {
    if (record.dateAssigned) {
      const monthKey = record.dateAssigned.toDate().toISOString().substring(0, 7); // Formato YYYY-MM
      const key = `${record.machineId}_${monthKey}`;

      if (!grouped[key]) {
        grouped[key] = {
          ...record,
          totalFuelAssigned: record.totalFuelAssigned, // Inicializamos el combustible
        };
      } else {
        grouped[key].totalFuelAssigned += record.totalFuelAssigned; // Sumamos el combustible
      }
    }
  });

  return Object.values(grouped); // Retornamos un array con los registros agrupados
}


 // Detectar clics fuera del menú
 @HostListener('document:click', ['$event'])
 onClickOutside(event: Event): void {
   if (
     this.exportMenu &&
     !this.exportMenu.nativeElement.contains(event.target)
   ) {
     this.showExportMenu = false; // Cierra el menú si el clic está fuera
   }
 }

  // Exportar la tabla como imagen
  exportAsImage(): void {
    html2canvas(this.table.nativeElement).then((canvas) => {
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = 'tabla_combustible.png';
      link.click();
    });
  }

  exportAsExcel(): void {
    const wsTable: XLSX.WorkSheet = XLSX.utils.table_to_sheet(this.table.nativeElement);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsTable, 'Tabla General');
  
    // Agrupar los registros de combustible por máquina (usando machineId)
    const groupedByMachine: { [key: string]: FuelRecord[] } = this.fuelRecords.reduce((acc: { [key: string]: FuelRecord[] }, record: FuelRecord) => {
      if (!acc[record.machineId]) {
        acc[record.machineId] = [];
      }
      acc[record.machineId].push(record);
      return acc;
    }, {});
  
    // Función que obtiene el historial para una máquina específica
    const getFuelHistoryForMachine = async (machineAssigned: string, machineSpecific: string): Promise<FuelHistoryEntry[]> => {
      console.log(`Recuperando historial para la máquina asignada: ${machineAssigned} y máquina específica: ${machineSpecific}`);
      
      const machinesCollection = collection(this.firestore, 'machines');
      const q = query(machinesCollection, where('name', '==', machineAssigned));
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const machineDoc = querySnapshot.docs[0];
        const machineDocId = machineDoc.id;
    
        const fuelAssignmentsRef = collection(this.firestore, `machines/${machineDocId}/fuelAssignments`);
        const fuelAssignmentsSnapshot = await getDocs(fuelAssignmentsRef);
        if (!fuelAssignmentsSnapshot.empty) {
          const fuelAssignmentDoc = fuelAssignmentsSnapshot.docs.find(d => d.id === machineSpecific);
          if (fuelAssignmentDoc) {
            const fuelData = fuelAssignmentDoc.data();
            if (fuelData['fuelHistory']) {
              console.log(`Historial de combustible encontrado para la máquina específica ${machineSpecific}:`, fuelData['fuelHistory']);
              return fuelData['fuelHistory'] || [];
            } else {
              console.error(`No hay historial de combustible para la máquina específica ${machineSpecific}`);
              return [];
            }
          } else {
            console.error(`No se encontró la máquina específica ${machineSpecific} en las asignaciones de combustible.`);
            return [];
          }
        } else {
          console.error(`No se encontraron asignaciones de combustible para la máquina asignada ${machineAssigned}`);
          return [];
        }
      } else {
        console.error(`No se encontró la máquina asignada con nombre ${machineAssigned}`);
        return [];
      }
    };
  
    // Función para cargar los historiales de combustible por máquina asignada
    const loadFuelHistories = async () => {
      const machinesHistories: { [key: string]: { machineSpecific: string, fuelHistory: FuelHistoryEntry[] }[] } = {};

      const rows = this.table.nativeElement.querySelectorAll('tr');
      
      // Iteramos solo hasta la penúltima fila (omitiendo la última)
      for (let i = 0; i < rows.length - 1; i++) {  // Aquí modificamos para no incluir la última fila
        const row = rows[i];
        const cells = row.querySelectorAll('td');

        if (cells.length > 0) {
          const machineAssigned = cells[2].textContent.trim();
          const machineSpecific = cells[3].textContent.trim();

          try {
            const fuelHistory = await getFuelHistoryForMachine(machineAssigned, machineSpecific);

            if (fuelHistory.length > 0) {
              if (!machinesHistories[machineAssigned]) {
                machinesHistories[machineAssigned] = [];
              }

              // Añadir los historiales para la máquina asignada y específica
              machinesHistories[machineAssigned].push({ machineSpecific, fuelHistory });
            }
          } catch (error) {
            console.error(`Error al recuperar el historial para la máquina específica ${machineSpecific}:`, error);
          }
        }
      }

      // Crear hojas para cada máquina asignada
      for (const machineAssigned in machinesHistories) {
        let combinedFuelHistoryData: any[] = [];

        // Crear un encabezado para cada máquina asignada
        const headerRow = ['Máquina', 'Combustible', 'Fecha'];
        combinedFuelHistoryData.push(headerRow);  // Agregar encabezado antes de cada grupo

        // Agrupar por cada máquina específica
        machinesHistories[machineAssigned].forEach((item) => {
          // Añadir una fila vacía entre los grupos de máquinas específicas
          if (combinedFuelHistoryData.length > 1) {
            combinedFuelHistoryData.push([]); // Fila vacía para separación visual
          }

          const fuelHistoryData = item.fuelHistory.map((entry: FuelHistoryEntry) => [
            item.machineSpecific,  // Ahora usamos machineSpecific para la columna 'Máquina'
            `${entry.Combustible}L`,
            this.formatDate(entry.Fecha),
          ]);

          combinedFuelHistoryData = combinedFuelHistoryData.concat(fuelHistoryData);
        });

        // Ahora 'combinedFuelHistoryData' es un arreglo de arreglos adecuado
        const wsHistory: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(combinedFuelHistoryData);
        XLSX.utils.book_append_sheet(wb, wsHistory, machineAssigned);
      }

      XLSX.writeFile(wb, 'tabla_combustible_con_historial.xlsx');
    };
    // Llamar de manera asíncrona pero secuencial
    loadFuelHistories();
  }
  
  exportAsCSV(): void {
    const getFuelHistoryForMachine = async (machineAssigned: string, machineSpecific: string): Promise<FuelHistoryEntry[]> => {
      const machinesCollection = collection(this.firestore, 'machines');
      const q = query(machinesCollection, where('name', '==', machineAssigned));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const machineDoc = querySnapshot.docs[0];
        const machineDocId = machineDoc.id;
        const fuelAssignmentsRef = collection(this.firestore, `machines/${machineDocId}/fuelAssignments`);
        const fuelAssignmentsSnapshot = await getDocs(fuelAssignmentsRef);
  
        if (!fuelAssignmentsSnapshot.empty) {
          const fuelAssignmentDoc = fuelAssignmentsSnapshot.docs.find(d => d.id === machineSpecific);
          if (fuelAssignmentDoc) {
            const fuelData = fuelAssignmentDoc.data();
            return fuelData['fuelHistory'] || [];
          }
        }
      }
      return [];
    };
  
    const loadFuelHistoriesForCSV = async () => {
      const rows = this.table.nativeElement.querySelectorAll('tr');
      const csvData = [];
      
      for (const row of rows) {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
          const machineAssigned = cells[2].textContent.trim();
          const machineSpecific = cells[3].textContent.trim();
          
          try {
            const fuelHistory = await getFuelHistoryForMachine(machineAssigned, machineSpecific);
            let fuelHistoryText = '';
            if (fuelHistory.length > 0) {
              // Incluir detalles del historial de forma estructurada
              fuelHistoryText = fuelHistory.map((entry: FuelHistoryEntry) => `Combustible: ${entry.Combustible}L, Fecha: ${this.formatDate(entry.Fecha)}`).join('; ');
            }
            const rowData = [...cells].map(cell => cell.textContent.trim());
            rowData.push(fuelHistoryText); // Agregar el historial como columna
            csvData.push(rowData);
          } catch (error) {
            console.error(`Error al recuperar el historial para la máquina específica ${machineSpecific}:`, error);
          }
        }
      }
  
      const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(csvData);
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      FileSaver.saveAs(blob, 'tabla_combustible_con_historial.csv');
    };
  
    loadFuelHistoriesForCSV();
  }
  
  exportAsPDF(): void {
    const getFuelHistoryForMachine = async (machineAssigned: string, machineSpecific: string): Promise<FuelHistoryEntry[]> => {
      const machinesCollection = collection(this.firestore, 'machines');
      const q = query(machinesCollection, where('name', '==', machineAssigned));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const machineDoc = querySnapshot.docs[0];
        const machineDocId = machineDoc.id;
        const fuelAssignmentsRef = collection(this.firestore, `machines/${machineDocId}/fuelAssignments`);
        const fuelAssignmentsSnapshot = await getDocs(fuelAssignmentsRef);
  
        if (!fuelAssignmentsSnapshot.empty) {
          const fuelAssignmentDoc = fuelAssignmentsSnapshot.docs.find(d => d.id === machineSpecific);
          if (fuelAssignmentDoc) {
            const fuelData = fuelAssignmentDoc.data();
            return fuelData['fuelHistory'] || [];
          }
        }
      }
      return [];
    };
  
    const loadFuelHistoriesForPDF = async () => {
      const rows = this.table.nativeElement.querySelectorAll('tr');
      const doc = new jsPDF();
      let currentY = 10; // Posición inicial Y para la tabla
  
      // **Primera página: Tabla con los datos originales**
      doc.autoTable({ html: this.table.nativeElement });
      currentY = doc.autoTable.previous.finalY + 10; // Actualiza la posición Y después de la tabla
  
      // **Evitar una página en blanco**
      // Si la posición Y es menor al final de la página (aproximadamente 290), no agregamos una nueva página aún
      const pageHeight = doc.internal.pageSize.height;
      if (currentY < pageHeight - 30) {
        // Esto evita agregar una página en blanco innecesaria si la tabla general no ocupa toda la página
        currentY = doc.autoTable.previous.finalY + 10; // Ajustar posición sin añadir página
      } else {
        doc.addPage(); // Si es necesario, añade una página nueva
        currentY = 10; // Reinicia la posición Y
      }
  
      // Agrupar las máquinas por "Máquina Asignada" (por ejemplo: Camión, Tractor, Excavadora)
      const groupedByAssignedMachine: { [key: string]: { machineSpecific: string; fuelHistory: FuelHistoryEntry[] }[] } = {};
  
      // Recorremos cada fila de la tabla para agrupar los datos
      for (const row of rows) {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
          const machineAssigned = cells[2].textContent.trim(); // "Máquina Asignada"
          const machineSpecific = cells[3].textContent.trim(); // "Máquina Específica"
  
          // Obtener el historial de combustible para la máquina específica
          const fuelHistory = await getFuelHistoryForMachine(machineAssigned, machineSpecific);
  
          // Si existe historial, lo agregamos a la estructura de agrupamiento
          if (fuelHistory.length > 0) {
            if (!groupedByAssignedMachine[machineAssigned]) {
              groupedByAssignedMachine[machineAssigned] = [];
            }
            groupedByAssignedMachine[machineAssigned].push({ machineSpecific, fuelHistory });
          }
        }
      }
  
      // **Generar una página para cada tipo de "Máquina Asignada"**
      for (const [machineAssigned, fuelData] of Object.entries(groupedByAssignedMachine)) {
        doc.addPage();
        currentY = 10; // Reiniciar la posición Y para cada nueva página
  
        // Título de la página
        doc.setFontSize(16);
        doc.text(`Historial de Combustible de ${machineAssigned}`, 10, currentY);
        currentY += 10; // Espacio después del título
  
        // **Agregar las tablas para cada máquina específica dentro de esa categoría**
        for (const { machineSpecific, fuelHistory } of fuelData) {
          doc.setFontSize(12);
          doc.text(`Máquina Específica: ${machineSpecific}`, 10, currentY);
          currentY += 10; // Espacio después del nombre de la máquina
  
          // Datos para la tabla de cada historial
          const fuelHistoryData = fuelHistory.map((entry: FuelHistoryEntry) => {
            const formattedDate = this.formatDate(entry.Fecha); // Asume que tienes una función `formatDate`
            return [formattedDate, `${entry.Combustible}L`];
          });
  
          // Agregar la tabla del historial
          doc.autoTable({
            head: [['Fecha', 'Combustible']],
            body: fuelHistoryData,
            startY: currentY,
            margin: { top: 10 },
            styles: {
              cellPadding: 2, // Espaciado dentro de las celdas
              fontSize: 10,    // Tamaño de la fuente
              halign: 'center', // Centrar texto en las celdas
              valign: 'middle', // Alinear verticalmente
            },
          });
  
          currentY = doc.autoTable.previous.finalY + 10; // Actualiza la posición Y después de la tabla
  
          // Si la tabla excede el límite de la página, se añade una nueva
          if (currentY > 270) { // Usamos 270 en lugar de 280 para mejor ajuste
            doc.addPage();
            currentY = 10; // Reiniciar la posición Y para la nueva página
          }
        }
      }
  
      // Guardar el archivo PDF
      doc.save('historial_combustible_por_maquina.pdf');
    };
  
    loadFuelHistoriesForPDF();
  }
  
}