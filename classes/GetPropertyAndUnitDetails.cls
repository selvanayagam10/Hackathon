public class GetPropertyAndUnitDetails {
    @InvocableMethod
    public static List<String> generatePromptTemplateResponse(List<String> propertyAndUnitDetails) {
        PropertyAndUnitRequestWrapper convertedPropertyAndUnitDetails;
          List<String> jsonResponse=new List<String>();
         system.debug(propertyAndUnitDetails);
        //call the prompt template using connect API
        ConnectApi.WrappedValue inputValue = new ConnectApi.WrappedValue();
        inputValue.value = propertyAndUnitDetails[0];
        Map<String, ConnectApi.WrappedValue> inputParams = new Map<String, ConnectApi.WrappedValue>();
        inputParams.put('Input:Property_and_unit_details', inputValue);
        ConnectApi.EinsteinPromptTemplateGenerationsInput executeTemplateInput = new ConnectApi.EinsteinPromptTemplateGenerationsInput();
        executeTemplateInput.additionalConfig = new ConnectApi.EinsteinLlmAdditionalConfigInput();
        executeTemplateInput.additionalConfig.applicationName = 'PromptBuilderPreview';
        executeTemplateInput.isPreview = false;
        executeTemplateInput.inputParams = inputParams;
        
        try {
            // Call the service
            ConnectApi.EinsteinPromptTemplateGenerationsRepresentation generationsOutput = ConnectApi.EinsteinLLM.generateMessagesForPromptTemplate(
                'Get_Property_and_unit_details',
                executeTemplateInput
            );
            if (!generationsOutput.generations.isEmpty()) {
                String jsonValue;
                ConnectApi.EinsteinLLMGenerationItemOutput response = generationsOutput.generations[0];
                System.debug('Response : ' + response.text);
                jsonValue=response.text.substringAfter('{');
                jsonValue='{'+jsonValue;
                system.debug(jsonValue);
                convertedPropertyAndUnitDetails=(PropertyAndUnitRequestWrapper)JSON.deserialize(jsonValue, PropertyAndUnitRequestWrapper.class);
                System.debug('propertyAndUnitDetailsJSON : ' + convertedPropertyAndUnitDetails);
                //Query the matching property and unit
                List<PropertyAndUnitResponseWrapper> getResponse=getPropertyAndUnitDetails(convertedPropertyAndUnitDetails);
				jsonResponse.add(JSON.serialize(getResponse));
            } 
        } catch (Exception e) {
            System.debug(e.getMessage());
            throw e;
        }
        return jsonResponse;
    }
    //Get the matching property and unit and add it in the response wrapper
   /* public static   List<PropertyAndUnitResponseWrapper> getPropertyAndUnitDetails(PropertyAndUnitRequestWrapper getDetails){
        List<Id> propertyIdList=new List<Id>();
        List<PropertyAndUnitResponseWrapper> propertyAndUnitResponseWrapperList=new  List<PropertyAndUnitResponseWrapper>();
        //Declare property record type
        Id residentialRecordTypeId = Schema.SObjectType.Property__c.getRecordTypeInfosByName().get('Residential').getRecordTypeId();
        Id retailRecordTypeId = Schema.SObjectType.Property__c.getRecordTypeInfosByName().get('Retail').getRecordTypeId();
        Id commercialRecordTypeId = Schema.SObjectType.Property__c.getRecordTypeInfosByName().get('Commercial').getRecordTypeId();
         Id mixedUseRecordTypeId = Schema.SObjectType.Property__c.getRecordTypeInfosByName().get('Mixed Use').getRecordTypeId();
        List<Property__c> propertyList=[SELECT Id FROM Property__c WHERE Status__c=:getDetails.propertyStatus];
        for(Property__c propertyRecords:propertyList){
            propertyIdList.add(propertyRecords.Id);
        }
        List<Unit__c> unitList=[SELECT Id,Amenities__c,Property__c,Property__r.name,Area__c,Asset_Class__c,Balcony_Count__c,Bathrooms__c,Bedrooms__c,Carpet_Area__c,Floor_Number__c,Furnishings__c,Handover__c,Name FROM Unit__c WHERE Furnishings__c=:getDetails.furnishing AND Property__c IN:propertyIdList ];
        for(Unit__c unitRecords:unitList){
            PropertyAndUnitResponseWrapper propertyAndUnitData=new PropertyAndUnitResponseWrapper();
            propertyAndUnitData.unitName=unitRecords.Name;
            propertyAndUnitResponseWrapperList.add(propertyAndUnitData);
        }
        return propertyAndUnitResponseWrapperList;
    }*/
   
 public static   List<PropertyAndUnitResponseWrapper> getPropertyAndUnitDetails(PropertyAndUnitRequestWrapper getDetails){
        List<Id> propertyIdList=new List<Id>();
        List<PropertyAndUnitResponseWrapper> propertyAndUnitResponseWrapperList=new  List<PropertyAndUnitResponseWrapper>();
        //Declare property record type
        Id residentialRecordTypeId = Schema.SObjectType.Property__c.getRecordTypeInfosByName().get('Residential').getRecordTypeId();
        Id retailRecordTypeId = Schema.SObjectType.Property__c.getRecordTypeInfosByName().get('Retail').getRecordTypeId();
        Id commercialRecordTypeId = Schema.SObjectType.Property__c.getRecordTypeInfosByName().get('Commercial').getRecordTypeId();
         Id mixedUseRecordTypeId = Schema.SObjectType.Property__c.getRecordTypeInfosByName().get('Mixed Use').getRecordTypeId();
     if(getDetails.assetType=='Residential'){
         propertyAndUnitResponseWrapperList=GetResidentialPropertyDetails.residentialPropertyDetails(getDetails,residentialRecordTypeId,mixedUseRecordTypeId);
     }
     if(getDetails.assetType=='Retail'){
         propertyAndUnitResponseWrapperList=GetRetailPropertyDetails.retailPropertyDetails(getDetails,retailRecordTypeId,mixedUseRecordTypeId);
     }
       if(getDetails.assetType=='commercial'){
         propertyAndUnitResponseWrapperList=GetCommercialPropertyDetails.commercialPropertyDetails(getDetails,commercialRecordTypeId,mixedUseRecordTypeId);
     }
        return propertyAndUnitResponseWrapperList;
    }
}