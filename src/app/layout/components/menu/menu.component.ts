import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { MainPageState, SubPageState, HeaderService } from 'app/layout/header.service';
import { ActionsService } from 'app/layout/actions.service';
import { AuthenticationService } from 'app/shared/authentication/authentication.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  mobileMenuState: boolean = false;
  mobileMenuSubscription: Subscription;
  isReceived = false;
  private receiveMessagesSubscription: Subscription;

  constructor(
    private actions: ActionsService, 
    private header : HeaderService,
    private authService: AuthenticationService ) {
    this.mobileMenuSubscription = this.actions.getMobileMenuState().subscribe(obj => { this.mobileMenuState = obj.state });
  }

  ngOnInit() {
    this.actions.connectSocket();

    this.receiveMessagesSubscription = this.actions.receiveMessages().subscribe(response => {
        console.log(response);
        this.isReceived = true;
      });
  }

  closeMenu() {
    this.actions.toggleMobileMenuState(false);
  }
  onResize(event) {
    if (event.target.innerWidth > 971) {
      this.actions.toggleMobileMenuState(true);
      this.actions.toggleMobileSortingState(true);
    } else {
      this.actions.toggleMobileMenuState(false);
      this.actions.toggleMobileSortingState(false);
    }
  }

  clickBooking(){
    //this.header.setPage( MainPageState.Booking,         SubPageState.Booking_TimeLine );
  }
  clickGuests(){
    //this.header.setPage( MainPageState.Guests,          SubPageState.None );
  }
  clickStaffs(){
    //this.header.setPage( MainPageState.Staffs,          SubPageState.None );
  }
  clickSettings(){
    //this.header.setPage( MainPageState.Settings,        SubPageState.Setting_Generals );
  }
  clickProfile(){
    //this.header.setPage( MainPageState.Profile,         SubPageState.None );
  }
  clickNotifications(){
    //this.header.setPage( MainPageState.Notifications,   SubPageState.None );
  }
  logout(){
    this.header.setPage( MainPageState.None,            SubPageState.None );    
    this.authService.logout();
  }
}
