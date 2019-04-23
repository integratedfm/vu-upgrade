/**
 * Controller for the work request assign.
 */
View.createController('wrAssign', {
    /**
     * When a specific work order is selected  in the 'Assign to Existing Work Request' grid, assign to existing work order 
     * @param row
     * @param action
     */		
	assignWoGrid_assignWo_onClick: function(row, action) {
		var wrRecords = View.getOpenerView().WRrecords;
		var woPanel = View.panels.get('assignWoGrid');
		var woId = woPanel.rows[woPanel.selectedRowIndex]['wo.wo_id'];		
		assignWRs(wrRecords, woId);
	},
	
	/**
	 * IFM Mehran Added on 29-05-2017
	 */
	afterInitialDataFetch: function() {
		var recs = View.getOpenerView().WRrecords;
		var rec = recs[0];
		var wr_id = rec["wr.wr_id"];
		this.wr_id= wr_id;
		
		var parameters = {
				tableName: 'wr',
		        fieldNames: toJSON(['wr.wr_id', 'wr.description', 'wr.tr_id','wr.ac_id', 'wr.bl_id', 'wr.dv_id', 'wr.dp_id']),
		        restriction: toJSON(new Ab.view.Restriction({'wr.wr_id':wr_id}))
			};
			
		var tr_parms = {
				tableName: 'wrtr',
		        fieldNames: toJSON(['wrtr.wr_id', 'wrtr.tr_id']),
		        restriction: toJSON(new Ab.view.Restriction({'wrtr.wr_id':wr_id}))
			};
		
		try {
	        var result = Ab.workflow.Workflow.call('AbCommonResources-getDataRecords', parameters);
			var res2 = Ab.workflow.Workflow.call('AbCommonResources-getDataRecords', tr_parms);
	        if (result.data.records.length == 0){
				View.showMessage(getMessage('Work Request Could Not Be Read From Database, Please Close This Dialog and Reopen It'));
				return false;
			}
	        var rec = result.data.records[0];
			var tr_rec=null;
			if (res2.data.records.length >0){
				tr_rec = res2.data.records[0];
			}	
	        var wop = View.panels.get('createWoForm');
	        
	        wop.setFieldValue("wo.description", rec["wr.description"]);
	        wop.setFieldValue("wo.bl_id", rec["wr.bl_id"]);
	        wop.setFieldValue("wo.dv_id", rec["wr.dv_id"]);
	        wop.setFieldValue("wo.dp_id", rec["wr.dp_id"]);
			if (tr_rec !=null){
				wop.setFieldValue("wo.tr_id", tr_rec["wrtr.tr_id"]);

			}
	        //wop.setFieldValue("costcentre", rec["wr.cc_id"])
	        wop =View.panels.get('issueWoForm');
	        
	        wop.setFieldValue("wo.description", rec["wr.description"]);
	        wop.setFieldValue("wo.bl_id", rec["wr.bl_id"]);
	        wop.setFieldValue("wo.dv_id", rec["wr.dv_id"]);
	        wop.setFieldValue("wo.dp_id", rec["wr.dp_id"]);
			if (tr_rec !=null){
				wop.setFieldValue("wo.tr_id", tr_rec["wrtr.tr_id"]);

			}
	        
	    } catch (e) {
	        Workflow.handleError(e);
			return false;
	    }
				
		
	},

    /**
     * Assign to new work order
     * @param action
     */	
	createWoForm_onCreate: function(action) {
		this.createWo(false);
	},

    /**
     * Assign and issue to work order
     * @param action
     */			
	issueWoForm_onAssignAndIssueWRs: function(action) {
		this.createWo(true);
	},
	
	 /**
     * Assign and issue to work order
     * @param doIssue
     */			
	createWo: function(doIssue) {
		var formId = "createWoForm";
		if(doIssue){
			formId = "issueWoForm";
		}
		var woPanel = View.panels.get(formId);
		var description = woPanel.getFieldValue('wo.description');		
		if (description == "") {
			woPanel.clearValidationResult();
			woPanel.addInvalidField("wo.description", getMessage("noDescription"));
			woPanel.displayValidationResult();
			return;
		}
		
		var record = woPanel.getFieldValues();
		var recs = View.getOpenerView().WRrecords;				
		
		//IFM added to remove fields not in wr table
		var wrRecordPanel = View.panels.get("ifmSaveWRCCForm");
		var wrDetailsFieldVals=wrRecordPanel.getFieldValues();
		wrDetailsFieldVals["wr.wr_id"] = this.wr_id;
		wrDetailsFieldVals["wr.cc_id"] = woPanel.getFieldValue('wo.cc_id');
		var sz = objSize(wrDetailsFieldVals);
		delete record["ifm_costcentre.name"];
		
		if(doIssue){
			this.ifmUpdateWR(this.issueWoForm, recs);  //get the info from the filled up form
			
			if(sz>0){
				result = Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-ifm_Update_WR_Fields', wrDetailsFieldVals);
			}
			assignAndIssueWRs(record, recs);
		}else{
			this.ifmUpdateWR(this.createWoForm, recs); //get the info from the filled up form
			
			if(sz>0){
				result = Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-ifm_Update_WR_Fields', wrDetailsFieldVals);
			}
			createNewWo(record, recs);
		}
		
	},
	/**
	 * IFM Mehran Added on 14-June-2017 
	 * Update wr.cc_id using the added form ifmSaveWRCCForm 
	 */
	ifmUpdateWR: function(pid, recs){
		
		this.ifmSaveWRCCForm.setFieldValue("wr.wr_id", recs[0]["wr.wr_id"]);
		
		var ccid = pid.getFieldValue("wo.cc_id");
		this.ifmSaveWRCCForm.setFieldValue("wr.cc_id", ccid);
		
	}
	
});

function objSize(obj){
	
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
	
}
