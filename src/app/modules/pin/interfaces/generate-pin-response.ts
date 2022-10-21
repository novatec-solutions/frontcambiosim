export enum GeneratePinError {
  SUCCESS = 0,
  ERRROR = 1,
}

export interface GeneratePinResponse {
  error: GeneratePinError;
  response: {
    description: string;
  }
}
