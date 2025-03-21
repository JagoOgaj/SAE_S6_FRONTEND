import { Routes } from '@angular/router';
import { PasswordForgotComponent } from './pages/auth/password-forgot/password-forgot.component';
import { PolitiqueConfidentialiteComponent } from './pages/politique-confidentialite/politique-confidentialite.component';
import { PromptComponent } from './pages/prompt/prompt.component';
import { AuthComponent } from './pages/auth/auth/auth.component';
import { AProposComponent } from './pages/a-propos/a-propos.component';

export const routes: Routes = [
  { path: 'auth', component: AuthComponent },
  { path: 'passwordforgot', component: PasswordForgotComponent },
  {
    path: 'politique-confidentialite',
    component: PolitiqueConfidentialiteComponent,
  },
  { path: 'prompt', component: PromptComponent },
  { path: 'prompt/:id', component: PromptComponent },
  { path: 'apropos', component: AProposComponent },
  { path: '**', redirectTo: 'prompt', pathMatch: 'full' },
];
