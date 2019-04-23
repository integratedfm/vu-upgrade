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

//IFM Added		
//IFM added
		var fccId=null, facId=null;
		var wop = View.panels.get('createWoForm');
		fccId = wop.getFieldValue('wo.cc_id');//already set in afterInitialDataFetch from wr rec
		facId = wop.getFieldValue('wo.ac_id');//already set in afterInitialDataFetch from wr rec
		//IFM Added to get cc_id, ac_id of assigned WRs
		var r;
		var wr_parms = {
				tableName: 'wr',
		        fieldNames: toJSON(['wr.cc_id', 'wr.ac_id']),
		        restriction: toJSON(new Ab.view.Restriction({'wr.wo_id':woId}))
			};
		try{
			r = Ab.workflow.Workflow.call('AbCommonResources-getDataRecords', wr_parms);
			if (r.data.records.length >0){
				
				for(var k=0; k<r.data.records.length; k++){
					var rec = r.data.records[k];
					var ccId = rec['wr.cc_id'].trim();
					
					if (ccId != fccId){
					 	fccId='';
					 	break;
					}
					
				}
				for(var j=0; j<r.data.records.length; j++){
					var rec = r.data.records[j];
					var acId = rec['wr.ac_id'].trim();
					
					if (acId != facId){
					 	facId='';
					 	break;
					}
					
				}
				wop.setFieldValue('wo.cc_id', fccId);
				wop.setFieldValue('wo.ac_id', facId);
				//*
	        	var ifmRec = {};
	        	ifmRec['wo.cc_id']=fccId;
	        	ifmRec['wo.ac_id']=facId;
	        	ifmRec['wo.wo_id']=woId;
	        	var ifmParms = {
	        			tableName: 'wo',
	        			fields: toJSON(ifmRec)
	        	};
	        	var ifmResult = AFM.workflow.Workflow.runRuleAndReturnResult('AbCommonResources-saveRecord', ifmParms);
	     					
			}
			
		}catch (e) {
	        Workflow.handleError(e);
			return;
	    }
		assignWRs(wrRecords, woId);
	},
	
	/**
	 * IFM Mehran Added on 29-05-2017
	 */
	afterInitialDataFetch: function() {
		var recs = View.getOpenerView().WRrecords;
		var rec = recs[0];
		var wr_id = rec["wr.wr_id"];
		var ccId=null, acId=null;
		var tr_rec;
		
		var wop    = null;
		var result = null;
		
		
		this.wr_id= wr_id;
		
		var parameters = {
				tableName: 'wr',
		        fieldNames: toJSON(['wr.wr_id', 'wr.description', 'wr.tr_id','wr.ac_id', 'wr.bl_id', 'wr.dv_id', 'wr.dp_id', 'wr.ac_id', 'wr.cc_id']),
		        restriction: toJSON(new Ab.view.Restriction({'wr.wr_id':wr_id}))
			};
			
		var tr_parms = {
				tableName: 'wrtr',
		        fieldNames: toJSON(['wrtr.wr_id', 'wrtr.tr_id']),
		        restriction: toJSON(new Ab.view.Restriction({'wrtr.wr_id':wr_id}))
			};
		
		try {
	        result = Ab.workflow.Workflow.call('AbCommonResources-getDataRecords', parameters);
			var res2 = Ab.workflow.Workflow.call('AbCommonResources-getDataRecords', tr_parms);
	        if (result.data.records.length == 0){
				View.showMessage(getMessage('Work Request Could Not Be Read From Database, Please Close This Dialog and Reopen It'));
				return false;
			}
	        rec = result.data.records[0];
			tr_rec=null;
			if (res2.data.records.length >0){
				tr_rec = res2.data.records[0];
			}	
	        wop = View.panels.get('createWoForm');
	        
	        wop.setFieldValue("wo.description", rec["wr.description"]);
	        wop.setFieldValue("wo.bl_id", rec["wr.bl_id"]);
	        wop.setFieldValue("wo.dv_id", rec["wr.dv_id"]);
	        wop.setFieldValue("wo.dp_id", rec["wr.dp_id"]);
			//IFM added ac_id and cc_id
	        wop.setFieldValue("wo.ac_id", rec["wr.ac_id"]);
	        wop.setFieldValue("wo.cc_id", rec["wr.cc_id"]);
			if (tr_rec !=null){
				wop.setFieldValue("wo.tr_id", tr_rec["wrtr.tr_id"]);

			}
			
			//IFM Added for multi selection cc_id, ac_id
			ccId = rec["wr.cc_id"];
			acId = rec["wr.ac_id"];
			
			for(var k=1; k<recs.length; k++){
				rec = recs[k];
				parameters = {
						tableName: 'wr',
				        fieldNames: toJSON(['wr.wr_id', 'wr.description', 'wr.tr_id','wr.ac_id', 'wr.bl_id', 'wr.dv_id', 'wr.dp_id', 'wr.ac_id', 'wr.cc_id' ]),
				        restriction: toJSON(new Ab.view.Restriction({'wr.wr_id':rec['wr.wr_id']}))
					};
				result = Ab.workflow.Workflow.call('AbCommonResources-getDataRecords', parameters);
				rec = result.data.records[0];
				
				if (ccId != rec['wr.cc_id']){
				 	
				 	ccId='';
				 	
				}
				if (acId != rec['wr.ac_id']){
				 	
				 	acId='';
				}
								
			}
			wop.setFieldValue("wo.ac_id", acId);
	        wop.setFieldValue("wo.cc_id", ccId);
			
	        //wop.setFieldValue("costcentre", rec["wr.cc_id"])
	        wop =View.panels.get('issueWoForm');
	        
	        wop.setFieldValue("wo.description", rec["wr.description"]);
	        wop.setFieldValue("wo.bl_id", rec["wr.bl_id"]);
	        wop.setFieldValue("wo.dv_id", rec["wr.dv_id"]);
	        wop.setFieldValue("wo.dp_id", rec["wr.dp_id"]);
			//IFM added ac_id and cc_id
	        wop.setFieldValue("wo.ac_id", acId);
	        wop.setFieldValue("wo.cc_id", ccId);
			
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
	 * IFM added checking of wr/s to have cf assigned
     * Assign and issue to work order
     * @param action
     */			
	issueWoForm_onAssignAndIssueWRs: function(action) {
		
		var recs = View.getOpenerView().WRrecords;
		var parameters, result, wrid;
		for(var k=0; k<recs.length; k++){
			rec = recs[k];
			wrId= rec['wr.wr_id'];
			parameters= {
				tableName: 'wrcf',
		        fieldNames: toJSON(['wrcf.wr_id', 'wrcf.cf_id']),
		        restriction: toJSON(new Ab.view.Restriction({'wrcf.wr_id':wrId}))
			};
			
			result = Ab.workflow.Workflow.call('AbCommonResources-getDataRecords', parameters);
			if (result.data.records.length == 0){
				View.showMessage(getMessage('Please assign Trades Person/s to Work Request: ' +wrId + ' and try again'));
				View.closeDialog();
				return;
			}
		}
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
		if (wrDetailsFieldVals["wr.cc_id"].length<1 ){
			View.showMessage('Cost Centre is required. Please insert a value');
			return;
		}
		wrDetailsFieldVals["wr.ac_id"] = woPanel.getFieldValue('wo.ac_id');//IFM added to update wr.ac_id
		if (wrDetailsFieldVals["wr.ac_id"].length<1 ){
			View.showMessage('Account Id is required. Please insert a value');
			return;
		}
		//IFM Added to save cc_id, ac_id for all wr recs
		for (var k=0; k<recs.length; k++){
			var rec = recs[k];
			wrDetailsFieldVals["wr.wr_id"] = rec['wr.wr_id'];
			result = Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-ifm_Update_WR_Fields', wrDetailsFieldVals);
			
		}
		delete record["ifm_costcentre.name"];
		
		if(doIssue){
						
			assignAndIssueWRs(record, recs);
		}else{
						
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
