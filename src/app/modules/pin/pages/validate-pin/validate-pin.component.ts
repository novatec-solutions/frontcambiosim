import { Component, OnInit, QueryList, ViewChildren } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DialogButton } from 'src/app/core/enums/dialog-button.enum';
import { DialogButtonTheme } from 'src/app/core/enums/dialog-theme.enum';
import { ModalDialogConfig } from 'src/app/core/interfaces/modal.config';
import { DialogComponent } from 'src/app/core/organisms/dialog/dialog.component';
import { LoadingService } from 'src/app/core/services/loading.service';
import { MigrationService } from 'src/app/modules/migration/services/migration.service';
import { GenerarPin } from '../../interfaces/generate-pin.model';
import { ValidatePinStatus } from '../../interfaces/validate-pin.model';
import { PinService } from '../../services/pin.service';
import { ValidatePinConfig } from './validate-pin.config';

@Component({
  selector: 'app-validate-pin',
  templateUrl: './validate-pin.component.html',
  styleUrls: ['./validate-pin.component.scss']
})
export class ValidatePinComponent implements OnInit {
  invalidPin: boolean = true;
  @ViewChildren('inputs') inputs!: QueryList<any>;
  pinForm!: FormGroup;
  public contactInfo!: GenerarPin;

  constructor(public fb: FormBuilder,
    private router: Router,
    public dialog: MatDialog,
    public loaderService: LoadingService,
    public migrationService: MigrationService,
    private PinService: PinService) {
      this.contactInfo = this.router.getCurrentNavigation()?.extras.state as GenerarPin;
      this.pinForm = this.fb.group({
        digits: this.fb.array([])
      });
    }

    ngOnInit(): void {
      for (let i = 0; i < 4; i++) {
        (this.pinForm.get('digits') as FormArray).push(
          this.fb.control(null)
        );
      }
    }
  
    check(index: number, field: { value: string | null; setValue: (arg0: null) => void; }, event: { keyCode: number; }) {
      this.invalidPin = !this.pinForm.value.digits.includes(null) ? false : true;
  
      if (field.value != null && event.keyCode !== 32) {
        if (index < (this.inputs.toArray().length - 1) ) {
          this.inputs.toArray()[index + 1].nativeElement.focus();
        }
      }
      
      if (event.keyCode === 8) {
        if (index > 0) {
          if(field.value != null){
            field.setValue(null); 
          }else{
            this.inputs.toArray()[index-1].nativeElement.focus();
          } 
        }
      }    
    }
  
    validateKey(e:any, field:any){
      if((e.keyCode < 48 || e.keyCode > 57) && (e.keyCode < 96 || e.keyCode > 105) && 
      e.keyCode !==8){
        e.preventDefault();
      }
      if((field.value !== null && e.keyCode !==8)){
        e.preventDefault();
      }
    }
  
    get digits(): FormArray {
      return this.pinForm.get('digits') as FormArray;
    }

  showSuccessDialog(){
    const dialogInstance = this.showMessage<ModalDialogConfig>({
      icon: "simok",
      message: `<span>La solicitud se ha realizado con éxito.</span> Espera unos minutos y una vez tu SIM Card actual quede sin servicio. Por favor inserta tu nueva`,
      content: `SIM Card 4G.`,
      actions: [
        {
          key: DialogButton.CONFIRM,
          color: DialogButtonTheme.PRIMARY,
          label: 'Aceptar',
          type: 'button'
        }
      ]
    });

    dialogInstance.componentInstance.buttonPressed.subscribe((buttonKey: DialogButton) => {
      if(buttonKey === DialogButton.CONFIRM){
        this.router.navigate(['/migration']);
      }
      dialogInstance.close();
    });
  }

  showIncorrectPinDialog(msg: string){
    const dialogInstance = this.showMessage<ModalDialogConfig>({
      icon: "warn",
      message: "Error",
      content: msg,
      actions: [
        {
          key: DialogButton.CANCEL,
          color: DialogButtonTheme.SECONDARY,
          label: 'Cancelar',
          type: 'button'
        },
        {
          key: DialogButton.CONFIRM,
          color: DialogButtonTheme.PRIMARY,
          label: 'Volver a intentar',
          type: 'button'
        },
      ]
    });

    dialogInstance.componentInstance.buttonPressed.subscribe((buttonKey: DialogButton) => {
      if(buttonKey == 'confirm'){
        this.generateNewPin();
      }
      dialogInstance.close();
    });
  }

  generateNewPin(){
    this.showSuccessGeneratePinDialog();
    this.pinForm.reset({digits: this.fb.array([])});
    this.invalidPin = true;
    const { documentClient } = this.contactInfo;

    

    const param = {
      ...this.contactInfo
    };
    this.migrationService.accountEvaluate({documentClient: documentClient}).subscribe({
      next: ()=> {
        this.PinService.generatePin(param).subscribe({ error : () => {} });
      },error: () =>{
        this.showMessage('Se ha presentado un error al hacer la consulta, por favor intenta nuevamente');
      }
    });
  }

  migrate(){
    this.loaderService.show();
    const { min, iccid, min_b } = this.contactInfo;
    const data = {
      min,
      iccidNew: iccid,
      min_b
    };
    this.migrationService.migrate(data).subscribe({
      next: res => {
        console.warn(res.response);
        if(res.error === 0){
          this.showSuccessDialog();
        }else{
          this.showDialogError(res.response.description);
          this.pinForm.reset();
        }        
      },
      error: () => {
        this.loaderService.hide();
        this.showDialogError(ValidatePinConfig.messages.iccidChangeError);
        this.pinForm.reset();
      },
      complete: () => this.loaderService.hide()
    })
  }

  showSuccessGeneratePinDialog(){
    const dialogInstance = this.showMessage<ModalDialogConfig>({
      icon: "check",
      message: ' ',
      content: 'Pin Generado satisfactoriamente',
      actions: [
        {
          key: DialogButton.CONFIRM,
          color: DialogButtonTheme.PRIMARY,
          label: 'Aceptar',
          type: 'button'
        }
      ]
    });

    dialogInstance.componentInstance.buttonPressed.subscribe((buttonKey: DialogButton) => {
      this.pinForm.reset();
      dialogInstance.close();
    });
  }

  validatePin(pin: any){
    this.loaderService.show();
    const pinNumber = Object.values(pin.digits).join('');
  
      const { documentClient } = this.contactInfo;

      const param = {
        documentClient,
        pinNumber
      };
      this.PinService.validatePin(param).subscribe({
        next: res => {
          if(res.error === ValidatePinStatus.SUCCESS){
            this.migrate();
            return;
          }
          this.showIncorrectPinDialog(res.response.description);
        },
        error : (err) => {
          this.loaderService.hide();
          this.showIncorrectPinDialog( err );
        },
        complete: () => this.loaderService.hide()
      });
  }

  showDialogError(content: string){
    this.loaderService.hide();
    const dialogInstance = this.showMessage<ModalDialogConfig>({
      icon: "warn",
      message: `Error`,
      content,
      actions: ValidatePinConfig.modals.genericError.actions
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

  showMessage<T>(info: T){
    return this.dialog.open(DialogComponent, {
      width: '400px',
      disableClose: true,
      data: info
    });
  }
}
