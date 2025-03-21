import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ModelApi, UserApi } from '../../constants/api-endpoints/api.constants';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PromptContentSharedService {
  private readonly http = inject(HttpClient);

  getConversation(conversation_id: number): Observable<any> {
    return this.http.get<any>(
      `${UserApi.BASE_URL}${UserApi.ENDPOINT.GET_CONVERSATION(conversation_id)}`,
    );
  }

  getPrediction(typeModel: string, data: FormData): Observable<any> {
    return this.http.post<any>(
      `${ModelApi.BASE_URL}${ModelApi.ENDPOINT.PREDICT(typeModel)}`,
      data,
    );
  }

  updateConversation(conversatin_id: number, data: any): Observable<any> {
    return this.http.put<any>(
      `${UserApi.BASE_URL}${UserApi.ENDPOINT.CONNTINUE_CONVERSATION(conversatin_id)}`,
      data,
      {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      },
    );
  }

  createConverstaion(data: any): Observable<any> {
    return this.http.post<any>(
      `${UserApi.BASE_URL}${UserApi.ENDPOINT.NEW_CONVERSATION}`,
      data,
      {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      },
    );
  }
}
