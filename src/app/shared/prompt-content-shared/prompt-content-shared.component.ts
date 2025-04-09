import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterContentChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { formatInTimeZone } from 'date-fns-tz';
import { Models, nameOfModels } from '../../constants/models-enum/model.enum';
import { AuthTokenService } from '../../core/auth-token.service';
import { PromptService } from '../../pages/prompt/prompt.service';
import { PromptContentSharedService } from './prompt-content-shared.service';
import { webSocketUrl } from '../../constants/web-sockets/ws.constants';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface CapturedImage {
  file: File | null;
  previewUrl: string;
}

@Component({
  selector: 'app-prompt-content-shared',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prompt-content-shared.component.html',
  styleUrl: './prompt-content-shared.component.css',
})
export class PromptContentSharedComponent
  implements OnInit, AfterContentChecked, OnChanges, OnDestroy
{
  @Input({ required: true }) isCollapsed!: boolean;
  @Input() screenWidth!: number;
  @Input() conversationSelected!: number | null;
  @Input() needNewConversation!: boolean;
  @Output() setIsCollapsed = new EventEmitter<boolean>();
  @Output() refreshConversationOverview = new EventEmitter<boolean>();
  @Output() setNeedNewConversation = new EventEmitter<boolean>();
  sizeClass: string = '';
  iconsClass: string = 'hidden-icons';
  Model = Models;
  selectedModel: string = Models.GENDER_SCRATCH;
  nameOfModels: any = nameOfModels;
  storeConversation: boolean = true;
  toggleStoreConversationClass: string = 'fa-solid fa-toggle-on fa-2xl';
  conversationData: any | null = null;
  isLoading: boolean = false;
  isAuth: boolean = false;
  isLoggingOut: boolean = false;
  isFirstGeneration: boolean = true;
  @ViewChild('webcamVideo') webcamVideo!: ElementRef<HTMLVideoElement>;
  isWebcamActive: boolean = false;
  stream!: MediaStream;
  disabledCaptureButton: boolean = true;
  isFileValid: boolean = true;
  selectedFiles: CapturedImage[] = [];
  conversationDataToUpdate: any = { messages: [] };
  showInputBar: boolean = false;
  responseComplete: boolean = false;
  @ViewChild('conversationContainer')
  private conversationContainer!: ElementRef;
  isProcessing: boolean = false;
  showScrollToBottomButton: boolean = false;
  newConversationHeader: any = null;
  newConversationId: number | null = null;
  actualConversationId: number | null = null;
  @ViewChild('webcamVideoRealTime', { static: false })
  webcamVideoRealTime!: ElementRef;
  @ViewChild('overlayCanvas', { static: false }) overlayCanvas!: ElementRef;
  showRealTimeToolTip: boolean = false;
  webcamStream: MediaStream | null = null;
  websocket: WebSocket | null = null;
  predictionText: string = 'Analyse en cours...';
  userInput: string = '';
  cancelRequest$ = new Subject<void>(); 
  initialConversationCount: number = 0;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private prompService: PromptContentSharedService,
    private authTokenService: AuthTokenService,
    private cdRef: ChangeDetectorRef,
    private sharedPrompService: PromptService,
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isAuth = this.authTokenService.isAuthenticated();
      if (this.isAuth) {
        window.addEventListener('beforeunload', this.handleBeforeUnload);
        this.router.events.subscribe((event) => {
          if (event instanceof NavigationStart) {
            this.saveConversationIfNeeded();
          }
        });
      }
      this.sharedPrompService.selectedModel$.subscribe((model) => {
        this.selectedModel = model;
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.isAuth) {
      if (changes['needNewConversation'] && this.needNewConversation) {
        if (
          this.actualConversationId &&
          this.conversationDataToUpdate.messages.length > 0
        ) {
          this.prompService
            .updateConversation(this.actualConversationId, {
              messages: this.conversationDataToUpdate.messages.map(
                (message: {
                  type: any;
                  content: any;
                  image: any;
                  created_at: any;
                }) => ({
                  type: message.type,
                  content: message.content,
                  image: message.image,
                  created_at: message.created_at,
                }),
              ),
            })
            .subscribe({
              next: (response) => {
                this.actualConversationId = null;
                this.conversationDataToUpdate = { messages: [] };
              },
              error: (errors) => {
                console.error(
                  'Erreur lors de la mise à jour de la conversation:',
                  errors,
                );
              },
            });
        }
        this.conversationData = null;
        this.setNeedNewConversation.emit(false);
        this.actualConversationId = null;
      }

      if (
        changes['conversationSelected'] &&
        this.conversationSelected !== null
      ) {
        if (
          this.actualConversationId !== null &&
          this.actualConversationId !== this.conversationSelected &&
          this.conversationDataToUpdate.messages.length > 0
        ) {
          this.prompService
            .updateConversation(this.actualConversationId, {
              messages: this.conversationDataToUpdate.messages.map(
                (message: {
                  type: any;
                  content: any;
                  image: any;
                  created_at: any;
                }) => ({
                  type: message.type,
                  content: message.content,
                  image: message.image,
                  created_at: message.created_at,
                }),
              ),
            })
            .subscribe({
              next: () => {
                this.conversationDataToUpdate = { messages: [] };
                this.loadNewConversation(this.conversationSelected!);
              },
              error: (errors) => {
                console.log(errors);
              },
            });
        } else {
          this.loadNewConversation(this.conversationSelected);
        }
      }
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      if (this.isAuth) {
        window.removeEventListener('beforeunload', this.handleBeforeUnload);
      }
    }
  }

  handleBeforeUnload = (event: BeforeUnloadEvent) => {
    this.saveConversationIfNeeded();
  };

  saveConversationIfNeeded(): void {
    if (
      this.actualConversationId &&
      this.conversationDataToUpdate.messages.length > 0
    ) {
      this.prompService
        .updateConversation(this.actualConversationId, {
          messages: this.conversationDataToUpdate.messages.map((message: { type: any; content: any; documents: any; created_at: any; }) => ({
            type: message.type,
            content: message.content,
            documents: message.documents || [],
            created_at: message.created_at,
          })),
        })
        .subscribe({
          next: () => {
            this.conversationDataToUpdate = { messages: [] };
          },
          error: (errors) => {
            console.error(
              'Erreur lors de la sauvegarde de la conversation:',
              errors,
            );
          },
        });
    }
  }

  loadNewConversation(conversationId: number): void {
    this.actualConversationId = conversationId;
    this.conversationDataToUpdate = { messages: [] };
    this.showScrollToBottomButton = false;
    this.loadConversation(conversationId);
    this.scrollToBottom();
  }

  ngAfterContentChecked(): void {
    this.setSizeClass();
    this.setIconsClass();
    if (isPlatformBrowser(this.platformId)) {
      this.applyBlurEffect();
    }
  }

  setIsWebCamActive() {
    if (this.isWebcamActive) {
      this.isWebcamActive = false;
    }
  }

  async toggleWebcam() {
    await this.startWebcam();
  }

  async startWebcam() {
    this.isWebcamActive = true;

    setTimeout(async () => {
      try {
        const videoElement = document.querySelector(
          'video#webcamVideo',
        ) as HTMLVideoElement;

        if (!videoElement) {
          return;
        }

        this.stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (this.stream) {
          videoElement.srcObject = this.stream;
          this.disabledCaptureButton = false;
        }
      } catch (error) {}
    }, 100);
  }

  
  onFileChange(event: any): void {
    const files = Array.from(event.target.files) as File[]; 
    const validExtensions = ['pdf', 'txt', 'docx', 'doc', 'rtf', 'odt'];
  
    files.forEach((file) => {
      const fileExtension = this.getFileExtension(file.name).toLowerCase();
  
      if (!validExtensions.includes(fileExtension)) {
        console.error(`Type de fichier non valide : ${file.name}`);
        return;
      }
  
      this.selectedFiles.push({
        file: file,
        previewUrl: '',
      });
    });
  
    this.showInputBar = this.selectedFiles.length > 0;
  }

  removeDocument(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.showInputBar = this.selectedFiles.length > 0 || this.userInput.trim() !== ''; 
  }

  removeAllImage(): void {
    this.selectedFiles = []
  }


  loadConversation(conversation_id: number): void {
    this.isLoading = true;
    this.showScrollToBottomButton = false;
    this.prompService.getConversation(conversation_id).subscribe({
      next: (response) => {
        this.conversationData = response.data.messages.map((message: any) => ({
          type: message.type,
          content: message.content,
          documents: message.documents || [],
          created_at: message.created_at,
        }));
        this.isLoading = false;
        this.initialConversationCount = this.conversationData.length;
        this.scrollToBottom();
      },
      error: (errors) => {
        console.log(errors);
        this.isLoading = false;
      },
    });
  }

  submitForPrediction() {
    if (!this.conversationData) {
      console.error('conversationData est null. Initialisation nécessaire.');
      this.conversationData = [];
    }
  
    if (this.selectedFiles.length > 0 || this.userInput.trim() !== '') {
      this.isProcessing = true;
  
  
      const userMessage = {
        type: 'user',
        content: this.userInput.trim(),
        documents: this.selectedFiles.map((file) => file.file?.name),
        created_at: this.getCurrentParisTime(),
      };
      this.conversationData.push(userMessage);
  

      this.userInput = '';
  
      const loadingMessage = {
        type: 'ia',
        content: 'Analyse...',
        created_at: this.getCurrentParisTime(),
      };
      this.conversationData.push(loadingMessage);
  

      const formData = new FormData();
      formData.append('userInput', userMessage.content);
      this.selectedFiles.forEach((file, index) => {
        if (file.file) {
          formData.append(`documents[${index}]`, file.file, file.file.name);
        }
      });
  
      this.prompService
        .getPrediction(this.selectedModel, formData)
        .pipe(takeUntil(this.cancelRequest$))
        .subscribe({
          next: (response) => {
            const modelMessage = {
              type: 'ia',
              content: response.message,
              created_at: this.getCurrentParisTime(),
            };
            this.conversationData[this.conversationData.length - 1].content = '';
            this.displayTextProgressively(
              response.message,
              this.conversationData.length - 1,
            );
            this.isProcessing = false;
          },
          error: (error) => {
            console.error('Erreur API:', error);
            this.conversationData[this.conversationData.length - 1].content =
              "Erreur lors de l'analyse.";
            this.isProcessing = false;
          },
        });
  
      this.removeAllImage();
    } else {
      console.error('Aucun fichier ou input utilisateur fourni.');
    }
  }
  

  cancelPrediction(): void {
    this.isProcessing = false;

  
    this.cancelRequest$.next();
    this.cancelRequest$.complete(); 
    

  
    if (this.conversationData && this.conversationData.length > 0) {
      this.conversationData.pop();
    }


    const interruptionMessage = {
      type: 'ia',
      content: 'Vous avez interrompu la requête.',
      created_at: this.getCurrentParisTime(),
    };
    this.conversationData.push(interruptionMessage);

    console.log('Requête annulée par l\'utilisateur.');
  }

  displayTextProgressively(text: string, messageIndex: number) {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        this.conversationData[messageIndex].content += text[currentIndex];
        this.scrollToBottom();
        currentIndex++;
      } else {
        clearInterval(interval);
        if (this.conversationSelected != null) {
          const newMessages = this.conversationData.slice(this.initialConversationCount);
          this.conversationDataToUpdate.messages.push(...newMessages);
          this.initialConversationCount = this.conversationData.length;
        }
        this.isProcessing = false;
        this.sharedPrompService.setIsProcessing(false);
        if (
          this.conversationSelected == null &&
          this.newConversationHeader == null &&
          this.storeConversation &&
          this.isAuth
        ) {
          const dateObj = new Date(this.getCurrentParisTime());
          const options: Intl.DateTimeFormatOptions = {
            day: '2-digit',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
          };
          const formattedDate = dateObj
            .toLocaleString('fr-FR', options)
            .replace(',', '');

          this.newConversationHeader = {
            name: `Conversation du ${formattedDate}`,
            created_at: this.getCurrentParisTime(),
            updated_at: this.getCurrentParisTime(),
            messages: [...this.conversationData],
          };
          this.prompService
            .createConverstaion(this.newConversationHeader)
            .subscribe({
              next: (response) => {
                this.actualConversationId = response.details.newConversation_id;
                this.newConversationHeader = null;
                this.refreshConversationOverview.emit(true);
                this.sharedPrompService.setNewConversation(true);
                this.sharedPrompService.setNeedDisabledCOnversation(false);
              },
              error: (errors) => {
                console.log(errors);
              },
            });
        }
      }
    }, 5);
  }

  scrollToBottom(): void {
    setTimeout(() => {
      try {
        if (this.conversationContainer) {
          this.conversationContainer.nativeElement.scrollTo({
            top: this.conversationContainer.nativeElement.scrollHeight + 50,
            behavior: 'smooth',
          });
        }
      } catch (err) {
        console.error('Erreur lors du défilement vers le bas:', err);
      }
    }, 0);
  }

  setShowScroolBotom(): void {
    const container = this.conversationContainer.nativeElement;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const threshold = 200;
    this.showScrollToBottomButton =
      scrollTop + clientHeight < scrollHeight - threshold;
  }

  onScroll(): void {
    this.setShowScroolBotom();
  }

  getCurrentParisTime(): string {
    return formatInTimeZone(
      new Date(),
      'Europe/Paris',
      "yyyy-MM-dd'T'HH:mm:ssXXX",
    );
  }

  getImageFromBase64(base64: string): string {
    return `data:image/png;base64,${base64}`;
  }

  setSizeClass(): void {
    if (this.isCollapsed || !this.isAuth) {
      this.sizeClass = '';
    } else {
      this.sizeClass =
        this.screenWidth > 768 ? 'body-trimmed' : 'body-md-screen';
    }
  }

  setIconsClass(): void {
    this.iconsClass =
      this.isCollapsed || !this.isAuth ? 'visible-icons' : 'hidden-icons';
  }

  toggleOrCloseCollapse(): void {
    this.setIsCollapsed.emit(!this.isCollapsed);
    this.applyBlurEffect();
  }

  newConversation(): void {
    if (
      this.actualConversationId &&
      this.conversationDataToUpdate.messages.length > 0 &&
      this.isAuth
    ) {
      this.prompService
        .updateConversation(this.actualConversationId, {
          messages: this.conversationDataToUpdate.messages.map(
            (message: { type: any; content: any; documents: any; created_at: any; }) => ({
              type: message.type,
              content: message.content,
              documents: message.documents || [],
              created_at: message.created_at,
            }),
          ),
        })
        .subscribe({
          next: (response) => {
            this.actualConversationId = null;
            this.conversationDataToUpdate = { messages: [] };
          },
          error: (errors) => {
            console.error('Erreur lors de la mise à jour de la conversation:', errors);
          },
        });
    }
    this.conversationData = null;
    this.setNeedNewConversation.emit(false);
  }

  selectModel(modelName: Models) {
    this.selectedModel = modelName;
  }

  toggleIconStoreConv(): void {
    this.storeConversation = !this.storeConversation;
    this.toggleStoreConversationClass = this.storeConversation
      ? 'fa-solid fa-toggle-on fa-2xl'
      : 'fa-solid fa-toggle-off fa-2xl';
  }

  logout(): void {
    this.isLoggingOut = true;
    this.sharedPrompService.setIsLoggingOut(true);
    this.authTokenService.logout().subscribe({
      next: (response) => {
        this.authTokenService.clearTokens();
        this.isLoggingOut = false;
        this.redirectTo('auth');
      },
      error: (erros) => {
        this.authTokenService.clearTokens();
        this.isLoggingOut = false;
        this.redirectTo('auth');
      },
    });
  }

  redirectTo(path: string): void {
    document.body.style.overflow = 'auto';
    this.sharedPrompService.setSelectedModel(Models.GENDER_SCRATCH);
    this.router.navigate([`${path}`]);
  }

  applyBlurEffect(): void {
    this.setClassFullPage(window.innerWidth <= 767 && !this.isCollapsed);
  }

  setClassFullPage(add: boolean): void {
    let fullPage = document.getElementById('fullPage');
    if (fullPage) {
      if (add) {
        fullPage.classList.add('blur-overlay');
      } else {
        fullPage.classList.remove('blur-overlay');
      }
    }
  }

  async toggleRealTime(): Promise<void> {
    if (!this.showRealTimeToolTip) {
      await this.startWebcamRealTime();
    } else {
      this.stopWebcamRealTime();
    }
  }

  async startWebcamRealTime(): Promise<void> {
    this.showRealTimeToolTip = true;

    setTimeout(async () => {
      if (!this.webcamVideoRealTime || !this.overlayCanvas) {
        console.error('❌ Webcam ou Canvas non trouvés.');
        this.showRealTimeToolTip = false;
        return;
      }

      try {
        if (this.webcamStream) {
          this.webcamStream.getTracks().forEach((track) => track.stop());
        }

        const videoElement = this.webcamVideoRealTime.nativeElement;
        this.webcamStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        videoElement.srcObject = this.webcamStream;

        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
          this.websocket.close();
        }

        this.websocket = new WebSocket(webSocketUrl);
        this.websocket.onmessage = (event) =>
          this.processWebSocketMessage(event);
        setInterval(() => this.sendFrameToWebSocket(), 500);
      } catch (error) {
        this.showRealTimeToolTip = false;
      }
    }, 500);
  }

  sendFrameToWebSocket(): void {
    if (
      !this.webcamVideoRealTime ||
      !this.websocket ||
      this.websocket.readyState !== WebSocket.OPEN
    )
      return;

    const video = this.webcamVideoRealTime.nativeElement;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }
    canvas.width = video.videoWidth || 700;
    canvas.height = video.videoHeight || 700;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/jpeg', 1);
    this.websocket.send(imageData.split(',')[1]);
  }

  processWebSocketMessage(event: MessageEvent): void {
    const data = JSON.parse(event.data);
    if (!data.prédiction || data.prédiction.length === 0) {
      this.predictionText = 'Aucun visage détecté.';
      return;
    }

    this.predictionText = data.prédiction;
  }

  stopWebcamRealTime(): void {
    if (this.webcamStream) {
      this.webcamStream.getTracks().forEach((track) => track.stop());
      this.webcamStream = null;
    }

    if (this.websocket) {
      this.websocket.close();
    }

    this.showRealTimeToolTip = false;
    this.predictionText = 'Analyse en cours...';

    const ctx = this.overlayCanvas.nativeElement.getContext('2d');
    ctx?.clearRect(
      0,
      0,
      this.overlayCanvas.nativeElement.width,
      this.overlayCanvas.nativeElement.height,
    );
  }

  get isOverlayActive(): boolean {
    return !this.isAuth;
  }

  adjustHeight(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto'; 
    textarea.style.height = `${textarea.scrollHeight}px`; 
  }
  
  getFileExtension(fileName: string | undefined): string {
    if (!fileName) return '';
    return fileName.split('.').pop()?.toUpperCase() || '';
  }
}
