import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RepayPage } from './repay.page';

const routes: Routes = [
  {
    path: '',
    component: RepayPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RepayPageRoutingModule {}
