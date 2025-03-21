import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  HostListener,
  Inject,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-a-propos',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './a-propos.component.html',
  styleUrl: './a-propos.component.css',
})
export class AProposComponent implements OnInit {
  overlayVisible: boolean = false;
  togglehamburgerIcon: boolean = false;
  navbarVisible = true;
  previousScrollPosition: number = 0;
  scrollThreshold = 15;
  isDisabled = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo(0, 0);
    }
  }

  setNavBarVisible() {
    const currentScrollPosition = window.pageYOffset;
    if (currentScrollPosition === 0) {
      this.navbarVisible = true;
    }

    if (
      currentScrollPosition <
      this.previousScrollPosition - this.scrollThreshold
    ) {
      this.navbarVisible = true;
    } else if (currentScrollPosition > this.previousScrollPosition) {
      this.navbarVisible = false;
    }

    this.previousScrollPosition = currentScrollPosition;
  }

  showOrHideOverlay() {
    this.navbarVisible = true;
    if (this.isDisabled) return;

    this.isDisabled = true;

    setTimeout(() => {
      this.isDisabled = false;
    }, 1000);

    if (!this.overlayVisible) {
      this.overlayVisible = true;
      this.togglehamburgerIcon = true;
      this.removeOverflowX();
      document.body.style.overflow = 'hidden';
    } else {
      this.hideOverlay();
      document.body.style.overflow = 'auto';
      this.addOverflowX();
    }
  }

  removeOverflowX() {
    document.documentElement.style.overflowX = 'visible';
    document.body.style.overflowX = 'visible';
  }

  addOverflowX() {
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflowX = 'hidden';
  }

  hideOverlay() {
    const overlayElement = document.querySelector('.overlay') as HTMLElement;
    overlayElement?.classList.add('hidden');
    setTimeout(() => {
      this.overlayVisible = false;
      overlayElement?.classList.remove('hidden');
    }, 700);
    this.togglehamburgerIcon = false;
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.setNavBarVisible();
  }

  navigateTo(route: string): void {
    if (this.overlayVisible) {
      document.body.style.overflow = 'auto';
      this.addOverflowX();
    }
    this.router.navigate([`${route}`]);
  }
}
