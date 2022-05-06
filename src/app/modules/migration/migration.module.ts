import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MigrationRoutingModule } from './migration-routing.module';
import { MigrationFormComponent } from './pages/form/migration-form.component';
import { MaterialModule } from 'src/app/core/material/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CoreModule } from 'src/app/core/core.module';
import { MaxLengthDirective } from './directive/max-length.directive';

@NgModule({
  declarations: [
    MigrationFormComponent,
    MaxLengthDirective
  ],
  imports: [
    CommonModule,
    MigrationRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    CoreModule
  ]
})
export class MigrationModule { }
