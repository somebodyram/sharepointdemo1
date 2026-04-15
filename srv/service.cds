using { exceldata as my } from '../db/schema.cds';

@path : '/service/empservice'
service empservice {

  @cds.redirection.target
  @odata.draft.enabled
  entity empdata as
    projection on my.empdata;

}

annotate empservice with @requires : [
  'authenticated-user'
];