import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../guards/auth.guard';
import { GuestGuard } from '../guards/guest.guard';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', canActivate: [AuthGuard], loadChildren: () => import('./pages/home/home.module').then(m => m.HomePageModule) },
  { path: 'login', canActivate: [GuestGuard], loadChildren: () => import('./pages/login/login.module').then(m => m.LoginPageModule) },
  { path: 'register', canActivate: [GuestGuard], loadChildren: () => import('./pages/register/register.module').then(m => m.RegisterPageModule) },
  { path: 'borrow', canActivate: [AuthGuard], loadChildren: () => import('./pages/borrow/borrow.module').then(m => m.BorrowPageModule) },
  { path: 'repay', canActivate: [AuthGuard], loadChildren: () => import('./pages/repay/repay.module').then(m => m.RepayPageModule) },
  { path: 'profile', canActivate: [AuthGuard], loadChildren: () => import('./pages/profile/profile.module').then(m => m.ProfilePageModule) },
  { path: '**', redirectTo: 'home' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
