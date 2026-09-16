using { managed } from '@sap/cds/common';

namespace bookshop;

entity Authors {
  key ID : Integer;
  name : String(120) not null;
}

entity Genres {
  key ID : Integer;
  name : String(80) not null;
}

entity Currencies {
  key code : String(3);
  name : String(80) not null;
}

entity Books : managed {
  key ID : Integer;
  title : String(200) not null;
  descr : LargeString;
  stock : Integer not null;
  price : Decimal(9,2);
  author : Association to one Authors;
  genre : Association to one Genres;
  currency : Association to one Currencies;
}


