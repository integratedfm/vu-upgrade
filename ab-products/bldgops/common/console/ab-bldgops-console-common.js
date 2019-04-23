/**
 * determine console role name by query cf table and wr_step_waiting table.
 */
function getConsoleRoleName() {
	
	var roleName = 'client';
	
	try {
		roleName = Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-getCurrentUserRoleName').message
		
	} catch (e) {
		Workflow.handleError(e);
	}
	
	return roleName;
}

function getSelectedWrRecordsForWFR(comments) {
	var records = [];
	var selectedRecords = View.controllers.get('opsConsoleWrListActionController').selectedWrRecordsForAction;
	if (selectedRecords.length > 0) {
		for ( var i = 0; i < selectedRecords.length; i++) {
			var id = selectedRecords[i].getValue('wr.wr_id');
			var record = {};
			record['wr.wr_id'] = id;
			record['wr.activity_type'] = 'SERVICE DESK - MAINTENANCE';
			record['activity_log.activity_log_id'] = selectedRecords[i].getValue('wr.activity_log_id');
			record['wr_step_waiting.wr_id'] = id;
			record['wr_step_waiting.step_log_id'] = selectedRecords[i].getValue('wr.stepWaitingCode');
			record['wr_step_waiting.comments'] = comments;
			records.push(record);
		}
	}

	return records;
}

/**
 * Approve work requests.
 */
function approveRequest() {
	doApprove('AbBldgOpsOnDemandWork-WorkRequestService-approveWorkRequest');
}

/**
 * Reject work requests.
 */
function rejectRequest() {
	//KB3021309 - Comments required when rejecting a request
	var comments = $('approve_comments').value;
	if(!valueExistsNotEmpty(comments)){
		View.showMessage(getMessage('noCommentsForReject'));
		return;
	}
	
	//if the schema not having rejected_step field, call the old WRF to reject work request and keep same as v21.3 
	if(!Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-checkSchemaExisting','helpdesk_step_log', 'rejected_step').value){
		doApprove('AbBldgOpsOnDemandWork-WorkRequestService-rejectWorkRequest');
	}else{
		//call new WFR to reject work request from v21.4
		var selectedRecords = getSelectedWrRecordsForWFR(comments);
		var rejectToOptions = View.controllers.get('opsConsoleWrListActionController').rejectToOptions;
		var index = jQuery(':checked[name=returnToRadioOptions]').val();
		try {
			var result = Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-rejectWorkRequestToPreviousStep', selectedRecords[0], rejectToOptions[index].rejected_step,rejectToOptions[index].user_name);
		} catch (e) {
			Workflow.handleError(e);
			return;
		}
		
		closeQuickWindowAndRefreshConsole(View.panels.get("approvePanel"));
	}
}

/**
 * Cancel work requests.
 */
function cancelRequest(from) {
	var comments = ''
	if(valueExistsNotEmpty(from) && from == 'dispatch'){
		comments = $('dispatch_comments').value;
	}else{
		comments = $('approve_comments').value;
	}
	
	if(!valueExistsNotEmpty(comments)){
		View.showMessage(getMessage('noCommentsForCancel'));
		return;
	}
	
	var selectedRecords = getSelectedWrRecordsForWFR(comments);
	callWfrToUpdateWorkRequest('AbBldgOpsOnDemandWork-WorkRequestService-cancelWorkRequests', selectedRecords);
	if(valueExistsNotEmpty(from) && from == 'dispatch'){
		View.panels.get("dispatchPanel").closeWindow();
	}else{
		View.panels.get("approvePanel").closeWindow();
	}
}

/**
 * Call WFR to do approve work requests.
 */
function doApprove(wfrName) {
	var comments = $('approve_comments').value;
	var selectedRecords = getSelectedWrRecordsForWFR(comments);
	if (selectedRecords.length > 0) {

		// for actionbar and multiple selection
		for ( var i = 0; i < selectedRecords.length; i++) {
			var record = selectedRecords[i];
			try {
				var result = Workflow.callMethod(wfrName, record, comments);
			} catch (e) {
				Workflow.handleError(e);
				return;
			}
		}
		
		closeQuickWindowAndRefreshConsole(View.panels.get("approvePanel"));
	}
}

/**
 * Dispatch work requests.
 */
function dispatchRequest() {
	var dispatchPanel = View.panels.get("dispatchPanel");
	if (dispatchPanel) {
		dispatchPanel.clearValidationResult();
		if (dispatchPanel.getFieldValue("wr.supervisor") == '' && dispatchPanel.getFieldValue("wr.work_team_id") == '') {
			dispatchPanel.addInvalidField("wr.supervisor", getMessage("supervisorOrWorkteam"));
			dispatchPanel.displayValidationResult();
			return;
		}
		
		doDispatch('AbBldgOpsOnDemandWork-WorkRequestService-dispatchWorkRequest');
	}
}

/**
 * Reject dispatch work requests.
 */
function rejectDispatchRequest() {
	//KB3042432 - Comments required when rejecting a request
	var comments = $('dispatch_comments').value;
	if(!valueExistsNotEmpty(comments)){
		View.showMessage(getMessage('noCommentsForReject'));
		return;
	}
	
	if(!Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-checkSchemaExisting','helpdesk_step_log', 'rejected_step').value){
		doDispatch('AbBldgOpsOnDemandWork-WorkRequestService-rejectDispatchWorkRequest');
	}else{
		//call new WFR to reject work request from v21.4
		var selectedRecords = getSelectedWrRecordsForWFR(comments);
		var rejectToOptions = View.controllers.get('opsConsoleWrListActionController').dispatchRejectToOptions;
		var index = jQuery(':checked[name=dispatchReturnToRadioOptions]').val();
		try {
			var result = Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-rejectWorkRequestToPreviousStep', selectedRecords[0], rejectToOptions[index].rejected_step,rejectToOptions[index].user_name);
		} catch (e) {
			Workflow.handleError(e);
			return;
		}
		
		closeQuickWindowAndRefreshConsole(View.panels.get("dispatchPanel"));
	}
}

/**
 * Call WFR to do dispatch work request.
 */
function doDispatch(wfrName) {
	var dispatchPanel = View.panels.get("dispatchPanel");
	if (dispatchPanel) {
		var comments = $('dispatch_comments').value;
		var selectedRecords = getSelectedWrRecordsForWFR(comments);
		if (selectedRecords.length > 0) {
			// for actionbar and multiple selection
			for ( var i = 0; i < selectedRecords.length; i++) {
				var record = selectedRecords[i];
				var stepLogId = record['wr_step_waiting.step_log_id'];
				
				if(Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-isStepEnded',stepLogId).value){
					View.showMessage(getMessage('dispatchStepEnded'));
					return;
			    }else{
			    	if(wfrName == 'AbBldgOpsOnDemandWork-WorkRequestService-dispatchWorkRequest'){
						record['wr.work_team_id'] = dispatchPanel.getFieldValue('wr.work_team_id');
						record['wr.supervisor'] = dispatchPanel.getFieldValue('wr.supervisor');
					}
					
					try {
						var result = Workflow.callMethod(wfrName, record, comments);
					} catch (e) {
						Workflow.handleError(e);
						return;
					}
			    }
				
			}
			
			closeQuickWindowAndRefreshConsole(dispatchPanel);
		}
	}
}

/**
 * Verify work requests.
 */
function verifyRequest() {
	doVerify('AbBldgOpsOnDemandWork-WorkRequestService-verifyWorkRequest');
}

/**
 * Verify work requests.
 */
function rejectVerifyRequest() {
	doVerify('AbBldgOpsOnDemandWork-WorkRequestService-returnWorkRequest');
}

/**
 * Call WFR to verify work requests.
 */
function doVerify(wfrName) {
	var verifyPanel = View.panels.get("verifyPanel");
	if (verifyPanel) {
		var comments = $('verify_comments').value;
		var selectedRecords = getSelectedWrRecordsForWFR(comments);
		if (selectedRecords.length > 0) {
			// for actionbar and multiple selection
			for ( var i = 0; i < selectedRecords.length; i++) {
				var record = selectedRecords[i];
				try {
					var result = Workflow.callMethod(wfrName, record);
				} catch (e) {
					Workflow.handleError(e);
					return;
				}
			}
			
			closeQuickWindowAndRefreshConsole(verifyPanel);
		}
	}
}

/**
 * Verify work requests.
 */
function saveSurvey() {
	var surveyPanel = View.panels.get("surveyPanel");
	if (surveyPanel) {
		var satisfaction = surveyPanel.getFieldValue('wr.satisfaction');
		var satisfactionNotes = surveyPanel.getFieldValue('wr.satisfaction_notes');
		if(satisfactionNotes == ''){
			surveyPanel.canSave();
			return;
		}

		var selectedRecords = getSelectedWrRecordsForWFR(satisfactionNotes);
		if (selectedRecords.length > 0) {
			// for actionbar and multiple selection
			for ( var i = 0; i < selectedRecords.length; i++) {
				var record = selectedRecords[i];
				record['wr.satisfaction'] = satisfaction;
				record['wr.satisfaction_notes'] = satisfactionNotes;
				record['activity_log.satisfaction'] = satisfaction;
				record['activity_log.satisfaction_notes'] = satisfactionNotes;

				try {
					var result = Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-saveSatisfaction', record);
				} catch (e) {
					Workflow.handleError(e);
					return;
				}
			}
			
			closeQuickWindowAndRefreshConsole(surveyPanel);
		}
	}
}

/**
 * get console role name.
 */
function getDataRecords(table, fields, restriction) {
	var parameters = {
		tableName : table,
		fieldNames : toJSON(fields),
		restriction : restriction
	};

	var result = Workflow.call('AbCommonResources-getDataRecords', parameters);
	var records = result.data.records;
	return records;
}

/**
 * Issue an array of work requests.
 */
function issueWRs(wrRecords) {
	callWfrToUpdateWorkRequest('AbBldgOpsOnDemandWork-WorkRequestService-issueWorkRequests', wrRecords);
}

/**
 * Cancel an array of work requests.
 */
function cancelWRs(wrRecords) {
	callWfrToUpdateWorkRequest('AbBldgOpsOnDemandWork-WorkRequestService-cancelWorkRequests', wrRecords);
}

/**
 * Close an array of work requests.
 */
function closeWRs(wrRecords) {
	var result = {};
	try {
		result = Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-closeWorkRequests', wrRecords);
	} catch (e) {
		if (e.code == 'ruleFailed') {
			View.showMessage(getMessage('closeFailed'));
		} else {
			Workflow.handleError(e);
		}
		return;
	}

	if (result.code == 'executed') {
		// refresh the console
		refreshConsole(View);
		
	} 
}

/**
 * Close an array of work requests.
 */
function closeStoppedWRs(wrRecords) {
	var result = {};
	try {
		result = Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-closeStoppedWorkRequests', wrRecords);
	} catch (e) {
		if (e.code == 'ruleFailed') {
			View.showMessage(getMessage('closeFailed'));
		} else {
			Workflow.handleError(e);
		}
		return;
	}

	if (result.code == 'executed') {
		// refresh the console
		refreshConsole(View);
		
	} 
}

/**
 * Assign work requests to an existing work order.
 */
function assignWRs(wrRecords, woId) {
	var result = {};
	try {
		result = Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-assignWrToWo', wrRecords, woId);
		closeDialogAndRefreshConsole();
	} catch (e) {
		Workflow.handleError(e);
	}
}

/**
 * Call WFR to update work request status.
 */
function callWfrToUpdateWorkRequest(wfrName, wrRecords) {
	var result = {};
	try {
		result = Workflow.callMethod(wfrName, wrRecords);
	} catch (e) {
		if (e.code == 'ruleFailed') {
			View.showMessage(e.message);
		} else {
			Workflow.handleError(e);
		}
		return;
	}

	if (result.code == 'executed') {
		// refresh the console
		refreshConsole(View);
		
	} else {
		Workflow.handleError(result);
	}
}

/**
 * Create and assign work requests to a new work order.
 */
function createNewWo(record, recs) {
	var result = {};
	if (recs != undefined) {
		try {
			result = Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-saveNewWorkorder', record, recs, "", "");
			var res = eval('(' + result.jsonExpression + ')');
			alert(getMessage("createdWO") + res.wo_id);
			closeDialogAndRefreshConsole();
		} catch (e) {
			Workflow.handleError(e);
		}
	}
}

/**
 * Issue work requests to a new work order.
 */
function assignAndIssueWRs(record, recs) {
	var result = {};
	if (recs != undefined) {
		try {
			result = Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-saveNewWorkorder', record, recs, "", "");
			var res = eval('(' + result.jsonExpression + ')');
			for ( var i = 0; i < recs.length; i++) {
				var rec = recs[i];
				rec['wr.wo_id'] = res.wo_id;
			}
			result = Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-issueWorkOrders', recs);
			alert(getMessage("createdWO") + res.wo_id);
			closeDialogAndRefreshConsole();

		} catch (e) {
			Workflow.handleError(e);
		}
	}
}

/**
 * Close quick window and refresh console.
 */
function closeQuickWindowAndRefreshConsole(panel) {
	panel.closeWindow();
	refreshConsole(View);
}

/**
 * Close quick window and refresh console.
 */
function closeDialogAndRefreshConsole() {
	var openerView = View.getOpenerView();
	refreshConsole(openerView);
	openerView.closeDialog();
}

/**
 * Close quick window and refresh console.
 */
function refreshConsole(view) {
	var wrFilter = view.controllers.get('wrFilter');
	if (wrFilter) {
		wrFilter.wrFilter_onFilter();
	}
}

/**
 * Get current date.
 */
function getCurrentDate() {
	var today = new Date();
	var day = today.getDate();
	var month = today.getMonth() + 1;
	var year = today.getFullYear();
	return FormattingDate(day, month, year, strDateShortPattern);
}

/**
 * Get current time.
 */
function getCurrentTime() {
	var returnedTime = "";
	var curDate = new Date();
	var hoursNow = curDate.getHours();
	var minsNow = curDate.getMinutes();
	returnedTime = FormattingTime(hoursNow, minsNow, "", "HH:MM");
	return returnedTime;
}

/**
 * Format date.
 */
function formatFormDate(date) {
	var dateparts = date.split('-');
	return FormattingDate(dateparts[2], dateparts[1], dateparts[0], strDateShortPattern);
}

/**
 * Delete items.
 */
function deleteItems(gridName, tableName) {
	var grid = View.getControl('', gridName);
	var records = grid.getPrimaryKeysForSelectedRows();
	runDeleteItemsWf(gridName, tableName, records);
}

/**
 * Run wf rule that can delete item(s).
 */
function runDeleteItemsWf(gridName, tableName, records) {
	var grid = View.getControl('', gridName);
	if (records.length < 1) {
		View.showMessage(getMessage('noRecordSelected'));
		return true;
	}
	var result = {};
	try {
		result = Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-deleteItems', tableName, records);
	} catch (e) {
		Workflow.handleError(result);
	}
	if (result.code == 'executed') {
		grid.refresh();
	} else {
		Workflow.handleError(result);
	}
}

/**
 * Used for selected value action listener and onchange event for work team field to make sure user inpust supervisor or work team.
 */
function onChangeWorkTeam(fieldName, selectedValue, previousValue) {
	var dispatchPanel = View.panels.get("dispatchPanel");
	
	if (fieldName != undefined && selectedValue != undefined) {
		dispatchPanel.setFieldValue(fieldName, selectedValue);
	}
	
	if (dispatchPanel && dispatchPanel.getFieldValue("wr.work_team_id") != '') {
		dispatchPanel.setFieldValue("wr.supervisor", '');
	}
}

/**
 * Used for selected value action listener and onchange event for supervisor field to make sure user inpust supervisor or work team.
 */
function onChangeSupervisor(fieldName, selectedValue, previousValue) {
    var dispatchPanel = View.panels.get("dispatchPanel");
	
	if (fieldName != undefined && selectedValue != undefined) {
		dispatchPanel.setFieldValue(fieldName, selectedValue);
	}
	
	if (dispatchPanel && dispatchPanel.getFieldValue("wr.supervisor") != '') {
		dispatchPanel.setFieldValue("wr.work_team_id", '');
	}
}

/**
 * Add new values to parent form of the select value pop up.
 */
function addNewValuesToParentForm(addNewFormId, selectedFields, parentFormId, targetFields) {
	var openerView = View.getOpenerView();
	if (openerView) {
		var addNewForm = View.panels.get(addNewFormId);
		var parentForm = openerView.panels.get(parentFormId);
		if(addNewForm && parentForm){
			for(var i=0;i<selectedFields.length;i++){
				if(selectedFields[i] == 'pd.pd_description'){
					parentForm.setFieldValue(targetFields[i],parentForm.getFieldValue(targetFields[i]) + addNewForm.getFieldValue(selectedFields[i]));
				}else{
					parentForm.setFieldValue(targetFields[i],addNewForm.getFieldValue(selectedFields[i]));
				}
				
			}
			
			var parentController = openerView.controllers.get('wrCreateController');
			if(parentController){
				// show priority
				parentController.priorityField.showPriority();
				
				//KB3042761 - call after location change logic to set Add New button for floor select value dialog
				if(selectedFields.toString().indexOf('bl_id')!=-1){
					parentController.afterLocationChange();
				}
			}
		}
	}
}


/**
 * Enable form fields base on work request status.
 */
function enableFormFieldsBaseOnWorkRequestStatus(formId,statusFormId) {
	var form = View.panels.get(formId);
	var statusForm = View.panels.get(statusFormId);
	var status = statusForm.getFieldValue('wr.status');
	var enable = true;
	//enable fields that before status before issued
	//IFM Mehran Added CAI 02-June-2017
	if(status=='R' ||  status=='A' || status=='AA' || status=='Cai' || status=='CAI'){
		enable = true;
		
	}else{
		enable = false;
	}
	
	var fieldArray = ['wrtr.tr_id','wrtr.hours_est',
	                  'wrpt.qty_estimated',
	                  'wrcf.date_assigned','wrcf.time_assigned','wrcf.hours_est',
	                  'wrtl.hours_est','wrtl.date_assigned','wrtl.time_assigned',
	                  'wr_other.cost_estimated'];
	for(var i=0;i<fieldArray.length;i++){
		form.enableField(fieldArray[i], enable);
	}
	
	//eable fields that not completed
	if(status=='Com'){
		enable = false;
		
	}else{
		enable = true;
	}
	
	fieldArray = ['wr_other.units_used','wr_other.qty_used'];
	for(var i=0;i<fieldArray.length;i++){
		form.enableField(fieldArray[i], enable);
	}
	
	//eable fields when status is Issued and On Hold 
	//KB3042530 - enable actuals field when status is completed
	//IFM Mehran Added CAI 02-June-2017
	if(status=='I' || status=='HP' || status=='HL'|| status=='Com'|| status=='Rej' || status=='Cai' || status=='CAI'){
		enable = true;
		
	}else{
		enable = false;
	}
	
	//visible field when status is issued on hold and completed
	//IFM Mehran Added CAI 02-June-2017
	var visible = false;
	if(status=='I' || status=='HP' || status=='HL' || status=='Com'|| status=='Rej' || status=='Cai' || status=='CAI'){
		visible = true;
		
	}else{
		visible = false;
	}
	
	fieldArray = ['wrpt.qty_actual',
	              'wrcf.hours_straight','wrcf.hours_double','wrcf.hours_over','wrcf.date_start','wrcf.time_start','wrcf.date_end','wrcf.time_end',
	              'wrtl.hours_straight','wrtl.date_start','wrtl.time_start','wrtl.date_end','wrtl.time_end',
	              'wr_other.cost_total'];
	for(var i=0;i<fieldArray.length;i++){
		form.enableField(fieldArray[i], enable);
		form.showField(fieldArray[i], visible);
	}
	
	//eable fields when status is Issued and On Hold 
	//KB3042530 - enable actuals field when status is completed
	//IFM Mehran Added CAI 02-June-2017
	if(status=='I' || status=='HP' || status=='HL'|| status=='HA'||status=='Com' || status=='Cai' || status=='CAI'){
		enable = false;
		
	}else{
		enable = true;
	}
	
	fieldArray = ['wrtr.tr_id','wrpt.part_id','wrcf.cf_id','wrtl.tool_id','wr_other.other_rs_type'];
	for(var i=0;i<fieldArray.length;i++){
		form.enableField(fieldArray[i], enable);
	}
	
	//eable fields when add new record
	if(form.newRecord){
		fieldArray = ['wrtr.tr_id','wrpt.part_id','wrcf.cf_id','wrtl.tool_id','wr_other.other_rs_type'];
		for(var i=0;i<fieldArray.length;i++){
			form.enableField(fieldArray[i], true);
		}
	}
}

/**
 * Show work request floor plan.
 */
function showWorkRequestFloolPlan(blId, flId, rmId, callback) {
	if (blId && flId) {
		var restriction = new Ab.view.Restriction();
		restriction.addClause('rm.bl_id', blId);
		restriction.addClause('rm.fl_id', flId);
		restriction.addClause('rm.dwgname', '', 'IS NOT NULL');

		var rmRecords = getDataRecords('rm', [ 'rm.dwgname' ], toJSON(restriction));
		if (rmRecords.length > 0) {
			var dwgName = rmRecords[0]['rm.dwgname'];
			restriction.addClause('rm.dwgname', dwgName, '=', 'AND', true);
			restriction.addClause('rm.rm_id', rmId);
			View.openDialog('ab-bldgops-console-show-floor-plan.axvw', restriction, false, {
				callback : callback
			});
		}
	}
}

/**
 * run Workflow rule to updte work request resource.
 */
function runWorkFlowRule(panelId,ruleId,isDialog,parentRefreshPanelId){

	var panel = View.panels.get(panelId);
	var fields = panel.getFieldValues(true);
	
	//KB3041184 - From Fred - We are going to omit using Other Resource Type for now, 
	//because it requires more sample data that we can probably safely remove from the Quick-Start process 
	if(panelId == 'wrotherForm'){
		//fields['wr_other.other_rs_type'] = ' ';
	}else{
		if(!panel.canSave()){
			return false;
		}
	}
	
	var result = {};
	try {
		
		 result = Workflow.callMethod(ruleId, fields);
		 //refresh cost panel
		 var wrCostsPanel = View.panels.get('wrCosts');
		 if(wrCostsPanel){
			 wrCostsPanel.refresh();
		 }
		 
	}catch(e){
		panel.validationResult.valid = false;
		panel.displayValidationResult(e);
		return false;
	}
	
	if(result.code == 'executed'){
		var refreshPanel = null;
		if(isDialog == true){
			refreshPanel = View.getOpenerView().panels.get(parentRefreshPanelId);
		}else{
			refreshPanel = View.panels.get(parentRefreshPanelId);
		}
		refreshPanel.refresh();
		if(isDialog == true){
			View.closeThisDialog();
		}else{
			panel.closeWindow();
		}
	}
}

function keepConsoleReqeustsSelectedAfterRefresh(){
	var openerController = View.getOpenerView().controllers.get('opsConsoleWrListActionController');
	if (openerController.isBulkAction) {
		openerController.keepReqeustsSelectedAfterRefresh();
	}
}

function disableRemoveAfterIssued(panel,field,action){
	panel.gridRows.each(function(row) {
		var estimate= row.getFieldValue(field);
		if(estimate>0){
			jQuery('#'+panel.id+'_row'+row.record.index+'_'+action).remove();
		}
	});
}

/**
 * set current local data and time
 */
function setCurrentLocalDateTime(panel,wrId,dateField,timeField) {
	try {
   		 var result = Workflow.callMethod("AbBldgOpsHelpDesk-CommonService-getCurrentLocalDateTime", 'wr','wr_id',wrId);
		 if (result.code == 'executed') {
			var obj = eval('(' + result.jsonExpression + ')');
			panel.setFieldValue(dateField, obj.date);
			panel.setInputValue(timeField, obj.time);
		} else {
			Workflow.handleError(e);
		}
    }catch (e) {
		 Workflow.handleError(e);
 	}
}

function showUrlTab(event) {
	var url = event.target.innerHTML;	
	if (url != '') { 
		// open a new tab or window
		window.open(url);
	}	
}

function checkExistingWo(wrRecords){
	return Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-checkExistingWo',wrRecords).value;
}