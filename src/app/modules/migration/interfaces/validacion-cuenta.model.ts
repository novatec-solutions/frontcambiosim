import { IccidStatus } from "../enums/iccid-status.enum";

export interface ValidacionCuenta {
  code?: string;
  description: string;
  iccidStatus?: IccidStatus; 
}

export interface ValidacionCuentaResponse {
  error?: number,
  response: ValidacionCuenta  
}
