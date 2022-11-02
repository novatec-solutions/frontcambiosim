import { TypeContacts } from "../../migration/enums/contact-type.enum";

export interface GenerarPin {
  documentClient : string;
  contactData : string;
  contactType? : TypeContacts;
  mask?: string;
  min?: string;
  iccid?: string;
  min_b?: string;
  method?: string;
}
