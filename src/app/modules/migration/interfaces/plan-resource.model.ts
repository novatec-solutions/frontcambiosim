import { DocumentTypeNumber } from "../mapper/document-type.mapper";

export interface PlanResource {
  code: string;
  description: string;
  identificationNumber: string;
  identificationType: DocumentTypeNumber;
}

export interface PlanResourceResponse {
  error?: number,
  response: PlanResource
}
