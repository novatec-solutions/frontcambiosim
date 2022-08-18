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
import { IccidStatus } from '../../enums/iccid-status.enum';
import { ValidacionCuenta, ValidacionCuentaResponse } from '../../interfaces/validacion-cuenta.model';
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
  readonly PREFIX_ICCID = '57101';

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
            this.processValidationStates(res.response);
          },
          complete: () => {
            this.loaderService.hide();
          }
        });
      }
      dialogInstance.close();
    });
  }

  processValidationStates(response: ValidacionCuenta){
    if( response.iccidStatus === IccidStatus.ASSIGNED || 
      response.iccidStatus === IccidStatus.RESERVED){
      this.processValidationAssignedState();
    } else if(
      response.iccidStatus === IccidStatus.FREE ||
      response.iccidStatus === IccidStatus.DEACTIVATED ||
      response.iccidStatus === IccidStatus.LIBRE ){
      this.processValidationFreeState();
    } else {
      if(response?.code === '-30'){
        response.description = MigrationFormConfig.messages.errorChange; 
      }
      this.showDialogError(response.description);
    }
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

  processValidationFreeState(){
    let documentData = "";
    const {
      currentPhoneNumber: min,
      serialSimlastNumbers: iccid,
    } = this.formRawValue;

    this.migrationService.getCustomerInfoResource({ min }).pipe(
      tap( () => this.loaderService.show() ),
      map(({ response })=> {
        if(response?.code === "-10"){
          throw new Error('Valid token not returned');
        }
        return response
      }),
      map( item => mapDocumentType(item) ),
      tap( ({ documentClient }) => documentData = documentClient),
      mergeMap( item => this.migrationService.accountEvaluate(item) ),
    ).subscribe( {
      next: accountContacts => {
        this.router.navigate([ MigrationFormConfig.routes.pinGenerate ], {
          state: {
            info: accountContacts.response.data,
            documentData,
            min,
            iccid
          }
        });
      },
      error: () => this.showDialogError(MigrationFormConfig.messages.errorChange),
      complete: () => this.loaderService.hide()
    });
  }

  processValidationAssignedState(){
    let documentData = "";
    const {
      currentPhoneNumber: min,
      serialSimlastNumbers: iccid,
    } = this.formRawValue;

    this.showConfirmSimNumberDialog().pipe(
      tap( () => this.loaderService.show() ),
      mergeMap( item => this.migrationService.validatePlanSimResource(item) ),
      map(({ response })=> {
        if(response?.code === "-3" || response?.code === "-7"){
          throw new Error('Valid token not returned');
        }
        return response
      }),
      map( item => mapDocumentType(item) ),
      tap( ({ documentClient }) => documentData = documentClient),
      mergeMap( item => this.migrationService.accountEvaluate(item) ),
    ).subscribe( {
      next: accountContacts => {
        this.router.navigate([ MigrationFormConfig.routes.pinGenerate ], {
          state: {
            info: accountContacts.response.data,
            documentData,
            min,
            iccid
          } 
        });
      },
      error: () => this.showDialogError(MigrationFormConfig.messages.errorChange),
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
