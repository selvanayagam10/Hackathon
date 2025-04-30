public class GetCommercialPropertyDetails {
    public static List<PropertyAndUnitResponseWrapper> commercialPropertyDetails(PropertyAndUnitRequestWrapper getDetails,Id commercialRecordTypeId,Id mixedUseRecordTypeId){
       String propertyQuery;
        String unitQuery;
        List<Id> propertyIdList=new List<Id>();
        propertyQuery='SELECT Id FROM Property__c WHERE (RecordTypeId=:commercialRecordTypeId OR RecordTypeId=:mixedUseRecordTypeId)';
  		 List<Property__c> propertyList=Database.Query(propertyQuery);
         for(Property__c propertyRecords:propertyList){
            propertyIdList.add(propertyRecords.Id);
            
        }
          system.debug(propertyIdList);
       unitQuery='SELECT Id,Amenities__c,Property__c,Property__r.name,Property__r.Property_Address__c,Square_Footage__c,Asset_Class__c,Balcony_Count__c,Bathrooms__c,Bedrooms__c,Carpet_Area__c,Floor_Number__c,Furnishings__c,Handover__c,Name,Full_Unit_Label__c,Available_Booked_Sold_Rented__c,Rental_Amount__c,Total_Selling_Amount__c,Display_Preference__c,Number_of_Seating_space__c,Additional_Storage_Space__c,No_of_Parking_Area__c FROM Unit__c WHERE Property__c IN:propertyIdList AND Available_Booked_Sold_Rented__c=\'Available\'';
         if(!String.isBlank(getDetails.unitType)){
         unitQuery+=' AND Unit_Type__c=\''+getDetails.unitType+'\'';
        }
         if(!String.isBlank(getDetails.furnishing)){
         unitQuery+=' AND Furnishings__c=\''+getDetails.furnishing+'\'';
        }
        if(!String.isBlank(getDetails.rentOrBuy)){
           if(getDetails.rentOrBuy=='rent' && getDetails.budget!=null && getDetails.budget!=0){
                 unitQuery+=' AND Rental_Amount__c>='+getDetails.budget;
           }
           if(getDetails.rentOrBuy=='buy' && getDetails.budget!=null && getDetails.budget!=0){
               unitQuery+=' AND Total_Selling_Amount__c>='+getDetails.budget;
           }
        }
         if( getDetails.noOfSeatingSpace!=null && getDetails.noOfSeatingSpace!=0){
                 unitQuery+=' AND Number_of_Seating_space__c>='+String.valueOf(getDetails.noOfSeatingSpace);
         }
          if(getDetails.squareFootage !=null && getDetails.squareFootage !=0){
           unitQuery+=' AND Square_Footage__c >='+String.valueOf(getDetails.squareFootage);
        }
          if(getDetails.numberofParkingArea !=null && getDetails.numberofParkingArea !=0){
           unitQuery+=' AND No_of_Parking_Area__c >='+String.valueOf(getDetails.numberofParkingArea);
        }
           if(!String.isBlank(getDetails.additionalStorageSpace)){
           unitQuery+=' AND Additional_Storage_Space__c='+getDetails.additionalStorageSpace;
        }
         
          List<Unit__c> unitList=Database.Query(unitQuery);
         List<PropertyAndUnitResponseWrapper> retailResponse=constructRetailResponse(unitList,getDetails.rentOrBuy);
         return retailResponse;
    }
    public static  List<PropertyAndUnitResponseWrapper> constructRetailResponse(List<Unit__c> unitList,String rentOrBuy){
          List<PropertyAndUnitResponseWrapper> propertyAndUnitResponseWrapperList=new  List<PropertyAndUnitResponseWrapper>();
		 for(Unit__c unitRecords:unitList){
            PropertyAndUnitResponseWrapper propertyAndUnitData=new PropertyAndUnitResponseWrapper();
            propertyAndUnitData.UnitName=unitRecords.Full_Unit_Label__c;
            propertyAndUnitData.area=String.valueOf(unitRecords.Square_Footage__c);
            propertyAndUnitData.address=String.valueOf(unitRecords.Property__r.Property_Address__c);
             if(rentOrBuy=='rent'){
            propertyAndUnitData.pricing=String.valueOf(unitRecords.Rental_Amount__c);
                }
            if(rentOrBuy=='buy'){
                propertyAndUnitData.pricing=String.valueOf(unitRecords.Total_Selling_Amount__c);
            }
             propertyAndUnitResponseWrapperList.add(propertyAndUnitData);
        }
        return propertyAndUnitResponseWrapperList;
    }  

}