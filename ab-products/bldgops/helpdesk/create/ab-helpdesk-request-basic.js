
var activityTypeValue;
var activityLogId = 0; 

var helpDeskCreateBasicController = View.createController("helpDeskBasicController", {
	
	mainTabs: null,
	locArray:[],
	
	afterInitialDataFetch: function() {
		this.inherit();
 		
 		var tabs = View.getOpenerView().panels.get("helpDeskRequestTabs");
		var tabBasic = tabs.findTab("basic");
		var restriction = tabBasic.restriction;
		this.requestPanel.actions.get('cancel').setTitle(getMessage('previous'));
		if(restriction == null){
			//the case is called by the ab-ondemand-request-create.axvw.
			//in the ab-helpdesk-create.axvw, in acturally, the ab-helpdesk-request-catalog.axvw,
			//does apply a restriction on the file. but the **-ondemand_**.axvw does not.
			this.doPrepareWorks();
		}
		//hide incident_id field
		var passedRestriction = ABHDC_getTabsSharedParameters()["condAssessmentRestrication"];
		
		// condition assessment item restriction.
		if (valueExistsNotEmpty(passedRestriction)){
			clause = passedRestriction.findClause('activity_log.incident_id');
			if (clause == null && clause == undefined){
				this.descriptionPanel.showField('activity_log.incident_id', false);
			}
		}
		//IFM Added
		$("deptreq").checked=true;
		$("deptreq").required=true;
		//var ee=document.getElementById("equipmentPanel_head");
		//ee.style = "display:none";
		jQuery('#equipmentPanel_head').css("display","none");
		onChangeNotifyOHS();//set Notify OHS value 
		
		
	},
	
	locationPanel_onSetLocation:function(){
		View.openDialog('ab-helpdesk-request-dialog.axvw');
	},
	
	setLocationPram:function(){
		setLocationPram('locationPanel','descriptionPanel');
	},
	
	requestPanel_beforeRefresh: function(){
		 
		ABHDC_getTabsSharedParameters()["questionnaire"] = null; 
		ABHDC_getTabsSharedParameters()["documents"] = null;
		ABHDC_getTabsSharedParameters()["locatie"] = null;
		ABHDC_getTabsSharedParameters()["equipment"] = null;
		ABHDC_getTabsSharedParameters()["required"] = null;
		ABHDC_getTabsSharedParameters()["prob_type"] = null;
		
		this.locationPanel.show(false);
		this.equipmentPanel.show(false);
		this.descriptionPanel.show(false);
		this.datePanel.show(false);
		
		this.requestPanel.actions.get("next").enabled = true;
		this.requestPanel.actions.get("cancel").enabled = true;
		this.requestPanel.actions.get("confirm").enabled = true;
		
		this.requestPanel.actions.get("next").show(true);
		this.requestPanel.actions.get("cancel").show(true);
		this.requestPanel.actions.get("confirm").show(true);
		
		$("specificTime").parentNode.parentNode.style.display = '';
		this.datePanel.getFieldElement("activity_log.date_required").parentNode.parentNode.style.display = '';
		
		this.descriptionPanel.showField('activity_log.prob_type', true);	
		
		var field = $("activity_log.description");	
		if (field.parentNode.previousSibling != null){ 
			//Hide label td
			field.parentNode.previousSibling.style.display = ''; 
		}
		field.parentNode.style.display = '';
		
		$("same").checked = false;
	},
	
	requestPanel_afterRefresh: function(){
		activityLogId = 0;
		this.doPrepareWorks();
		
		clearInvalidHtmlField("activity_log.prob_type");
		clearInvalidHtmlField("priority");
		
		$("activity_log.prob_type").readOnly = true;
        this.descriptionPanel.fields.get("activity_log.prob_type").actions.get(0).command.commands[0].actionListener = afterSelectProblemType;
	},

	doPrepareWorks: function(){
		
		var tabs = View.getOpenerView().panels.get("helpDeskRequestTabs");
		
		
		var tabBasic = tabs.findTab("basic");
		var restriction = tabBasic.restriction;
		
		this.mainTabs = tabs;
	
	 	//var tabs = View.getOpenerView().panels.get("helpDeskRequestTabs");
		//if(tabs.findTab("basic").restrication == null){
		//	this.requestPanel.show(true);
		//}
		
		var record = this.requestPanel.getRecord();
		
		this.locationPanel.setRecord(record);
		this.equipmentPanel.setRecord(record);
		this.descriptionPanel.setRecord(record);
		this.datePanel.setRecord(record);
		
		
		this.locationPanel.show(true);
		this.equipmentPanel.show(true);
		onEqIdChange();
		this.descriptionPanel.show(true);
		this.datePanel.show(true);
		this.priorityPanel.show(true);
		
		// if the request comes from the ab-helpdesk-request-catalog.axvw
		// the restriction must be a object, otherwise it is undifined.
		if(restriction != undefined){
			activityTypeValue = restriction["activitytype.activity_type"];
		}else{
			// meet the ondemand case.
			activityTypeValue = 'SERVICE DESK - MAINTENANCE';
		}
		// display the activity type on html.
		$("activity_type").innerHTML = activityTypeValue;
		
		
		/**********************************************************************/
		this.doWorkForActions(activityTypeValue);
		this.doWorkForPanels(activityTypeValue);
		// KB 3038367 handleRedlineRestriction reset room code for CA 
		if(valueExists(ABHDC_getTabsSharedParameters()["condAssessmentRestrication"])){
			this.handleConditionAssessmentRestriction();
		} else{
			this.handleRedlineRestriction();
		}
		/*********************************************************************/
		this.doWorkForEditServiceRequest();
		
		//fix KB3035440 - reset 'Same as requestor' checkbox
		this.resetSameAsRequestorCheckBox();
	},	
	
	/**
	 * reset 'Same as requestor' checkbox
	 */
	resetSameAsRequestorCheckBox: function(){
		$("same").checked=false;
		var requestor = this.requestPanel.getFieldValue("activity_log.requestor"); 
		if(requestor != ''){
			//parameters = {'em_id': requestor};
			try {
				var result = Workflow.callMethod('AbBldgOpsHelpDesk-RequestsService-getEmployeeLocation', requestor);
			}catch(e){
				Workflow.handleError(e);
			}
		 	if (result.code == 'executed'){
				var results = eval("(" + result.jsonExpression + ")");
				
				if(this.locationPanel.getFieldValue("activity_log.site_id") == results.site_id
					&& this.locationPanel.getFieldValue("activity_log.bl_id") == results.bl_id
					&& this.locationPanel.getFieldValue("activity_log.fl_id") == results.fl_id
					&& this.locationPanel.getFieldValue("activity_log.rm_id") == results.rm_id){
					
					// set the value to the html element.
					$("same").checked=true;
				}
			}else{
				Workflow.handleError(result);
			}
		}
	},
	
	handleRedlineRestriction: function(){
		var redlineRestriction = View.getOpenerView().panels.get("helpDeskRequestTabs").restriction;
		if (redlineRestriction == null 
				|| redlineRestriction == undefined
			    || typeof redlineRestriction == "string" 
				|| ABHDC_getTabsSharedParameters()["fromIncident"]){
			return;				
		}
		var clause = null;
		$("same").checked = false;
		clause = redlineRestriction.findClause('activity_log.bl_id');
		if (clause != null && clause != undefined
				&& clause.value != null && clause.value != undefined){
			this.locationPanel.setFieldValue("activity_log.bl_id", clause.value);	
		} else {
			this.locationPanel.setFieldValue("activity_log.bl_id", '');
		}
		
		clause = redlineRestriction.findClause('activity_log.fl_id');
		if (clause != null && clause != undefined
				&& clause.value != null && clause.value != undefined){
			this.locationPanel.setFieldValue("activity_log.fl_id", clause.value);	
		} else {
			this.locationPanel.setFieldValue("activity_log.fl_id", '');
		}
		this.locationPanel.setFieldValue("activity_log.rm_id",'');
		SLA_onChangeLocation2('locationPanel','descriptionPanel');
	},
	
	
	handleConditionAssessmentRestriction: function() {
	
		var passedRestriction = ABHDC_getTabsSharedParameters()["condAssessmentRestrication"];
		
		// condition assessment item restriction.
		if (passedRestriction == null 
				|| passedRestriction == undefined){
			return;				
		}
		
		var clause = null;
		$("same").checked = false;	
		
		clause = passedRestriction.findClause('activity_log.site_id');
		if (clause != null && clause != undefined
				&& clause.value != null && clause.value != undefined){
			this.locationPanel.setFieldValue("activity_log.site_id", clause.value);
		} else {
			this.locationPanel.setFieldValue("activity_log.site_id", '');
		}
		
		clause = passedRestriction.findClause('activity_log.bl_id');
		if (clause != null && clause != undefined
				&& clause.value != null && clause.value != undefined){
			this.locationPanel.setFieldValue("activity_log.bl_id", clause.value);	
		} else {
			this.locationPanel.setFieldValue("activity_log.bl_id", '');
		}
		
		clause = passedRestriction.findClause('activity_log.fl_id');
		if (clause != null && clause != undefined
				&& clause.value != null && clause.value != undefined){
			this.locationPanel.setFieldValue("activity_log.fl_id", clause.value);	
		} else {
			this.locationPanel.setFieldValue("activity_log.fl_id", '');
		}
		
		clause = passedRestriction.findClause('activity_log.rm_id');
		if (clause != null && clause != undefined
				&& clause.value != null && clause.value != undefined){
			this.locationPanel.setFieldValue("activity_log.rm_id", clause.value);	
		} else {
			this.locationPanel.setFieldValue("activity_log.rm_id", '');
		}
		
		clause = passedRestriction.findClause('activity_log.location');
		if (clause != null && clause != undefined
				&& clause.value != null && clause.value != undefined){
			this.requestPanel.setFieldValue("activity_log.location", clause.value);	
		} else {
			this.requestPanel.setFieldValue("activity_log.location", '');
		}
		
		clause = passedRestriction.findClause('activity_log.eq_id');
		if (clause != null && clause != undefined
				&& clause.value != null && clause.value != undefined){
			this.equipmentPanel.setFieldValue("activity_log.eq_id", clause.value);
			onEqIdChange();
		} else {
			this.equipmentPanel.setFieldValue("activity_log.eq_id", '');
		}
		
		clause = passedRestriction.findClause('activity_log.requestor');
		if (clause != null && clause != undefined
				&& clause.value != null && clause.value != undefined){
			this.requestPanel.setFieldValue("activity_log.requestor", clause.value);
			
			clause = passedRestriction.findClause('activity_log.phone_requestor');
			if (clause != null && clause != undefined
					&& clause.value != null && clause.value != undefined){
				this.requestPanel.setFieldValue("activity_log.phone_requestor", clause.value);	
			} else {
				this.requestPanel.setFieldValue("activity_log.phone_requestor", '');
			} 
		} 
		
		
		clause = passedRestriction.findClause('activity_log.description');
		if (clause != null && clause != undefined
				&& clause.value != null && clause.value != undefined){
			this.descriptionPanel.setFieldValue("activity_log.description", clause.value);	
		} else {
			this.descriptionPanel.setFieldValue("activity_log.description", '');	
		}
		
		/**
		 * IOAN  Add problem type field when is from clean building
		 */
		clause = passedRestriction.findClause('activity_log.prob_type');
		if (clause != null && clause != undefined
				&& clause.value != null && clause.value != undefined){
			this.descriptionPanel.setFieldValue("activity_log.prob_type", clause.value);
			afterSelectProblemType("activity_log.prob_type", clause.value, "");
		}
		clause = passedRestriction.findClause('activity_log.project_id');
		if (clause != null && clause != undefined
				&& clause.value != null && clause.value != undefined){
			this.requestPanel.setFieldValue("activity_log.project_id", clause.value);
		}

		clause = passedRestriction.findClause('activity_log.assessment_id');
		if (clause != null && clause != undefined
				&& clause.value != null && clause.value != undefined){
			this.requestPanel.setFieldValue("activity_log.assessment_id", clause.value);
		}
		
		clause = passedRestriction.findClause('activity_log.date_scheduled');
		if (clause != null && clause != undefined
				&& clause.value != null && clause.value != undefined){
			
			var date = clause.value;
			var strDate = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
				
			this.requestPanel.setFieldValue("activity_log.date_scheduled", strDate);
		}

		clause = passedRestriction.findClause('activity_log.copied_from');
		if (clause != null && clause != undefined
				&& clause.value != null && clause.value != undefined){
			this.requestPanel.setFieldValue("activity_log.copied_from", clause.value);
		}

		/**
		 * Add incident_id field when is from EH&S
		 */
		clause = passedRestriction.findClause('activity_log.incident_id');
		if (clause != null && clause != undefined
				&& clause.value != null && clause.value != undefined){
			this.descriptionPanel.setFieldValue("activity_log.incident_id", clause.value);
		}
	},
	
	
	doWorkForEditServiceRequest: function() {
		var tabs = View.getOpenerView().panels.get("helpDeskRequestTabs");
		
		var tabBasic = tabs.findTab("basic");
		var restriction = tabBasic.restriction;
		if (!valueExists(restriction)) {
			return;	
		}
		
		if (valueExists(restriction["activity_log.location"])) {
			this.requestPanel.setFieldValue("activity_log.location", restriction["activity_log.location"]);
		}
		
		if (valueExists(restriction["activity_log.requestor"])) {
			this.requestPanel.setFieldValue("activity_log.requestor", restriction["activity_log.requestor"]);
		}
		
		if (valueExists(restriction["activity_log.prob_type"])) {
			this.descriptionPanel.setFieldValue("activity_log.prob_type", restriction["activity_log.prob_type"]);
						checkSLA();
					}
		
		if (valueExists(restriction["activity_log.description"])) {
			this.descriptionPanel.setFieldValue("activity_log.description", restriction["activity_log.description"]);
		}
		
		if (valueExists(restriction["activity_log.site_id"])) {
			this.locationPanel.setFieldValue("activity_log.site_id", restriction["activity_log.site_id"]);
		}
		
		if (valueExists(restriction["activity_log.dp_id"])) {
			this.requestPanel.setFieldValue("activity_log.dp_id", restriction["activity_log.dp_id"]);
		}
		
		if (valueExists(restriction["activity_log.dv_id"])) {
			this.requestPanel.setFieldValue("activity_log.dv_id", restriction["activity_log.dv_id"]);
		}
		
		if (valueExists(restriction["activity_log.bl_id"])) {
			this.locationPanel.setFieldValue("activity_log.bl_id", restriction["activity_log.bl_id"]);
		}
		
		if (valueExists(restriction["activity_log.fl_id"])) {
			this.locationPanel.setFieldValue("activity_log.fl_id", restriction["activity_log.fl_id"]);
		}
		
		if (valueExists(restriction["activity_log.rm_id"])) {
			this.locationPanel.setFieldValue("activity_log.rm_id", restriction["activity_log.rm_id"]);
		}
		
		if (valueExists(restriction["activity_log.eq_id"])) {
			this.equipmentPanel.setFieldValue("activity_log.eq_id", restriction["activity_log.eq_id"]);
		}
		
		if (valueExists(restriction["activity_log.priority"])) {
			this.descriptionPanel.setFieldValue("activity_log.priority", restriction["activity_log.priority"]);
			
			var htmlPriority = document.getElementsByName("priorities");
			if (valueExists(htmlPriority)) {
				for (var i = 0; i < htmlPriority.length; i++) {
					htmlPriority[i].checked = false;
					if (htmlPriority[i].value == restriction["activity_log.priority"]) {
						htmlPriority[i].checked = true;
						//fix KB3031741- when go back from the next tab, restore the actual value of priority
						SLA_setPriority("requestPanel","descriptionPanel",htmlPriority[i].value,"priorities");
					}
				}
			}
		}
		
		if (valueExists(restriction["activity_log.date_required"]) && restriction["activity_log.date_required"] != "") {
			onCheckSpecificTime('datePanel', 'priorities');
			var specificTime = document.getElementById("specificTime");
			if (valueExists(specificTime)) {
				specificTime.checked = true;	
			}
			
			this.datePanel.setFieldValue("activity_log.date_required", restriction["activity_log.date_required"]);
		}
		
		if (valueExists(restriction["activity_log.time_required"])) {
			this.datePanel.setFieldValue("activity_log.time_required", restriction["activity_log.time_required"]);
		}
		
		if (valueExists(restriction["activity_log.date_scheduled"])) {
			this.requestPanel.setFieldValue("activity_log.date_scheduled", restriction["activity_log.date_scheduled"]);
		}
		
		if (valueExists(restriction["activity_log.phone_requestor"])) {
			this.requestPanel.setFieldValue("activity_log.phone_requestor", restriction["activity_log.phone_requestor"]);
		}
		
		var tabCatalog = tabs.findTab("catalog");
		if (!valueExists(tabCatalog)) {
			// hidden previous button
			View.panels.get("requestPanel").actions.get("cancel").show(false);
		}
	},
	
	doWorkForActions: function(activityTypeValue){
		try {
			var result = Workflow.callMethod('AbBldgOpsHelpDesk-RequestsService-checkRequestForm', activityTypeValue);
		}catch(e){
			Workflow.handleError(e);
		}

		if(result.code == 'executed'){
			var json = eval('('+result.jsonExpression+')');	
			
			 
			ABHDC_getTabsSharedParameters()["questionnaire"] = json.questionnaire; 
			ABHDC_getTabsSharedParameters()["documents"] = json.documents;
			ABHDC_getTabsSharedParameters()["locatie"] = json.locatie;
			ABHDC_getTabsSharedParameters()["equipment"] = json.equipment;
			ABHDC_getTabsSharedParameters()["required"] = json.required;
			ABHDC_getTabsSharedParameters()["prob_type"] = json.prob_type;
			
			
			if(ABHDC_getTabsSharedParameters()["questionnaire"]){
				//below code is used to show quest tab again if quest tab have been hide.
                //but now when go back to catalog tab we have change code to show all visible tab
                //as first time load, so I comment out below code, it not need now (Guo 2011/06/23)  
				/*if(this.mainTabs.findTab("quest") != null){
					this.mainTabs.showTab("quest");
				}*/
				
				this.requestPanel.actions.get("confirm").show(false);
			}
			
			if(!ABHDC_getTabsSharedParameters()["questionnaire"]
				 && !ABHDC_getTabsSharedParameters()["documents"]){
				 
				this.requestPanel.actions.get("next").show(false);
			}
			
			if(ABHDC_getTabsSharedParameters()["prob_type"]){
				//hide details tab
				if(this.mainTabs.findTab("quest") != null){
					this.mainTabs.hideTab("quest"); 
				}
			}		
			
		}else{
			Workflow.handleError(result);
		}
	},
	
		
	doWorkForPanels: function(activityTypeValue){
	
		if(!valueExists(activityTypeValue)){
			alert("the activity type is undefined");
			return;
		}
		
		ABHDC_clearPriorities("descriptionPanel", "priorities")
		this.descriptionPanel.setFieldValue("activity_log.activity_type", activityTypeValue);
		
		//check fields to hide
		if(!ABHDC_getTabsSharedParameters()["locatie"]){
			this.locationPanel.show(false);
		}
	
		if(!ABHDC_getTabsSharedParameters()["equipment"]){
			this.equipmentPanel.show(false);
		}
		
		if(!ABHDC_getTabsSharedParameters()["required"]){
			
			if($("specificTime") != null){
				$("specificTime").parentNode.parentNode.style.display = 'none';
			}

			this.datePanel.getFieldElement("activity_log.date_required").parentNode.parentNode.style.display = 'none';
		} else {
			this.datePanel.enableField("activity_log.date_required", false) ;
			this.datePanel.enableField("activity_log.time_required", false) ;
		}
		
		//check questionnaire (hide description if questionnaire exists)
		if(ABHDC_getTabsSharedParameters()["questionnaire"]){
			
            //below code is used to show quest tab again if quest tab have been hide.
            //but now when go back to catalog tab we have change code to show all visible tab
            //as first time load, so I comment out below coce, it not need now (Guo 2011/06/23)  
	        /*if(this.mainTabs.findTab("quest") != null){
				this.mainTabs.showTab("quest"); 
		      }*/
			
			var element = this.descriptionPanel.getFieldElement("activity_log.description");		
			if(element.parentNode.previousSibling != null){ 
				//hide the label td
				element.parentNode.previousSibling.style.display = 'none'; 
			}
			//hide the td EL.
			element.parentNode.style.display = 'none';	
		}else{
			//if no questionnaire hide quest tab to support dynamic tab in 20.1, which will show next next tab by value of tab.forcedHidden(Guo 2011/06/23) 
			if(this.mainTabs.findTab("quest") != null){
				this.mainTabs.hideTab("quest"); 
		}
		}
		
		
		//check prob_type
		if(ABHDC_getTabsSharedParameters()["prob_type"]){
			this.descriptionPanel.showField('activity_log.prob_type', true);
            this.descriptionPanel.enableFieldActions('activity_log.prob_type', true);
			//hide details tab
			if(this.mainTabs.findTab("quest") != null){
				this.mainTabs.hideTab("quest"); 
			}
		} else {
			this.descriptionPanel.showField('activity_log.prob_type', false);	
			}
		
		
		if(activityLogId != 0 && activityLogId != undefined){
			//can not be debugged.
			// XXX XXX XXX XXX XXX XXX
			// XXX XXX XXX XXX XXX XXX
			var restriction = new Ab.view.Restriction();
			restriction.addClause('activity_log.activity_log_id', activityLogId,'=');
			
			this.requestPanel.refresh(restriction, false);
			
			if(ABHDC_getTabsSharedParameters()["locatie"]) {
				this.locationPanel.refresh(restriction, false);
				
			}
			
			if(ABHDC_getTabsSharedParameters()["equipment"]){
				this.equipmentPanel.refresh(restriction, false);
				
			}				
			
			this.descriptionPanel.restriction(restriction, false);	
			this.descriptionPanel.setFieldValue("activity_log.activity_type", activityTypeValue);		
			 
			
			
			//check if location is same as requestor's
			var requestor = this.requestPanel.getFieldValue("activity_log.requestor"); 
			if(requestor != ''){
				//parameters = {'em_id': requestor};
				try {
					var result = Workflow.callMethod('AbBldgOpsHelpDesk-RequestsService-getEmployeeLocation', requestor);
				}catch(e){
					Workflow.handleError(e);
				}
			 	if (result.code == 'executed'){
					var results = eval("(" + result.jsonExpression + ")");
					
					if(this.locationPanel.getFieldValue("activity_log.site_id") == results.site_id
						&& this.locationPanel.getFieldValue("activity_log.bl_id") == results.bl_id
						&& this.locationPanel.getFieldValue("activity_log.fl_id") == results.fl_id
						&& this.locationPanel.getFieldValue("activity_log.rm_id") == results.rm_id){
						
						// set the value to the html element.
						$("same").checked=true;
					}
				}else{
					Workflow.handleError(result);
				}
			}
			 
			if(ABHDC_getTabsSharedParameters()["required"]){
				checkDateAndTimeRequired();
			}
			SLA_setPriority("requestPanel","descriptionPanel",null,"priorities");
		}else{
		
			if(ABHDC_getTabsSharedParameters()["locatie"]){
				 //this.locationPanel.refresh( {'activity_log.activity_log_id':0},true);
				
				 $("same").checked = true;}
				 // set the parameters   
			//kb:3023309 @lei
				 onCheckSameAsRequestor(this);
			
			
			this.descriptionPanel.setFieldValue("activity_log.activity_type",activityTypeValue);
			
			this.datePanel.setFieldValue("activity_log.date_required",'');
			this.datePanel.setFieldValue("activity_log.time_required",'');
			
		}		 
	
	
		if(ABHDC_getTabsSharedParameters()["slaFound"]){
			checkSLA();
		}	
	},	
		
		
	

	requestPanel_onCancel: function(){
		
		document.getElementById("activity_type").innerHTML = "";		
		
		var activityLogIdValue = this.requestPanel.getFieldValue("activity_log.activity_log_id");
		var assessmentId = this.requestPanel.getFieldValue("activity_log.assessment_id");
		
		if(this.mainTabs != null){ 
		       this.mainTabs.findTab("basic").restriction = null;
		}
		
		var parentCtrl = View.getOpenerView().controllers.get(0);
		parentCtrl.basicRestriction = null;
		
		ABHDC_getTabsSharedParameters()["questionnaire"] = null; 
		ABHDC_getTabsSharedParameters()["documents"] = null;
		ABHDC_getTabsSharedParameters()["locatie"] = null;
		ABHDC_getTabsSharedParameters()["equipment"] = null;
		ABHDC_getTabsSharedParameters()["required"] = null;
		ABHDC_getTabsSharedParameters()["prob_type"] = null;
		
		if(activityLogIdValue != '' && activityLogIdValue > 0){
			
			var sure = confirm(getMessage("deleteRequest"));
			if(sure){
				var record = ABHDC_getDataRecord2(this.requestPanel); 
				//parameters = { "fields" : record };
				try {
					var result = Workflow.callMethod('AbBldgOpsHelpDesk-RequestsService-deleteRequest', record);
				} 
				catch (e) {
					Workflow.handleError(e);
				}
				if(result.code == 'executed'){
					if (this.mainTabs != null) {
                        //reload the whole tabs structure to support 20.1 dynamic tab, that means when go back to catalog tab, show default tabs structure
                        //and when select a request type dynamically show specified tabs structure by  request type(Guo 2011/06/23) 
						ABHDC_getTabsSharedParameters()["activity_log_id"] = 0;
						ABHDC_getTabsSharedParameters()["activity_type"] = null;
						//refresh the parent url.
						window.parent.location.href = window.parent.location.href;
					}
				} else {
					Workflow.handleError(result);
				}
			}	
			
			if(assessmentId != '' && assessmentId > 0){
				View.getOpenerView().closeThisDialog();
			}
					
		} else {
			
			if(assessmentId != '' && assessmentId > 0){
				View.getOpenerView().closeThisDialog();
				return;
			}
			
            //reload the whole tabs structure to support 20.1 dynamic tab, that means when go back to catalog tab, show default tabs structure
            //and when select a request type dynamically show specified tabs structure by  request type	(Guo 2011/06/23) 					
			ABHDC_getTabsSharedParameters()["activity_log_id"] = 0;
			ABHDC_getTabsSharedParameters()["activity_type"] = null;
			//refresh the parent url.
			window.parent.location.href = window.parent.location.href;
                return;
            }
	},
	


	requestPanel_onNext: function(){

	
		if(this.mainTabs != null){
			
			if(!this.checkBasicForm()){ //all required fields filled in?
				return;
			}
			
			//move below code here to aviod an error: when there exists similar request, it will open similar rquest view
            //if you click continue in the pop up and go to next tab, then if you click previous butoon to go back basic tab again,
            //it will cause error because the  parentCtrl.basicRestriction is not yet set (Guo 2011/06/23) 
			// save the restriction as parameter
			var basicRestriction = ABHDC_getDataRecordValues(this.requestPanel.dataSourceId);
			var parentCtrl = View.getOpenerView().controllers.get(0);
	
			basicRestriction["activitytype.activity_type"] = basicRestriction["activity_log.activity_type"];
			parentCtrl.basicRestriction = basicRestriction;
			
			var record = ABHDC_getDataRecord2(this.requestPanel);
			try {
				var result = Workflow.callMethod('AbBldgOpsHelpDesk-RequestsService-checkRequestDuplicates', record);
			}catch(e){
				Workflow.handleError(e);
				return;
			}
			
			if(result.code == 'executed'){
				var res = eval('('+result.jsonExpression+')');
				if (res.duplicates){										
					var restriction = ABHDC_createDuplicatesRestriction();
					
					ABHDC_getTabsSharedParameters()["saveOrSubmit"] = 'save';
					View.openDialog("ab-helpdesk-request-similar.axvw", restriction, false); 
					return;
				}					
			} else {
				Workflow.handleError(result);
			}	
			
			try {
				result = Workflow.callMethod('AbBldgOpsHelpDesk-RequestsService-saveRequest', record);
			}catch(e){
				Workflow.handleError(e);
				return;
			}
			
			if(result.code == 'executed'){
				//get activity_log_id from result
				var res;
				if(result.jsonExpression != ""){
					res = eval('('+result.jsonExpression+')');
				} 
				/*
				 * Ioan - call calbackMethod if exists
				 */
				if(valueExists(ABHDC_getTabsSharedParameters().callbackMethod)){
					ABHDC_getTabsSharedParameters().callbackMethod.call(this, res.activity_log_id);
				}
				
				//nextTab();
				var restriction = new Ab.view.Restriction();
				restriction.addClause('activity_log.activity_log_id',res.activity_log_id);
				
				//var XMLrest = ABHDC_generatePKeyRestriction('activity_log', 'activity_log_id', res.activity_log_id);		
				
				//this.mainTabs.selectTab("quest",restriction,XMLrest,false);
				/////////////////////////////////
				
				//add for support dynamic tabs in 20.1 and also keep compatible with other applications that not dynamic tabs like On Demand - Create Maintenance Service Request(Guo 2011/06/23) 
				var dynamicAssemblyTabsController = View.getOpenerView().controllers.get('dynamicAssemblyTabsController');
				if(dynamicAssemblyTabsController){
                    dynamicAssemblyTabsController.selectNextTab(restriction);
                }else{
				var currentTab = this.mainTabs.getSelectedTabName();
				if(currentTab == 'basic'){	
					if(!ABHDC_getTabsSharedParameters()["questionnaire"]){
						if(!ABHDC_getTabsSharedParameters()["documents"]){
						} else {
							this.mainTabs.selectTab("docs", restriction, false, false, false);
						}
					} else { //basic quest => quest
						if(this.mainTabs.findTab("quest") != null){
							this.mainTabs.selectTab("quest", restriction, false, false, false);
						}
					}	
				} else if (currentTab == 'quest'){
					if(ABHDC_getTabsSharedParameters()["documents"]) {//basic no quest, docs => attach
						if(this.mainTabs.findTab("quest") != null){
							this.mainTabs.selectTab("docs", restriction, false, false, false);
						}
					}
					
				} 

                }
				
			} else {
				Workflow.handleError(result);
			}
		} 
	},

	requestPanel_onConfirm: function(){
		if(this.mainTabs != null){
			if(!this.checkBasicForm()){ //all required fields filled in?
				return;
			}
			
			var record = ABHDC_getDataRecord2(this.requestPanel);
			//IFM Added
			record['activity_log.notify_ohs']= sessionStorage.notifyOHS;
			
			try {
				var result = Workflow.callMethod('AbBldgOpsHelpDesk-RequestsService-checkRequestDuplicates', record);
			}catch(e){
				Workflow.handleError(e);
				return;
			}
			
			if(result.code == 'executed'){
				var res = eval('('+result.jsonExpression+')');
				if (res.duplicates){										
					var restriction = ABHDC_createDuplicatesRestriction();
					//kb:3023406 @lei
					ABHDC_getTabsSharedParameters()["saveOrSubmit"] = 'submit';
					View.openDialog("ab-helpdesk-request-similar.axvw", restriction, false); 
					return;
				}					
			} else {
				Workflow.handleError(result);
			}	
			activityLogId = 0;
			
			if(this.requestPanel.getFieldValue("activity_log.activity_log_id") != ''){
				activityLogId = this.requestPanel.getFieldValue("activity_log.activity_log_id");
			}
			
	    	try {
				result = Workflow.callMethod('AbBldgOpsHelpDesk-RequestsService-submitRequest', activityLogId,record);
			}catch(e){
				    Workflow.handleError(e);
				return;
			}
			
			if(result.code == 'executed'){
				//get activity_log_id from result
				var res;
				if(result.jsonExpression != ""){
					res = eval('('+result.jsonExpression+')');
				} 
				/*
				 * Ioan - call calbackMethod if exists
				 */
				if(valueExists(ABHDC_getTabsSharedParameters().callbackMethod)){
					ABHDC_getTabsSharedParameters().callbackMethod.call(this, res.activity_log_id);
				}
				//nextTab();
				var restriction = new Ab.view.Restriction();
				restriction.addClause('activity_log.activity_log_id',res.activity_log_id);
				
				//IFM Added to save wr.cc_id from activity_log.cc_id
				var tds = View.dataSources.get("ifmWRDs");
				var ifmRestriction = new Ab.view.Restriction();
				ifmRestriction.addClause('wr.activity_log_id',res.activity_log_id);
								
				var ifmRec = tds.getRecord(ifmRestriction);
				var ifmCCId = record["activity_log.cc_id"];
				ifmRec.setValue("wr.cc_id", ifmCCId);
				tds.saveRecord(ifmRec);
				
				this.mainTabs.selectTab("result",restriction,false,false,false);
			} else {
				Workflow.handleError(result);
			}
		} 
	},
	
    checkBasicForm: function(){
    	
    	this.requestPanel.clearValidationResult();
        this.locationPanel.clearValidationResult();
        this.equipmentPanel.clearValidationResult();
        this.descriptionPanel.clearValidationResult();
        this.datePanel.clearValidationResult();
        
        //remove priority field validation result
        var fieldInputTd = $("priority").parentNode.parentNode;
        Ext.fly(fieldInputTd).removeClass('formError');
        var errorTextElements = Ext.query('.formErrorText', fieldInputTd);
        for (var e = 0; e < errorTextElements.length; e++) {
            fieldInputTd.removeChild(errorTextElements[e]);
        }
		
		var probTypeValue = 
			this.descriptionPanel.getFieldValue("activity_log.prob_type");
		
		if(probTypeValue == '' || probTypeValue == undefined || probTypeValue == null)
		{
			if (ABHDC_getTabsSharedParameters()["prob_type"]) {
				View.showMessage(getMessage("noProblemType"));
				
				//KB3039310 - change dom value and class name because core UI change in v21.1
			  	var fieldInputTd = $("activity_log.prob_type").parentNode.parentNode;
			    Ext.fly(fieldInputTd).addClass('formError');
			    var errorBreakElement = document.createElement('br');
			    errorBreakElement.className = 'formErrorText';
			    fieldInputTd.appendChild(errorBreakElement);
			    
				return false;
			}
		}
		
		
    	//priority selected?
		var activityLogPriorityValue = 
			this.descriptionPanel.getFieldValue("activity_log.priority");
		
		if(document.getElementById("default").innerHTML == '' 
			&& (activityLogPriorityValue== '' || activityLogPriorityValue== '0'))
		{
			View.showMessage(getMessage("noPriority"));
			
			//KB3039310 - change dom value and class name because core UI change in v21.1 
			var fieldInputTd = $("priority").parentNode.parentNode;
		    Ext.fly(fieldInputTd).addClass('formError');
		    var errorBreakElement = document.createElement('br');
		    errorBreakElement.className = 'formErrorText';
		    fieldInputTd.appendChild(errorBreakElement);
			
			return false;
		}
        
        if (this.descriptionPanel.getFieldValue("activity_log.priority") == '') {
            this.descriptionPanel.addInvalidField("activity_log.priority", getMessage("selectPriority"));
            this.descriptionPanel.displayValidationResult();
            
            //KB3039310 - change dom value and class name because core UI change in v21.1
            var fieldInputTd = $("priority").parentNode.parentNode;
		    Ext.fly(fieldInputTd).addClass('formError');
		    var errorBreakElement = document.createElement('br');
		    errorBreakElement.className = 'formErrorText';
		    fieldInputTd.appendChild(errorBreakElement);
			
            return false;
        }
        
        if (this.requestPanel.getFieldValue("activity_log.requestor") == '') {
            this.requestPanel.addInvalidField("activity_log.requestor", getMessage("noRequestor"));
            this.requestPanel.displayValidationResult();
            return false;
        }
        
        //kb3023449(Guo changed 2009-07-08)
        if (ABHDC_getTabsSharedParameters()["locatie"] && this.locationPanel.getFieldValue("activity_log.site_id") == '') {
            this.locationPanel.addInvalidField("activity_log.site_id", getMessage("noSite"));
            this.locationPanel.displayValidationResult();
            return false;
        }
        //kb3023435
        //kb3023449(Guo changed 2009-07-08)
        if (!ABHDC_getTabsSharedParameters()["questionnaire"] && this.descriptionPanel.getFieldValue("activity_log.description") == '') {
            this.descriptionPanel.addInvalidField("activity_log.description", getMessage("noDescription"));
            this.descriptionPanel.displayValidationResult();
            return false;
        }
		//IFM Added
        if (!checkCCId()){
        	this.descriptionPanel.addInvalidField("activity_log.cc_id", "Please enter a Cost Centre");
        	this.descriptionPanel.displayValidationResult();
        	return false;
        }
        
        return this.validateEqLocation();
    },
	
	saveAndNext: function(){
		
		var record = ABHDC_getDataRecord2(this.requestPanel);
		//IFM Added
		record['activity_log.notify_ohs']= sessionStorage.notifyOHS;
		
		//IFM Added
		if(!this.checkBasicForm()){ //all required fields filled in?
			return;
		}
		
		
		if(ABHDC_getTabsSharedParameters()["saveOrSubmit"] == 'submit'){
			activityLogId = this.requestPanel.getFieldValue("activity_log.activity_log_id");
			if(activityLogId == ''){
				activityLogId = 0;
			}
			
			try {
				var result = Workflow.callMethod('AbBldgOpsHelpDesk-RequestsService-submitRequest', activityLogId,record);
			}catch(e){
				if (e.code == 'ruleFailed'){
					View.showMessage(e.message);
				}else{
				    Workflow.handleError(e);
				}
				return;
			}
			
			if(result.code == 'executed'){
				if(this.mainTabs != null){
					var res = eval('('+result.jsonExpression+')');
					activityLogId = res.activity_log_id;
					
					/*
					 * Ioan - call calbackMethod if exists
					 */
					if(valueExists(ABHDC_getTabsSharedParameters().callbackMethod)){
						ABHDC_getTabsSharedParameters().callbackMethod.call(this, res.activity_log_id);
					}
					
					var rest = new Ab.view.Restriction();
					rest.addClause("activity_log.activity_log_id",activityLogId,"=");
					//var restriction = ABHDC_generatePKeyRestriction('activity_log','activity_log_id',activity_log_id);
					this.mainTabs.selectTab("result",rest,false,false,false);
				}
			} else {
				Workflow.handleError(result);
			}
		}else if(ABHDC_getTabsSharedParameters()["saveOrSubmit"] == 'save'){
			try {
				var result = Workflow.callMethod('AbBldgOpsHelpDesk-RequestsService-saveRequest', record);
			}catch(e){
				Workflow.handleError(e);
			}
					
			if(result.code == 'executed'){
				//get activity_log_id from result
				if(result.jsonExpression != ""){
					var res = eval('('+result.jsonExpression+')');
					/*
					 * Ioan - call calbackMethod if exists
					 */
					if(valueExists(ABHDC_getTabsSharedParameters().callbackMethod)){
						ABHDC_getTabsSharedParameters().callbackMethod.call(this, res.activity_log_id);
					}
					ABHDC_getTabsSharedParameters()["activity_log_id"] = res.activity_log_id;
				} 
				this.nextTab();
			} else {
				Workflow.handleError(result);
			}
		}
		this.requestPanel.actions.get("confirm").enable(true);
		//IFM Added to save cc_id
		var ifm_parms = {
				tableName: 'activity_log',
		        fieldNames: toJSON(['activity_log.wr_id','activity_log.cc_id','activity_log.ac_id']),
		        restriction: toJSON(new Ab.view.Restriction({'activity_log.activity_log_id':activityLogId}))
			};
		var wrRes = Ab.workflow.Workflow.call('AbCommonResources-getDataRecords', ifm_parms);
		
		if (wrRes.data.records.length>0  ){
			var ifmRec = {};
			var wrId = wrRes.data.records[0]['activity_log.wr_id'];
			
	    	ifmRec['wr.cc_id']=record['activity_log.cc_id'];
	    	ifmRec['wr.ac_id']=record['activity_log.ac_id'];
	    	ifmRec['wr.wr_id']=wrId;
	    	//*	
	    	var ifmParms = {
	    			tableName: 'wr',
	    			fields: toJSON(ifmRec),
	    			restriction: toJSON(new Ab.view.Restriction({'wr.wr_id':wrId}))
	    	};
	    	var ifmResult = AFM.workflow.Workflow.runRuleAndReturnResult('AbCommonResources-saveRecord', ifmParms);
	    	//*/			
		}
	},
	
	nextTab: function(){
	
		if(this.mainTabs != null){
			if(ABHDC_getTabsSharedParameters()["activity_log_id"] == 0) 
				ABHDC_getTabsSharedParameters()["activity_log_id"] = $("activity_log.activity_log_id").value;
			
			var restriction = new Ab.view.Restriction();
			restriction.addClause('activity_log.activity_log_id',ABHDC_getTabsSharedParameters()["activity_log_id"]);
			//var XMLrest = ABHDC_generatePKeyRestriction('activity_log','activity_log_id',ABHDC_getTabsSharedParameters()["activity_log_id"]);		
	
			//add for support dynamic tabs in 20.1 and also keep compatible with other applications that not dynamic tabs like On Demand - Create Maintenance Service Request(Guo 2011/06/23) 
			var dynamicAssemblyTabsController = View.getOpenerView().controllers.get('dynamicAssemblyTabsController');
			if(dynamicAssemblyTabsController){
                 dynamicAssemblyTabsController.selectNextTab(restriction);
             }else{
                currentTab = this.mainTabs.getSelectedTabName();
			if(currentTab == 'basic'){	
				if(!ABHDC_getTabsSharedParameters()["questionnaire"]){
					if(!ABHDC_getTabsSharedParameters()["documents"]){
					} else {
						this.mainTabs.selectTab("docs",restriction,false,false,false);
					}
				} else { //basic quest => quest
					if(this.mainTabs.findTab("quest") != null){
						this.mainTabs.selectTab("quest",restriction,false,false,false);
					}
				}	
			}else if(currentTab == 'quest'){
				if(ABHDC_getTabsSharedParameters()["documents"]) {//basic no quest, docs => attach
					this.mainTabs.selectTab("docs",restriction,false,false,false);
				}
			} 
		}
	}
	},
	
	
	validateEqLocation: function(){
		var eqId = this.equipmentPanel.getFieldValue('activity_log.eq_id');
		if(eqId){
			var restriction = new Ab.view.Restriction();
			restriction.addClause('eq.eq_id',eqId, '=');
			
			var blId = this.locationPanel.getFieldValue('activity_log.bl_id');
			var flId = this.locationPanel.getFieldValue('activity_log.fl_id');
			var rmId = this.locationPanel.getFieldValue('activity_log.rm_id');
			
			if(blId){
				restriction.addClause('eq.bl_id',blId, '=');
			}else{
				restriction.addClause('eq.bl_id',null, 'IS NULL');
			}
			
			if(flId){
				restriction.addClause('eq.fl_id',flId, '=');
			}else{
				restriction.addClause('eq.fl_id',null, 'IS NULL');
			}
			
			if(rmId){
				restriction.addClause('eq.rm_id',rmId, '=');
			}else{
				restriction.addClause('eq.rm_id',null, 'IS NULL');
			}
			
			var records = this.ds_eq_warranty_grid.getRecords(restriction);
			if(records.length == 0){
				var continueToNext = confirm(getMessage('differentEqLocaiton'));
				return continueToNext;
			}else{
				return true;
			}
		}
		
		return true;
	}
});





/**
* Retrieves requestor information (phone, dv_id, dp_id) from the database<br />
* Calls WFR <a href='../../../javadoc/com/archibus/eventhandler/helpdesk/RequestHandler.html#getRequestorInformation(com.archibus.jobmanager.EventHandlerContext)' target='main'>AbBldgOpsHelpDesk-getRequestorInformation</a>
*/
function setRequestorInfo(){
	
	var requestPanel = View.panels.get("requestPanel");
	var requestorValue = requestPanel.getFieldValue("activity_log.requestor");
	
	
	try {
		var result = Workflow.callMethod('AbBldgOpsHelpDesk-RequestsService-getRequestorInformation', requestorValue);
	}catch(e){
		Workflow.handleError(e);
	}
	
	if(result.code == 'executed'){
		var res = eval('('+result.jsonExpression+')');
		if(res != null){
			
			
			//KB3043720 - clear phone number before select new requestor
			requestPanel.setFieldValue("activity_log.phone_requestor",'');
			requestPanel.setFieldValue("activity_log.dv_id",'');
			requestPanel.setFieldValue("activity_log.dp_id",'');
			
			if(res.phone != undefined)
				requestPanel.setFieldValue("activity_log.phone_requestor",res.phone);
			
			if(res.dv_id != undefined)
				requestPanel.setFieldValue("activity_log.dv_id",res.dv_id);
				
			if(res.dp_id != undefined)
				requestPanel.setFieldValue("activity_log.dp_id",res.dp_id);
		}
	} else {
		Workflow.handleError(result);
	}
}

function checkSLA(){
	var panel = View.panels.get("descriptionPanel");
	
	if(ABHDC_getTabsSharedParameters()["prob_type"]){
		if($("activity_log.prob_type").value != ''){
			panel.setFieldValue("activity_log.prob_type",$("activity_log.prob_type").value);
			showSlaParameters();
		}
	}else if(panel.getFieldValue("activity_log.activity_type") != ''){
		showSlaParameters();
	}
}
/**
* Retrieves SLA Parameters according to current request information<br />
* Calls WFR <a href='../../../javadoc/com/archibus/eventhandler/SLA/ServiceLevelAgreementHandler.html#getSLAConditionParameters(com.archibus.jobmanager.EventHandlerContext)' target='main'>AbBldgOpsHelpDesk-getSLAConditionParameters</a>
* @param {String} formName current form
*/
function showSlaParameters() {
	
	var descriptionPanel = View.panels.get("descriptionPanel");
	//KB3043453 - no change priority when check 'Same as requestor' checkbox
	//descriptionPanel.setFieldValue("activity_log.priority",1);
	
	var recordValues = ABHDC_getDataRecordValues("basicDs"); 
	recordValues["activity_log.priority"] = 1;
	//$("activity_log.prob_type").value != '';
	var record = ABHDC_handleDataRecordValues2(recordValues);
	
	
    try {
		var result = Workflow.callMethod('AbBldgOpsHelpDesk-SLAService-getSLAConditionParameters', null,null,record);
	}catch(e){
		Workflow.handleError(e);
	}
	
	if (result.code == 'executed') {  
	//show priority levels or default priority
        var params = eval("(" + result.jsonExpression + ")");
        if (params.ordering_seq != $("afm_sla_config.ordering_seq").value){
      		if($("afm_sla_config.ordering_seq").value != ""){
      			ABHDC_clearPriorities("descriptionPanel","priorities");
	      	}
    	  	$("afm_sla_config.ordering_seq").value = params.ordering_seq;
        }
        
        if(params.default_priority != undefined){
        	
        	SLA_setPriority("requestPanel","descriptionPanel",params.default_priority,"priorities");
        	//setPriority(params.default_priority);
        	
        	$("default").innerHTML = params['priority_level_'+params.default_priority];
      		$("default").style.display='inline';
        } else {
        	
        	ABHDC_getTabsSharedParameters()["slaFound"] = true;
        	if(params.priority_level_1 == undefined) { // no sla found        	  
        		alert(getMessage("noSlaFound") + descriptionPanel.getFieldValue("activity_log.activity_type")); 
        		ABHDC_getTabsSharedParameters()["slaFound"] = false;
        	}else if(params.priority_level_1 != "" 
        		&& params.priority_level_2 == undefined 
        		&& params.priority_level_3 == undefined 
        		&& params.priority_level_4 == undefined 
        		&& params.priority_level_5 == undefined){
      			
      			
      			SLA_setPriority("requestPanel","descriptionPanel",1,"priorities");
      			
      			$("default").innerHTML = params.priority_level_1;
      			$("default").style.display='inline';
      		} else {
	      		var radioButtons = document.getElementsByName('priorities');
	   		  	if(params.priority_level_1 != ""){
   			  		radioButtons[0].style.visibility='visible';
   			  		radioButtons[0].style.display='inline';
   					document.getElementById("priority_value1").innerHTML = params.priority_level_1 + '<br/>';
   					document.getElementById("priority_value1").style.display='inline';
		      	}
   			  	if(params.priority_level_2 != undefined){
   			  		radioButtons[1].style.visibility='visible';
   		  			radioButtons[1].style.display='inline';
   					document.getElementById("priority_value2").innerHTML = params.priority_level_2 + '<br/>';
    				document.getElementById("priority_value2").style.display='inline';
		      	}
    		  	if(params.priority_level_3 != undefined){
    		  		radioButtons[2].style.visibility='visible';
    		  		radioButtons[2].style.display='inline';
      				document.getElementById("priority_value3").innerHTML = params.priority_level_3 + '<br/>';
      				document.getElementById("priority_value3").style.display='inline';
		      	}
    		  	if(params.priority_level_4 != undefined){
    		  		radioButtons[3].style.visibility='visible';
    		  		radioButtons[3].style.display='inline';
      				document.getElementById("priority_value4").innerHTML = params.priority_level_4 + '<br/>';
      				document.getElementById("priority_value4").style.display='inline';
		      	}
		      	if(params.priority_level_5 != undefined){
   			  		radioButtons[4].style.visibility='visible';
   			  		radioButtons[4].style.display='inline';
   					document.getElementById("priority_value5").innerHTML = params.priority_level_5 + '<br/>';
   					document.getElementById("priority_value5").style.display='inline';
	      		}
	      		var panel = View.panels.get("descriptionPanel");
	      		
				if(panel.getFieldValue("activity_log.priority") != '' 
	      			&& panel.getFieldValue("activity_log.priority") != '0'){
		      		SLA_setPriority("requestPanel","descriptionPanel",panel.getFieldValue("activity_log.priority"),"priorities");
    	  		}
    	    }
    	    var panel = View.panels.get("datePanel");
    	    
    	    //if date required was filled in, check new priority button
    	    if(panel.getFieldValue("activity_log.date_required") != ''){
				ABHDC_onChangeDateRequired(this);
			}
        }
      		
    } else {
       Workflow.handleError(result);
    }
}


/**
* Retrieves location of current user<br />
* Calls WFR <a href='../../../javadoc/com/archibus/eventhandler/helpdesk/RequestHandler.html#getEmployeeLocation(com.archibus.jobmanager.EventHandlerContext)' target='main'>AbBldgOpsHelpDesk-getEmployeeLocation</a><br />
* <a href='#setLocation'>Set location fields</a>
* @param {String} formName current form
*/
function onCheckSameAsRequestor() {
	
	var panel = View.panels.get("requestPanel");
	var	requestor = panel.getFieldValue("activity_log.requestor"); 
	if(requestor != ''){			
		 //var parameters = {'em_id': requestor};
		 try {
		 	var result = Workflow.callMethod('AbBldgOpsHelpDesk-RequestsService-getEmployeeLocation', requestor);
		 }catch(e){
		 	Workflow.handleError(e);
		 }  		
	 	 if (result.code == 'executed') {
			 var results = eval("(" + result.jsonExpression + ")");		 $
			 if(results != null){
				 setLocation(results.bl_id, results.fl_id, results.rm_id, results.site_id);
				 checkSLA();		
			 }
		} else {
			Workflow.handleError(result);
		}
	} else {
		alert(getMessage("noRequestor"));
	}		 
}

function checkDateAndTimeRequired(datePanelId){
	if(!valueExists(datePanelId))
		datePanelId = "datePanel";
	
	var datePanel = View.panels.get(datePanelId);
	
	if(datePanel.getFieldValue("activity_log.date_required") != ''){
		$("specificTime").checked = true;
		datePanel.enableField("activity_log.date_required",true) ;
		datePanel.enableField("activity_log.time_required",true) ;
	}else{
		$("specificTime").checked = false;
		datePanel.enableField("activity_log.date_required",false) ;
		datePanel.enableField("activity_log.time_required",false) ;
	}
}

function selectEquipment(){
	//add eq.warranty_id for 19.2 update
	View.selectValue({
		formId : 'locationPanel',
		title : getMessage('equipment'),
		fieldNames : [ 'activity_log.eq_id', 'activity_log.bl_id', 'activity_log.fl_id', 'activity_log.rm_id' ],
		selectTableName : 'eq',
		selectFieldNames : [ 'eq.eq_id', 'eq.bl_id', 'eq.fl_id', 'eq.rm_id' ],
		visibleFieldNames : [ 'eq.eq_id', 'eq.eq_std', 'eq.warranty_id', 'eq.bl_id', 'eq.fl_id', 'eq.rm_id' ],
		actionListener : onEquipmentChangeField,
		selectValueType : 'grid',
		applyFilter : true,
		showIndex : true
	});
}	

function onCheckSpecificTime(datePanelId, buttonName){
	if(!valueExists(datePanelId))
		alert("the datePanelId is invalid!");
	
	if(!valueExists(buttonName))
		buttonName = "priorities";
	
	var radioButtons = document.getElementsByName(buttonName);
	var datePanel = View.panels.get(datePanelId);
	
	if(document.getElementById("specificTime").checked){
		for (var i=0; i<radioButtons.length;i++){
			radioButtons[i].disabled = true;
		}
		datePanel.enableField("activity_log.date_required",true) ;
		datePanel.enableField("activity_log.time_required",true) ;
	} else {
		for (var i=0; i<radioButtons.length;i++){
			radioButtons[i].disabled = false;
		}
		datePanel.enableField("activity_log.date_required",false) ;
		datePanel.enableField("activity_log.time_required",false) ;
	}
}


function onChangeTimeRequired(datePanelId){
	
	if (datePanelId == null || datePanelId == undefined){
		datePanelId = "datePanel";
	}
	
	var datePanel = View.panels.get(datePanelId);
	
	if(datePanel.getFieldValue("activity_log.date_required") == ''){
		var today = new Date();
		var date = FormattingDate(today.getDate(),today.getMonth()+1,today.getFullYear(),strDateShortPattern);
		datePanel.setFieldValue('activity_log.date_required',date);
	}
	
	if($('default').innerHTML == ''){
		var ord_seq = $("afm_sla_config.ordering_seq").value;

		var record = ABHDC_getDataRecord2(datePanel);
		
		try {
			var result = Workflow.callMethod('AbBldgOpsHelpDesk-SLAService-determinePriority', record,ord_seq);
		}catch(e){
			Workflow.handleError(e);
		}
		afterDeterminePriority(result);
	}
}

function afterDeterminePriority(result){
	if(result.code == 'executed'){
		var res = eval ('(' + result.jsonExpression + ')');
		if(res.possible > 0){
			var p = res.priority;
		 	SLA_setPriority("requestPanel", "descriptionPanel", p, "priorities");
		} else if (res.possible < 0){ //invalid SLA
		 	
		} else {//date in the past
			//TODO: is this always true????, should be checked earlier !!!!!
			alert(getMessage("impossibleDate"));		 	
		}
	} else {
		Workflow.handleError(result);
	}
}

function onChangeDateRequired(panelId,buttonName){
	var datePanel = View.panels.get('datePanel');
	
	if(datePanel.getFieldValue("activity_log.date_required") == ''){
		View.showMessage(getMessage('dateIsRequired'));
		return;
	}
	
	var panel = null;
	
	if(!valueExists(panelId)){
		panelId = "requestPanel";
	}
	
	if(!valueExists(buttonName)){
		buttonName = "priorities";
	}
	
	panel = View.panels.get(panelId);
	
	var radioButtons = document.getElementsByName(buttonName);
	
	if(radioButtons.length > 1){	
		var ord_seq = document.getElementById("afm_sla_config.ordering_seq").value;
		if(ord_seq > 0){
			
			var record = ABHDC_getDataRecord2(panel);
			
			try {
				var result = Workflow.callMethod('AbBldgOpsHelpDesk-SLAService-determinePriority', record,ord_seq);
			}catch(e){
				Workflow.handleError(e);
			}
			afterDeterminePriority(result);
		}
	}
}

function onEquipmentChangeField(fieldName,selectedValue,previousValue){
	
	
	if(fieldName == 'activity_log.eq_id'){
		var panel = View.panels.get("equipmentPanel");
		panel.setFieldValue(fieldName,selectedValue);
		onEqIdChange();
	}else{
		var panel = View.panels.get("locationPanel");
		if (panel.getFieldValue(fieldName) != selectedValue ) {
			panel.setFieldValue(fieldName,selectedValue);
			if(fieldName == 'activity_log.bl_id'){
				var restriction = new Ab.view.Restriction();
				restriction.addClause('bl.bl_id',selectedValue, '=');
				var blRecords = View.dataSources.get('siteQueryDS').getRecords(restriction);
				if(blRecords.length>0){
					panel.setFieldValue('activity_log.site_id',blRecords[0].getValue('bl.site_id'));
				}
			}
			var El = document.getElementById("same");
			if (El != null && El != undefined)
				El.checked = false;
		}
		//'activity_log.bl_id','activity_log.fl_id','activity_log.rm_id'
	}
	
	checkSLA();
	
	return true;
}
/*
function onChangeField(fieldName,selectedValue,previousValue){
	//alert("--> 1 ");
	//var panel = View.panels.get("equipmentPanel");
	//panel.setFieldValue(fieldName,selectedValue);
	document.getElementById(fieldName).value = selectedValue;
	//checkSLA();
	return true;
}
*/

function onChangeRequestor(fieldName,selectedValue,previousValue){
	//if(fieldName != undefined)	
	//	document.getElementById(fieldName).value = selectedValue;
	var panel = View.panels.get("requestPanel");
	
	panel.setFieldValue(fieldName,selectedValue);
	
	setRequestorInfo();
	if(document.getElementById("same").checked){
		document.getElementById("same").checked = false;
	} 
	
	checkSLA();
	return true;
}

function setLocation(building, floor, room, site) {
	var panel = View.panels.get("locationPanel");
	panel.setFieldValue("activity_log.site_id",site);
	panel.setFieldValue("activity_log.bl_id",building);
	panel.setFieldValue("activity_log.fl_id",floor);
	panel.setFieldValue("activity_log.rm_id",room);
}

function clearInvalidHtmlField(id){
    var fieldInputTd = $(id).parentNode;
    Ext.fly(fieldInputTd).removeClass('formErrorInput');
    
    // remove per-field error messages
    var errorTextElements = Ext.query('.formErrorText', fieldInputTd);
    for (var e = 0; e < errorTextElements.length; e++) {
        fieldInputTd.removeChild(errorTextElements[e]);
    }
}

/**
 * event handler for button Review Warranty Details
 * open the details panels as a pop-up window
 */
function onReviewWarrantyDetails(){
    var form = View.panels.get('equipmentPanel');
	//get the equipment code
    var eqId = form.getFieldValue('activity_log.eq_id');
	//if equipment code is not null open the details panel as a pop up window
    if (eqId) {
        var restriction = new Ab.view.Restriction();
        restriction.addClause('eq.eq_id', eqId, '=');
        var detailsPanel = View.panels.get('eq_warranty_grid');
        detailsPanel.show(true);
        detailsPanel.refresh(restriction);
        detailsPanel.showInWindow({
            width: 800,
            height: 300
        });
    }
}

/**
 * event handler for onchange event for field activity_log.eq_id
 * show related warranty information
 */
function onEqIdChange(){
	var form = View.panels.get('equipmentPanel');
	//get the equipment code
	var eqId = form.getFieldValue('activity_log.eq_id');
	
	//get the related warranty vendor and warranty expiration date
	var restriction = new Ab.view.Restriction();
	restriction.addClause('eq.eq_id',eqId,'=');
	var ds = View.dataSources.get('ds_eq_warranty_grid');
	var record =  ds.processOutboundRecord(ds.getRecord(restriction));
	var warVendor = record.getValue('warranty.war_vendor');
	var warExpDate = record.getValue('warranty.date_expiration');
	var isexpiration = record.getValue('eq.isexpiration');
	
	//set the field warVendor
	if(warVendor){
		form.setFieldValue('warVendor',warVendor);
	}else{
		form.setFieldValue('warVendor','');
	}
	//set the field warExpDate
	if(warExpDate){
		form.setFieldValue('warExpDate',warExpDate);
		//If the warranty.date_expiration is earlier than today set text color to red
		if(isexpiration=='true'){
			form.getFieldElement('warExpDate' + '_short', 'Show').style.color = 'Red';
		}
		//If the warranty.date_expiration is not earlier than today set text color to black
		if(isexpiration=='false'){
			form.getFieldElement('warExpDate' + '_short', 'Show').style.color = 'Black';
		}
		
	}else{
		form.setFieldValue('warExpDate','');
	}
}

function afterSelectProblemType(fieldName, newValue, oldValue){
	$("activity_log.prob_type").value = newValue;
	checkSLA();
	//IFM Added
	var form = View.panels.get("descriptionPanel");
	if(valueExistsNotEmpty(newValue)){
		var ptRec = getProblemTypeRecord(newValue);
		if (valueExists(ptRec)){
			var acId = ptRec.getValue('probtype.ac_id');
			form.setFieldValue('activity_log.ac_id', acId);
			
		}
		
	}
}


/**
 * Action Listener after select Problem description field.
 */
function afterSelectPd(fieldName, selectedValue, previousValue) {
	var form = View.panels.get('descriptionPanel');
	form.setFieldValue('activity_log.description', previousValue + selectedValue);
	return false;
}

/**
 * IFM Added to show / hide cc_id field
 */
function onCheckDeptReq(){
	var descp = View.panels.get("descriptionPanel");
	var e = descp.getFieldCell('activity_log.cc_id');
	
	if ($("deptreq").checked){
		descp.enableField('activity_log.cc_id', true);
		e.required="true";
		//e.hidden="false";
		//e.style.display="block"
	}else{
		descp.enableField('activity_log.cc_id', false);
		descp.setFieldValue("activity_log.cc_id", '');
		e.required="false";
		//e.hidden="true";
		//e.style.display="none"
	}
}

/**
 * IFM Added to check if cc_id is entered
 * @returns {Boolean}
 */
function checkCCId(){
	var descp =View.panels.get("descriptionPanel");
	var e=descp.getFieldCell('activity_log.cc_id');
	var ccId = descp.getFieldValue('activity_log.cc_id');
	
	if ($("deptreq").checked && ccId.length<1){				
		return false;
	}else{
		return true;
	}
}

/**
 * IFM Added to get ac_id for problem type
 * Get probtype record.
 * @param prob_type code
 * @returns record object
 */
function getProblemTypeRecord(pt){
	var params = {
			tableName: 'probtype',
			fieldNames: toJSON(['probtype.prob_type', 'probtype.ac_id']),
			restriction: toJSON({
				'probtype.prob_type': pt
			})
	};
	try {
		var result = Workflow.call('AbCommonResources-getDataRecord', params);
		if (result.code == 'executed') {
			return result.dataSet;
		} 
	} catch (e) {
		Workflow.handleError(e);
	}
}

/**
 * IFM Added to save NotifyOHS checkbox value
 */
function onChangeNotifyOHS(){
	
	if (jQuery('#notifyohs')[0].checked){
		sessionStorage.notifyOHS='1';
	}else{
		sessionStorage.notifyOHS='0';
	}
	
}
