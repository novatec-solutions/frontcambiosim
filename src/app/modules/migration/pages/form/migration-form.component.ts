import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { map, mergeMap, Observable, tap } from 'rxjs';
import { REGEX_PHONE_NUMBER, REGEX_SERIAL_NUMBER } from 'src/app/core/constants/validations';
import { ModalDialogConfig } from 'src/app/core/interfaces/modal.config';
import { DialogComponent } from 'src/app/core/organisms/dialog/dialog.component';
import { LoadingService } from 'src/app/core/services/loading.service';
import { DialogButton } from '../../../../core/enums/dialog-button.enum';
import { ValidacionCuentaResponse } from '../../interfaces/validacion-cuenta.model';
import { ValidatePlanModel } from '../../interfaces/validate-plan.model';
import { mapDocumentType } from '../../mapper/document-type.mapper';
import { MigrationService } from '../../services/migration.service';
import { MigrationFormConfig } from './migration-form.config';

@Component({
  selector: 'app-migration-form',
  templateUrl: './migration-form.component.html',
  styleUrls: ['./migration-form.component.scss']
})
export class MigrationFormComponent {
  migrationForm!: FormGroup;
  readonly PREFIX_ICCID = '8957101';

  get currentPhoneNumber() {
    return this.migrationForm.get("currentPhoneNumber");
  }

  get serialSimlastNumbers() {
    return this.migrationForm.get("serialSimlastNumbers");
  }

  get formRawValue() {
    const rawJson = this.migrationForm.getRawValue();
    return {
      ...rawJson,
      serialSimlastNumbers: `${this.PREFIX_ICCID}${rawJson.serialSimlastNumbers}`
    }
  }

  constructor(
    public fb: FormBuilder,
    public dialog: MatDialog,
    public loaderService: LoadingService,
    public migrationService: MigrationService,
    private router: Router) {

    this.migrationForm = new FormGroup({
      currentPhoneNumber: new FormControl('', [
        Validators.required,
        Validators.pattern(REGEX_PHONE_NUMBER)
      ]),
      serialSimlastNumbers: new FormControl('', [
        Validators.required,
        Validators.pattern(REGEX_SERIAL_NUMBER)
      ]),
    });
  }

  showConfirmSimNumberDialog() : Observable<ValidatePlanModel> {
    const {
      currentPhoneNumber: min,
      serialSimlastNumbers: iccid,
    } = this.formRawValue;

    return new Observable( observer => {
      const dialogInstance = this.showMessage<ModalDialogConfig>({
        icon: "simcard",
        message: `Esta SIM card ya tiene un número de celular, para continuar digítalo en el siguiente campo:`,
        inputs: MigrationFormConfig.modals.confirmSimNumber.inputs,
        actions: MigrationFormConfig.modals.confirmSimNumber.actions
      });

      dialogInstance.componentInstance.buttonPressed.subscribe((buttonKey: DialogButton) => {
        dialogInstance.close();
        observer.error(buttonKey);
      });

      dialogInstance.componentInstance.formSubmitted.subscribe((form: FormGroup) => {
        dialogInstance.close();
        const formValue = form.getRawValue();
        observer.next({
          min,
          min_b: formValue.SimCard,
          iccid
        });
        observer.complete();
      });
    });
  }

  continueToNextStep() {
    if(this.migrationForm.valid){
      const dialogInstance = this.showMessage<ModalDialogConfig>({
        icon: "check",
        message: `Por favor confirma que el serial que ingresaste está <span>correcto.</span>`,
        content: `57101${this.serialSimlastNumbers?.value}`,
        actions: MigrationFormConfig.modals.confirmMigration.actions
      });
      this.bindDialogEvents(dialogInstance);
    }
  }

  bindDialogEvents(dialogInstance: MatDialogRef<DialogComponent, any>){
    dialogInstance.componentInstance.buttonPressed.subscribe((buttonKey: DialogButton) => {
      if(buttonKey === DialogButton.CONFIRM){
        this.loaderService.show();
        const {
          currentPhoneNumber: min,
          serialSimlastNumbers: iccid,
        } = this.formRawValue;

        this.migrationService.validarCuenta({ min, iccid }).subscribe({
          next: (res: ValidacionCuentaResponse) => {
            if(res.error === 0){
              this.processValidationAssignedState();
            }else{
              this.showDialogError(res.response.description);
            }  
          },
          complete: () => {
            this.loaderService.hide();
          }
        });
      }
      dialogInstance.close();
    });
  }

  showDialogError(content: string){
    this.loaderService.hide();
    const dialogInstance = this.showMessage<ModalDialogConfig>({
      icon: "warn",
      message: `Error`,
      content,
      actions: MigrationFormConfig.modals.genericError.actions
    });
    this.bindGenericDialogEvents(dialogInstance);
  }

  bindGenericDialogEvents(dialogInstance: MatDialogRef<DialogComponent, any>){
    dialogInstance.componentInstance.buttonPressed.subscribe((buttonKey: DialogButton) => {
      if(buttonKey === DialogButton.CANCEL){
        dialogInstance.close();
      }
    });
  }

  processValidationAssignedState(){
    let documentData = "";
    let min_b = "";
    const {
      currentPhoneNumber: min,
      serialSimlastNumbers: iccid,
    } = this.formRawValue;

    this.showConfirmSimNumberDialog().pipe(
      tap( () => this.loaderService.show() ),
      tap( (item) => min_b = item.min_b ),
      mergeMap( item => this.migrationService.validatePlanSimResource(item) ),
      map( res => {
        if(res.error === 1){         
          throw new Error(res.response.description);
        }
        return res.response; 
      }),
      map( item => mapDocumentType(item) ),
      tap( ({ documentClient }) => documentData = documentClient),
      mergeMap( item => this.migrationService.accountEvaluate(item) ),
    ).subscribe( {
      next: accountContacts => {
        if(accountContacts.error === 0){
          this.router.navigate([ MigrationFormConfig.routes.pinGenerate ], {
            state: {
              info: accountContacts.response,
              method: accountContacts.method,
              documentData,
              min,
              min_b,
              iccid
            } 
          });
          return;
        }
        this.showDialogError(accountContacts.response.description);
      },
      error: (error) => {
        this.showDialogError(error.message)
      },
      complete: () => this.loaderService.hide()
    });
  }

  showMessage<T>(info: T){
    return this.dialog.open(DialogComponent, {
      width: '350px',
      disableClose: true,
      data: info
    });
  }
}
