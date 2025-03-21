import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { UserApi } from '../../constants/api-endpoints/api.constants';

@Injectable({
  providedIn: 'root',
})
export class SlideBarSharedService {
  private readonly http = inject(HttpClient);

  getConversationOverview(): Observable<any> {
    return this.http
      .post<any>(
        `${UserApi.BASE_URL}${UserApi.ENDPOINT.CONVERSATION_OVERVIEW}`,
        {
          headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        },
      )
      .pipe(
        map(
          (response: {
            data: { [key: string]: { period: string; conversations: any[] } };
            message: string;
            status: string;
          }) => {
            const conversationsData = response.data;

            return Object.keys(conversationsData).map((index) => ({
              date: conversationsData[index].period,
              conversations: conversationsData[index].conversations.map(
                (convo) => ({
                  id: convo.id,
                  title: convo.name,
                }),
              ),
            }));
          },
        ),
      );
  }

  deleteConversation(conversation_id: number): Observable<any> {
    return this.http
      .delete<any>(
        `${UserApi.BASE_URL}${UserApi.ENDPOINT.CONVERSATION_TO_DEL(conversation_id)}`,
        {
          headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        },
      )
      .pipe(
        catchError((error) => {
          return throwError(() => new Error(error));
        }),
      );
  }
}
