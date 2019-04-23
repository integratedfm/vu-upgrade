/**
 * Controller for the Work request craftsperson.
 */
var opsConsoleWrcfController = View.createController('opsConsoleWrcfController', {
	
	/**
	 * Record before Edit.
	 */
	recordBeforeEdit : null,
	
	/**
	 * After view loaded.
	 */
	afterViewLoad : function() {
		// KB3016857 -Allow craftspersons to be members of more than one team
		// IFM - Modify the Select Value Restriction on the cf_id field to retrieve Craftsperson based on Primary Trade.  Original code is commented-out (below).
		/**
		var cfSelectValueRestriction = 'cf.work_team_id IS NULL OR cf.work_team_id IN (select cf.work_team_id from cf where cf.email= ${sql.literal(user.email)})';
		if (Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-checkSchemaExisting', 'cf_work_team', 'cf_id').value) {
			cfSelectValueRestriction = "cf.work_team_id IS NULL OR cf.cf_id IN (SELECT cf_work_team.cf_id FROM cf_work_team WHERE cf_work_team.work_team_id IN (SELECT cf_work_team.work_team_id FROM cf_work_team,cf where cf_work_team.cf_id = cf.cf_id and cf.email= ${sql.literal(user.email)}))";
		}
		**/

		var wrIds = [];
		
		//if (this.wrcfGrid.restriction.clauses[0].op == 'IN') {
		if (this.wrcfGrid.restriction.clauses[0].op == 'IN') {
			wrIds = View.getOpenerView().WRids;
		} else {
			wrIds = [ this.wrcfGrid.restriction.clauses[0].value ];
		}
		
		var wrId = wrIds[0];
		var cfSelectValueRestriction = "cf.tr_id = 'MULTI TRADE' OR cf.tr_id IN (SELECT tr_id FROM wrtr WHERE wrtr.wr_id = " + wrId + ") OR NOT EXISTS (SELECT * FROM wrtr WHERE wrtr.wr_id = " + wrId + ")";
		
		this.wrcfForm.fields.get("wrcf.cf_id").actions.get(0).command.commands[0].dialogRestriction = cfSelectValueRestriction;
	},
	
	 /**
     * Disable delete after issued.
     */	
	wrcfGrid_afterRefresh: function(){
		var wrIds = [];
		
		//if (this.wrcfGrid.restriction.clauses[0].op == 'IN') {
		if (this.wrcfGrid.restriction.clauses[0].op == 'IN') {
			wrIds = View.getOpenerView().WRids;
		} else {
			wrIds = [ this.wrcfGrid.restriction.clauses[0].value ];
		}

		//get application parameter, if = 0, then make the resource panels read-only if estimate step is completed.
		var EditEstimationAndScheduling = View.activityParameters['AbBldgOpsOnDemandWork-EditEstAndSchedAfterStepComplete'];
		var isSchedulingCompleted = false;
		if(EditEstimationAndScheduling == '0'){
			for(var i=0;i<wrIds.length;i++){
				isSchedulingCompleted = Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-isEstimateOrSchedulingCompleted',wrIds[i],'scheduling').value;
				if(isSchedulingCompleted){
					View.panels.get('wrcfGrid').actions.get('addCf').show(false);
					break;
				}
			}
		}
		
		this.wrcfGrid.gridRows.each(function(row) {
			var wrId = row.getFieldValue('wrcf.wr_id');
			var status = row.getFieldValue('wr.status');
			if(isSchedulingCompleted){
				row.removeActionListeners();
				jQuery('#wrcfGrid_row'+row.getIndex()+'_deleteWrcf').remove();
			}
			
			if(status!="A" && status!="AA"){
				//KB3042844 - disable Remove action after work request issued
				disableRemoveAfterIssued(View.panels.get('wrcfGrid'),'wrcf.hours_est','deleteWrcf');
			}
		});
		
		//KB3044170 - Allow craftspersons to view, read-only, the scheduling records of other craftspersons, remove action listeners for the other cf rows
		this.updateForCf();
	},
	
	/**
     * KB3042446 - Hide add cf button for role craftsperson
     */
	updateForCf: function(){
		
		var userRoleOfTheRequet = View.getOpenerView().userRoleOfTheRequet;
		if(userRoleOfTheRequet == 'craftsperson'){
			this.wrcfGrid.actions.get('addCf').show(false);
			
			//KB3044170 - Allow craftspersons to view, read-only, the scheduling records of other craftspersons, remove action listeners for the other cf rows
			this.wrcfGrid.gridRows.each(function(row) {
				if(row.getFieldValue('cf.email')!=View.user.email){
					row.removeActionListeners();
				}
			});
			
			jQuery('input[id^=wrcfGrid_row][id$=_deleteWrcf]').remove();
		}
	},

	/**
	 * Clear the form restriction before add new.
	 */
	wrcfForm_beforeRefresh : function() {
		if (this.wrcfForm.newRecord) {
			this.wrcfForm.restriction = null;
		}
	},
	
	/**
	 * Store the record before edit.
	 */
	wrcfForm_afterRefresh : function() {
		var wrDetailsControllers = View.controllers.get('wrDetails');
		if(wrDetailsControllers){
			wrDetailsControllers.wrcfForm_afterRefresh();
		}
		
		if (!this.wrcfForm.newRecord) {
			this.recordBeforeEdit = View.panels.get('wrcfForm').getFieldValues(true);
		}else{
			//KB3046729 - obey timezone of work location when assign craftsperson
			var wrIds = [];
			var form = View.panels.get('wrcfForm');
			if (form.newRecord) {
				if (this.wrcfGrid.restriction.clauses[0].op == 'IN') {
					wrIds = View.getOpenerView().WRids;
				} else {
					wrIds = [ this.wrcfGrid.restriction.clauses[0].value ];
				}

				form.setFieldValue('wrcf.wr_id', wrIds[0], false);
			} else {
				wrIds = [ form.getFieldValue('wrcf.wr_id') ];
			}
			
			setCurrentLocalDateTime(form,wrIds[0],'wrcf.date_assigned','wrcf.time_assigned');
		}
	},
	
	/**
	 * Check Primary key change before edit,  if primary key change, delete the old record and insert the new record.
	 */
	checkPrimaryKeyChange : function() {
		if (!this.wrcfForm.newRecord) {
			var newValues = View.panels.get('wrcfForm').getFieldValues(true);
			if(newValues['wrcf.cf_id']!=this.recordBeforeEdit['wrcf.cf_id']
			   ||newValues['wrcf.date_assigned']!=this.recordBeforeEdit['wrcf.date_assigned']
			     ||newValues['wrcf.time_assigned']!=this.recordBeforeEdit['wrcf.time_assigned']){
				var records = [ this.recordBeforeEdit];
				runDeleteItemsWf('wrcfGrid', 'wrcf', records);
			}
		}
	},

	/**
	 * Save craftsperson.
	 */
	wrcfForm_onSaveWrcf : function() {
		var form = View.panels.get('wrcfForm');

		var wrIds = [];
		if (form.newRecord) {
			if (this.wrcfGrid.restriction.clauses[0].op == 'IN') {
				wrIds = View.getOpenerView().WRids;
			} else {
				wrIds = [ this.wrcfGrid.restriction.clauses[0].value ];
			}

			form.setFieldValue('wrcf.wr_id', wrIds[0], false);
		} else {
			wrIds = [ form.getFieldValue('wrcf.wr_id') ];
		}

		// validate form input and save form
		if (form.canSave()) {
			try {
				
				this.checkPrimaryKeyChange();
				
				var newRecord = form.getFieldValues(true);
				// IFM - Delete rate_callout from fields array before saving-updating wrcf record as these are look-up fields from cf table
				delete newRecord['cf.rate_callout'];
				
				for ( var i = 0; i < wrIds.length; i++) {
					newRecord['wrcf.wr_id'] = wrIds[i];
						Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-saveWorkRequestCraftsperson', newRecord);
				}

				View.panels.get('wrcfGrid').refresh();
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
		} else {
			return false;
		}
	},

	/**
	 * Delete craftsperson.
	 */
	wrcfGrid_onDeleteWrcf : function(row, action) {
		var records = [ row.panel.getPrimaryKeysForRow(row.record) ];
		runDeleteItemsWf('wrcfGrid', 'wrcf', records);
		// refresh cost panel
		if(this.wrCosts){
			this.wrCosts.refresh();
		}
		View.getOpenerView().panels.get('wrList').refresh();
		keepConsoleReqeustsSelectedAfterRefresh();
	},

	/**
	 * Hide fields.
	 */
	hideFields : function(fields) {
		// hide fields from 'Fields to Hide' list
		for ( var i = 0; i < fields.length; i++) {
			this.wrcfGrid.showColumn(fields[i], false);
			this.wrcfForm.showField(fields[i], false);
		}

		// update grid
		this.wrcfGrid.update();
	}
});

/**
 * Over write core API to open Add new dialog and close select value dialog.
 */
Ab.grid.SelectValue.prototype.onAddNew = function() {
	var parameters = Ab.view.View.selectValueParameters;
	var title = parameters.title;
	View.closeDialog();
	View.openDialog(this.addNewDialog, null, false, {
		x : 100,
		y : 100,
		width : 850,
		height : 800,
		title : this.getLocalizedString(Ab.grid.SelectValue.z_TITLE_ADD_NEW) + ' ' + title,
		useAddNewSelectVDialog : false,
		closeButton : false
	});
}

//IFM - Added this.clearAllFilters function in order clear the restriction clause on the cf_id Select Value list
Ab.grid.MiniConsole.prototype.clearAllFilters = function(){

	if (this.filterPaletteIsActive) {
		this.clearAllFilterValues(); 
		
		// reset paging parameters
		this.pagingAction = null;  
		this.firstRecords = []; 
		this.currentPageFirstRecord = {};
		this.currentPageLastRecord = {};
		//IFM - Erase the restriction
		this.restriction = {};

		var parameters = this.getParameters(
			this.getCurrentSortValues(),
			new Ab.grid.IndexValue(this.indexColumnID, this.indexValue, this.indexLevel));
		try {
		    var result = this.getData(parameters);
			this.reloadOnFilter(result.data);
			
			this.restorePreviousSelections();

			if(this.actionbar && this.selectionAcrossPagesEnabled){
				 this.actionbar.updateSelected(this.getAllSelectedRows().length);
			}
		
		} catch (e) {
			this.handleError(e);
		}
	}
	
	//IFM - Superseded solution (04/04/2019)
	//View.panels.get("wrcfForm").fields.get("wrcf.cf_id").actions.get(0).command.commands[0].dialogRestriction=null;
	
}


//IFM Added onChangeCFID() function
function onChangeCFID(fieldName, selectedValue, previousValue) {
	var wrcfPanel = View.panels.get("wrcfForm");
	if (typeof(fieldName)==='undefined' || typeof(selectedValue)==='undefined'){
		return;
	}
	var cfrest = new Ab.view.Restriction();
	var cfds = View.dataSources.get('cf_callout_ds');
	cfrest.addClause("cf.cf_id", selectedValue, "=");
	var cf_rec = cfds.getRecord(cfrest);
	if(cf_rec == ''){
		return;
	}
	wrcfPanel.setFieldValue("cf.rate_callout", cf_rec.values["cf.rate_callout"]);
}
