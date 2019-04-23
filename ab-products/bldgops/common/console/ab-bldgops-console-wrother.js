/**
 * Controller for the Work request trades.
 */
var opsConsoleWrOtherController = View.createController('opsConsoleWrOtherController', {
	
	/**
	 * Record before Edit.
	 */
	recordBeforeEdit : null,
	
	 /**
     * Disable delete after issued.
     */	
	wrotherGrid_afterRefresh: function(){
		var wrIds = [];
		
		if (this.wrotherGrid.restriction.clauses[0].op == 'IN') {
			wrIds = View.getOpenerView().WRids;
		} else {
			wrIds = [ this.wrotherGrid.restriction.clauses[0].value ];
		}

		//get application parameter, if = 0, then make the resource panels read-only if estimate step is completed.
		var EditEstimationAndScheduling = View.activityParameters['AbBldgOpsOnDemandWork-EditEstAndSchedAfterStepComplete'];
		var isEstimateStepCompleted = false;
		if(EditEstimationAndScheduling == '0'){
			for(var i=0;i<wrIds.length;i++){
				isEstimateStepCompleted = Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-isEstimateOrSchedulingCompleted',wrIds[i],'estimation').value;
				if(isEstimateStepCompleted){
					View.panels.get('wrotherGrid').actions.get('addWrother').show(false);
					break;
				}
			}
		}
		this.wrotherGrid.gridRows.each(function(row) {
			var wrId = row.getFieldValue('wr_other.wr_id');
			var status = row.getFieldValue('wr.status');
			if(isEstimateStepCompleted){
				row.removeActionListeners();
				jQuery('#wrotherGrid_row'+row.getIndex()+'_deleteWrother').remove();
			}
			
			if(status!="A" && status!="AA"){
				//KB3042844 - disable Remove action after work request issued
				disableRemoveAfterIssued(View.panels.get('wrotherGrid'),'wr_other.cost_estimated','deleteWrother');
			}
		});
	},
	
	/**
	 * Clear the form restriction before add new.
	 */
	wrotherForm_beforeRefresh : function() {
		if (this.wrotherForm.newRecord) {
			this.wrotherForm.restriction = null;
		}
	},
	
	/**
	 * Store the record before edit.
	 */
	wrotherForm_afterRefresh : function() {
		var wrDetailsControllers = View.controllers.get('wrDetails');
		if(wrDetailsControllers){
			wrDetailsControllers.wrotherForm_afterRefresh();
		}
		
		if (!this.wrotherForm.newRecord) {
			this.recordBeforeEdit = View.panels.get('wrotherForm').getFieldValues(true);
		}
		//IFM Added to enable esitmate field
		//this.wrotherForm.getFieldElement('wr_other.cost_estimated').readOnly=false;
		
	},
	
	/**
	 * Check Primary key change before edit,  if primary key change, delete the old record and insert the new record.
	 */
	checkPrimaryKeyChange : function() {
		if (!this.wrotherForm.newRecord) {
			var newValues = View.panels.get('wrotherForm').getFieldValues(true);
			if(newValues['wr_other.other_rs_type']!=this.recordBeforeEdit['wr_other.other_rs_type']){
				var records = [ this.recordBeforeEdit];
				runDeleteItemsWf('wrotherGrid', 'wr_other', records);
			}
		}
	},

	/**
	 * Set Read-only
	 * 
	 * @param row
	 * @param action
	 */
	setReadOnly : function() {
		this.wrotherGrid.actions.get('addWrother').show(false);
		this.wrotherGrid.hideColumn('deleteWrother');
		this.wrotherGrid.update();
		this.wrotherGrid.removeActionListeners();
	},

	/**
	 * Save Other resources.
	 */
	wrotherForm_onSaveOtherRes : function() {
		var form = View.panels.get('wrotherForm');
		var wrIds = [];
		
		if (form.newRecord) {
			if (this.wrotherGrid.restriction.clauses[0].op == 'IN') {
				wrIds = View.getOpenerView().WRids;
			} else {
				wrIds = [ this.wrotherGrid.restriction.clauses[0].value ];
			}
		} else {
			wrIds = [ form.getFieldValue('wr_other.wr_id') ];
		}

		form.setFieldValue('wr_other.wr_id', wrIds[0], false);

		try {
			
			this.checkPrimaryKeyChange();
			
			var newRecord = form.getFieldValues(true);
			for ( var i = 0; i < wrIds.length; i++) {
				newRecord['wr_other.wr_id'] = wrIds[i];
				Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-saveOtherCosts', newRecord);
			
			}

			View.panels.get('wrotherGrid').refresh();
			// refresh cost panel
			if(this.wrCosts){
				this.wrCosts.refresh();
			}
			form.closeWindow();
			View.getOpenerView().panels.get('wrList').refresh();
			keepConsoleReqeustsSelectedAfterRefresh();
			
			
		} catch (e) {
			form.validationResult.valid = false;
			form.displayValidationResult(e);
			return false;
		}
	},
	

	/**
	 * When 'X' is pressed, delete Other Cost
	 * 
	 * @param row
	 * @param action
	 */
	wrotherGrid_onDeleteWrother : function(row, action) {
		var records = [ row.panel.getPrimaryKeysForRow(row.record) ];
		// KB3041184 - From Fred - We are going to omit using Other Resource Type for now,
		// because it requires more sample data that we can probably safely remove from the Quick-Start process
		runDeleteItemsWf('wrotherGrid', 'wr_other', records);
		// refresh cost panel
		if(this.wrCosts){
			this.wrCosts.refresh();
		}
	},
	
});


function editOtherCost(eventObject){
	var form = View.panels.get('wrotherForm');
	form.refresh(eventObject.restriction,false);
	form.showInWindow({
        width: 800, 
        title: getMessage('editOtherCost'),
        closeButton: false
    });
}
