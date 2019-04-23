var controller = View.createController('abOnDemandCfWrUpdateController',{
	woRecords : {},
	
	afterViewLoad: function(){
		//KB3044152 - Performance issue - use WFR to get workflow substitutes and avoid sub query 
		var cfWorkflowSubstitutes = Workflow.callMethod('AbBldgOpsHelpDesk-RequestsService-getWorkflowSubstitutes','cf_id').message;
		this.wo_report.addParameter('cfWorkflowSubstitutes', cfWorkflowSubstitutes);
		this.wr_report.addParameter('cfWorkflowSubstitutes', cfWorkflowSubstitutes);
		this.hold_email_templates = {"ha":"ISSUED HOLD ON ACCESS_HA","hp":"ISSUED HOLD ON PARTS_HP","hl":"ISSUED HOLD ON LABOR_HL"};
	},

	    /**
     * After initial data fetch. Show relevant panel.
     */	
	afterInitialDataFetch: function(){
		//IFM - Call listener to set Invoice Fields to read-only
		this.InitInvoiceFieldsListener();
		
	},
	
	wo_report_afterRefresh: function(){
		if(parseInt(View.activityParameters['AbBldgOpsHelpDesk-SubstituteRecordColor']) != 0){
			this.wo_report.selectAll(true);
			var wo_rows = this.wo_report.getPrimaryKeysForSelectedRows();
			
			//KB3036931 - only call WFR when the grid is not empty
			if(wo_rows.length>0){
				var result = {};
				try {
					 result = Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-checkWoCfSubstitutes',wo_rows);
				} catch (e) {
					Workflow.handleError(e);
				}
				if(result.code == 'executed'){
					this.woRecords = eval('('+result.jsonExpression+')');
					
					this.wo_report.gridRows.each(function(row) {
						
						// get wr.status for this row
						var woId = row.getRecord().getValue('wo.wo_id');
						for(var j=0;j<controller.woRecords.length;j++){
							if(controller.woRecords[j] == woId){
								color = View.activityParameters['AbBldgOpsHelpDesk-SubstituteRecordColor'];
								Ext.get(row.dom).setStyle('background-color', color);
								break;
							}
						}
					});
					
					
				} else {
					Workflow.handleError(result);
				}
				//IFM added for hold button
				this.showActionBarActions();
			}		
			
			var instructions = "<span style='background-color:"+View.activityParameters['AbBldgOpsHelpDesk-SubstituteRecordColor']+"'>"+getMessage("substituteLegend")+"</span>";
			this.wo_report.setInstructions(instructions);
			this.wo_report.selectAll(false);
			//var wo_gp = document.getElementById("wo_report");
			//wo_gp.style.maxHeight="15%";
			//var wr_gp=document.getElementById("wr_report");
			//wr_gp.style.minHeight="250px";		
			
			
		}
		this.highlightWORec();
	},
	highlightWORec : function() {
		this.wo_report.gridRows.each(function(row) {
			var lateCount = row.getRecord().getValue('wo.late_count');
			
			
			row.cells.get("wo.wo_id").dom.style.textAlign="left";
			if(lateCount>0){
				 
				
				Ext.get(row.dom).setStyle('color', '#FF4500');
				row.dom.bgColor='#FF5555';
			}
				
			
		});
	},
	
	requestdetailsPanel_beforeRefresh: function(){
		this.costPanel.show(false);
		this.cfPanel.show(false);
		this.hiddenPanel.show(false);
	},
	
	wr_report_afterRefresh: function(){
		this.highlightRequest();
		this.costPanel.show(false);
		this.cfPanel.show(false);
		//hidden
		this.hiddenPanel.show(false);
		this.requestdetailsPanel.show(false);
		this.requestdetailsPanel.hidden=true;
		caiPanel_afterRefresh();
		holdPanel_afterRefresh();
		var wr_gp=document.getElementById("wr_report");
		wr_gp.style.minHeight="250px";
	},
	
	
	requestdetailsPanel_afterRefresh: function(){
		//Set Invoice and Purchase Order fields to read-only
		var cc=document.getElementById("closeButton");
		if (cc !=null){
			cc.click();
			View.closeDialog();
		}
		this.disableActionButtons();
		//
		var p = View.panels.get("requestdetailsPanel");
		var wrId = p.getFieldElement("wr.wr_id").value;
		//change to readonly-editable depending on the 
		updateInvoicePoFields();
		
		//
		var dd= View.panels.get("requestdetailsPanel").getFieldCell("wr.cost_total");
		sessionStorage["wr.wr_id"]=wrId;
		var btn = document.getElementById("addCostButtonId");
		
		if (btn==undefined){
			var line2 = document.createElement('hr');
			var dp = document.getElementById('requestdetailsPanel');
			btn = document.createElement('input');
			btn.type = "button";
			btn.className = "btn";
			btn.value = 'Add Cost Total';
			btn.view = View;
			btn.wrid = wrId;
			btn.controller = this;
			btn.id = 'addCostButtonId';
			btn.setAttribute("style", ' font-size: 14px; box-shadow: 1px 1px 4px; padding: 4px 9px; font-family: "PT Sans",Verdana,Arial,Helvetica,sans-serif; border: 1px solid #c9d2df;');
			//window.wrDetailsPanel =View.panels.get("requestdetailsPanel"); 
			btn.onclick = (function() {return function() {
				//IFM Added to save the work request details form
				controller.requestdetailsPanel_onUpdate();
				var k=0;
				k +=1;
				var rest = new Ab.view.Restriction();
				rest.addClause("wr_other.wr_id", sessionStorage["wr.wr_id"], "=");
				//openDialog: function(url, restriction, newRecord, x, y, width, height) 
				//this.view.openDialog("ab-ifm-wrother.axvw",rest,true,null,null,null,null );
				this.view.openDialog("ab-ifm-wrother.axvw");
				
			
			}})();
			
			dd.appendChild(btn);
			//dp.append(line2);
			
		}
		
		
		this.displayPanels();
		var status = this.requestdetailsPanel.getFieldValue("wr.status");
		this.createStatusSelectList(status);
		var selectElement = document.getElementById("selectStatus");	
		
		if(selectElement.disabled == true){
			this.requestdetailsPanel.actions.get("update").show(false);
		}
		// ER 11/29/11: Turn action back on for next requests
		else{
			this.requestdetailsPanel.actions.get("update").show(true);
			
		}
	},
	
	displayPanels: function(){
		var record = this.requestdetailsPanel.getRecord();
		
		this.costPanel.setRecord(record);
		this.cfPanel.setRecord(record);
		
		this.costPanel.show(false);
		this.cfPanel.show(false);
		//hidden
		this.hiddenPanel.show(false);
	},
	/**
	 * disables action buttons if no wr selected under wr_report panel
	 */
	disableActionButtons: function(){
		var p = View.panels.get("wr_report");
		var selected_array=this.getSelectedWrIdObjects();
		if (selected_array.length>0){
			for(var k=0; k<p.actionbar.actions.items.length; k++){
				p.actionbar.actions.items[k].enabled=true;
			}
			return;
		}
		for(var k=0; k<p.actionbar.actions.items.length; k++){
			p.actionbar.actions.items[k].enabled=false;
		}
		
	},
	/**
	 * Create selection list for status depending on the current work request status<br />
	 * Called by <a href='#user_form_onload' target='main'>user_form_onload</a><br />
	 * Possible values:
	 * <ul>
	 * 		<li>Issued and In Process: not for I, Com, S</li>
	 * 		<li>On Hold for Parts: not for HP, Com, S</li>
	 * 		<li>On Hold for Access: not for HA, Com, S</li>
	 * 		<li>On Hold for Labor: not for HL, Com, S</li>
	 * 		<li>Stopped: not for S</li>
	 * 		<li>Completed: not for Com</li>
	 * </ul>
	 * @param {String} status current work request status
	 */
	createStatusSelectList: function(status){
		document.getElementById("selectStatus").disabled = false;
	
		var states = [];
		var statusList = this.hiddenPanel.getFieldElement("wr.status");
		 
		for(var i = 0; i < statusList.length; i++){
			var value = statusList.options[i].value;
			var text = statusList.options[i].text;
			//IFM  replace Com (Completed) with Cai (Completed awaiting invoice ) 02-06-2017 
			if(value =='I'||value == 'HP'||value=='HA'||value=='HL'||value=='S'|| value=='Cai'){
				states.push({"value":value, "text":text});
			}
		}
	
		var selectElement = document.getElementById("selectStatus");	
		//IFM  Mehran added Cai 02-06-2017
		if(status =='I'||status == 'HP'||status=='HA'||status=='HL' || status == 'Cai' ){
			for(var i=0;i<states.length;i++){ 
				var option = new Option(states[i].text, states[i].value);
				selectElement.options[i] = option;
				if(status == states[i].value){
					selectElement.selectedIndex = i;
				}
			}
		}
		//disable for status select for S or Com 
		if(status=='Com' || status=='S'){
			for(var i=0;i<states.length;i++){ 
				if(status == states[i].value){
					selectElement.options[0] = new Option(states[i].text, states[i].value);
					selectElement.disabled = true;
				}
			}
		}
		if(selectElement.options.length==0){
			selectElement.disabled = true;
		}
		this.showActionBarActions();
	},
	
	/**
	 * Update Work Request, including status<br />
	 * Calls WFR <a href='../../javadoc/com/archibus/eventhandler/ondemandwork/WorkRequestHandler.html#updateWorkRequestStatus(com.archibus.jobmanager.EventHandlerContext)' target='main'>AbBldgOpsOnDemandWork-updateWorkRequestStatus</a>
	 * and reloads tab
	 * @param {String} form name of current form
	 */
	requestdetailsPanel_onUpdate: function(){
		var status = document.getElementById("selectStatus").value;
		var record = ABODC_getDataRecord2(this.requestdetailsPanel);
		var wr_id = this.requestdetailsPanel.getFieldValue("wr.wr_id");
		
		//IFM added fixes
		delete record["activity_log.date_required"];
		delete record["activity_log.time_required"];
		delete record["bl.name"];
		
		var result = {};
	    try {		
			 result = Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-updateWorkRequestStatus', 'wr','wr_id',wr_id,record,status);
	     } 
   		catch (e) {
		Workflow.handleError(e);
 		}
	    if(result.code == 'executed'){
			this.requestdetailsPanel.refresh();
			this.wr_report.refresh();
			this.wr_report.show(true);
			this.requestdetailsPanel.show(true);
			//ABHDC_getTabsSharedParameters()["refresh_from_ab_helpdesk_cf_workrequest_select"] = true; 
			this.showQuickPanel('popup', this.popupPanel, 500, 150, "Successfuly Updated Work Request "+wr_id);
			setTimeout(popUpTimeOut, 2000); //1000 ms = 1 second
		} else {
		 	Workflow.handleError(result);
		}
	},
	
	InitInvoiceFieldsListener: function(){
		
		var po_input=this.requestdetailsPanel.getFieldElement("wr.po_no");
		var invoice_no_input=this.requestdetailsPanel.getFieldElement("wr.invoice_no");
		
		
		if (po_input !==null){//IFM fix for null condition
			po_input.addEventListener('input', function(evt){
				//controller.requestdetailsPanel_afterRefresh();
				updateInvoicePoFields();
			});
		}
		
		if (invoice_no_input !==null){
			invoice_no_input.addEventListener('input', function(evt){
				//controller.requestdetailsPanel_afterRefresh();
				updateInvoicePoFields();
			});
		}
		//IFM added for hold button
		this.wo_report.addEventListener('input', function(evt){
				controller.showActionBarActions();
			});
	},
	/**
	 * Show common actions.
	 */
	showActionBarActions : function() {
		//hide all actins first
		this.wr_report.actionbar.actions.each(function(action) {
			action.show(false);
		});

		//get common actions for selected rows
		var enabledActions = [];
		enabledActions = this.getCommonActionsForSelectedRows();

		//show all common actions in action bar
		for ( var i = 0; i < enabledActions.length; i++) {
			
			var actionName = enabledActions[i];
			
			//bulk approval just need comments field, so replace review with approval,
			actionName = actionName.replace('review', 'approval');
			
			var action = this.wr_report.actionbar.getAction(actionName);
			action.show(true);
			action.forceDisable(false);
		}
	},
	/**IFM Added 
	 * Add action to the array
	 * Returns the common actions for all selected rows.
	 */
	getCommonActionsForSelectedRows : function() {
		var commonActions = ['hold','Cai', 'completeSelected'];
		
		return commonActions;
	},
	
	/**
	 * Show panel as quick window
	 */
	showQuickPanel : function(action, panel, width, height, title) {
		//panel config
		if (this.wr_report.getSelectedRecords().length <1  &&(title==null || title.indexOf('Success')<0) ){
			View.showMessage("Please select at least one work request");
			return;
		}
		var panelConfig = {
			modal : true,
			//anchor : action.button ? action.button.dom : action.el.dom,
			width : width,
			height : height
		};
		
		//reset title
		if(title){
			
			panelConfig.title = title;
			
		}
		if (panel.fields !=undefined && panel.record !=undefined  ){
			//populate the panel form if record is defined for all the form fields
			if (panel.fields.keys.length>0 && panel.record.values['wr.wr_id']!=undefined){
				for(var k=0; k<panel.fields.keys.length; k++){
					panel.setFieldValue(panel.fields.keys[k], panel.record.values[panel.fields.keys[k]]);
				}
			}
		}
		// show quick panel as pop up
		panel.showInWindow(panelConfig);
		//this.highlightRequest();
	},
	/**IFM Added
	 * Get the wr.wr_id values from selected rows.
	 * saves selected wr record before applying the status update 
	 */
	getSelectedWrIdObjects : function() {
		this.selectedWrRecordsForAction = this.wr_report.getSelectedRecords();
		var records = [];
		for ( var i = 0; i < this.selectedWrRecordsForAction.length; i++) {
			
			var wrId = this.selectedWrRecordsForAction[i].getValue('wr.wr_id');
			var woId = this.selectedWrRecordsForAction[i].getValue('wr.wo_id');
			var status = this.selectedWrRecordsForAction[i].getValue('wr.status');
			
			var estTotalCost = this.selectedWrRecordsForAction[i].getValue('wr.cost_est_total');
			var cai_contractor = this.selectedWrRecordsForAction[i].getValue('wr.cai_contractor');
			var cai_approved_by = this.selectedWrRecordsForAction[i].getValue('wr.cai_approved_by');
			records.push({
				'wr.wr_id' : wrId,
				'wr.wo_id': woId,
				'wr.cost_est_total': estTotalCost,
				'wr.status' : status,
				'wr.cai_approved_by': cai_approved_by,
				'wr.cai_contractor': cai_contractor
			});
		}
		return records;
	},
	
	wr_report_onHold : function(action){
		View.WRrecords = this.getSelectedWrIdObjects();
		
		this.showQuickPanel('hold', this.holdPanel, 500, 250, "Hold Work Request" + ' ' + (action.button ? action.row.getFieldValue('wr.wr_id') : ''));
	},

	wr_report_onCai : function(action){
		View.WRrecords = this.getSelectedWrIdObjects();
		
		this.showQuickPanel('Cai', this.caiPanel, 500, 250, "Completed Awaiting Invoice Work Request" + ' ' + (action.button ? action.row.getFieldValue('wr.wr_id') : ''));
		
		var recs = View.WRrecords // get selected records
		var cp = this.caiPanel;
		var rec = recs[0];
		var wrId = rec['wr.wr_id'];
		var hRest = new Ab.view.Restriction();
		hRest.addClause("wr.wr_id", wrId, "=");
		vals = this.WRCai_DS.getRecord(hRest);
		var  estTotalCost = rec['wr.cost_est_total'].trim();
		estTotalCost = estTotalCost.length < 1 ? "0":estTotalCost;
		estTotalCost = parseFloat(estTotalCost);
		
		var contractor = rec['wr.cai_contractor'].trim();
		var approver = rec['wr.cai_approved_by'].trim();
		this.caiPanel.setFieldValue("wr.cai_contractor", contractor);
		this.caiPanel.setFieldValue("wr.cai_approved_by", approver);
		
		if (estTotalCost > 500) {
			cp.showField('wr.cai_approved_by', true);
		} else {
			cp.showField('wr.cai_approved_by', false);
		}
	},
	//IFM Added
	holdPanel_onHoldYes: function(action){
		// TODO:  API for radio buttons
		var status = '';
		var panels;
		var p;
		var nDate = new Date();
		var curDate = nDate.toISOString();
		var user_id = View.user.name;	
		var	user_email = View.user.email;
		var etp, etps, vals; 
		var radioOptions = document.getElementsByName('holdRadio');
		var records = View.WRrecords // get selected records
		var hp= this.holdPanel;
		var holdEnd = hp.getFieldValue("wr.hold_end");			
		
		if (holdEnd.length <1){
			//this.holdPanel.closeWindow();
			var cause = {"details":"Hold End Date is empty"};
			var e= {"cause": cause, "message":"Please fill up hold end date and resubmit", "description":""};
			//View.showException(e);
			View.showMessage("Please fill up hold end date and resubmit","Please fill up hold end date and resubmit","Hold End Date is empty");
			return;
		}
		
		var hDate = new Date(holdEnd);
		var diff = (hDate - nDate) / (1000*3600);
		if (diff> 30 *24){
			//this.holdPanel.closeWindow();
			//var cause = {"details":"Please contact the Facilities Department if the request cannot be completed within 30 days."};
			//cause["localizedMessage"]="The request cannot be On Hold for more than 30 days.";
			//cause["message"]="The request cannot be On Hold for more than 30 days.";
			//cause["description"]="Please contact the Facilities Department if the request cannot be completed within 30 days.";
			var e= {"cause": cause, "message":"The request cannot be On Hold for more than 30 days.", "description":"Please contact the Facilities Department if the request cannot be completed within 30 days."};
			//View.showException(e, "Please contact the Facilities Department if the request cannot be completed within 30 days.");
			View.showMessage('The request cannot be On Hold for more than 30 days.', "The request cannot be On Hold for more than 30 days.", "Please contact the Facilities Department if the request cannot be completed within 30 days.");
			return;
		}else if(diff < 0){
			View.showMessage('Please enter a valid hold end date.', "Please enter a valid hold end date.", "End date of the hold period can not be in the past.");
			return;
		}

		for(var i=0; i<radioOptions.length; i++){
			if(radioOptions[i].checked == 1){
				status = radioOptions[i].value;
				break;
			}
		} 
		etp  = this.hold_email_templates[status.toLowerCase()];
		etps = "NOTIFICATION_STEP;"+etp+"_SUBJECT;"+etp+"_BODY";
		email = "facilitiesservicedesk@vu.edu.au";
		//email="mehdow@hotmail.com";
		for (var i=0; i<records.length;i++){
			var record = records[i];
			if (record['wr.status']==status){
				continue;
			}
			var wrId = record['wr.wr_id'];
			var hRest = new Ab.view.Restriction();
			hRest.addClause("wr.wr_id", wrId, "=");
			vals = this.WRHold_DS.getRecord(hRest);
			
			vals.setValue("wr.hold_end",holdEnd)
			vals.setValue("wr.hold_date",curDate);
			
			delete record["activity_log.date_required"];
			delete record["activity_log.time_required"];
			delete record["bl.name"];

			this.WRHold_DS.saveRecord(vals);//save vals
			
			record["values"]={};//ifmSendEmail expects a values json object even if empty 
			
			try{
				//*
				Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-ifmSendEmail', 
									wrId,
									etps,
									record,email,user_id);//*/									
			}catch(e){
				Workflow.handleError(e);
			}		
		}
		this.updateWorkRequestStatusForRecords(status);
		this.holdPanel.closeWindow();
		//View.refreshPanels(null, this.abOnDemandCfWrUpdateController);
	},

	/**
	 * IFM Mehran added for CAI status 
	 */
	caiPanel_onCaiYes: function(action){
		var nDate = new Date();
		var curDate = nDate.toISOString();
		var records = View.WRrecords // get selected records
		var record = records[0];
		var cp = this.caiPanel;
		var tpRest = new Ab.view.Restriction();
		var tpRec, email, cfid, cfapprover;
		var wrcfRecs, wrcfRest, vals;
		cfid = cp.getFieldValue("wr.cai_contractor").trim();
		cfapprover = cp.getFieldValue("wr.cai_approved_by").trim();

		if (cfid.length < 1){
			var cause = {"details":"Please enter a person's name into the CAI Contractor field."};
			var e= {"cause": cause, "message":"Please enter a person's name into the CAI Contractor field.", "description":""};
			View.showException(e);
			//this.caiPanel.closeWindow();
			return;
		}

		if (cfapprover.length < 1 && this.wr_report.getSelectedRecords()[0].getValue('wr.cost_est_total') > 500) {
			var cause = {"details":"Please select a Tradesperson in the CAI Approved By field."};
			var e= {"cause": cause, "message":"Please select a Tradesperson in the CAI Approved By field.", "description":""};
			View.showException(e);
			return;
		}
		
		tpRest.addClause("cf.cf_id", cfapprover,"=" );
		tpRest.addClause("cf.is_approver", "1" ,"=" );
		tpRec = this.tpEmailDS.getRecord(tpRest);
		//IFM FIX 05-03-2019 Added check for invalid cf_id on cai_approved_by field
		if (jQuery.isEmptyObject(tpRec.values) && this.wr_report.getSelectedRecords()[0].getValue('wr.cost_est_total') > 500) {
			var cause = {"details":"The Tradesperson entered into the CAI Approved By field does NOT have authority to approve payments. Please select a Tradesperson from 'Select Values' list."};
			var e= {"cause": cause, "message":"Please Select a Tradesperson from Select Values list.", "description":""};
			View.showException(e);
			//this.caiPanel.closeWindow();
			return;
		}
		
		email = tpRec.getValue("cf.email");
		tpRec.setValue("approverName",tpRec.getValue("cf.name"));
		tpRec.setValue("userName",View.user.name);
		
		//Email loop to send email for more than 500
		for (var i=0; i<records.length;i++){
			var record = records[i];
			delete record["activity_log.date_required"];
			delete record["activity_log.time_required"];
			delete record["bl.name"];
		
			var wrId = record['wr.wr_id'];
			if (record['wr.status']=='Cai'){
				continue;
			}
			
			var hRest = new Ab.view.Restriction();
			hRest.addClause("wr.wr_id", wrId, "=");
			vals = this.WRCai_DS.getRecord(hRest);
			var  estTotalCost = record['wr.cost_est_total'].trim();
			estTotalCost = estTotalCost.length <1 ? "0":estTotalCost;
			estTotalCost = parseFloat(estTotalCost);
			
			
			vals.setValue("wr.cai_user", View.user.name);
			vals.setValue("wr.cai_date",curDate);
			vals.setValue("wr.cai_contractor",cfid);
			vals.setValue("wr.cai_approved_by",cfapprover);//WRCai_DS 
			this.WRCai_DS.saveRecord(vals);//save vals

			if(estTotalCost <= 500){
				continue;
			}
			var tpNames="";
			var tpCfIds ="";
			
			wrcfRest = new Ab.view.Restriction();
			wrcfRest.addClause("wrcf.wr_id", wrId, "=");
			wrcfRecs = this.WRCFDS.getRecords(wrcfRest);
			
			
			for (var j=0;j<wrcfRecs.length; j++){
				tpNames += "; "+wrcfRecs[j].getValue("cf.name");
				tpCfIds += "; "+wrcfRecs[j].getValue("wrcf.cf_id");
			}
			if(wrcfRecs.length>0){
				tpNames = tpNames.replace("; ","");
				tpCfIds = tpCfIds.replace("; ","");
			}
			
			tpRec.setValue("contractorNames",tpNames);
			tpRec.setValue("contractorIds",tpCfIds);

			//final String wrId, final String emailTemplates, final JSONObject record, final String emailAddr, final String cfId 
			//NOTIFY_APPROVER_CAI_WFR
			try{
				//*
				Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-ifmSendEmail', 
									wrId,
									"NOTIFY_APPROVER_CAI_WFR;NOTIFY_APPROVER_CAI_TITLE;NOTIFY_APPROVER_CAI_BODY",
									tpRec,email,cfid);//*/
			}catch(e){
				Workflow.handleError(e);
			}
			
		}
		this.updateWorkRequestStatusForRecords('Cai');			
		this.caiPanel.closeWindow();
	},
	 /**IFM Added
     * Update work request status for records.
     */	
	updateWorkRequestStatusForRecords: function(status){
		var records = View.WRrecords;
		for(var i=0; i<records.length; i++){
			var record = records[i];
			var wrId = record['wr.wr_id'];
			var record = {'wr.wr_id': wrId, 'wr.activity_type': 'SERVICE DESK - MAINTENANCE'};
			
			var result = {};
			try {
				if (record['wr.status']==status){//donot update if already in the new status is the same as before
					continue;
				}
//				if(!status.includes('Com'))
				result = Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-updateWorkRequestStatus', 'wr','wr_id',wrId,record,status);
			} catch (e) {
				Workflow.handleError(e);
			}
		}
		
		//KB3041584  - just need one refresh for bulk update
		var wrFilter = View.controllers.get('wrFilter');
		if (wrFilter) {
			wrFilter.wrFilter_onFilter();
		}
		
		this.wr_report.refresh();
		this.requestdetailsPanel.refresh();
		this.wr_report.show(true);
		this.requestdetailsPanel.show(true);
	},
	
	/**
	 * IFM Mehran added for highlighting Emergency requests 08-11-16
	 * Highlight the emergency request in orange-color.
	 */
	highlightRequest : function(record) {
		this.wr_report.gridRows.each(function(row) {
			var action_by = row.getRecord().getValue('wr.action_by');
			var wrd, dmy, da, tm, pm, hr ;
			row.cells.get("wr.wr_id").dom.style.textAlign="left";
			if(action_by.length>0){
				pm = action_by.lastIndexOf("PM")>1;
				
				dmy = action_by.split(" ")[0];
				tm = action_by.split(" ")[1];
				hr = parseInt(tm.trim().split(":")[0]);
				if (pm){
					hr +=12;
				}
				
				da = dmy.split("/");
				if (da.length <3){
					return;
				}
				wrd=new Date(da[2]+"-"+da[1]+"-"+da[0]);
			} else{
				return;
			}
			var curd = new Date();
			
			if (curd>wrd) {
				Ext.get(row.dom).setStyle('color', '#FF4500');
				row.dom.bgColor='#FF5555'
			}
		});
	},
	/**
	*IFM added to auto save the wr details form panel if wr_id is the same as the selected
	**/
	wrDetailsSave: function(){
		var record = ABODC_getDataRecord2(this.requestdetailsPanel);
		var wrId = this.requestdetailsPanel.getFieldValue("wr.wr_id");
		var dp = this.requestdetailsPanel;
		var ds=this.detailDS;
		var fk;
		//IFM added fixes
		//delete record["activity_log.date_required"];
		//delete record["activity_log.time_required"];
		//delete record["bl.name"];
		//delete record["wr.status"];
		//dp.save();
		var hRest = new Ab.view.Restriction();
		hRest.addClause("wr.wr_id", wrId, "=");
		vals = ds.getRecord(hRest);
		
		for(var k=0; k<dp.fields.keys.length; k++){
			fk = dp.fields.keys[k];
			if (fk.indexOf('wr.')<0 || fk=='wr.status'){
				delete vals.values[fk];
				continue;
			}
			vals.values[fk]=record[fk];			
		}
			
		ds.saveRecord(vals);
		
	},
	/**
	 * Generates a warning popup panel if cost_total> 0 and both po_no and invoice no are empty 
	 * or when cost_total>0, inv_no not empty and inv file is empty
	 * Note This reads from wr db rec and not from panel so beaware to update the form before  
	 */
	wr_report_onCompleteSelected: function(){
		//this.wrDetailsSave(); //update the selected wr before 		
		View.WRrecords = this.getSelectedWrIdObjects();//used by update status
		
		var recs =  this.wr_report.getSelectedRecords();
		//*
		if (recs.length <1 && View.panels.get("hiddenPanel").hidden){
			View.showMessage("Please select at least one work request");
			return;		
		}//*/
		var rec, invno, invfile, wrcost, po_no, tcwcond, invwcond, invdate, powcond;
		var qp, msg;
		for (var k=0; k<recs.length;k++){
			rec=recs[k];
			invno = rec.getValue("wr.invoice_no").trim();
			invfile = rec.getValue("wr.invoice_file_name").trim();
			wrcost = rec.getValue("wr.cost_total").trim();
			qp=View.panels.get("completeSelectedPanel");
			po_no = rec.getValue("wr.po_no").trim();
			invdate = rec.getValue("wr.invoice_date");
			
			tcwcond =(wrcost.length>0 )&&(invno.length<1)&& (po_no.length<1) ;
			invwcond = (wrcost.length>0 )&& (invno.length>0) && (invfile.length<1);
			
			qp.record = rec;
			if ( tcwcond || invwcond){
				
				//qp.config.instructions = "No invoice has be provided, no payment will go through";
				this.showQuickPanel('completeSelected', this.completeSelectedPanel, 500, 250, "Complete Selected Work Request" + ' ' +  rec.getValue('wr.wr_id'));
				break;
				
			} else {
				//qp.config.instructions = "Payment will go through";
				//this.showQuickPanel('completeSelected', this.completeSelectedPanel, 500, 250, "Complete Selected Work Request" + ' ' +  rec.getValue('wr.wr_id'));
				this.updateWorkRequestStatusForRecords('Com');
			}
		}
		
	},
	
	/**
	 * 
	 */
	completeSelectedPanel_onCsYes: function(action){
		this.updateWorkRequestStatusForRecords('Com');
		this.completeSelectedPanel.closeWindow();
	}
});

function selectAllRecords() {
	var grid = AFM.view.View.getControl('', 'wr_report');
	var selectedRows = grid.setAllRowsSelected();
}

function unselectAllRecords() {
	var grid = AFM.view.View.getControl('', 'wr_report');
	var unselectedRows = grid.setAllRowsSelected(false);
}

function caiPanel_afterRefresh() {
		var nDate = new Date();
		var name = View.user.name;		
		controller.caiPanel.setFieldValue("wr.cai_user", name);
		controller.caiPanel.setFieldValue("wr.cai_date", nDate);
}

function holdPanel_afterRefresh() 
	{
		var nDate = new Date();
		var name = View.user.name;		
		controller.holdPanel.setFieldValue("wr.hold_date", nDate);
		//controller.holdPanel.setFieldValue("wr.cai_date", nDate);
}
	
function popUpTimeOut() {
	View.panels.get("popupPanel").closeWindow();
    //window.location = "Your redirect URL";
}	

function updateInvoicePoFields(){
	
	var p = View.panels.get("requestdetailsPanel");
	var poNOField=p.getFieldElement("wr.po_no");
	var invoice_no_input=p.getFieldElement("wr.invoice_no");
	var invoice_date=p.getFieldElement("wr.invoice_date");
	var invoice_file=p.getFieldElement("wr.invoice_file_name");
	var wrId = p.getFieldElement("wr.wr_id").value;
	
	
	var poVal =null;
	if (poNOField !=null){//IFM Added Fix
		poVal = poNOField.value;
		poNOField.readOnly=false;
	}
	var invoiceNumVal = null;
	if (invoice_no_input !=null){//IFM Added Fix
		invoiceNumVal = invoice_no_input.value;
		invoice_no_input.readOnly =false;
	}
	var doc_img;
	
	if (poVal !=null && poVal.length>0 ){
		poNOField.readOnly=false;
		invoice_no_input.readOnly=true;
		invoice_file.readOnly=true;
		invoice_date.readOnly=true;
		doc_img=p.getFieldElement("wr.invoice_file_name_checkInNewDocument");
		doc_img.hidden=true;
		
	}else if(invoiceNumVal !=null && invoiceNumVal.length>0 ){
		poNOField.readOnly=true;
		invoice_no_input.readOnly=false;
		invoice_file.readOnly=false;
		invoice_date.readOnly=false;
		doc_img=p.getFieldElement("wr.invoice_file_name_checkInNewDocument");
		doc_img.hidden=false;
	}	

}