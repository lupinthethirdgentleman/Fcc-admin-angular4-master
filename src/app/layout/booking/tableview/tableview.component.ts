import { Component, OnInit, OnDestroy,AfterViewInit,ViewChild,ViewEncapsulation } from '@angular/core';
import { ActionsService, BookingAction } from 'app/layout/actions.service';
import { DataSource } from '@angular/cdk/collections';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { Subject } from 'rxjs/Subject';

import { BookingService } from 'app/layout/booking/booking.service';
import { Moment } from 'moment';
import { MatPaginator } from '@angular/material';

var moment = require('moment');

@Component({
  selector: 'app-tableview',
  templateUrl: './tableview.component.html',
  styleUrls: ['./tableview.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TableviewComponent implements OnInit,OnDestroy, AfterViewInit {

  isShow:boolean = false;
  loading = false;
  private componetDestroyed = new Subject();

  bookings:Array<any>;
  private date : string;
  private shiftId:number;

  displayedColumns;
  dataSource;
  //@ViewChild(MatPaginator) paginator: MatPaginator;


  pageSize = 10;
  pageNumber = 0;
  offSet = 0;
  totalElements = 0;
  columns = [
    {
      name: 'Number',
      prop: 'booking_number',
      flexGrow: 1
    },

    {
      prop: 'date',
      flexGrow: 2
    },

    {
      prop: 'time',
      flexGrow: 1
    },

    {
      prop: 'hours',
      flexGrow: 1
    },

    {
      name: "Number<br>of People",
      prop: 'number_of_people',
      flexGrow: 2
    },

    {
      prop: 'status',
      flexGrow: 2
    },

    {
      prop: 'name',
      name: "Guest Name",
      flexGrow: 2
    },

    {
      prop: 'phone',
      name: 'Phone Number',
      flexGrow: 3
    },

    {
      prop: 'email',
      flexGrow: 3
    },

    {
      prop: 'details',
      flexGrow: 2
    }
  ];
  constructor(
    private actions         : ActionsService,
    private bookingService  : BookingService) {


    this.actions.getBookingAction().takeUntil(this.componetDestroyed).subscribe(
      action => {
        switch ( action.action ){
          case BookingAction.Search:
            if(action.param2) break;
            this.initialize( action.param1 );
          case BookingAction.ReSet:
            this.search();
            break;
        }
      });

  }

  ngOnInit() {
    //this.setPage({ offset: 0 });
    this.displayedColumns = [ 'booking_number', 'date', 'time','hours','number_of_people', 'status', 'name','phone','email', 'link'];
  }

  ngOnDestroy(){
    this.componetDestroyed.next();
    this.componetDestroyed.unsubscribe();
  }
  ngAfterViewInit() {
  }

  getToalNumberAndBookings( date:string, shift_id:number ){
    this.startLoading();
    this.bookingService.getToalNumberBookings(date, shift_id, '').subscribe(
      res => {
        this.totalElements = parseInt( res.data );
        console.log( res.data );
        this.getBookings( date, shift_id, this.offSet, this.pageSize );
        this.endLoading();
      },
      err => {
        this.bookings = [];      
        this.endLoading();
      });
  }
  getBookings(date:string, shift_id:number, offsetNumber:number, pageSize:number ){
    this.startLoading();
    this.bookingService.getBookings(date, shift_id, '', offsetNumber, pageSize).subscribe(
      res => {
        const data = res.data.map(v => {
          return {
            ...v,
            time: moment(v.time, 'hh:mm:ss').format('hh:mm A')
          };
        });
        this.bookings = res.data;
        console.log( res.data );
        console.log( offsetNumber );
        console.log( pageSize );
        this.dataSource = new BookingDataSource(data);
        this.actions.toggleBookingAction( BookingAction.Searched, this.bookings);
        this.endLoading();
      },
      err => {
        this.bookings = [];   
        this.endLoading();
      });
  }
  initialize( info ){
    this.date = info.date;
    this.shiftId = info.shift.id;
  }
  search(){
    this.getToalNumberAndBookings( this.date, this.shiftId );
  }
    /**
   * Populate the table with new data based on the page number
   * @param page The page to select
   */
  setPage(pageInfo){
    this.pageNumber = pageInfo.offset;
    let offSetNumber = this.pageNumber * this.pageSize;
    console.log( offSetNumber );
    this.getBookings( this.date, this.shiftId, offSetNumber, this.pageSize );

  }
   //------- Spinner start -----------------
   private startLoading() {
    this.loading = true;
  }

  private endLoading() {
    this.loading = false;
  }
  //------- Spinner start -----------------
}
export interface Booking {
  id:number,
  booking_number: number,
  date: string;
  time: string;
  hours: number;
  number_of_people: number;
  status: string;
  name: string;
  phone: string;
  email: string;
  link: string;
}

export class BookingDataSource extends DataSource<any> {
  data: Booking[];
  constructor(data: Booking[]) {
    super();
    this.data = data;
  }
  /** Connect function called by the table to retrieve one stream containing the data to render. */
  connect(): Observable<Booking[]> {
    return of(this.data);
  }

  disconnect() { }
}
