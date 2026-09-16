using { bookshop as domain } from '../db/schema';

@path: '/admin'
service AdminService {
  @readonly
  @Capabilities.InsertRestrictions.Insertable: false
  @Capabilities.UpdateRestrictions.Updatable: false
  @Capabilities.DeleteRestrictions.Deletable: false
  entity Books as projection on domain.Books { createdAt, createdBy, modifiedAt, modifiedBy, ID, title, descr, stock, price, author, genre, currency };
  @readonly
  @Capabilities.InsertRestrictions.Insertable: false
  @Capabilities.UpdateRestrictions.Updatable: false
  @Capabilities.DeleteRestrictions.Deletable: false
  entity Authors as projection on domain.Authors { ID, name };
  @readonly
  @Capabilities.InsertRestrictions.Insertable: false
  @Capabilities.UpdateRestrictions.Updatable: false
  @Capabilities.DeleteRestrictions.Deletable: false
  entity Genres as projection on domain.Genres { ID, name };
  @readonly
  @Capabilities.InsertRestrictions.Insertable: false
  @Capabilities.UpdateRestrictions.Updatable: false
  @Capabilities.DeleteRestrictions.Deletable: false
  entity Currencies as projection on domain.Currencies { code, name };
}


