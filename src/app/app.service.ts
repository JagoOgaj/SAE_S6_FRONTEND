import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  private showTokenAlert = new BehaviorSubject<boolean>(false);
  tokenExpired$ = this.showTokenAlert.asObservable();

  setShowTokenExpiredAlert(value: boolean): void {
    this.showTokenAlert.next(value);
  }
}
