import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { RolesComponent } from './components/roles/roles.component';
import { EmployeesComponent } from './components/employees/employees.component';
import { WorkHoursComponent } from './components/work-hours/work-hours.component';
import { MachineryComponent } from './components/machinery/machinery.component';
import { LoginComponent } from './components/login/login.component';
import { AssignResourcesComponent } from './components/assign-resources/assign-resources.component';
import { ProjectComponent } from './components/projects/projects.component';
import { CalendarComponent } from './components/calendar/calendar.component';
import { FuelManagementComponent } from './components/fuel-management/fuel-management.component';
import { ProjectDashboardComponent } from './components/project-dashboard/project-dashboard.component';
import { ProjectDetailsComponent } from './components/project-dashboard/project-details/project-details.component';
import { ProjectTasksComponent } from './components/project-dashboard/project-tasks/project-tasks.component';
import { ProjectTeamComponent } from './components/project-dashboard/project-team/project-team.component';
import { FuelAssignmentTableComponent } from './components/fuel-assignment-table/fuel-assignment-table.component';
import { EmployeeScheduleComponent } from './components/employee-schedule/employee-schedule.component';
import { AuthGuard } from './auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard]  },
  { path: 'roles', component: RolesComponent, canActivate: [AuthGuard]  },
  { path: 'employees', component: EmployeesComponent, canActivate: [AuthGuard]  },
  { path: 'work-hours', component: WorkHoursComponent, canActivate: [AuthGuard]  },
  { path: 'machinery', component: MachineryComponent , canActivate: [AuthGuard] },
  { path: 'assign-resources', component: AssignResourcesComponent, canActivate: [AuthGuard]  },
  { path: 'projects', component: ProjectComponent, canActivate: [AuthGuard]  },
  { path: 'fuel', component: FuelManagementComponent, canActivate: [AuthGuard]  },
  { path: 'calendar', component: CalendarComponent, canActivate: [AuthGuard]  },
  { path: 'fuel-assignment', component: FuelAssignmentTableComponent, canActivate: [AuthGuard]  },
  { path: 'employee-schedule', component: EmployeeScheduleComponent, canActivate: [AuthGuard]  },

  // Rutas anidadas para ProjectDashboard con manejo de parámetros
  {
    path: 'projects/:id',
    component: ProjectDashboardComponent,
    canActivate: [AuthGuard], // Protect parent route
    children: [
      {
        path: 'details',
        component: ProjectDetailsComponent,
        canActivate: [AuthGuard], 
      },
      {
        path: 'tasks',
        component: ProjectTasksComponent,
        canActivate: [AuthGuard], 
      },
      {
        path: 'team',
        component: ProjectTeamComponent,
        canActivate: [AuthGuard], 
      },
      {
        path: '', // Redirección a 'details' por defecto si se accede a /projects/:id
        redirectTo: 'details',
        pathMatch: 'full',
      },
    ],
  },

  // Redirección a login por defecto si no hay una ruta válida
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // Ruta para manejar páginas no encontradas (opcional)
  { path: '**', redirectTo: '/login', pathMatch: 'full' },
];
