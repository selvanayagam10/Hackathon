public class GetResidentialPropertyDetails {
     public static List<PropertyAndUnitResponseWrapper> residentialPropertyDetails(PropertyAndUnitRequestWrapper getDetails,Id residentialRecordTypeId, Id mixedUseRecordTypeId){
        String propertyQuery;
        String unitQuery;
        List<Id> propertyIdList=new List<Id>();
        propertyQuery='SELECT Id FROM Property__c WHERE (RecordTypeId=:residentialRecordTypeId OR RecordTypeId=:mixedUseRecordTypeId)';
         /*if(!String.isBlank(getDetails.propertyType)){
             propertyQuery+='AND Property_Type__c=:getDetails.propertyType';
         }*/
         if(!String.isBlank(getDetails.propertyStatus)){
             propertyQuery+='AND Status__c=\''+getDetails.propertyStatus+ '\'';
         }
         List<Property__c> propertyList=Database.Query(propertyQuery);
         for(Property__c propertyRecords:propertyList){
            propertyIdList.add(propertyRecords.Id);
        }
        unitQuery='SELECT Id,Amenities__c,Property__c,Property__r.name,Property__r.Property_Address__c,Square_Footage__c,Asset_Class__c,Balcony_Count__c,Bathrooms__c,Bedrooms__c,Carpet_Area__c,Floor_Number__c,Furnishings__c,Handover__c,Name,Full_Unit_Label__c,Available_Booked_Sold_Rented__c,Rental_Amount__c,Total_Selling_Amount__c,Unit_Type__c,No_of_Parking_Area__c,Display_Preference__c FROM Unit__c WHERE Property__c IN:propertyIdList AND Available_Booked_Sold_Rented__c=\'Available\'';
          if(!String.isBlank(getDetails.unitType)){
         unitQuery+=' AND Unit_Type__c=\''+getDetails.unitType+'\'';
        }
         if(!String.isBlank(getDetails.furnishing)){
         unitQuery+=' AND Furnishings__c=\''+getDetails.furnishing+'\'';
        }
       if(getDetails.numberofBedrooms !=null && getDetails.numberofBedrooms !=0){
         unitQuery+=' AND Bedrooms__c='+getDetails.numberofBedrooms;
        }
       if(getDetails.numberofBathrooms !=null && getDetails.numberofBathrooms !=0){
         unitQuery+=' AND Bathrooms__c='+getDetails.numberofBathrooms;
        }
           if(getDetails.numberofParkingArea !=null || getDetails.numberofParkingArea !=0){
         unitQuery+=' AND No_of_Parking_Area__c='+getDetails.numberofParkingArea;
        }
          
       if(!String.isBlank(getDetails.rentOrBuy)){
           if(getDetails.rentOrBuy=='rent' && getDetails.budget!=null && getDetails.budget!=0){
                 unitQuery+=' AND Rental_Amount__c>='+getDetails.budget;
           }
           if(getDetails.rentOrBuy=='buy' && getDetails.budget!=null && getDetails.budget!=0){
              unitQuery+=' AND Total_Selling_Amount__c>='+getDetails.budget;
           }
        }
         
          List<Unit__c> unitList=Database.Query(unitQuery);
         List<PropertyAndUnitResponseWrapper> residentialResponse=constructResidentialResponse(unitList,getDetails.rentOrBuy);
         return residentialResponse;
    }
    public static  List<PropertyAndUnitResponseWrapper> constructResidentialResponse(List<Unit__c> unitList,String rentOrBuy){
          List<PropertyAndUnitResponseWrapper> propertyAndUnitResponseWrapperList=new  List<PropertyAndUnitResponseWrapper>();
		 for(Unit__c unitRecords:unitList){
            PropertyAndUnitResponseWrapper propertyAndUnitData=new PropertyAndUnitResponseWrapper();
            propertyAndUnitData.UnitName=unitRecords.Full_Unit_Label__c;
            propertyAndUnitData.area=String.valueOf(unitRecords.Square_Footage__c);
            propertyAndUnitData.address=String.valueOf(unitRecords.Property__r.Property_Address__c);
             propertyAndUnitData.unitHighlights=unitRecords.Amenities__c+' '+unitRecords.No_of_Parking_Area__c+' '+unitRecords.Handover__c;
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