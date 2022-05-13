import { TypeContacts } from "../enums/contact-type.enum";

export interface AccountContactInfo {
  type: TypeContacts;
  contact: string;
}

export interface AccountContact {
  error: number;
  response: Array<AccountContactInfo>
}
