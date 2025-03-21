import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  PLATFORM_ID,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { PromptService } from '../../pages/prompt/prompt.service';
import { SlideBarSharedService } from './slide-bar-shared.service';

@Component({
  selector: 'app-slide-bar-shared',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './slide-bar-shared.component.html',
  styleUrl: './slide-bar-shared.component.css',
})
export class SlideBarSharedComponent implements OnInit, OnDestroy {
  @Input({ required: true }) isCollapsed!: boolean;

  @Input() needNewConversation!: boolean;
  @Output() setIsCollapsed = new EventEmitter<boolean>();
  @Output() conversationSelected = new EventEmitter<number | null>();
  @Output() setNewConversation = new EventEmitter<boolean>();

  conversations: any[] = [];
  isLoading: boolean = false;
  selectedConversationId: number | null = null;
  selectedConversationIdToDell: number | null = null;
  selectedConversationTitleToDell: string | null = null;
  isDeleting: boolean = false;
  private intervalId: any;
  isProcessing: boolean = false;
  isLoggingOut: boolean = false;
  needDisabledConversation: boolean = false;
  private isProcessingSubscription!: Subscription;
  private isLogginOutSubscription!: Subscription;
  private needDisabledConversationSubscription!: Subscription;
  private needNewConversationSubscription!: Subscription;
  needRefresh: boolean = false;
  searchQuery: string = '';
  filteredConversations: any[] = [];

  constructor(
    private slideBarService: SlideBarSharedService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdRef: ChangeDetectorRef,
    private sharedPromptService: PromptService,
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadConversations();
      this.isProcessingSubscription =
        this.sharedPromptService.isProcessing$.subscribe((isProcessing) => {
          this.isProcessing = isProcessing;
        });
      this.isLogginOutSubscription =
        this.sharedPromptService.isLoggingOut$.subscribe((isLoggingOut) => {
          this.isLoggingOut = isLoggingOut;
        });
      this.needDisabledConversationSubscription =
        this.sharedPromptService.needDisabledConversation$.subscribe((v) => {
          this.needDisabledConversation = v;
        });
      this.needNewConversationSubscription =
        this.sharedPromptService.needNewConversation$.subscribe((v) => {
          this.needRefresh = v;
          if (v) {
            this.loadConversations();
          }
        });
    }
  }

  ngOnDestroy(): void {
    if (this.isProcessingSubscription) {
      this.isProcessingSubscription.unsubscribe();
    }
    if (this.isLogginOutSubscription) {
      this.isLogginOutSubscription.unsubscribe();
    }
  }

  loadConversations(): void {
    if (this.isLoading) return;
    this.isLoading = true;

    this.slideBarService.getConversationOverview().subscribe({
      next: (newConversations) => {
        this.conversations = newConversations;
        this.filterConversations();

        if (this.needRefresh) {
          const latestConversation = this.conversations[0]?.conversations[0];
          if (latestConversation) {
            const originalTitle = latestConversation.title;
            latestConversation.title = '';
            this.selectConversation(latestConversation.id);

            this.displayTitleProgressively(
              latestConversation.id,
              originalTitle,
            );
          }
          this.sharedPromptService.setNewConversation(false);
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des conversations', err);
        this.isLoading = false;
      },
    });
  }

  displayTitleProgressively(conversationId: number, fullTitle: string) {
    let index = 0;
    this.intervalId = setInterval(() => {
      for (const group of this.conversations) {
        const conversation = group.conversations.find(
          (c: any) => c.id === conversationId,
        );
        if (conversation) {
          conversation.title = fullTitle.slice(0, index + 1);
          break;
        }
      }

      index++;
      if (index >= fullTitle.length) {
        clearInterval(this.intervalId);
      }

      this.cdRef.detectChanges();
    }, 50);
  }

  filterConversations(): void {
    if (this.searchQuery.trim() === '') {
      this.filteredConversations = this.conversations;
    } else {
      this.filteredConversations = this.conversations
        .map((group) => ({
          ...group,
          conversations: group.conversations.filter((convo: any) =>
            convo.title.toLowerCase().includes(this.searchQuery.toLowerCase()),
          ),
        }))
        .filter((group) => group.conversations.length > 0);
    }
  }

  toggleOrCloseCollapse(): void {
    this.setIsCollapsed.emit(!this.isCollapsed);
  }

  newConversation(): void {
    this.setNewConversation.emit(true);
    this.conversationSelected.emit(null);
    this.needNewConversation = true;
  }

  deleteConversation(): void {
    if (this.selectedConversationIdToDell) {
      this.isDeleting = true;
      this.slideBarService
        .deleteConversation(this.selectedConversationIdToDell)
        .subscribe({
          next: () => {
            this.conversations = this.conversations.map((group) => ({
              ...group,
              conversations: group.conversations.filter(
                (convo: any) => convo.id !== this.selectedConversationIdToDell,
              ),
            }));
            this.selectedConversationIdToDell = null;
            this.selectedConversationTitleToDell = null;
            this.isDeleting = false;
            this.loadConversations();
            if (this.selectedConversationId) {
              this.newConversation();
            }
          },
          error: (err) => {
            this.selectedConversationIdToDell = null;
            this.selectedConversationTitleToDell = null;
            this.isDeleting = false;
          },
        });
    }
  }

  selectConversation(conversationId: number): void {
    this.selectedConversationId = conversationId;
    if (window.innerWidth < 767) {
      this.toggleOrCloseCollapse();
    }
    this.conversationSelected.emit(conversationId);
    this.setNewConversation.emit(false);
    this.needNewConversation = false;
  }

  prepareDeleteConversation(conversation: any): void {
    this.selectedConversationIdToDell = conversation.id;
    this.selectedConversationTitleToDell = conversation.title;
  }

  resetConversationToDell(): void {
    this.selectedConversationIdToDell = null;
    this.selectedConversationTitleToDell = null;
  }
}
