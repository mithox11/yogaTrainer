import { Routes } from '@angular/router';
import { RoutineBuilderComponent } from './components/routine-builder/routine-builder.component';
import { RoutineDisplayComponent } from './components/routine-display/routine-display.component';

export const routes: Routes = [
    { path: '', component: RoutineBuilderComponent },
    { path: 'play', component: RoutineDisplayComponent },
    { path: '**', redirectTo: '' }
];
