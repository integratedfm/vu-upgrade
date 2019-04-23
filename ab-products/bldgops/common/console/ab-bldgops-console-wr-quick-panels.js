/**
 * Controller for the other quick panels exclude console filter and grid.
 */
View.createController('wrOtherController', {
	
	/**
	 * After initial data fetch.
	 */
	afterInitialDataFetch : function() {
		//if the schema not having rejected_step field, hide Approval form cancel button and make the UI same as v21.3 
		if(!Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-checkSchemaExisting','helpdesk_step_log', 'rejected_step').value){
			this.approvePanel.actions.get('cancel').show(false);
			this.dispatchPanel.actions.get('cancel').show(false);
		}
	},
	
	 /**
     * Forward approval.
     */
	approvePanel_onForwardApproval: function(action){
		var selectedRecords = getSelectedWrRecordsForWFR();
		View.forwardRecords = selectedRecords;
			
		this.forwardForm.setFieldValue('em.em_id','');
		this.forwardForm.showInWindow({
			x : 200,
			y : 200,
			modal : true,
			width : 500,
			height : 200
		});
	}, 
	
    /**
     * Issue a work request.
     */
	issuePanel_onIssueYes: function(action){
		issueWRs(View.WRrecords);	
		this.issuePanel.closeWindow();		
	}, 

    /**
     * Cancel a work request.
     */	
	cancelPanel_onCancelYes: function(action){	
		cancelWRs(View.WRrecords);
		this.cancelPanel.closeWindow();	
	}, 

    /**
     * Hold a work request.
     */				
	holdPanel_onHoldYes: function(action){
		// TODO:  API for radio buttons
		var status = '';
		var radioOptions = document.getElementsByName('holdRadio');
		for(var i=0; i<radioOptions.length; i++){
			if(radioOptions[i].checked == 1){
				status = radioOptions[i].value;
			}
		} 
		this.updateWorkRequestStatusForRecords(status);
		this.holdPanel.closeWindow();		
	}, 

    /**
     * Stop a work request.
     */	
	stopPanel_onStopYes: function(action){
		this.updateWorkRequestStatusForRecords('S');
		this.stopPanel.closeWindow();
	}, 

    /**
     * Complete a work request.
     */	
	completePanel_onCompleteYes: function(action){	
		this.updateWorkRequestStatusForRecords('Com');
		this.completePanel.closeWindow();
	},

	/**
	 * IFM Mehran added for CAI status 02-06-2017 
	 */
	caiIFMPanel_onCaiIFMYes: function(action){
		var nDate = new Date();
		var curDate = nDate.toISOString();
		var wrId= View.WRrecords[0]["wr.wr_id"];
		var test = true;
		var cp = this.caiIFMPanel;
		var vals;
		var wrRest = new Ab.view.Restriction();
		var cfRest = new Ab.view.Restriction();
		var record;
		var estTotalCost;
		
		cp.setFieldValue('wr.wr_id', wrId);
		wrRest.addClause("wr.wr_id", wrId, "="); //set restriction to the first selected wr_id
		
		cp.setFieldValue("wr.cai_date",curDate);
		cp.setFieldValue("wr.cai_user",View.user.name);
		cfid = cp.getFieldValue("wr.cai_contractor").trim();
		cfapprover = cp.getFieldValue("wr.cai_approved_by").trim();
		
		vals = this.caiDS.getRecord(wrRest);
		estTotalCost = vals.getValue('wr.cost_est_total').trim();
		estTotalCost = estTotalCost.length < 1 ? "0":estTotalCost;
		estTotalCost = parseFloat(estTotalCost);
		
		if (cfid.length < 1) {
			var cause = {"details":"Please enter a person's name into the 'CAI Contractor' field."};
			var e = {"cause": cause, "message":"Please enter a person's name into the 'CAI Contractor' field.", "description":""};
			View.showException(e);
			this.caiPanel.closeWindow();
			return;
		}
		
		if (cfapprover.length < 1 && estTotalCost > 500) {
			var cause = {"details":"Please select a Tradesperson in the 'CAI Approved By' field."};
			var e = {"cause": cause, "message":"Please select a Tradesperson in the 'CAI Approved By' field.", "description":""};
			View.showException(e);
			this.caiPanel.closeWindow();
			return;
		}

		var dscf = new Ab.data.createDataSourceForFields({id: 'cf_ds', tableNames: ['cf'], fieldNames: ['cf.cf_id', 'cf.is_approver']});
		cfRest.addClause("cf.cf_id", cfapprover,"=" );
		cfRest.addClause("cf.is_approver", "1" ,"=" );
		var cfRec = dscf.getRecord(cfRest);
		if (jQuery.isEmptyObject(cfRec.values) && estTotalCost > 500) {
			var cause = {"details":"The Tradesperson entered into the 'CAI Approved By' field does NOT have authority to approve payments. Please select a Tradesperson from the 'Select Values' list."};
			var e = {"cause": cause, "message":"Please Select a Tradesperson from the Select Values list.", "description":""};
			View.showException(e);
			this.caiPanel.closeWindow();
			return;
		}
		
		//record = this.caiDS.getRecord(restriction);
		vals.setValue("wr.cai_user", View.user.name);
		vals.setValue("wr.cai_date",curDate);
		vals.setValue("wr.cai_contractor",cfid);
		vals.setValue("wr.cai_approved_by",cfapprover);//WRCai_DS 
		this.caiDS.saveRecord(vals);//Save values using the caiDS dataSource

		//this.updateWorkRequestStatusForRecords('Cai');
		record = {'wr.wr_id': wrId, 'wr.activity_type': 'SERVICE DESK - MAINTENANCE'};//only change status of first record even if more than one selected
		this.updateWorkRequestStatus(wrId, record, 'Cai');
		//IFM Added for refreshing the wrList grid panel		
		var wrl = View.panels.get("wrList");
		wrl.refresh();
		this.caiIFMPanel.closeWindow();
	},
	
	caiIFMPanel_afterRefresh: function(){
		var wrId= View.WRrecords[0]["wr.wr_id"];
		var cp = this.caiIFMPanel;		
		var tpRest = new Ab.view.Restriction();
		tpRest.addClause("wr.wr_id", wrId, "=");//set rest to the first selected wr_id
		var record ;
		var vals = this.caiDS.getRecord(tpRest);
		var  estTotalCost = vals.getValue('wr.cost_est_total').trim();
		estTotalCost = estTotalCost.length < 1 ? "0":estTotalCost;
		estTotalCost = parseFloat(estTotalCost);
		
		if (estTotalCost > 500) {
			form.showField('wr.cai_approved_by', true);
		} else {
			form.showField('wr.cai_approved_by', false);
		}
	},
	
	/**
	 * IFM Mehran added for send quote request status 23-06-2017 
	 */
	ifmRequestQuotePanel_onIfmSendRequestQuoteYes: function(action){
		this.ifmSendRequestQuote();
		this.ifmRequestQuotePanel.closeWindow();
	},

    /**
     * Close a work request.
     */
	closePanel_onCloseYes: function(action){
		if(this.closePanel.closeStopped){
			closeStoppedWRs(View.WRrecords)
		}else{
			closeWRs(View.WRrecords);
		}
			
		this.closePanel.closeWindow();
	},

    /**
     * Update work request status for records.
     */	
	updateWorkRequestStatusForRecords: function(status){
		var records = View.WRrecords;
		for(var i=0; i<records.length; i++){
			var record = records[i];
			var wrId = record['wr.wr_id'];
			var record = {'wr.wr_id': wrId, 'wr.activity_type': 'SERVICE DESK - MAINTENANCE'};
			//KB3046145 - Fill completed_by field
			if (status == 'Com') {
				record['wr.completed_by'] = View.user.employee.id;
			}
			this.updateWorkRequestStatus(wrId, record, status);
		}
		
		//KB3041584  - just need one refresh for bulk update
		var wrFilter = View.controllers.get('wrFilter');
		if (wrFilter) {
			wrFilter.wrFilter_onFilter();
		}		
	},
	
    /**
     * Update the status for a work request.
     */		
	updateWorkRequestStatus: function(wrId, record, status){
		var result = {};
		try {		
			result = Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-updateWorkRequestStatus', 'wr','wr_id',wrId,record,status);
		} catch (e) {
			Workflow.handleError(e);
		}		
	},
	
	/**
	 * IFM Mehran added for sending a quote request 23-06-2017 
	 */
	ifmSendRequestQuote: function(){
		var records = View.WRrecords;
		var record = records[0];
		var wrId = record['wr.wr_id'];
		var record = {'wr.wr_id': wrId, 'wr.activity_type': 'SERVICE DESK - MAINTENANCE'};
		var result = {};
		try {		
			result = Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-ifmSendRequestQuote', wrId);
		} catch (e) {
			Workflow.handleError(e);
		}		
	}
	
});