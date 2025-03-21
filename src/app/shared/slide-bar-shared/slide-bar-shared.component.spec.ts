import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SlideBarSharedComponent } from './slide-bar-shared.component';

describe('SlideBarSharedComponent', () => {
  let component: SlideBarSharedComponent;
  let fixture: ComponentFixture<SlideBarSharedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SlideBarSharedComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SlideBarSharedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
