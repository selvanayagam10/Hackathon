public class NextActionSteps {
 @InvocableMethod(label='getUnitDetails' description='Get unit map and tour link')
    public static   List<String> getUnitDetails(List<String> promptResponse) {
         ParsedInfo result = new ParsedInfo();
        result.nextActions = new List<String>();
        result.unitNames = new List<String>();
        List<responseWrapper> responseWrapperList=new List<responseWrapper>();
        List<String> jsonResponse=new  List<String>();
        // Split the string by the keywords
        String[] splitByAction = promptResponse[0].split('Next Action:');
        if (splitByAction.size() > 1) {
            String[] splitByUnits = splitByAction[1].split('Unit Names:');

            if (splitByUnits.size() > 1) {
                // Split and clean next actions
                String actionsRaw = splitByUnits[0].trim();
                result.nextActions = actionsRaw.split(',');

                // Split and clean unit names
                String unitsRaw = splitByUnits[1].trim();
                result.unitNames = unitsRaw.split(',');
                for (Integer i = 0; i < result.nextActions.size(); i++) {
                    result.nextActions[i] = result.nextActions[i].trim();
                }
                for (Integer i = 0; i < result.unitNames.size(); i++) {
                    result.unitNames[i] = result.unitNames[i].trim();
                }
            }
        }
        system.debug('Next action'+result.nextActions);
        List<Unit__c> unitList=[SELECT Full_Unit_Label__c,Virtual_Tour_Link__c,Map_URL__c FROM Unit__c WHERE Full_Unit_Label__c IN:result.unitNames];
        for(Unit__c unitRecords:unitList){
             responseWrapper responseWrapperRecords=new responseWrapper();
            responseWrapperRecords.unitName=unitRecords.Full_Unit_Label__c;
            if(result.nextActions.contains('View on Map')){
               responseWrapperRecords.mapLink=unitRecords.Map_URL__c;
            }
             if(result.nextActions.contains('Virtual Tour')){
               responseWrapperRecords.virtualTourLink=unitRecords.Virtual_Tour_Link__c;
            }
            responseWrapperList.add(responseWrapperRecords);
        }
       jsonResponse.add(JSON.serialize(responseWrapperList));
       return jsonResponse;
    }
     public class ParsedInfo {
        public List<String> nextActions { get; set; }
        public List<String> unitNames { get; set; }
    }
    public class responseWrapper {
        Public string unitName;
        public string virtualTourLink;
         public string mapLink;
    }
}