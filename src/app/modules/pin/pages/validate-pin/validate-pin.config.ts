import { DialogButton } from "src/app/core/enums/dialog-button.enum";
import { DialogButtonTheme } from "src/app/core/enums/dialog-theme.enum";
import { DialogButtonActions } from "src/app/core/interfaces/modal.config";

export const ValidatePinConfig = Object.freeze({
  modals: {
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
    generic: "Ha ocurrido un error, por favor intenta nuevamente.",
    generatePinError : "Ha ocurrido un error al general el pin, por favor intente nuevamente",
    iccidChangeError : "Error al realizar cambio de ICCID"
  }
});
