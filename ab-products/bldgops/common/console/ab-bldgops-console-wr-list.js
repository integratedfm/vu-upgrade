/**
 * Controller for the Operation Console.
 */
var opsConsoleWrListController =  View.createController('opsConsoleWrListController', {

	/**
	 * Group by configuration.
	 */
	groupBy : null,

	/**
	 * Statuses and the order to present them when grouping by statuses. (default)
	 * IFM Mehran Added 02-06-2017
	 */
	statusOrderArray : [ 'Rej','R', 'A', 'AA', 'I', 'S', 'HA', 'HL', 'HP', 'Cai', 'Com' ],
	
	/**
	 * Highlight escalated requests flag, true|false
	 */
	highlightEscalatedReqeusts : false,
	
	/**
	 * Flag array to indicate grid action columns show or hide
	 */
	showActionColumnsFlagArray : [false,false,false,false,false],

	/**
	 * Initialize the controller state.
	 */
	afterViewLoad : function() {
		this.groupBy = {
			fieldName : 'wr.status',
			order : this.statusOrderArray,
			getStyleForCategory : this.getStyleForCategory
		};
	},

	/**
	 * Customize the grid.
	 */
	afterInitialDataFetch : function() {
		// set group by configuration
		this.wrList.setCategoryConfiguration(this.groupBy);
		
		//set the grid title used for exporting Docx
		this.wrList.title = getMessage('exportTitle');

	},

	/**
	 * Set actions and higlight escalated requests.
	 */
	wrList_afterRefresh : function() {
		//show action bar ations
		this.showActionBarActions();
		
		//show grid row actions
		this.showGridRowActions();

		// Highlight the escalated request in red-color
		if(this.highlightEscalatedReqeusts){
			this.highlightEscalatedRequest();
		}
		
		//From Burke -Make the work request code data left justified
		//KB3041556 - change all columns data left aligned
		this.changeGridCellLeftJustified();
		
		//disable rejected work request bulk action(KB3047764)
		this.disableRejectBulkActions();
	},

	// ----------------------- Helper methods ----------------------------------
	
	/**
	 * disable rejected work request bulk action.
	 */
	disableRejectBulkActions : function() {
		jQuery('#wrList_categoryRejected_checkAll').hide();
		var gridRows = this.wrList.gridRows.items;
		for(var i = 0; i < gridRows.length; i++){
			var row = gridRows[i];
			if(row.getFieldValue('wr.status') == 'Rej'){
				jQuery('#wrList_row'+i+'_multipleSelectionColumn').hide();
			}
		}
	},
	
	/**
	 * Change all grid data cell style to left justified.
	 */
	changeGridCellLeftJustified : function() {
		this.wrList.gridRows.each(function(row) {
			 row.cells.each(function(cell){
				Ext.get(cell.dom).setStyle('text-align', 'left');
			 });
		});
	},
	
	/**
	 * Returns styling properties for category.
	 */
	getStyleForCategory : function(record) {
		var status = record.getValue('wr.status');
		var color = '#000000';
		

		if (status == 'R') {
			
			color = '#CC3700';
			
		} else if (status == 'A') {
			
			color = '#4169E1';
			
		} else if (status == 'AA') {
			
			color = '#4169E1';
			
		} else if (status == 'HA' | status == 'HL' || status == 'HP') {
			
			color = '#CC3700';
			
		} else if (status == 'I') {
			
			color = '#4169E1';
			
		} else if (status == 'S') {
			
			color = '#CC3700';
			
		} else if (status == 'Com') {
			
			color = '#4169E1';
			
		}else if (status == 'Rej') {
			
			color = '#CC3700';
			
		}else if (status == 'Cai') {//IFM Mehran Added 02-06-2017
			
			color = '#e18041';
			
		} 

		return {
			color : color
		};
	},
	
	/**
	 * Only show common actions of the selected row in the action bar.
	 */
	showActionBarActions : function() {
		//hide all actins first
		this.wrList.actionbar.actions.each(function(action) {
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
			
			var action = this.wrList.actionbar.getAction(actionName);
			action.show(true);
			action.forceDisable(false);
			
		}
	},
	
	/**
	 * Returns the common actions for all selected rows.
	 */
	getCommonActionsForSelectedRows : function() {
		var commonActions = [];
		var rows = this.wrList.getSelectedGridRows();
		if (rows.length > 0) {
			
			// get the first row actions, and the common actions should sublist of these four actions
			var firstRowActions = this.getFirstRowActions(rows);

			// get all not empty action names in the first row as common actions
			commonActions = this.getCommonActionsFromFirstRowActions(firstRowActions, rows);
			
		}

		return commonActions;
	},
	
	/**
	 * Get first row actions from the selected rows.
	 * 
	 * @param rows
	 *            the selected grid rows.
	 */
	getFirstRowActions : function(rows) {
		var firstRowActions = {};
		
		for ( var index = 1; index <= 5; index++) {
			
			firstRowActions['action' + index] = rows[0].actions.get('action' + index).actionName;
			
		}

		return firstRowActions;
	},
	
	/**
	 * Get all not empty action names in firstRowActions as common actions.
	 * 
	 * @param firstRowActions
	 *            the first row.
	 * @param rows
	 *            all rows.        
	 */
	getCommonActionsFromFirstRowActions : function(firstRowActions, rows) {
		var commonActions = [];
		
		// Check all rows actions to find out and remove actions in the first row are not common
		firstRowActions = this.removeNotCommonActions(firstRowActions, rows);

		//Get all not empty action names in firstRowActions as common actions
		for ( var index = 1; index <= 5; index++) {

			if (valueExistsNotEmpty(firstRowActions['action' + index])) {
				commonActions.push(firstRowActions['action' + index]);
			}

		}

		return commonActions;
	},

	/**
	 * Check all rows actions to find out which actions in the first row are not common and remove the action name.
	 * 
	 * @param firstRowActions
	 *            the first row.
	 * @param rows
	 *            the selected grid rows.
	 */
	removeNotCommonActions : function(firstRowActions, rows) {
		for ( var i = 0; i < rows.length; i++) {
			
			var rowActions = rows[i].actions;

			// concat all actions to make it easy compare
			var actionNames = rowActions.get('action1').actionName + rowActions.get('action2').actionName 
			+ rowActions.get('action3').actionName 
			+ rowActions.get('action4').actionName
			+ rowActions.get('action5').actionName;
			
			//bulk approval just need comments field, so replace review with approval,
			actionNames = actionNames.replace('review', 'approval');

			// check the 5 actions and set not common actions to ''
			for ( var index = 1; index <= 5; index++) {
				
				this.removeNotCommonActionByIndex(firstRowActions, actionNames, index);
				
			}
		}

		return firstRowActions;
	},
	
	/**
	 * Check action by index to find out if this action is not common and remove the action name.
	 */
	removeNotCommonActionByIndex : function(firstRowActions, actionNames, index) {
		
		var actionNameByIndex = firstRowActions['action' + index];

		//bulk approval just need comments field, so replace review with approval,
		actionNameByIndex = actionNameByIndex.replace('review', 'approval');
			
		
		// check the action and set not common actions to ''
		if (actionNames.indexOf(actionNameByIndex) == -1) {
			
			firstRowActions['action' + index] = '';
			
		}
		
	},
	
	/**
	 * Show grid row actions.
	 */
	showGridRowActions : function() {
		//iinitial showActionColumnsFlagArray before show actions
		this.showActionColumnsFlagArray = [false,false,false,false,false];
		
		//show actions for each row and change the flag value of showActionColumnsFlagArray
		var mainController = View.controllers.get('opsExpressConsoleCtrl');
		var currentController = this;
		this.wrList.gridRows.each(function(row) {
			currentController.showActionsByRow(row);
		});
		
		//hide empty action columns
		this.hideEmptyActionColumns();
		
	},
	
	/**
	 * Show actions by row.
	 * 
	 * @param row
	 *            current row.
	 */
	showActionsByRow : function(row) {
		// prepare actions by request status and role name
		var actions = this.prepareGridRowActions(row);

		// set row actions title
		this.setTitleOfGridRowActions(row, actions);
	},
	
	/**
	 * Show actions by row.
	 * 
	 * @param row
	 *            current row.
	 */
	getUserRoleNameOfTheRequest : function(row) {
		var userRoleOfTheRequet = '';
		if(row.getFieldValue('wr.isRequestSupervisor')=='true'){
			
			userRoleOfTheRequet = 'supervisor';
		
		}else if(row.getFieldValue('wr.isRequestCraftsperson') =='true'){
			
			userRoleOfTheRequet = 'craftsperson';
		
		}else if(row.getFieldValue('wr.requestor') == View.user.employee.id){
		
			userRoleOfTheRequet = 'requestor';
		
		}else{
		
			userRoleOfTheRequet = 'otherRole';
		}
		
		return userRoleOfTheRequet;
	},

	/**
	 * Prepare all actions of given row.
	 * 
	 * @param row
	 *            current row.
	 */
	prepareGridRowActions : function(row) {
		var actions = {};
		var userRoleOfTheRequet = this.getUserRoleNameOfTheRequest(row);
		if (userRoleOfTheRequet == 'supervisor') {
			
			//prepare actions for supervisor
			actions = this.prepareActionsForSupervisor(row);
			
		} else if (userRoleOfTheRequet == 'craftsperson') {
			
			//prepare actions for craftsperson
			actions = this.prepareActionsForCraftsperson(row);
			
		}else if (userRoleOfTheRequet == 'requestor') {
			
			//prepare actions for requestor
			actions = this.prepareActionsForRequestor(row);
			
		}else {
			
			//prepare actions for other roles exclude supervisor
			actions = this.prepareActionsForOtherRoles(row);
			
		} 

		return actions;
	},
	
	/**
	 * Prepare all actions for requestor.
	 * 
	 * @param row
	 *            current row.
	 */
	prepareActionsForRequestor : function(row) {
	   var actions = {};
	   var status = row.getFieldValue('wr.status');
	   var stepType = row.record['wr.stepWaitingType'];
	   //if status is before issued, add cancel button
       if(status == 'R' || status == 'A'|| status == 'AA'){
    	    var isWorkTeamSelfAssign = row.getFieldValue('wr.isWorkTeamSelfAssign') == 'true';
            actions['action1'] = 'cancel';
			if (stepType && 'basic' != stepType) {
				actions['action2'] = stepType;
				//KB3048333 - Add Assign button for current user are Craftsperson and Requestor 
				if (status == 'AA' && isWorkTeamSelfAssign) {
					actions['action3'] = 'assignToMe';
				}
			}else{
				//KB3048333 - Add Assign button for current user are Craftsperson and Requestor 
				if (status == 'AA' && isWorkTeamSelfAssign) {
					actions['action2'] = 'assignToMe';
				}
			}
        }else if(status == 'Rej'){
        	var rejectedStep = row.record['wr.rejectedStep'];
			if ('basic' == stepType && 'R' == rejectedStep) {
				actions['action1'] = 'update';
				actions['action2'] = 'cancel';
			}else{
				if (stepType) {
					actions['action1'] = stepType;
				}
			}
        }else{
        	if (stepType) {
				actions['action1'] = stepType;
			}
        }
       
        return actions;
	},
	
	/**
	 * Prepare all actions for supervisor.
	 * 
	 * @param row
	 *            current row.
	 */
	prepareActionsForSupervisor : function(row) {
		var actions = {};
		
		var stepType = row.record['wr.stepWaitingType'];
		var status = row.getFieldValue('wr.status');
		if (status == 'R') {
			
			//show pending steps for supervisor in action 1
			if (stepType) {
				
				actions['action1'] = stepType;
				
			}
			
		}else if (status == 'A') {
			actions['action1'] = 'estimation';
			actions['action2'] = 'scheduling';
			actions['action3'] = 'assign';
			//show pending steps for supervisor in action 4
			if (stepType && stepType!='estimation' && stepType!='scheduling') {
				
				actions['action4'] = stepType;
				actions['action5'] = 'RequestQuote';
				
			}else{
				actions['action4'] = 'RequestQuote';
			}
			
			
		} else if (status == 'AA') {
			actions['action1'] = 'estimation';
			actions['action2'] = 'scheduling';
			actions['action3'] = 'issue';
			actions['action4'] = 'cancel';
			//show pending steps for supervisor in action 5
			if (stepType && stepType!='estimation' && stepType!='scheduling') {
				
				actions['action5'] = stepType;
				
			}
			
		} else if (status == 'I') {
			
			actions['action1'] = 'hold';
			actions['action2'] = 'stop';
			actions['action3'] = 'update';
			actions['action4'] = 'AwaitingInvoice';//IFM Mehran replaced 'complete' with AwaitingInvoice 03-06-2017
			actions['action5'] = 'complete';
			//show pending steps for supervisor in action 5
			if (stepType) {
				
				actions['action5'] = stepType;
				
			}
			
		} else if (status == 'S') {
			
			//show pending steps for supervisor in action 1
			if (stepType) {
				
				actions['action1'] = stepType;
				actions['action2'] = 'closeStopped';
				
			}else{
				actions['action1'] = 'closeStopped';
			}
			
		} else if (status == 'HA' || status == 'HL' || status == 'HP') {
			
			actions['action1'] = 'update';
			actions['action2'] = 'AwaitingInvoice';//IFM Mehran added AwaitingInvoice 03-06-2017
			actions['action3'] = 'complete';
			//show pending steps for supervisor in action 3
			if (stepType) {
				
				actions['action3'] = stepType;
				
			}
			
		} else if (status == 'Com') {
			
			actions['action1'] = 'close';
			//show pending steps for supervisor in action 1
			if (stepType) {
				
				actions['action1'] = stepType;
				actions['action2'] = 'close';
				
			}else{
				
				actions['action1'] = 'close';
				
			}
			
		}else if (status == 'Cai'){
			//IFM Mehran added for adding complete button for supervisor 02-06-2017
			actions['action1'] = 'update';
			actions['action2'] = 'complete';
		}else if (status == 'Rej') {
			
			
			//show pending steps for supervisor in action 1
			if (stepType && stepType!='basic') {
				actions['action1'] = stepType;
			}else if(stepType && stepType == 'basic'){
				var rejectedStep = row.getFieldValue('wr.rejectedStep');
				if(rejectedStep == 'R'){
					actions['action1'] = 'update';
					if(row.getFieldValue('wr.requestor') == View.user.employee.id){
						actions['action2'] = 'cancel';
					}
				}else if(rejectedStep == 'I'){
					actions['action1'] = 'estimation';
					actions['action2'] = 'scheduling';
					actions['action3'] = 'issue';
					actions['action4'] = 'cancel';
				}else if(rejectedStep == 'Com'){
					actions['action1'] = 'hold';
					actions['action2'] = 'stop';
					actions['action3'] = 'update';
					actions['action4'] = 'complete';
				}else{
					if (stepType) {
						actions['action1'] = stepType;
					}
				}
			}
			//IFM Mehran added cancel 11-09-2017
			if (Object.keys(actions).length <1){
				actions['action1'] = 'cancel';
				
			}
			
		}

		return actions;
	},
	
	/**
	 * Prepare all actions for craftsperson.
	 * 
	 * @param row
	 *            current row.
	 */
	prepareActionsForCraftsperson : function(row) {
		var actions = {};

		var stepType = row.record['wr.stepWaitingType'];
		var status = row.getFieldValue('wr.status');
		if (status == 'I') {

			actions['action1'] = 'update';
			if (stepType) {

				actions['action2'] = stepType;

			}
		}else if (status == 'Rej') {
			
			if (stepType && stepType!='basic') {
				actions['action1'] = stepType;
			}else if(stepType && stepType == 'basic'){
				var rejectedStep = row.getFieldValue('wr.rejectedStep');
				if(rejectedStep == 'Com'){
					actions['action1'] = 'update';
				}else if(rejectedStep == 'I'){
					actions['action1'] = 'issue';
				}
			}
		} else {

			if (stepType) {

				actions['action1'] = stepType;

			}
		}

		return actions;
	},
	
	/**
	 * Prepare all actions for other roles exclude supervisor.
	 * 
	 * @param row
	 *            current row.
	 */
	prepareActionsForOtherRoles : function(row) {
		var stepType = row.record['wr.stepWaitingType'];
		var status = row.getFieldValue('wr.status');
		var isWorkTeamSelfAssign = row.getFieldValue('wr.isWorkTeamSelfAssign') == 'true';
		var actions = {};
		
		//KB3027463 - Add Assign button for Craftsperson if work_team.cf_assign = 1
		if (status == 'AA' && isWorkTeamSelfAssign) {
			// show pending steps for supervisor in action 1
			if (stepType) {

				actions['action1'] = stepType;
				if(isWorkTeamSelfAssign){
					actions['action2'] = 'assignToMe';
				}

			}else{
				if(isWorkTeamSelfAssign){
					actions['action1'] = 'assignToMe';
				}
			}
			
		}else if(stepType && stepType!='basic'){
			actions['action1'] = stepType;
			
		}

		return actions;
	},

	/**
	 * Set action title of the row.
	 * 
	 * @param row
	 *            current row.
	 * @param actions
	 *            actions of the row.
	 */
	setTitleOfGridRowActions : function(row, actions) {
		for ( var i = 1; i <= 5; i++) {
			
			this.setTitleOfGridRowActionByIndex(row, actions, i);

		}
	},
	
	/**
	 * Set row action title by action index.
	 */
	setTitleOfGridRowActionByIndex : function(row, actions, index) {
		if (row.actions.get('action' + index)) {
			
			if (actions['action' + index]) {
				
				this.setActionSymbol(row,actions,index);
				
				row.actions.get('action' + index).actionName = actions['action' + index];
				var title = getMessage(actions['action' + index]);
				row.actions.get('action' + index).setTitle(title);
				
				this.showActionColumnsFlagArray[index-1] = true;
				
			} else {
				
				row.actions.get('action' + index).actionName = '';
				row.actions.get('action' + index).show(false);
				
			}
		}
	},
	
	/**
	 * Set action symbol.
	 */
	setActionSymbol : function(row, actions, index) {
		if (actions['action' + index] == row.getFieldValue('wr.stepWaitingType')) {
			jQuery(row.actions.get('action' + index).button.dom).addClass('requiredAction');
			return;

		}
		
		if ((actions['action' + index] == 'estimation' && row.getFieldValue('wr.isEstimate')=='true')
				||(actions['action' + index] == 'scheduling' && row.getFieldValue('wr.isSchedule')=='true')) {

			jQuery(row.actions.get('action' + index).button.dom).addClass('completedAction');
			return;

		}
		
		var step_status = row.getFieldValue('wr.step_status');
		if(valueExistsNotEmpty(step_status) && step_status =='waiting' 
			&&(actions['action' + index] == 'assign' || actions['action' + index] == 'issue'
				|| actions['action' + index] == 'assignToMe'
				  || actions['action' + index] == 'hold'
					|| actions['action' + index] == 'stop'|| actions['action' + index] == 'complete'
						|| actions['action' + index] == 'closeStopped'|| actions['action' + index] == 'close')){
			
			jQuery(row.actions.get('action' + index).button.dom).addClass('pendingAction');
			return;
		}

	},
	
	/**
	 * Hide empty action columns.
	 */
	hideEmptyActionColumns : function() {
		var grid = this.wrList;
		var columns = grid.columns;
		var headerRow = grid.headerRows[0];

		_.each(this.showActionColumnsFlagArray, function(flag, index) {

			if (flag == false) {

				//find the column index
				var columnIndex = null;
				for ( var i = 0; i < columns.length; i++) {

					if (columns[i].id == 'action' + (index + 1)) {

						columnIndex = i;
						break;

					}
				}
				
				//hide column header
				for ( var i = 0; i < headerRow.childNodes.length; i++) {

					if (headerRow.childNodes[i].id == 'sortHeader_' + columnIndex) {

						headerRow.childNodes[i].style.display = "none";

					}
				}
				
				//hide column in grid row
				grid.gridRows.each(function(row) {
					 row.cells.each(function(cell){
						 if(cell.dom.childNodes[0] && cell.dom.childNodes[0].id && cell.dom.childNodes[0].id.indexOf('action'+ (index + 1))!=-1){
							 cell.dom.style.display = "none";
						 }
					 });
				});
			}

		});
		
	},

	/**
	 * Highlight the escalated request in red-color.
	 */
	highlightEscalatedRequest : function(record) {
		this.wrList.gridRows.each(function(row) {
			var escalated = row.getRecord().getValue('wr.escalated_completion');
			if (escalated == '1') {
				
				Ext.get(row.dom).setStyle('background-color', '#FF6A6A');
				
			}
		});
	},
	
	/**
	 * Display double line for descripiton column.
	 */
	displayDoubleLineForDescription : function(action) {
		var grid = this.wrList;
		var columnIndex = grid.findColumnIndex('wr.description');
		var column = grid.columns[columnIndex];

		if (action.checked) {
			
			// display two lines
			column.width = '500';
			
		} else {
			
			// display one line
			column.width = '';
			
		}
		
		grid.update();
	},
	
	/**
	 * Highlight escalated requests.
	 */
	onHighlightEscalatedRequests : function(action) {
		// set highlightEscalatedReqeusts flag
		this.highlightEscalatedReqeusts = action.checked;

		// refresh the grid to apply the higlight base on the flag
		this.wrList.refresh();
	}
});