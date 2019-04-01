import { Component, OnInit, OnDestroy, ViewEncapsulation, ViewChildren, QueryList } from '@angular/core';
import { IDatePickerConfig, DatePickerComponent } from 'ng2-date-picker';
import { NgSelectComponent } from '@ng-select/ng-select';
import { Subscription } from 'rxjs/Subscription';
import { Subject } from 'rxjs/Subject';
import { take } from 'rxjs/operator/take';
import { Moment } from 'moment';

import { PageState, HeaderService, SubPageState, MainPageState } from 'app/layout/header.service';
import { ApiService } from 'app/api.service';
import { Lang } from 'app/shared/services';
import { ActionsService, ActionState, BookingAction } from 'app/layout/actions.service';
import { Angular2Csv } from 'angular2-csv/Angular2-csv';
import { forEach } from '@angular/router/src/utils/collection';

var moment = require('moment');

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  encapsulation: ViewEncapsulation.None  
})

export class HeaderComponent implements OnInit, OnDestroy {

  datePickerConfig: IDatePickerConfig = {
    firstDayOfWeek: 'su',
    monthFormat: 'MMMM YYYY',
    closeOnSelect: true,
    disableKeypress: true,
    allowMultiSelect: false,
    onOpenDelay: 0,
    weekDayFormat: 'dd',
    showNearMonthDays: false,
    showWeekNumbers: false,
    enableMonthSelector: false,
    yearFormat: 'YYYY',
    format: "D MMM YYYY",
    showGoToCurrent: false,
    dayBtnFormat: 'D',
    timeSeparator: ':',
    multipleYearsNavigateBy: 10
  };

  loading:boolean = false;

  title: any;
  public page: PageState = { main: MainPageState.None, sub:SubPageState.None };

  mobileMenuState: boolean = false;
  mobileSortingState: boolean = true;

  private componetDestroyed = new Subject();

  shiftPackages:Array<any>=[];
  floorPackages:Array<any>=[];
  floors:Array<any>=[];
  shifts:Array<any>=[];

  selectSpId:number = -1;
  selectFpId:number = -1;
  selectFId :number = null;
  selectSId :number = null;
  defaultSpId:number = -1;
  defaultFpId:number = -1;
  selectDate = moment( new Date() );
  isHoliday = false;
  currentSpId:number = -1;
  currentFpId:number = -1;
  constructor(
    private apiService: ApiService, 
    private lang      : Lang,
    public header    : HeaderService, 
    private actions   : ActionsService) {

  }
  ngOnInit(){
    this.header.getPage().takeUntil(this.componetDestroyed).subscribe( 
      page => { 
        this.page = page as PageState;
        this.title = this.header.getHeaderTitle( this.page.main, this.page.sub );

        if ( this.header.isSettings( this.page ) ){
          switch (this.page.sub ){
            case SubPageState.Setting_Generals:
              break;
            case SubPageState.Setting_FloorPackages:
              this.initializeFP();
              break;
            case SubPageState.Setting_ShiftPackages:
              this.initializeSP();
              break;
            case SubPageState.Setting_Rules:
              break;
          }
        }else if ( this.header.isBooking( this.page )){
          //this.selectDate = moment( new Date() );
          this.getShifts( this.selectDate );
        }

      });
      this.actions.getBookingAction().takeUntil(this.componetDestroyed).subscribe( 
        action => {
          switch ( action.action ){
            case BookingAction.SelectTable:

              break;
          }
        });

    this.actions.getMobileMenuState().takeUntil(this.componetDestroyed).subscribe(obj => { this.mobileMenuState = obj.state });
    this.actions.getMobileSortingState().takeUntil(this.componetDestroyed).subscribe(obj => { this.mobileSortingState = obj.state });    


    this.actions.getFloorPackageAction().takeUntil(this.componetDestroyed).subscribe(
      action => {
        switch ( action.action ){
          case ActionState.Deleted:
            this.initializeFP();
            break;
          case ActionState.Created:
            this.selectFpId = action.param1;
            this.getFloorPackages();
            break;
          case ActionState.Updated:         
            this.getFloorPackages();
            break;
          case ActionState.SetDefault:
            this.setDefaultFloorPackage( action.param1 );
            break;
        }
      }
    );
    this.actions.getShiftPackageAction().takeUntil(this.componetDestroyed).subscribe(
      action => {
        switch ( action.action ){
          case ActionState.Deleted:
            this.initializeSP();
            break;
          case ActionState.Created:
            this.selectSpId = action.param1;
            this.getShiftPackages();
            break;
          case ActionState.Updated:
            this.getShiftPackages();
            break;
          case ActionState.SetDefault:
            this.setDefaultShiftPackage( action.param1 );
            break;
        }
      }
    );


    //this.selectedLang = this.lang.getLang() === LANG_CN_NAME ? 0 : 1;

    
  }
  ngOnDestroy(){
    this.componetDestroyed.next();
    this.componetDestroyed.unsubscribe();
  }

  //---- Get data from API Start----------
  public getShiftPackages(){
    this.startLoading();
    this.apiService.getShiftPackages().subscribe( 
      res => { 
        this.shiftPackages = res.data;
        this.apiService.getSettingsGeneral().subscribe(
          res => { 
            this.setDefaultShiftPackage( parseInt( res.data.DefaultShiftPackage ) );
            if ( this.selectSpId == -1 ){
              this.setSelectShiftPackage( this.defaultSpId );             
            }
            this.endLoading();
          },
          err => {
            this.endLoading();
          });       
      },
      err =>{
        this.endLoading();
      }
    );
  }
  public getFloorPackages(){
    this.startLoading();
    this.apiService.getFloorPackages().subscribe( 
      res => { 
        this.floorPackages = res.data;     
        this.apiService.getSettingsGeneral().subscribe(
          res => { 
            this.setDefaultFloorPackage( parseInt( res.data.DefaultFloorPackage ) );
            if ( this.selectFpId == -1 ){
              this.setSelectFloorPackage( this.defaultFpId );
            }
            this.endLoading();
          },
          err => {
            this.endLoading();
          });        
      },
      err =>{
        this.endLoading();
      }
    );    
  }
  public getFloors(){
    this.startLoading();
    this.apiService.getFloors().subscribe( 
      res => { 
        this.floors = res.data;
        if ( this.isBookingTimeLine() ){
          this.selectFId = null;
        }else{
          this.selectFId = this.floors[0].id;
        }
        this.changeFloor();
        this.endLoading();  
      },
      err =>{
        this.endLoading();
      }
    );    
  }
  public getShifts( date ){
    //this.startLoading();
    console.log(date.format('YYYY-MM-DD'));
    this.apiService.getShiftsFromDate( date.format('YYYY-MM-DD') ).subscribe( 
      res => { 
        console.log(res.data);
        if (res.data.length) {
            this.shifts = res.data;    
            // if ( this.isBookingTimeLine() ){
            //     this.selectSId = null;
            //   } else 
              {
                this.selectSId = this.shifts[0].id;
              }
            // this.selectSId = this.shifts[0].id;
            this.getFloors();
        } else {
            // holiday
            console.log('holiday');
            this.isHoliday = true;
            this.actions.showNotification(date.format('YYYY-MM-DD') + ' is holiday');
            this.actions.toggleBookingAction( BookingAction.Search, { date    : this.selectDate.format('YYYY-MM-DD') }, true);
        }

        //this.endLoading();  
      },
      err =>{
        this.shifts =[];
        this.selectSId = null;
        //this.endLoading();
      }
    );      
  }
  
  //---- Get data from API End------------
  initializeSP(){
    this.selectSpId = -1;
    this.getShiftPackages();      
  }
  initializeFP(){
    this.selectFpId = -1;
    this.getFloorPackages();     
  }
  initializeFloor(){
    this.selectFId = null;
    this.getFloors();
  }

  public setDefaultShiftPackage( id:number ){
    if ( this.defaultSpId == -1 || this.defaultSpId != id ) this.defaultSpId = id;   
  }

  public setSelectShiftPackage( id:number ){
    if ( this.selectSpId != -1 && this.selectSpId == id ) return;
    this.selectSpId = id;   
    let s_item = this.shiftPackages.find( item => item.id === id );
    let d_item = this.shiftPackages.find( item => item.id === this.defaultSpId );
    this.actions.toggleShiftPackageAction( ActionState.Select, s_item, d_item ); 

  }

  setDefaultFloorPackage( id:number ){
    if ( this.defaultFpId == -1 || this.defaultFpId != id ) this.defaultFpId = id;
  }
  setSelectFloorPackage( id:number ){
    if ( this.selectFpId != -1 && this.selectFpId == id ) return;
    this.selectFpId = id;   
    let s_item = this.floorPackages.find( item => item.id === id );
    let d_item = this.floorPackages.find( item => item.id === this.defaultFpId );
    this.actions.toggleFloorPackageAction( ActionState.Select, s_item, d_item );   
  }
  selectFloor( id:number ){

  }

  changeToBookingTimeline() {
    this.selectFId = null;
    this.header.setPage( MainPageState.Booking, SubPageState.Booking_TimeLine );
  }
  changeToBookingFloorView() {
    if (!this.isHoliday) {
        this.selectFId = this.floors[0].id;
    }
    this.header.setPage( MainPageState.Booking, SubPageState.Booking_FloorView );    
  }
  changeToBookingList() {
    if (!this.isHoliday) {
        this.selectFId = this.floors[0].id;    
    }
    this.header.setPage( MainPageState.Booking, SubPageState.Booking_List );    
  }

  toggleMobileMenu() {
    if (this.mobileMenuState)
      this.actions.toggleMobileMenuState(false);
    else
      this.actions.toggleMobileMenuState(true);
  }
  toggleSorting() {
    if (this.mobileSortingState)
      this.actions.toggleMobileSortingState(false);
    else
      this.actions.toggleMobileSortingState(true);
  }

  changeShiftPackage(value:any){
    this.setSelectShiftPackage( value.value );
  }
  changeFloorPackage(value:any){
    this.setSelectFloorPackage ( value.value );
  }
  changeShift(){
    this.changeFloor();
  }
  changeFloor(){

    let shift = this.shifts.find( item => item.id === this.selectSId );

    if (this.selectSId == null) {
        shift = this.shifts[0];
    }

    this.actions.toggleBookingAction( BookingAction.Search, { date    : this.selectDate.format('YYYY-MM-DD'), 
    shift   : shift,
    floorId : this.selectFId, 
    isAllShift : this.selectSId ? false : true} );

  }
  changeDate(){
    if ( !this.selectDate ) this.selectDate = moment( new Date() );
    this.getShifts( this.selectDate );
  }
  addShiftPackage(){
    this.actions.toggleShiftPackageAction( ActionState.Create );
  }
  addFloorPackage(){
    this.actions.toggleFloorPackageAction( ActionState.Create );
  }
  addRule(){
    this.actions.toggleRulesAction( ActionState.Create );
  } 
  addBooking(){
    this.actions.toggleBookingAction( BookingAction.Create );
  }
  createGuest() {
    this.actions.toggleGuestAction( ActionState.Create );
  }
  exportGuest(){
    this.export();
  }
  createStaff() {
    this.actions.toggleStaffAction( ActionState.Create );
  }
  exportTables(){
    this.actions.toggleBookingAction( BookingAction.Export );
  }
  isSettings(){
    return this.header.isSettings( this.page );
  }
  isBooking(){
    return this.header.isBooking( this.page );
  }
  isBookingTimeLine(){
    return this.header.isBookingTimeLine( this.page );
  }
  isBookingFloorView(){
    return this.header.isBookingFloorView( this.page );
  }
  isBookingList(){
    return this.header.isBookingList( this.page );
  }
  //------- Spinner start -----------------
  private startLoading() {
    this.loading = true;
  }

  private endLoading() {
    this.loading = false;
  }
  //------- Spinner start -----------------  

  private export(){
    var options = { 
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalseparator: '.',
      showLabels: true, 
      showTitle: true,
      useBom: true,
      headers: ['ID', 'Name', 'Email', 'Phone', 'Company', 'WeChatAccount', 'Blocked', 'VIP', 'Tags']
    };
    const filename = "guest";
    this.startLoading();
    this.apiService.getGuests().takeUntil(this.componetDestroyed).subscribe(

        res => {
          this.endLoading();        
          let guests = res.data.data;
          let data =[];
          guests.forEach( guest =>{
            let strTag =  guest.tags.map( tag => {return tag.name }).join();  
            data.push({
              Id            : guest.id,
              Name          : guest.name,
              Email         : guest.email,
              Phone         : guest.phone,
              Company       : guest.company_name ? guest.company_name : "",
              WeChatAccount : guest.wechat_account ? guest.wechat_account : "",
              Blocked       : guest.is_block ? 'Yes' : 'No',
              VIP           : guest.is_vip ? 'Yes' : 'No',
              Tags          : strTag
            });
          });
          let genCSV = new Angular2Csv(data, 'Guests', options );
        },
        err => {
          this.endLoading();
        }
      );

  }

}
