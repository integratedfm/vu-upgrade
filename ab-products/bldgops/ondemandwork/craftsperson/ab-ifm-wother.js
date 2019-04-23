/**
 * Controller for the Work request trades.
 */
var ifmWROtherCost = View.createController('ifmWROtherCost', {
	
	/**
	 * Record before Edit.
	 */
	recordBeforeEdit : null,
	wrDetailsPanel : null,
		
	/**
	 * Clear the form restriction before add new.
	 */
	wrotherForm_beforeRefresh : function() {
		this.wrotherForm.restriction = null;
	},
	
	/**
	 * Store the record before edit.
	 */
	wrotherForm_afterRefresh : function() {
		var wrId=sessionStorage["wr.wr_id"];
		var form = View.panels.get('wrotherForm');
		form.clear();
		form.setFieldValue('wr_other.wr_id', wrId, false);
		form.setFieldValue('wr_other.cost_estimated', "0.00", false);
		form.setFieldValue('wr_other.cost_total', "0.00", false);
		form.setFieldValue('wr_other.invoice_file_name', "", false);
		form.setFieldValue("wr_other.date_used", new Date());
	},
	
	/**
	 * Save Other resources.
	 */
	wrotherForm_onSaveOtherRes : function() {
		var form = View.panels.get('wrotherForm');
		
		var wrId = sessionStorage["wr.wr_id"];//this.wrDetailsPanel.getFieldValue("wr.wr_id");

		form.setFieldValue('wr_other.wr_id', wrId, false);

		try {
			var newRecord = form.getFieldValues(true);
			{
				newRecord['wr_other.wr_id'] = wrId;
				Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-saveOtherCosts', newRecord);
				//IFM Mehran added for saving invoice fields from the added form ifmSaveWRInvoiceForm			
				//result = Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-ifm_Update_WR_Fields', wrRecordPanel.getFieldValues());
			}
			
			var cc=document.getElementById("closeButton");
			var ctrl=window.parent.window.controller;//gives the controller as defined here at the top
			ctrl.requestdetailsPanel.refresh();
			form.closeWindow();
			
			//ctrl.requestdetailsPanel.updateOldFieldValues();
			//ctrl.requestdetailsPanel_afterRefresh();
			
		} catch (e) {
			form.validationResult.valid = false;
			form.displayValidationResult(e);
			form.closeWindow();
			View.showMessage(e);
			return false;
		}
	},
	/**
	* IFM Mehran added for saving without closing 29-June-2017
	*/
	wrotherForm_onSaveAndStay : function() {
		var form = View.panels.get('wrotherForm');
		var wrId = View.panels.getFieldValue("wr.wr_id");;

		form.setFieldValue('wr_other.wr_id', wrId, false);

		try {
			
			//this.checkPrimaryKeyChange();
			
			var newRecord = form.getFieldValues(true);
			{
				newRecord['wr_other.wr_id'] = wrId;
				Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-saveOtherCosts', newRecord);
				//IFM Mehran added for saving invoice fields from the added form ifmSaveWRInvoiceForm			
				//this.ifmUpdateWR(form,wrIds[i]);
				//var wrRecordPanel = View.panels.get("ifmSaveWRInvoiceForm");				
			}

			form.refresh(restriction,false);
			
		} catch (e) {
			form.validationResult.valid = false;
			form.displayValidationResult(e);
			return false;
		}
	}
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
