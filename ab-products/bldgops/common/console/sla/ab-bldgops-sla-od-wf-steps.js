/**
 * Controller for On demand workflow tab.
 */
View.createController('onDemandWorkflowTabStep', {

	/**
	 * Step action template
	 */
	stepActionTemplate : new Ext.Template('<span><a class="mediumAction button fieldLink optionalStepAction" type="{1}">{0}</a></span>'),

	/**
	 * Maps DOM events to event listeners.
	 */
	events : {
		
		/**
		 * Event handler for click checkbox 'Approval required'.
		 * 
		 * @param event
		 */
		"click input[value='approvalRequired']" : function(event) {
			this.addApproveStep(event.target.checked);
		},

		/**
		 * Event handler for click action 'Add dispatch step'.
		 * 
		 * @param event
		 */
		"click #addDispatchStep" : 'addDispatchStep',

		/**
		 * Event handler for click add step button for different type.
		 * 
		 * @param event
		 */
		'click .optionalStepAction' : function(event) {
			this.addOptionalStep(event.target.type)
		},

		/**
		 * Event handler for delete step.
		 * 
		 * @param event
		 */
		'click .exListItem a.exListItemDelete' : function(event) {
			this.deleteOptionalStep(event.target.id);
		},

		/**
		 * Event handler for edit step.
		 * 
		 * @param event
		 */
		'click .exListItem a.exListItemEdit' : function(event) {
			this.editOptionalStep(event.target.id);
		},

		/**
		 * Event handler for move up step.
		 * 
		 * @param event
		 */
		'click .exListItem a.exListItemUp' : function(event) {
			this.upOptionalStep(event.target.id);
		},

		/**
		 * Event handler for move down step.
		 * 
		 * @param event
		 */
		'click .exListItem a.exListItemDown' : function(event) {
			this.downOptionalStep(event.target.id);
		}

	},

	/**
	 * Constructor.
	 */
	afterCreate : function() {
		this.on('app:operation:express:sla:updateOptionalSteps', this.updateOptionalSteps);
	},

	/**
	 * Show optional steps actions
	 */
	showOptionalStepActions : function(level) {
		var controller = this;
		_.each(SLA_ALL_STEPS, function(step, index) {
			var status = step.state;
			var stepTypes = step.types;
			for ( var i = 0; i < stepTypes.length; i++) {
				var type = stepTypes[i].type.value;
				var text = stepTypes[i].type.text;
				if (type != 'basic' && type != 'acceptance' && type != 'dispatch' && type != 'change'&& type != 'return')
					controller.addStepAction(status, type, text)
			}
		});
	},

	/**
	 * Show optional steps actions
	 */
	addStepAction : function(status, type, title) {
		var form = View.panels.get(status + '_StepForm');
		if (form) {
			var buttonConfig = {
				template : this.stepActionTemplate,
				renderTo : form.getFieldCell(status + '_OptionalSteps'),
				type : status + ',' + type,
				text : getMessage('addText_' + type),
				buttonSelector : "a:first"
			}

			new Ext.Toolbar.Button(buttonConfig);
		}
	},

	/**
	 * Update optional step.
	 */
	updateOptionalSteps : function(step) {
		var onDemandWorkflowTabController = View.controllers.get('onDemandWorkflowTab');
		var responseParameter = onDemandWorkflowTabController.getResponseParameterByLevel(onDemandWorkflowTabController.currentPriorityLevel);
		if (valueExists(step) && !valueExists(step.index)) {
			step.index = responseParameter.workflowSteps.length;
			responseParameter.workflowSteps.push(step);
		}

		this.showOptionalSteps(responseParameter);
	},

	/**
	 * Shows some (fake) optional steps to workflow forms.
	 */
	showOptionalSteps : function(responseParameter) {
		// remove all steps before showing new steps
		this.removeOptionalSteps();

		// show all optional steps by status
		this.showOptionalStepsByStatus(responseParameter, 'R');

		// KB3041522 - when WorkRequestsOnly='1', only show steps for status AA, BUT display in 'A_StepForm' panel
		var workRequestsOnly = View.activityParameters['AbBldgOpsOnDemandWork-WorkRequestsOnly'];
		if (workRequestsOnly == '1') {
			this.showOptionalStepsByStatus(responseParameter, 'AA');
		} else {
			this.showOptionalStepsByStatus(responseParameter, 'A');
			this.showOptionalStepsByStatus(responseParameter, 'AA');
		}

		this.showOptionalStepsByStatus(responseParameter, 'I');
		this.showOptionalStepsByStatus(responseParameter, 'Com');
		this.showOptionalStepsByStatus(responseParameter, 'Rej');
		this.showOptionalStepsByStatus(responseParameter, 'S');
		this.showOptionalStepsByStatus(responseParameter, 'Can');
		this.showOptionalStepsByStatus(responseParameter, 'Clo');
		this.showOptionalStepsByStatus(responseParameter, 'HA');
		this.showOptionalStepsByStatus(responseParameter, 'HL');
		this.showOptionalStepsByStatus(responseParameter, 'HP');
		this.showOptionalStepsByStatus(responseParameter, 'Cai');

		Ext.query("*[value=approvalRequired]")[0].checked = false;
		var workflowSteps = responseParameter.workflowSteps;
		for ( var i = 0; i < workflowSteps.length; i++) {
			var workflowStep = workflowSteps[i];
			if (workflowStep.basicStatus == 'R' && (workflowStep.stepType == 'approval' || workflowStep.stepType == 'review')) {
				Ext.query("*[value=approvalRequired]")[0].checked = true;
			}
		}

		var autoCreateWoEl = Ext.query("*[value=autoCreateWo]")[0];

		if (responseParameter.autoIssue) {
			autoCreateWoEl.checked = true;
			autoCreateWoEl.disabled = true;
			responseParameter.autoCreateWo = true;

			// hide dispath to dispatch step option if auto issue
			Ext.fly("dispatchToDispatcher").parent().setDisplayed(false);
			Ext.fly("addDispatchStep").parent().setDisplayed(false);

			// hide optional steps box and actions in Approve status panel if auto issue
			Ext.fly("A_StepForm_A_OptionalSteps_labelCell").parent().setDisplayed(false);
			Ext.fly("A_StepForm_A_OptionalSteps_fieldCell").parent().setDisplayed(false);

			if (workRequestsOnly == '0') {
				// hide Assign to Work Order status panel if auto issue
				Ext.fly('AA_StepForm_layoutWrapper').setDisplayed(false);
			}

		} else {

			autoCreateWoEl.disabled = false;

			if (responseParameter.autoCreateWo && workRequestsOnly == '0') {
				// hide dispath to dispatch step option if auto create work order
				Ext.fly("dispatchToDispatcher").parent().setDisplayed(false);
				Ext.fly("addDispatchStep").parent().setDisplayed(false);

				// hide optional steps box and actions in Approve status panel if auto create work order
				Ext.fly("A_StepForm_A_OptionalSteps_labelCell").parent().setDisplayed(false);
				Ext.fly("A_StepForm_A_OptionalSteps_fieldCell").parent().setDisplayed(false);

			} else {
				// show dispath to dispatch step option if not auto issue and not auto create work order
				Ext.fly("dispatchToDispatcher").parent().setDisplayed(true);
				Ext.fly("addDispatchStep").parent().setDisplayed(true);

				// show optional steps box and actions in Approve status panel if not auto issue and not auto create work order
				Ext.fly("A_StepForm_A_OptionalSteps_labelCell").parent().setDisplayed(true);
				Ext.fly("A_StepForm_A_OptionalSteps_fieldCell").parent().setDisplayed(true);
			}

			if (workRequestsOnly == '0') {
				// show Assign to Work Order panel if not auto issue
				Ext.fly('AA_StepForm_layoutWrapper').setDisplayed(true);
			}
		}
	},

	/**
	 * Show optional steps by status
	 */
	showOptionalStepsByStatus : function(responseParameter, status) {
		// get template
		var workflowOptionalStepTemplate = View.templates.get('workflowOptionalStepTemplate');

		// get all steps of this status
		var steps = this.getStepsByStatus(responseParameter, status);
		;

		for ( var i = steps.length - 1; i >= 0; i--) {
			workflowOptionalStepTemplate.render(steps[i], steps[i].parentEl, 'before');
		}

		// make sure the form is showing if exists at least one step
		if (steps.length > 0) {

			// KB3041522 - when WorkRequestsOnly='1', display steps for status AA to panel 'A_StepForm'
			var workRequestsOnly = View.activityParameters['AbBldgOpsOnDemandWork-WorkRequestsOnly'];
			if (workRequestsOnly == '1' && status == 'AA') {
				Ext.fly('A_StepForm_layoutWrapper').setDisplayed(true);
			} else {
				Ext.fly(status + '_StepForm_layoutWrapper').setDisplayed(true);
			}
		}
	},

	/**
	 * Get workflow actions from response parameters.
	 */
	getStepsByStatus : function(responseParameter, status) {
		var stepOrder = 0;
		var lastStepIndex = -1;

		var steps = [];
		var workflowSteps = responseParameter.workflowSteps;
		_.each(workflowSteps, function(workflowStep, index) {
			if (workflowStep.basicStatus == status) {
				var step = {};
				step.id = status + "_" + index;
				step.title = workflowStep.toString();
				var parentEl = null;
				// KB3041522 - when WorkRequestsOnly='1', display steps for status AA to panel 'A_StepForm'
				var workRequestsOnly = View.activityParameters['AbBldgOpsOnDemandWork-WorkRequestsOnly'];
				if (workRequestsOnly == '1' && status == 'AA') {
					parentEl = View.panels.get('A_StepForm').getFieldCell('A_OptionalSteps');
				} else {
					parentEl = View.panels.get(status + '_StepForm').getFieldCell(status + '_OptionalSteps');
				}

				step.parentEl = parentEl;
				steps.push(step);

				// set step order in the same status, start from 1
				stepOrder++;
				workflowStep.stepOrder = stepOrder;

				// set WorkflowStep.isFirstInGroup flag in the same status group, used for move up and move down step actions
				if (stepOrder == 1) {
					workflowStep.isFirstInGroup = true;
				} else {
					workflowStep.isFirstInGroup = false;
				}

				// set WorkflowStep.isLastInGroup flag default value false in the same status group, used for move up and move down step actions
				workflowStep.isLastInGroup = false;
				lastStepIndex = index;
			}
		});

		// set WorkflowStep.isLastInGroup flag for the last step in the same status group, used for move up and move down step actions
		if (lastStepIndex != -1) {
			workflowSteps[lastStepIndex].isLastInGroup = true;
		}

		return steps;
	},

	/**
	 * Remove all steps before showing new steps
	 */
	removeOptionalSteps : function() {
		var allSteps = Ext.query(".exListItem");
		_.each(allSteps, function(step, index) {
			Ext.fly(step).remove();
		});
	},

	/**
	 * Add optional step
	 * 
	 * @param type,
	 *            format like 'R,review'
	 */
	addOptionalStep : function(type) {
		var basicStatus = type.split(',')[0];
		var stepType = type.split(',')[1];

		// for auto issue, cannot add any new steps
		if (basicStatus == 'A' && Ext.query("*[value=autoIssue]")[0].checked) {
			return;
		}

		// KB3041522 - chang A to AA if WorkRequestsOnly='1'
		var workRequestsOnly = View.activityParameters['AbBldgOpsOnDemandWork-WorkRequestsOnly'];
		if (workRequestsOnly == '1' && basicStatus == 'A') {
			basicStatus = 'AA';
		}

		// open edit step dialog to add new step
		this.trigger('app:operation:express:sla:addStep', basicStatus, stepType);
	},

	/**
	 * Delete optional step
	 */
	deleteOptionalStep : function(id) {
		var index = parseInt(id.split('_')[1]);

		var onDemandWorkflowTabController = View.controllers.get('onDemandWorkflowTab');
		// get current priority level response parameter
		var responseParameter = onDemandWorkflowTabController.getResponseParameterByLevel(onDemandWorkflowTabController.currentPriorityLevel);

		// delete current step by index
		responseParameter.workflowSteps.splice(index, 1);

		// reset the step index
		_.each(responseParameter.workflowSteps, function(step, newIndex) {
			step.index = newIndex;
		});

		// show optional steps after delete
		this.showOptionalSteps(responseParameter);
	},

	/**
	 * Edit optional step
	 */
	editOptionalStep : function(id) {
		var index = parseInt(id.split('_')[1]);

		var onDemandWorkflowTabController = View.controllers.get('onDemandWorkflowTab');
		// get current priority level response parameter
		var responseParameter = onDemandWorkflowTabController.getResponseParameterByLevel(onDemandWorkflowTabController.currentPriorityLevel);

		// open edit step dialog to edit
		this.trigger('app:operation:express:sla:editStep', responseParameter.workflowSteps[index])
	},

	/**
	 * Up optional step
	 */
	upOptionalStep : function(id) {
		var index = parseInt(id.split('_')[1]);
		
		var onDemandWorkflowTabController = View.controllers.get('onDemandWorkflowTab');
		var responseParameter = onDemandWorkflowTabController.getResponseParameterByLevel(onDemandWorkflowTabController.currentPriorityLevel);

		if (responseParameter.workflowSteps[index].isFirstInGroup) {
			View.alert(getMessage("upError"));
		} else {
			// change the position of the selected step and previous step in workflowSteps array
			var tempStep = responseParameter.workflowSteps[index];
			responseParameter.workflowSteps[index] = responseParameter.workflowSteps[index - 1];
			responseParameter.workflowSteps[index - 1] = tempStep;

			// showing the steps in the interface
			this.showOptionalSteps(responseParameter);
		}
	},

	/**
	 * Down optional step
	 */
	downOptionalStep : function(id) {
		var index = parseInt(id.split('_')[1]);
		
		var onDemandWorkflowTabController = View.controllers.get('onDemandWorkflowTab');
		var responseParameter = onDemandWorkflowTabController.getResponseParameterByLevel(onDemandWorkflowTabController.currentPriorityLevel);

		if (responseParameter.workflowSteps[index].isLastInGroup) {
			View.alert(getMessage("downError"));
		} else {
			// change the position of the selected step and next step in workflowSteps array
			var tempStep = responseParameter.workflowSteps[index];
			responseParameter.workflowSteps[index] = responseParameter.workflowSteps[index + 1];
			responseParameter.workflowSteps[index + 1] = tempStep;

			// showing the steps in the interface
			this.showOptionalSteps(responseParameter);
		}
	},

	/**
	 * Add approve step
	 */
	addApproveStep : function(checked) {
		var onDemandWorkflowTabController = View.controllers.get('onDemandWorkflowTab');
		var responseParameter = onDemandWorkflowTabController.getResponseParameterByLevel(onDemandWorkflowTabController.currentPriorityLevel);

		if (checked) {
			// if checked, open step dialog to add new approve step
			this.addOptionalStep('R,review');
		} else {
			// if not checked, remve all approve steps
			var workflowSteps = responseParameter.workflowSteps;
			var tempArray = [];
			for ( var i = 0; i < workflowSteps.length; i++) {
				var workflowStep = workflowSteps[i];
				if (workflowStep.basicStatus == 'R' && (workflowStep.stepType == 'approval' || workflowStep.stepType == 'review')) {

				} else {
					tempArray.push(workflowSteps[i]);
				}
			}
			responseParameter.workflowSteps = tempArray;
			responseParameter.autoApprove = true;
			this.showOptionalSteps(responseParameter);
		}
	},

	/**
	 * Add dispatch step
	 */
	addDispatchStep : function(checked) {
		var dispatchToDispatcher = Ext.fly('dispatchToDispatcher').dom.checked;
		
		var onDemandWorkflowTabController = View.controllers.get('onDemandWorkflowTab');
		var responseParameter = onDemandWorkflowTabController.getResponseParameterByLevel(onDemandWorkflowTabController.currentPriorityLevel);

		var autoIssue = Ext.query("*[value=autoIssue]")[0].checked;

		// if dispatch to dispatcher radio is checked and not existing a dispatch step and not auto issue, open step dialog to add new step
		if (dispatchToDispatcher && !autoIssue) {
			responseParameter.supervisor = '';
			responseParameter.workTeam = '';
			this.addOptionalStep('A,dispatch');
		}
	}
});
