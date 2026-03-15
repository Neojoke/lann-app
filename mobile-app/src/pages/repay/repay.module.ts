import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RepayPage } from './repay.page';
import { RepayPageRoutingModule } from './repay-routing.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    RepayPageRoutingModule,
    TranslateModule.forChild(),
  ],
  declarations: [RepayPage],
})
export class RepayPageModule {}
