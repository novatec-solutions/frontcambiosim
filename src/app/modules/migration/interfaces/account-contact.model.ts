import { TypeContacts } from "../enums/contact-type.enum";

export interface AccountContactInfo {
  type: TypeContacts;
  contact: string;
}

export interface AccountContact {
  error?: number;
  response: {
    description: string,
    data: Array<AccountContactInfo>
  }
}

export interface AccountContactExtras {
  info: Array<AccountContactInfo>;
  documentData: string;
  min?: string;
  iccid?: string;
  min_b?:string;
}
