export interface MigrationData {
  code : string;
  description : string;
}

export interface MigrationDataResponse {
  error?: number,
  response: MigrationData
}
