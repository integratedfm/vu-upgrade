/**
 * Controller for the Operation Console.
 */
var opsConsoleWrListActionController =  View.createController('opsConsoleWrListActionController', {
	
	/**
	 * Flag to indicate if action is bulk action or single row action
	 */
	isBulkAction : false,
	
	/**
	 * Selected work request records for action
	 */
	selectedWrRecordsForAction : [],
	
	/**
	 * Reject To Options
	 */
	rejectToOptions : [],
	
	// ----------------------- Multiple rows checkbox selection action ----------------------------------
	
	/**
	 * Show multiple select actions in action bar.
	 */
	wrList_onMultipleSelectionChange : function() {
		opsConsoleWrListController.showActionBarActions();
	},
	
	// ----------------------- Action bar actions (for multiple work requests selection) ----------------------------------
	
	/**
	 * Event handler for Approve button in action bar.
	 */
	wrList_onApproval : function(action) {
		this.onApproval(action);
	},

	/**
	 * Event handler for Dispatch button in action bar.
	 */
	wrList_onDispatch : function(action) {
		this.onDispatch(action);
	},

	/**
	 * Event handler for Estimate button in action bar.
	 */
	wrList_onEstimation : function(action) {
		this.onEstimation(action);
	},

	/**
	 * Event handler for Schedule button in action bar.
	 */
	wrList_onScheduling : function(action) {
		this.onScheduling(action);
	},

	/**
	 * Event handler for Assign button in action bar.
	 */
	wrList_onAssign : function(action) {
		this.onAssign(action);
	},

	/**
	 * Event handler for Issue button in action bar.
	 */
	wrList_onIssue : function(action) {
		this.onIssue(action);
	},

	/**
	 * Event handler for Cancel button in action bar.
	 */
	wrList_onCancel : function(action) {
		this.onCancel(action);
	},

	/**
	 * Event handler for Hold button in action bar.
	 */
	wrList_onHold : function(action) {
		this.onHold(action);
	},

	/**
	 * Event handler for Stop button in action bar.
	 */
	wrList_onStop : function(action) {
		this.onStop(action);
	},

	/**
	 * Event handler for Update button in action bar.
	 */
	wrList_onUpdate : function(action) {
		this.onUpdate(action);
	},

	/**
	 * Event handler for Complete button in action bar.
	 */
	wrList_onComplete : function(action) {
		this.onComplete(action);
	},

	/**
	 * Event handler for Verify button in action bar.
	 */
	wrList_onVerification : function(action) {
		this.onVerification(action);
	},

	/**
	 * Event handler for Survey button in action bar.
	 */
	wrList_onSurvey : function(action) {
		this.onSurvey(action);
	},

	/**
	 * Event handler for Close button in action bar.
	 */
	wrList_onClose : function(action) {
		this.onClose(action);
	},
	
	/**
	 * Event handler for Close Stopped button in action bar.
	 */
	wrList_onCloseStopped : function(action) {
		this.onCloseStopped(action);
	},
	
	/**
	 * Event handler for Assign to Me button in action bar.
	 */
	wrList_onAssignToMe : function(action) {
		this.onAssignToMe(action);
	},
	
	// ----------------------- Single row actions (for single work request) ---------------------------
	
	/**
	 * Event handler for row action 1.
	 */
	wrList_onAction1 : function(panel, action) {
		var name = action.row.actions.get('action1').actionName;
		this.excuteActionByName(name, action);
	},

	/**
	 * Event handler for row action 2.
	 */
	wrList_onAction2 : function(panel, action) {
		var name = action.row.actions.get('action2').actionName;
		this.excuteActionByName(name, action);
	},

	/**
	 * Event handler for row action 3.
	 */
	wrList_onAction3 : function(panel, action) {
		var name = action.row.actions.get('action3').actionName;
		this.excuteActionByName(name, action);
	},

	/**
	 * Event handler for row action 4.
	 */
	wrList_onAction4 : function(panel, action) {
		var name = action.row.actions.get('action4').actionName;
		this.excuteActionByName(name, action);
	},
	
	/**
	 * Event handler for row action 5.
	 */
	wrList_onAction5 : function(panel, action) {
		var name = action.row.actions.get('action5').actionName;
		this.excuteActionByName(name, action);
	},
	
	/**
	 * Show work request details in the pop up when click wr_id row cell of the grid ,
	 */
	wrList_onWr_wr_id: function(panel, action) {
		this.showWorkRequestDetails(action.row);
	},
	
	/**
	 * Show work request details in the pop up when click wr_id row cell of the grid ,
	 */
	reviewPanel_onReviewDetails: function(action) {
		var wrId = this.reviewPanel.getFieldValue('wr.wr_id');
		for (var i = 0; i < this.wrList.gridRows.length; i++) {
			var row =  this.wrList.gridRows.get(i);
			if (wrId == row.getRecord().getValue('wr.wr_id')) {
				this.showWorkRequestDetails(row);
				break;
			}
		}
	},
	
	/**
	 * Show work request details in the pop up
	 */
	showWorkRequestDetails: function(row) {
		var wrId = row.getFieldValue('wr.wr_id');
		//prepare restriction for the pop up
		var restriction = new Ab.view.Restriction();
		restriction.addClause('wr.wr_id', wrId);
		
		View.canEditWorkRequest = false;
		
		var rowActions = row.actions;
		var actionNames = rowActions.get('action1').actionName + rowActions.get('action2').actionName 
		+ rowActions.get('action3').actionName 
		+ rowActions.get('action4').actionName
		+ rowActions.get('action5').actionName;
		

		//if current row contains one of below actions, then show actions in work request details pop up 
		
		if ((actionNames.indexOf('assign') != -1 && actionNames.indexOf('assignToMe') == -1) || actionNames.indexOf('issue') != -1 || actionNames.indexOf('update') != -1 || actionNames.indexOf('close') != -1) {
			View.canEditWorkRequest = true;
		}
		
		
		View.userRoleOfTheRequet = opsConsoleWrListController.getUserRoleNameOfTheRequest(row);
		View.rejectedStep = row.getFieldValue('wr.rejectedStep');

		this.openDialog('ab-bldgops-console-wr-details.axvw',restriction, 1200, 1200, getMessage('workRequestDetailsTitle'));
	},
	
	/**
	 * Display the floor plan for location when click location cell in the grid row
	 */
	wrList_onWr_location : function(panel, action) {
		//get values from the click row
		var blId = action.row.getFieldValue('wr.bl_id');
		var flId = action.row.getFieldValue('wr.fl_id');
		var rmId = action.row.getFieldValue('wr.rm_id');

		//show floor plan
		showWorkRequestFloolPlan(blId, flId, rmId);
	},

	/**
	 * Show all craftsperson of the selected work request when click Assign to row cell
	 */
	wrList_onWr_assignTo : function(panel, action) {
		//get work request from the click row
		var wrId = action.row.getFieldValue('wr.wr_id');
		var assignTo = action.row.getFieldValue('wr.assignTo');

		//prepare restriction for the pop up
		var restriction = new Ab.view.Restriction();
		restriction.addClause('wrcf.wr_id', wrId);
		if(assignTo.indexOf('...')==-1){
			restriction.addClause('wrcf.cf_id', assignTo);
		}

		//refresh the quick panel and show quick panel as pop up
		this.assignToList.refresh(restriction);
		this.showQuickPanel(action, this.assignToList, 350, 250);
	},


	// ----------------------- Helper methods ----------------------------------
	
	/**
	 * Execue action by action name of the user click.
	 */
	excuteActionByName : function(name, action) {
		//get action method to call, like 'onApproval'
		var actionMethod = this['on'+name.substring(0, 1).toUpperCase() + name.substring(1, name.length)].createDelegate(this);
		
		//call action method
		actionMethod(action);
	},
	
	/**
	 * Open review quick panel to do approve work request(s).
	 */
	onReview : function(action) {
		// get the selected work request records
		this.getSelectedWrRecordsForAction(action);
		this.openDialog('ab-bldgops-console-wr-edit-approve.axvw',{}, 1000, 600, getMessage('approveTitle') + ' ' + (action.button ? action.row.getFieldValue('wr.wr_id') : ''));
	},

	/**
	 * Open Approve quick panel to do approve work request(s).
	 */
	onApproval : function(action) {
		// clear values in the approve panel
		$('approve_comments').value = '';

		// get the selected work request records
		this.getSelectedWrRecordsForAction(action);
		
		// open the approve panel to do the action
		this.showQuickPanel(action, this.approvePanel, 500, 400, getMessage('approveTitle') + ' ' + (action.button ? action.row.getFieldValue('wr.wr_id') : ''));
		
		if(Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-checkSchemaExisting','helpdesk_step_log', 'rejected_step').value){
			if(this.selectedWrRecordsForAction.length>1){
				this.approvePanel.actions.get('reject').show(false);
				jQuery('#returnToOptions').hide().prev().hide();
			}else{
				this.approvePanel.actions.get('reject').show(true);
				this.loadRejectTo();
			}
		}else{
			this.approvePanel.actions.get('reject').show(false);
			jQuery('#returnToOptions').hide().prev().hide();
		}
		
	},

	/**
	 * Open dispatch quick panel to do dispatch work request(s).
	 */
	onDispatch : function(action) {
		// clear values in the approve panel
		this.dispatchPanel.setFieldValue('wr.work_team_id', '');
		this.dispatchPanel.setFieldValue('wr.supervisor', '');
		$('dispatch_comments').value = '';

		// get the selected work request records
		this.getSelectedWrRecordsForAction(action);

		// open the dispatch panel to do the action
		this.showQuickPanel(action, this.dispatchPanel, 500, 300,getMessage('dispatchTitle') + ' ' + (action.button ? action.row.getFieldValue('wr.wr_id') : ''));
		
		if(Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-checkSchemaExisting','helpdesk_step_log', 'rejected_step').value){
			if(this.selectedWrRecordsForAction.length>1){
				this.dispatchPanel.actions.get('reject').show(false);
				jQuery('#dispatchReturnToOptions').hide().parent().parent().hide();
			}else{
				this.dispatchPanel.actions.get('reject').show(true);
				this.loadDispatchRejectTo();
			}
		}else{
			this.dispatchPanel.actions.get('reject').show(false);
			jQuery('#dispatchReturnToOptions').hide().parent().parent().hide();
		}
		
	},
	
	/**
	 * Open estimate dialog to do estimate work request(s).
	 */
	onEstimation : function(action) {
		// get the selected work request records
		this.getSelectedWrRecordsForAction(action);
		this.isBulkAction = action.button ? false:true;
		
		View.WRids = this.getSelectedWrIdsArr(action);
		var restriction = new Ab.view.Restriction();
		if (View.WRids.length > 0) {
			if (View.WRids.length == 1) {

				restriction.addClause('wrtr.wr_id', View.WRids[0]);

			} else {

				restriction.addClause('wrtr.wr_id', View.WRids, 'IN');

			}
			
			this.openDialog('ab-bldgops-console-wr-estimate.axvw',restriction, 700, 600, getMessage('estimateTitle') + ' ' + (action.button ? action.row.getFieldValue('wr.wr_id') : ''));
		}
	},
	
	/**
	 * Open schedule dialog to do schedule work request(s).
	 */
	onScheduling : function(action) {
		// get the selected work request records
		this.getSelectedWrRecordsForAction(action);
		
		View.WRids = this.getSelectedWrIdsArr(action);
		var restriction = new Ab.view.Restriction();
		if (View.WRids.length > 0) {
			
			if (View.WRids.length == 1) {
				
				restriction.addClause('wrtr.wr_id', View.WRids[0]);
				
			} else {
				
				restriction.addClause('wrcf.wr_id', View.WRids, 'IN');
				
			}
			
			this.isBulkAction = action.button ? false:true;
			
			this.openDialog('ab-bldgops-console-wr-schedule.axvw',restriction, 900, 600, getMessage('scheduleTitle') + ' ' + (action.button ? action.row.getFieldValue('wr.wr_id') : ''));
			
		}
	},

	/**
	 * Open assign dialog to do assign work request(s).
	 */
	onAssign : function(action) {
		var controller = this;
		View.WRrecords = this.getSelectedWrIdObjects(action);
		if(!this.existPendingRequests()){
			var assignNewWO = true;
			var existingWo = checkExistingWo(View.WRrecords);
			if(existingWo){
				//Use window.confirm to avoid issue - Cannot return to original status after this View.confirm() pop up
				 var assignNew = confirm(getMessage('assignDifferentWO'));
				 
				 if(assignNew){
					 controller.openDialog('ab-bldgops-console-wr-assign.axvw',{}, 720, 600, getMessage('assignTitle') + ' ' + (action.button ? action.row.getFieldValue('wr.wr_id') : ''));
				 }else{
					 Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-updateWorkRequestStatusToAA',View.WRrecords);
					 refreshConsole(View);
				 }
				 
			}else{
				controller.openDialog('ab-bldgops-console-wr-assign.axvw',{}, 720, 600, getMessage('assignTitle') + ' ' + (action.button ? action.row.getFieldValue('wr.wr_id') : ''));
			}
			
		}else{
			
			View.showMessage(getMessage('pendingRequestWhenAssign'));
			
		}
	},
	
	/**
	 * Open issue quick panel to do issue work request(s).
	 */
	onIssue : function(action) {
		View.WRrecords = this.getSelectedWrIdObjects(action);
		if(!this.existPendingRequests()){
			this.showQuickPanel(action, this.issuePanel, 500, 200, getMessage('issueTitle') + ' ' + (action.button ? action.row.getFieldValue('wr.wr_id') : ''));
		}else{
			View.showMessage(getMessage('pendingRequestWhenIssue'));
		}
	},
	
	/**
	 * Open cancel quick panel to do cancel work request(s).
	 */
	onCancel : function(action) {
		View.WRrecords = this.getSelectedWrIdObjects(action);
		this.showQuickPanel(action, this.cancelPanel, 500, 200, getMessage('cancelTitle') + ' ' + (action.button ? action.row.getFieldValue('wr.wr_id') : ''));
	},
	
	/**
	 * Open hode quick panel to do hold work request(s).
	 */
	onHold : function(action) {
		View.WRrecords = this.getSelectedWrIdObjects(action);
		this.showQuickPanel(action, this.holdPanel, 500, 250, getMessage('holdTitle') + ' ' + (action.button ? action.row.getFieldValue('wr.wr_id') : ''));
	},

	/**
	 * Open stop quick panel to do stop work request(s).
	 */
	onStop : function(action) {
		View.WRrecords = this.getSelectedWrIdObjects(action);
		this.showQuickPanel(action, this.stopPanel, 500, 200, getMessage('stopTitle') + ' ' + (action.button ? action.row.getFieldValue('wr.wr_id') : ''));
	},
	
	/**
	 * Open update dialog to do update work request(s).
	 */
	onUpdate : function(action) {
		// if the action is row action, call sigle update
		if (action.button) {
			View.canEditWorkRequest = true;
			View.userRoleOfTheRequet = opsConsoleWrListController.getUserRoleNameOfTheRequest(action.row);
			View.rejectedStep = action.row.getFieldValue('wr.rejectedStep');
			
			var restriction = new Ab.view.Restriction();
			restriction.addClause('wr.wr_id', action.row.getFieldValue('wr.wr_id'));
			this.openDialog('ab-bldgops-console-wr-details.axvw',restriction, 1200, 1200, getMessage('updateTitle') + ' ' + (action.button ? action.row.getFieldValue('wr.wr_id') : ''));
			
		} else {
			
			// if the action is actionbar action, call multiple update
			View.WRrecords = this.getSelectedWrIdObjects(action);
			this.openDialog('ab-bldgops-console-wr-bulk-update.axvw',{}, 720, 450, getMessage('bulkUpdateTitle'));
			
		}

	},
	
	/**
	 * Open complete quick panel to do complete work request(s).
	 */
	onComplete : function(action) {
		View.WRrecords = this.getSelectedWrIdObjects(action);
		if(!this.existPendingRequests()){
			//KB3045879 - Ops Console: provide a warning message when closing a work request that has missing labor hours
			if(this.existEmptyLaborHour()){
				var cotinueExecuteComplete = confirm(getMessage('emptyLaborHours'));
				if(!cotinueExecuteComplete){
					return;
				}
			}
			
			this.showQuickPanel(action, this.completePanel, 500, 200, getMessage('completeTitle') + ' ' + (action.button ? action.row.getFieldValue('wr.wr_id') : ''));
			
		}else{
			View.showMessage(getMessage('pendingRequestWhenComplete'));
		}
	},

	/**
	 * Open verify quick panel to do verify work request(s).
	 */
	onVerification : function(action) {
		//clear the verify panel
		$('verify_comments').value = '';
		
		// get the selected work request records
		this.getSelectedWrRecordsForAction(action);
		
		//show the verify panel as pop up
		this.showQuickPanel(action, this.verifyPanel, 500, 200, getMessage('verifyTitle') + ' ' + (action.button ? action.row.getFieldValue('wr.wr_id') : ''));
	},

	/**
	 * Open survey quick panel to do survey work request(s).
	 */
	onSurvey : function(action) {
		//clear the suvey panel
		this.surveyPanel.setFieldValue('wr.satisfaction', '');
		this.surveyPanel.setFieldValue('wr.satisfaction_notes', '');
		
		// get the selected work request records
		this.getSelectedWrRecordsForAction(action);
		
		this.surveyPanel.clear();
		
		//show the survey panel as pop up
		this.showQuickPanel(action, this.surveyPanel, 650, 250, getMessage('surveyTitle') + ' ' + (action.button ? action.row.getFieldValue('wr.wr_id') : ''));
	},

	/**
	 * Open close quick panel to do close work request(s).
	 */
	onClose : function(action) {
		this.closePanel.closeStopped = false;
		View.WRrecords = this.getSelectedWrIdObjects(action);
		if(!this.existPendingRequests()){
			this.showQuickPanel(action, this.closePanel, 500, 200, getMessage('closeTitle') + ' ' + (action.button ? action.row.getFieldValue('wr.wr_id') : ''));
		}else{
			View.showMessage(getMessage('pendingRequestWhenClose'));
		}
	},
	

	/**
	 * Open close quick panel to do close stopped work request(s).
	 */
	onCloseStopped : function(action) {
		this.closePanel.closeStopped = true;
		View.WRrecords = this.getSelectedWrIdObjects(action);
		if(!this.existPendingRequests()){
			this.showQuickPanel(action, this.closePanel, 500, 200, getMessage('closeTitle') + ' ' + (action.button ? action.row.getFieldValue('wr.wr_id') : ''));
		}else{
			View.showMessage(getMessage('pendingRequestWhenClose'));
		}
	},
	
	/**
	 * KB3027463 - Add Assign button for Craftsperson if work_team.cf_assign = 1.
	 */
	onAssignToMe : function(action) {
		View.WRrecords = this.getSelectedWrIdObjects(action);
		if(!this.existPendingRequests()){
			var cfRecord = View.dataSources.get('cfAssignDS').getRecord();
			if(cfRecord){
				for ( var i = 0; i < this.selectedWrRecordsForAction.length; i++) {
					
					var wrId = this.selectedWrRecordsForAction[i].getValue('wr.wr_id');
					var latestStatus = this.wrStatusQueryDS.getRecord('wr.wr_id='+wrId).getValue('wr.status');
					
					if (latestStatus != 'AA') {
						View.showMessage(getMessage('refreshForSelfAssign'));
						return;
					}
					
					var newRecord = View.panels.get('cfAssignForm').getFieldValues(true);
					newRecord['wrcf.cf_id'] =  cfRecord.getValue('cf.cf_id');
					newRecord['wrcf.wr_id'] =  wrId;
					
				    Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-saveWorkRequestCraftsperson', newRecord);
				    Workflow.call('AbBldgOpsOnDemandWork-WorkRequestService-issueWorkRequest', {'wr.wr_id': wrId});
				    
				    //check if all work requests of the same work order are issued
				    var woRecords = View.dataSources.get('woIssueDS').getRecords("exists(select 1 from wr where wr.wo_id = wo.wo_id and wr.wr_id="+wrId+")")
				    if(woRecords.length > 0){
				    	var woId = woRecords[0].getValue('wo.wo_id');
				    	Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-issueWorkorder', woRecords[0].getValue('wo.wo_id'));
				    }
				}
					    
			    var wrFilter = View.controllers.get('wrFilter');
				if (wrFilter) {
					wrFilter.wrFilter_onFilter();
				}
			}
		}else{
			View.showMessage(getMessage('pendingRequestWhenAssignToMe'));
		}
	},
	/**
	 * IFM - Mehran Added for state change to Completed Awaiting Invoice ('Cai') 03-06-17 
	 * updated 18/10/16 to save the status
	 * Updated to use AB framework for invoking caiIFMPanel_onCaiIFMYes
	 */
	onAwaitingInvoice : function(action) {
		View.WRrecords = this.getSelectedWrIdObjects(action);
		if(!this.existPendingRequests()){
			this.showQuickPanel(action, this.caiIFMPanel, 500, 300, getMessage('completedAwaitingInvoiceTitle') + ' ' + (action.button ? action.row.getFieldValue('wr.wr_id') : ''));
			var form = this.caiIFMPanel;
			form.clear();
			var nDate = new Date();
			var curDate = nDate.toISOString();
			var wrId= View.WRrecords[0]["wr.wr_id"];
			
			var tpRest = new Ab.view.Restriction();
			tpRest.addClause("wr.wr_id", wrId, "=");//set rest to the first selected wr_id
			var record ;
			var vals = this.caiDS.getRecord(tpRest);
			var  estTotalCost = vals.getValue('wr.cost_est_total').trim();
			estTotalCost = estTotalCost.length < 1 ? "0":estTotalCost;
			estTotalCost = parseFloat(estTotalCost);
			
			form.setFieldValue("wr.cai_date",curDate );
			form.setFieldValue("wr.cai_user",View.user.name );
			form.setFieldValue("wr.wr_id",View.WRrecords[0]["wr.wr_id"] );
			
			if (estTotalCost > 500) {
				form.showField('wr.cai_approved_by', true);
			}else {
				form.showField('wr.cai_approved_by', false);
				// IFM - the following method does not work in Internet Explorer
				//form.getFieldCell('wr.cai_approved_by').hidden=true;
				//form.getFieldLabelElement('wr.cai_approved_by').hidden=true;
			}
		}else{
			View.showMessage("Work Request is completed. Please review and confirm completion of the work request.");
		}
	},
	
	onCqu_completion_confirmed : function(action) {
		View.WRrecords = this.getSelectedWrIdObjects(action);
		if(!this.existPendingRequests()){
			this.showQuickPanel(action, this.completePanel, 500, 200, getMessage('completedAwaitingInvoiceTitle') + ' ' + (action.button ? action.row.getFieldValue('wr.wr_id') : ''));
		}else{
			View.showMessage(getMessage('pendingRequestWhenComplete'));
		}
	},
	
	/**
	 * IFM Mehran Added for request a quote 23-06-17 
	 *
	 */
	onRequestQuote : function(action) {
		View.WRrecords = this.getSelectedWrIdObjects(action);
		if(!this.existPendingRequests()){
			this.showQuickPanel(action, this.ifmRequestQuotePanel, 500, 200, getMessage('ifmSendQuoteRequest') + ' ' + (action.button ? action.row.getFieldValue('wr.wr_id') : ''));
		}else{
			View.showMessage("This sends a quote request email to added trades person. Please confirm to send a quote request email.");
		}
	},
	
	
	/**
	 * Open view as dialog
	 */
	openDialog : function(viewName, restriction, width, height, title) {
	     if(!View.dialog){
			View.openDialog(viewName, restriction, false, {
				width : width,
				height : height,
				closeButton : false,
				isDialog : true,
				collapsible : false,
				title : title
			});
	     }
	},
	
	/**
	 * Show panel as quick window
	 */
	showQuickPanel : function(action, panel, width, height, title) {
		//panel config
		var panelConfig = {
			modal : true,
			anchor : action.button ? action.button.dom : action.el.dom,
			width : width,
			height : height
		};
		
		//reset title
		if(title){
			
			panelConfig.title = title;
			
		}
		
		// show quick panel as pop up
		panel.showInWindow(panelConfig);
	},
	
	/**
	 * Get the selected work request records.
	 */
	getSelectedWrRecordsForAction : function(action) {
		// if the action is row action, get the current row record
		if (action.button) {
			
			this.selectedWrRecordsForAction = [ action.row.getRecord() ];
			
		} else {
			
			// if the action is actionbar action, get all selected record with checkbox
			this.selectedWrRecordsForAction = this.wrList.getSelectedRecords();
			
		}
	},

	/**
	 * Get the wr.wr_id values from selected rows.
	 */
	getSelectedWrIdObjects : function(action) {
		this.getSelectedWrRecordsForAction(action);
		var records = [];
		for ( var i = 0; i < this.selectedWrRecordsForAction.length; i++) {
			
			var wrId = this.selectedWrRecordsForAction[i].getValue('wr.wr_id');
			var woId = this.selectedWrRecordsForAction[i].getValue('wr.wo_id');
			records.push({
				'wr.wr_id' : wrId,
				'wr.wo_id': woId
			});
			
		}
		return records;
	},

	/**
	 * Get the wr.wr_id values from selected rows.
	 */
	getSelectedWrIdsArr : function(action) {
		this.getSelectedWrRecordsForAction(action);
		var records = [];

		for ( var i = 0; i < this.selectedWrRecordsForAction.length; i++) {
			
			var wrId = this.selectedWrRecordsForAction[i].getValue('wr.wr_id');
			records.push(wrId);
			
		}
		return records;
	},
	
	/**
	 * Keep the work requests after refresh.
	 */
	keepReqeustsSelectedAfterRefresh : function() {
		for ( var i = 0; i < this.selectedWrRecordsForAction.length; i++) {
			
			var wrId = this.selectedWrRecordsForAction[i].getValue('wr.wr_id');
			this.selectRequestById(wrId);
			
		}
		
		this.wrList.actionbar.updateSelected(this.wrList.getSelectedRows().length);
		opsConsoleWrListController.showActionBarActions()
	},
	
	/**
	 * Select the work request row by work request id.
	 */
	selectRequestById : function(id) {
		this.wrList.gridRows.each(function(row) {
			var wrId = row.getRecord().getValue('wr.wr_id');
			if (wrId == id) {
				row.select(true);
			}
		});
	},
	
	/**
	 * Check if pending steps exists.
	 */
	existPendingRequests : function() {
		var existing = false;
		for ( var i = 0; i < this.selectedWrRecordsForAction.length; i++) {
			var wrId = this.selectedWrRecordsForAction[i].getValue('wr.wr_id');
			var step_status = this.selectedWrRecordsForAction[i].getValue('wr.step_status');
			var step_type = this.selectedWrRecordsForAction[i].getValue('wr.stepWaitingType');
			if(valueExistsNotEmpty(step_status) && step_status =='waiting' && step_type !='basic'){
				existing = true;
				break;
			}
		}
		
		return existing;
	},
	
	/**
	 * Check empty if labor hours exist.
	 */
	existEmptyLaborHour : function() {
		var existing = false;
		var wrIds = [];
		for ( var i = 0; i < this.selectedWrRecordsForAction.length; i++) {
			var wrId = this.selectedWrRecordsForAction[i].getValue('wr.wr_id');
			wrIds.push(wrId);
		}
		
		if(wrIds.length>0){
			var restriction = new Ab.view.Restriction();
			restriction.addClause('wrcf.wr_id', wrIds, 'IN');
			if(this.emptyLaborHoursCheckDS.getRecords(restriction).length>0){
				existing = true;
			}
			
		}
		
		return existing;
	},
	
	/**
	 * Load Reject To options.
	 */
	loadRejectTo : function(action) {
		 jQuery('#returnToOptions').show().empty().prev().show();
		 var result = {};
		 try {
			  result = Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-getRejectReturnToOptions',parseInt(this.selectedWrRecordsForAction[0].getValue('wr.wr_id')));
		 } catch (e) {
			  Workflow.handleError(e);
		 }
		 
		 if(result.code == 'executed'){
			this.rejectToOptions = eval('('+result.jsonExpression+')');
			if(this.rejectToOptions.length > 0){
				for(var i=0;i<this.rejectToOptions.length;i++){
					this.writeRejectToRadioHtml(i);
				}
			}
		 
		 }
		 
		 jQuery('[name=returnToRadioOptions][value=0]').get(0).checked = true;
	},
	
	/**
	 * Load Dispatch Reject To options.
	 */
	loadDispatchRejectTo : function(action) {
		 jQuery('#dispatchReturnToOptions').show().empty().parent().parent().show();
		 var result = {};
		 try {
			  result = Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-getDispatchRejectReturnToOptions',parseInt(this.selectedWrRecordsForAction[0].getValue('wr.wr_id')));
		 } catch (e) {
			  Workflow.handleError(e);
		 }
		 
		 if(result.code == 'executed'){
			this.dispatchRejectToOptions = eval('('+result.jsonExpression+')');
			if(this.dispatchRejectToOptions.length > 0){
				for(var i=0;i<this.dispatchRejectToOptions.length;i++){
					this.writeDispatchRejectToRadioHtml(i);
				}
			}
		 
		 }
		 
		 jQuery('[name=dispatchReturnToRadioOptions][value=0]').get(0).checked = true;
	},
	
	
	/**
	 * Write reject to radio option html.
	 */
	writeRejectToRadioHtml : function(index) {
		 jQuery('<tr><td><input type="radio" name="returnToRadioOptions" value="'+index+'">'+getMessage(this.rejectToOptions[index].role)+' '+this.rejectToOptions[index].user_name+'</input></td></tr>').appendTo(jQuery('#returnToOptions'));
	},
	
	/**
	 * Write dispatch reject to radio option html.
	 */
	writeDispatchRejectToRadioHtml : function(index) {
		 jQuery('<tr><td><input type="radio" name="dispatchReturnToRadioOptions" value="'+index+'">'+getMessage(this.dispatchRejectToOptions[index].role)+' '+this.dispatchRejectToOptions[index].user_name+'</input></td></tr>').appendTo(jQuery('#dispatchReturnToOptions'));
	}
	
});
