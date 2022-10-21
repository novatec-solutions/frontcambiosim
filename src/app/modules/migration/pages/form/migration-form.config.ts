import { Validators } from "@angular/forms";
import { REGEX_PHONE_NUMBER } from "src/app/core/constants/validations";
import { DialogButton } from "src/app/core/enums/dialog-button.enum";
import { DialogButtonTheme } from "src/app/core/enums/dialog-theme.enum";
import { DialogButtonActions, DialogInputs } from "src/app/core/interfaces/modal.config";

export const MigrationFormConfig = Object.freeze({
  modals: {
    confirmSimNumber: {
      inputs: [
        {
          key: "SimCard",
          validators: [
            Validators.required,
            Validators.pattern(REGEX_PHONE_NUMBER)
          ],
          mask: "0000000000",
          errors: {
            pattern: 'Campo obligatorio, debe iniciar en 3 y contener 10 dígitos'
          }
        }
      ] as DialogInputs[],
      actions: [
        {
          key: DialogButton.CANCEL,
          color: DialogButtonTheme.SECONDARY,
          label: 'Cancelar',
          type: "button"
        },
        {
          key: DialogButton.CONFIRM,
          color: DialogButtonTheme.PRIMARY,
          label: 'Confirmar',
          type: "submit"
        },
      ] as DialogButtonActions[]
    },
    confirmMigration: {
      actions: [
        {
          key: DialogButton.CANCEL,
          color: DialogButtonTheme.SECONDARY,
          label: 'Editar',
          type: "button"
        },
        {
          key: DialogButton.CONFIRM,
          color: DialogButtonTheme.PRIMARY,
          label: 'Confirmar',
          type: "button"
        },
      ] as DialogButtonActions[]
    },
    genericError: {
      actions: [
        {
          key: DialogButton.CANCEL,
          color: DialogButtonTheme.SECONDARY,
          label: 'Aceptar',
          type: "button"
        },
      ] as DialogButtonActions[]
    }
  },
  messages: {
    IccdStatusError : "El serial ingresa presenta un estado que no permite migrar",
    generic: "Ha ocurrido un error al validar la cuenta, por favor intenta nuevamente.",
    errorChange: "No aplica para realizar el cambio de sim card"
  },
  routes: {
    pinGenerate: '/pin/generate',
  },
});
