public class GetRetailPropertyDetails {
     public static List<PropertyAndUnitResponseWrapper> retailPropertyDetails(PropertyAndUnitRequestWrapper getDetails,Id retailRecordTypeId, Id mixedUseRecordTypeId){
        String propertyQuery;
        String unitQuery;
        List<Id> propertyIdList=new List<Id>();
        propertyQuery='SELECT Id FROM Property__c WHERE (RecordTypeId=:retailRecordTypeId OR RecordTypeId=:mixedUseRecordTypeId)';
  		 List<Property__c> propertyList=Database.Query(propertyQuery);
         for(Property__c propertyRecords:propertyList){
            propertyIdList.add(propertyRecords.Id);
            
        }
          system.debug(propertyIdList);
       unitQuery='SELECT Id,Amenities__c,Property__c,Property__r.name,Property__r.Property_Address__c,Square_Footage__c,Asset_Class__c,Balcony_Count__c,Bathrooms__c,Bedrooms__c,Carpet_Area__c,Floor_Number__c,Furnishings__c,Handover__c,Name,Full_Unit_Label__c,Available_Booked_Sold_Rented__c,Rental_Amount__c,Total_Selling_Amount__c,Display_Preference__c FROM Unit__c WHERE Property__c IN:propertyIdList AND Available_Booked_Sold_Rented__c=\'Available\'';
         if(!String.isBlank(getDetails.unitType)){
         unitQuery+=' AND Unit_Type__c=\''+getDetails.unitType+'\'';
        }
         if(!String.isBlank(getDetails.furnishing)){
         unitQuery+=' AND Furnishings__c=\''+getDetails.furnishing+'\'';
        }
        if( getDetails.budget!=null && getDetails.budget!=0){
                 unitQuery+=' AND Rental_Amount__c>='+getDetails.budget;
           }
          if(getDetails.numberofParkingArea !=null && getDetails.numberofParkingArea !=0){
           unitQuery+=' AND No_of_Parking_Area__c >='+String.valueOf(getDetails.numberofParkingArea);
        }
          if(!String.isBlank(getDetails.displayfeatures)){
         unitQuery+=' AND Display_Preference__c=\''+getDetails.displayfeatures+'\'';
        }
        if(getDetails.squareFootage !=null && getDetails.squareFootage !=0){
           unitQuery+=' AND Square_Footage__c >='+String.valueOf(getDetails.squareFootage);
        }
         if(!String.isBlank(getDetails.additionalStorageSpace)){
           unitQuery+=' AND Additional_Storage_Space__c='+getDetails.additionalStorageSpace;
        }
          List<Unit__c> unitList=Database.Query(unitQuery);
         List<PropertyAndUnitResponseWrapper> retailResponse=constructRetailResponse(unitList);
         return retailResponse;
    }
    public static  List<PropertyAndUnitResponseWrapper> constructRetailResponse(List<Unit__c> unitList){
          List<PropertyAndUnitResponseWrapper> propertyAndUnitResponseWrapperList=new  List<PropertyAndUnitResponseWrapper>();
		 for(Unit__c unitRecords:unitList){
            PropertyAndUnitResponseWrapper propertyAndUnitData=new PropertyAndUnitResponseWrapper();
            propertyAndUnitData.UnitName=unitRecords.Full_Unit_Label__c;
            propertyAndUnitData.area=String.valueOf(unitRecords.Square_Footage__c);
            propertyAndUnitData.address=String.valueOf(unitRecords.Property__r.Property_Address__c);
            propertyAndUnitData.pricing=String.valueOf(unitRecords.Rental_Amount__c);
             propertyAndUnitResponseWrapperList.add(propertyAndUnitData);
        }
        return propertyAndUnitResponseWrapperList;
    }  
}