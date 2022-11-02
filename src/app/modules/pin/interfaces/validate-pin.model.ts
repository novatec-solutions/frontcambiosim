export enum ValidatePinStatus {
  SUCCESS = 0,
  ERRROR = 1,
}

export interface ValidatePin {
  documentClient: string;
  pinNumber: string;
  method?: string;
}

export interface ValidatePinResponse {
  error: ValidatePinStatus;
  response: {
    description: string;
  };
}
