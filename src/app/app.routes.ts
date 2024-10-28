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

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'roles', component: RolesComponent },
  { path: 'employees', component: EmployeesComponent },
  { path: 'work-hours', component: WorkHoursComponent },
  { path: 'machinery', component: MachineryComponent },
  { path: 'assign-resources', component: AssignResourcesComponent },
  { path: 'projects', component: ProjectComponent },
  { path: 'fuel', component: FuelManagementComponent },
  { path: 'calendar', component: CalendarComponent },

  // Nueva ruta para ProjectDashboard con subrutas
  {
    path: 'projects/:id',
    component: ProjectDashboardComponent,
    children: [
      {
        path: 'details',
        component: ProjectDetailsComponent,
      },
      {
        path: 'tasks',
        component: ProjectTasksComponent,
      },
      {
        path: 'team',
        component: ProjectTeamComponent,
      },
      {
        path: '', // Redirige a 'details' por defecto si se accede a /projects/:id
        redirectTo: 'details',
        pathMatch: 'full',
      },
    ],
  },

  { path: '', redirectTo: '/login', pathMatch: 'full' }, // Redirección a login por defecto
];
