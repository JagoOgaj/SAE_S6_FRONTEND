import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  HostListener,
  Inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { SlideBarSharedComponent } from '../../shared/slide-bar-shared/slide-bar-shared.component';
import { PromptContentSharedComponent } from '../../shared/prompt-content-shared/prompt-content-shared.component';
import { AuthTokenService } from '../../core/auth-token.service';

@Component({
  selector: 'app-prompt',
  standalone: true,
  imports: [
    CommonModule,
    SlideBarSharedComponent,
    PromptContentSharedComponent,
  ],
  templateUrl: './prompt.component.html',
  styleUrl: './prompt.component.css',
})
export class PromptComponent {
  isSlideBarCollapsed = signal<boolean>(false);
  conversation_idSelected = signal<number | null>(null);
  setNewConversationSignal = signal<boolean>(false);
  needRefreshConverstaionOverview = signal<boolean>(false);
  screenWidth = signal<number>(
    typeof window !== 'undefined' ? window.innerWidth : 0,
  );

  constructor(
    private authTokenService: AuthTokenService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.isSlideBarCollapsed.set(this.screenWidth() < 768);
    }
  }

  @HostListener('window:resize')
  onResize() {
    if (typeof window !== 'undefined') {
      this.screenWidth.set(window.innerWidth);
      if (this.screenWidth() < 768) {
        this.isSlideBarCollapsed.set(true);
      } else {
        this.isSlideBarCollapsed.set(false);
      }
    }
  }

  changeIsSlideBarCollapsed(isSlideBarCollapsed: boolean): void {
    this.isSlideBarCollapsed.set(isSlideBarCollapsed);
  }

  setConversationSelected(conversationSelected: number | null): void {
    this.conversation_idSelected.set(conversationSelected);
  }

  setNewconversation(needNewConversation: boolean): void {
    this.setNewConversationSignal.set(needNewConversation);
  }

  isAuth(): boolean | void {
    if (isPlatformBrowser(this.platformId)) {
      return this.authTokenService.isAuthenticated();
    }
  }
}
