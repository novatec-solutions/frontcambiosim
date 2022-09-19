import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GeneratePinComponent } from './pages/generate-pin/generate-pin.component';
import { ValidatePinComponent } from './pages/validate-pin/validate-pin.component';
import { StateGuard } from './services/state.guard';

const routes: Routes = [
  {
    path: 'validate',
    component: ValidatePinComponent,
    data: { animation: 'ValidatePinComponent' },
    canActivate : [StateGuard]
  },
  {
    path: 'generate',
    component: GeneratePinComponent,
    data: { animation: 'GeneratePinComponent' },
    canActivate : [StateGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PinRoutingModule { }
