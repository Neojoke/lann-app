import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { BorrowPage } from './borrow.page';
import { BorrowPageRoutingModule } from './borrow-routing.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BorrowPageRoutingModule,
    TranslateModule.forChild(),
  ],
  declarations: [BorrowPage],
})
export class BorrowPageModule {}
