import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BorrowPage } from './borrow.page';

const routes: Routes = [
  {
    path: '',
    component: BorrowPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BorrowPageRoutingModule {}
