
var docsController = View.createController("helpDeskDocsController",{
	
	mainTabs: null,
	locArray:[],
	activityLogId: "",
	
	afterInitialDataFetch: function() {
		this.inherit();
		this.requestPanel.actions.get('cancel').setTitle(getMessage('previous'));
		this.mainTabs = View.getOpenerView().panels.get("helpDeskRequestTabs");
	},
	
	requestPanel_afterRefresh: function(){
		var record = this.requestPanel.getRecord();
		this.problemPanel.clear();
		this.documentsPanel.clear();
		
		this.problemPanel.setRecord(record);
		this.documentsPanel.refresh(this.requestPanel.restriction,false);
		
		this.problemPanel.show(true);
		
		ABHDC_showPriorityLevel("activity_log","activity_log_id","priority",this.problemPanel,"activity_log.priority");
	},
	
	requestPanel_onCancel: function(){
		
		var activityLogId = this.requestPanel.getFieldValue("activity_log.activity_log_id");
		var parentCtrl = View.getOpenerView().controllers.get(0);
		//fix KB3031741 - add activity_log.activity_log_id to the basic tab restriction before go back to basic tab(Guo 2011/06/20)
		parentCtrl.basicRestriction["activity_log.activity_log_id"] = activityLogId;
		
		//add for support dynamic tabs in 20.1 and also keep compatible with other applications that not dynamic tabs like On Demand - Create Maintenance Service Request(Guo 2011/06/23)
		var dynamicAssemblyTabsController = View.getOpenerView().controllers.get('dynamicAssemblyTabsController');
		if(dynamicAssemblyTabsController){
			dynamicAssemblyTabsController.selectPreviousTab(parentCtrl.basicRestriction);
		}else{
			var questPanel = this.mainTabs.findTab("quest");
			if (valueExists(questPanel)) {
				if (questPanel.forcedHidden == false) {
					this.mainTabs.selectTab("quest", parentCtrl.basicRestriction, false, false, false);
				} else {
					this.mainTabs.selectTab("basic", parentCtrl.basicRestriction, false, false, false);
				}
			} else {
				this.mainTabs.selectTab("basic", parentCtrl.basicRestriction, false, false, false);
			}
		}
	},

	requestPanel_onSubmit: function(){

		 
		var record = ABHDC_getDataRecord2(this.requestPanel);
		
		var activityLogIdValue = this.requestPanel.getFieldValue("activity_log.activity_log_id");                    
		
		if(activityLogIdValue == ''){
			activityLogIdValue = 0;
		}
		
		try {
			var result = Workflow.callMethod('AbBldgOpsHelpDesk-RequestsService-submitRequest', activityLogIdValue,record);
		}catch(e){
			if (e.code == 'ruleFailed'){
				View.showMessage(e.message);
			}else{
				Workflow.handleError(e);
			}
			return;
		}

		if (result.code == 'executed'){
			var tabs = View.getOpenerView().panels.get('helpDeskRequestTabs');
			var rest = new Ab.view.Restriction();
			rest.addClause("activity_log.activity_log_id",activityLogIdValue,"=");
			
			//IFM Added
			var tds = View.dataSources.get("ifmDocWRDs");//ifmDocWRDs
			var ifmRestriction = new Ab.view.Restriction();
			ifmRestriction.addClause('wr.activity_log_id',record["activity_log.activity_log_id"]);
							
			var ifmRec = tds.getRecord(ifmRestriction);
			var ifmCCId = record["activity_log.cc_id"];
			ifmRec.setValue("wr.cc_id", ifmCCId);
			tds.saveRecord(ifmRec);

			
			//add for support dynamic tabs in 20.1 and also keep compatible with other applications that not dynamic tabs like On Demand - Create Maintenance Service Request(Guo 2011/06/23)
			var dynamicAssemblyTabsController = View.getOpenerView().controllers.get('dynamicAssemblyTabsController');
			if(dynamicAssemblyTabsController){
				dynamicAssemblyTabsController.selectNextTab(rest);
			}else{
				tabs.selectTab("result",rest,false,false,false);	
				//function(tabName, restriction, newRecord, clearRestriction, noRefresh)
			}
			
		}else{
			Workflow.handleError(result);            		 
		}
	},
	documentsPanel_onAddDrawing:function(){
		var requestId = this.requestPanel.getFieldValue("activity_log.activity_log_id");
		this.activityLogId = requestId;
			
		var c=View.controllers.items[0];
		var blId=this.requestPanel.getFieldValue('activity_log.bl_id');
		var flId=this.requestPanel.getFieldValue('activity_log.fl_id');
		var rmId=this.requestPanel.getFieldValue('activity_log.rm_id');
		if(valueExistsNotEmpty(blId) && valueExistsNotEmpty(flId)){
			c.locArray[0]=blId;
			c.locArray[1]=flId;
			c.locArray[2]=rmId;
			View.openDialog('ab-helpdesk-request-redlines-dialog.axvw');
		} else {
			alert(getMessage("noLocation"));
		}
	},
	refreshDocsPanel:function(){
		this.documentsPanel.refresh();
		View.closeDialog();
	 
	}
});