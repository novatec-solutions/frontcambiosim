import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AccountContact } from '../interfaces/account-contact.model';
import { AccountEvaluate } from '../interfaces/account-evaluate.model';
import { CustomerInfo } from '../interfaces/customer-info.model';
import { MigrateAccount } from '../interfaces/migrate.model';
import { MigrationDataResponse } from '../interfaces/migration-data.model';
import { PlanResourceResponse } from '../interfaces/plan-resource.model';
import { ValidacionCuentaResponse } from '../interfaces/validacion-cuenta.model';
import { ValidateInfo } from '../interfaces/validate-info.model';
import { ValidatePlanModel } from '../interfaces/validate-plan.model';

@Injectable({
  providedIn: 'root'
})
export class MigrationService {
  public baseUrl!: string;
  public baseUrlMock!: string;

  constructor(private http: HttpClient) {
    this.baseUrl = environment.url;
  }

  validarCuenta( data: ValidateInfo ): Observable<ValidacionCuentaResponse> {
    const url = this.baseUrl + "validar/informacion";
    return this.http.post<ValidacionCuentaResponse>(url, data);
  }

  validatePlanSimResource( data: ValidatePlanModel ): Observable<PlanResourceResponse> {
    const url = this.baseUrl + "validar/plan";
    return this.http.post<PlanResourceResponse>(url, data);
  }

  accountEvaluate( data: AccountEvaluate ): Observable<AccountContact> {
    const url = this.baseUrl + "cuenta/contactos";
    return this.http.post<AccountContact>(url, data);
  }

  migrate( data: MigrateAccount ): Observable<MigrationDataResponse> {
    const url = this.baseUrl + "cuenta/migrar";
    return this.http.post<MigrationDataResponse>(url, data);
  }

}
