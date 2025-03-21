import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PromptContentSharedComponent } from './prompt-content-shared.component';

describe('PromptContentSharedComponent', () => {
  let component: PromptContentSharedComponent;
  let fixture: ComponentFixture<PromptContentSharedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PromptContentSharedComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PromptContentSharedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
