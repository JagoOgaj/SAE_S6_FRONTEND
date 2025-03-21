import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Models } from '../../constants/models-enum/model.enum';

@Injectable({
  providedIn: 'root',
})
export class PromptService {
  private isProcessingSubject = new BehaviorSubject<boolean>(false);
  private isLoggingOutSubject = new BehaviorSubject<boolean>(false);
  private needDisabledConversationSubject = new BehaviorSubject<boolean>(false);
  private needNewConversationSubject = new BehaviorSubject<boolean>(false);
  private selectedModelSubject = new BehaviorSubject<string>(
    Models.GENDER_SCRATCH,
  );
  isProcessing$ = this.isProcessingSubject.asObservable();
  isLoggingOut$ = this.isLoggingOutSubject.asObservable();
  needDisabledConversation$ =
    this.needDisabledConversationSubject.asObservable();
  needNewConversation$ = this.needNewConversationSubject.asObservable();
  selectedModel$ = this.selectedModelSubject.asObservable();

  setIsProcessing(value: boolean) {
    this.isProcessingSubject.next(value);
  }

  setIsLoggingOut(value: boolean) {
    this.isLoggingOutSubject.next(value);
  }

  setNeedDisabledCOnversation(value: boolean) {
    this.needDisabledConversationSubject.next(value);
  }

  setNewConversation(value: boolean) {
    this.needNewConversationSubject.next(value);
  }

  setSelectedModel(model: string) {
    this.selectedModelSubject.next(model);
  }
}
