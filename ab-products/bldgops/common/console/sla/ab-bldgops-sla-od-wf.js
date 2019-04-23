/**
 * Controller for On demand workflow tab.
 */
View.createController('onDemandWorkflowTab', {

	/**
	 * Current priority level
	 */
	currentPriorityLevel : null,

	/**
	 * Maps DOM events to event listeners.
	 */
	events : {
		/**
		 * Event handler for click priority tab.
		 * 
		 * @param event
		 */
		'click .priorityLevelTab' : function(event) {
			if (this.requestTabs.selectedTabName == 'workflowTab') {
				this.loadPriorityLevel(event.target.id.replace('priority_level_tab_', ''));
			}
		},

		/**
		 * Event handler for click show reject optional form.
		 * 
		 * @param event
		 */
		'click #showRejectForm' : function(event) {
			Ext.fly('Rej_StepForm_layoutWrapper').setDisplayed(true);
		},

		/**
		 * Event handler for click show stopped optional form.
		 * 
		 * @param event
		 */
		'click #showStoppedForm' : function(event) {
			Ext.fly('S_StepForm_layoutWrapper').setDisplayed(true);
		},

		/**
		 * Event handler for click show cancelled optional form.
		 * 
		 * @param event
		 */
		'click #showCancelledForm' : function(event) {
			Ext.fly('Can_StepForm_layoutWrapper').setDisplayed(true);
		},
		
		/**
		 * Event handler for click show HA optional form.
		 * 
		 * @param event
		 */
		'click #showHAForm' : function(event) {
			Ext.fly('HA_StepForm_layoutWrapper').setDisplayed(true);
		},
		
		/**
		 * Event handler for click show HL optional form.
		 * 
		 * @param event
		 */
		'click #showHLForm' : function(event) {
			Ext.fly('HL_StepForm_layoutWrapper').setDisplayed(true);
		},
		
		/**
		 * Event handler for click show HP optional form.
		 * 
		 * @param event
		 */
		'click #showHPForm' : function(event) {
			Ext.fly('HP_StepForm_layoutWrapper').setDisplayed(true);
		},
		/**
		 * IFM Added
		 * Event handler for click show CAI optional form.
		 * 
		 * @param event
		 */
		'click #showCAIForm' : function(event) {
			Ext.fly('Cai_StepForm_layoutWrapper').setDisplayed(true);
		},
		

		/**
		 * Event handler for click checkbox 'Auto Create Work Order'.
		 * 
		 * @param event
		 */
		"click input[value='autoCreateWo']" : function(event) {
			this.checkAutoCreateWorkOrder(event.target.checked);
		},

		/**
		 * Event handler for click checkbox 'Auto issue'.
		 * 
		 * @param event
		 */
		"click input[value='autoIssue']" : function(event) {
			this.checkAutoIssue(event.target.checked);
		},

		/**
		 * Event handler for click dispatch radio .
		 * 
		 * @param event
		 */
		"click input[name='dispatchRadio']" : function(event) {
			SLA_onChagneDispatchForm(this.A_StepForm,event)
		},

		/**
		 * Event handler for save workflow template.
		 * 
		 * @param event
		 */
		"click #saveWorkflowTemplate" : 'saveWorkflowTemplate',

		/**
		 * Event handler for find workflow pre-fill.
		 * 
		 * @param event
		 */
		"click #findWorkflowPreFill" : 'findWorkflowPreFill',

		/**
		 * Event handler for rename workflow template.
		 * 
		 * @param event
		 */
		"click #renameWorkflowTemplate" : 'saveWorkflowTemplate',

		/**
		 * Event handler for remove workflow template.
		 * 
		 * @param event
		 */
		"click #removeWorkflowTemplate" : 'removeWorkflowTemplate'

	},

	/**
	 * After view loaded, move standard field to customized element position.
	 */
	afterViewLoad : function() {
		SLA_moveFormField('A_StepForm', 'helpdesk_sla_response.work_team_id', 'workTeamCode');
		SLA_moveFormField('A_StepForm', 'helpdesk_sla_response.supervisor', 'supervisorCode');
		SLA_moveFormField('A_StepForm', 'helpdesk_sla_response.cf_id', 'craftspersonCode');
		SLA_moveFormField('A_StepForm', 'helpdesk_sla_response.default_duration', 'defaultDuration');

		// KB3041120 - add select value restriction
		this.A_StepForm.fields.get("helpdesk_sla_response.supervisor").actions.get(0).config.commands[0].dataSource = 'supervisorSelectValueDS';
		this.A_StepForm.fields.get("helpdesk_sla_response.supervisor").actions.get(0).config.commands[0].restriction = 'exists(select 1 from cf where cf.email=em.email and (cf.is_supervisor = 1))';
		this.A_StepForm.fields.get("helpdesk_sla_response.supervisor").actions.get(0).command.commands[0].dialogRestriction = 'exists(select 1 from cf where cf.email=em.email and (cf.is_supervisor = 1))';
		this.A_StepForm.fields.get("helpdesk_sla_response.cf_id").actions.get(0).command.commands[0].beforeSelect = this.beforeSelectCf.createDelegate(this);
		
		//KB3043335 - increace the field width to avoid string truancated
		jQuery('#A_StepForm_helpdesk_sla_response\\.work_team_id').css('width', '230px');
		jQuery('#A_StepForm_helpdesk_sla_response\\.supervisor').css('width', '230px');
		jQuery('#A_StepForm_helpdesk_sla_response\\.cf_id').css('width', '230px');
		jQuery('#A_StepForm_helpdesk_sla_response\\.default_duration').css('width', '230px');
		
		if(!Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-checkSchemaExisting','helpdesk_sla_response', 'schedule_immediately').value){
			jQuery('#scheduleimmediately_div').hide();
	    }
		
		//move the tooltip image after the enforceNewWorkflowCheckBox
		jQuery('input[value=enforceNewWorkflowCheckBox]').parent().next().appendTo(jQuery('input[value=enforceNewWorkflowCheckBox]').parent());
		
		if(!Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-checkSchemaExisting','helpdesk_sla_response', 'enforce_new_workflow').value){
			jQuery('input[value=enforceNewWorkflowCheckBox]').parent().hide();
	    }
	
	},

	/**
	 * Constructor.
	 */
	afterCreate : function() {
		this.on('app:operation:express:sla:loadSLA', this.loadResponseParameters);
		this.on('app:operation:express:sla:loadWorkflowPriorityLevel', this.loadPriorityLevel);
		this.on('app:operation:express:sla:afterShowSlaSummary', this.refreshSlaSummary);
	},

	/**
	 * Return to Console.
	 */
	topActionBar_onReturnToConsole : function() {
		SLA_returnToConsole();
	},

	/**
	 * Return to Console.
	 */
	workflowActions_onReturnToConsole : function() {
		SLA_returnToConsole();
	},

	/**
	 * Select previous tab.
	 */
	topActionBar_onGoPreviousTab : function() {
		this.goPreviousTab();
	},

	/**
	 * Select previous tab.
	 */
	workflowActions_onGoPreviousTab : function() {
		this.goPreviousTab();
	},

	/**
	 * Select next tab.
	 */
	topActionBar_onGoNextTab : function() {
		this.goNextTab();
	},

	/**
	 * Select next tab.
	 */
	workflowActions_onGoNextTab : function() {
		this.goNextTab();
	},

	/**
	 * Go Previous tab.
	 */
	goPreviousTab : function() {
		// update sla response parameters from interface
		this.updateResponseParameters();
		// go to previous tab
		this.requestTabs.selectTab('requestParametersTab');

		// clear the priority tabs after go to first tab
		if (Ext.fly('priorityLevelTabs_block')) {
			Ext.fly('priorityLevelTabs_block').remove();
		}

		// show summary panel with new data
		var selectedSLA = View.controllers.get('editDetailsWizard').selectedSLA;
		this.trigger('app:operation:express:sla:showSlaSummary', selectedSLA);
	},

	/**
	 * Go next tab.
	 */
	goNextTab : function() {
		// update sla response parameters from interface
		this.updateResponseParameters();
		if (this.validateForm()) {
			// go to next tab
			this.requestTabs.selectTab('serviceParametersTab');

			// Load first priority to workflow tab
			this.trigger('app:operation:express:sla:loadServicePriorityLevel', 1);

			// show summary panel with new data
			var selectedSLA = View.controllers.get('editDetailsWizard').selectedSLA;
			this.trigger('app:operation:express:sla:showSlaSummary', selectedSLA);
		}

	},

	/**
	 * Validate form values.
	 */
	validateForm : function() {
		//KB3041778 - add validation for field helpdesk_sla_response.default_duration before save template and go next page
		if(!this.A_StepForm.validateField("helpdesk_sla_response.default_duration")){
			return false;
		}
		
		var validate = true;
		var responseParameters = View.controllers.get('editDetailsWizard').selectedSLA.responseParameters

		for ( var i = 0; i < responseParameters.length; i++) {
			try {
				// check valid foreign keys for request parameters
				var result = Workflow.callMethod('AbBldgOpsHelpDesk-SLAService-checkValidForeignKeysForResponseParameters', responseParameters[i]);
				if (!responseParameters[i].supervisor && !responseParameters[i].workTeam && !this.checkDispatchStep(responseParameters[i])) {
					validate = false;
					View.showMessage(getMessage('noDispatcher'));
					// load the current priority level response parameter to the interface
					this.loadPriorityLevel(i + 1);
					break;
				}

			} catch (e) {
				validate = false;
				// load the current priority level response parameter to the interface
				this.loadPriorityLevel(i + 1);
				View.showMessage(e.message);
				break;
			}
		}

		return validate;

	},

	/**
	 * Check dispatch step
	 */
	checkDispatchStep : function(responseParameter) {
		var existing = false;

		var workflowSteps = responseParameter.workflowSteps;
		for ( var i = 0; i < workflowSteps.length; i++) {
			var workflowStep = workflowSteps[i];
			if (workflowStep.stepType == 'dispatch') {
				existing = true;
				break;
			}
		}

		return existing;
	},

	/**
	 * Load response parameter to the interface
	 */
	loadResponseParameters : function(selectedSLA) {
		// hide all optional forms by default
		this.hideOptionalForms();

		if ('PREVENTIVE MAINT' != selectedSLA.requestParameters.probType) {
			// show workflow status arrow for standard workflow form
			this.showWorkflowStatusArrow();
		} else {
			// Update interface for PM SLA
			this.updateInterfaceForPmSla();
		}

		// show optional step 'add' actions only for on demand sla
		if ('PREVENTIVE MAINT' != selectedSLA.requestParameters.probType) {
			View.controllers.get('onDemandWorkflowTabStep').showOptionalStepActions();
		}
	},

	/**
	 * Update the interface of the second tab for PM SLA.
	 */
	updateInterfaceForPmSla : function(selectedSLA) {
		// Hide panels that not related to PM SLA
		this.hidePanelsAndFieldsForPmSla();
	},

	/**
	 * Hide panels and some fields for PM SLA
	 */
	hidePanelsAndFieldsForPmSla : function(selectedSLA) {
		// Hide Request form, issue form, assign form, completed form for PM SLA
		Ext.fly('R_StepForm_layoutWrapper').setDisplayed(false);
		Ext.fly('AA_StepForm_layoutWrapper').setDisplayed(false);
		Ext.fly('I_StepForm_layoutWrapper').setDisplayed(false);
		Ext.fly('Com_StepForm_layoutWrapper').setDisplayed(false);
		Ext.fly('Clo_StepForm_layoutWrapper').setDisplayed(false);
		Ext.fly('workflowOptionsForm_layoutWrapper').setDisplayed(false);
		Ext.fly('scheduleimmediately_div').setDisplayed(false);

		// hide optional steps field in Approve panel
		Ext.fly('A_StepForm_A_OptionalSteps_labelCell').parent().setDisplayed(false);

		// hide Approval required option for PM SLA
		Ext.fly(Ext.query("*[value=approvalRequired]")[0]).parent().setDisplayed(false);
		// hide autoCreateWo option for PM SLA
		Ext.fly(Ext.query("*[value=autoCreateWo]")[0]).parent().setDisplayed(false);
		// hide dispath to dispatcher step option for PM SLA
		Ext.fly("dispatchToDispatcher").parent().setDisplayed(false);
		Ext.fly("addDispatchStep").parent().setDisplayed(false);
		Ext.fly('A_StepForm').removeClass('exCalloutFormPanel');

		// move Notify craftsperson to approve panel
		Ext.get('A_StepForm_approvedOptions_fieldCell').appendChild(Ext.get(Ext.query("*[value=notifyCraftsperson]")[0]).parent());
	},

	/**
	 * Hide all optional forms
	 */
	hideOptionalForms : function(selectedSLA) {
		Ext.fly('Rej_StepForm_layoutWrapper').setDisplayed(false);
		Ext.fly('S_StepForm_layoutWrapper').setDisplayed(false);
		Ext.fly('Can_StepForm_layoutWrapper').setDisplayed(false);
		Ext.fly('HA_StepForm_layoutWrapper').setDisplayed(false);
		Ext.fly('HL_StepForm_layoutWrapper').setDisplayed(false);
		Ext.fly('HP_StepForm_layoutWrapper').setDisplayed(false);
		//IFM Added
		Ext.fly('Cai_StepForm_layoutWrapper').setDisplayed(false);
	},

	/**
	 * Shows workflow step titles and arrows to the left of On-Demand Workflow forms.
	 */
	showWorkflowStatusArrow : function() {
		var showWorkflowForPanel = function(id, type) {
			// The HTML template for each workflow form title/arrow is defined in in ab-bldops-html-templates.axvw.
			var workflowFormTemplate = View.templates.get('workflowFormTemplate');
			if (valueExists(type) && type == 'optional') {
				workflowFormTemplate = View.templates.get('optionalFormTemplate');
			}

			// Render the template and prepend the rendered HTML before the
			// content of the form.
			workflowFormTemplate.render({
				// Specify parameters for the template here.
				title : getMessage(id + 'Title')
			}, '#' + id, 'before');
		};

		// show standard workflow form
		showWorkflowForPanel('R_StepForm');
		showWorkflowForPanel('A_StepForm');
		showWorkflowForPanel('AA_StepForm');
		showWorkflowForPanel('I_StepForm');
		showWorkflowForPanel('Com_StepForm');
		showWorkflowForPanel('Clo_StepForm','optional');

		// show optional form
		showWorkflowForPanel('Rej_StepForm', 'optional');
		showWorkflowForPanel('S_StepForm', 'optional');
		showWorkflowForPanel('Can_StepForm', 'optional');
		showWorkflowForPanel('HA_StepForm', 'optional');
		showWorkflowForPanel('HL_StepForm', 'optional');
		showWorkflowForPanel('HP_StepForm', 'optional');
		//IFM Added
		showWorkflowForPanel('Cai_StepForm', 'optional');
	},

	/**
	 * Load given priority level
	 */
	loadPriorityLevel : function(level) {
		// updata current priority level values before load other priority level
		if (this.currentPriorityLevel && this.currentPriorityLevel != level) {
			this.updateResponseParameters();
		}
		// store current priority level
		this.currentPriorityLevel = level;

		// get response parameter of the selected priority level
		var responseParameter = this.getResponseParameterByLevel(level);
		if (responseParameter) {
			// show response parameter field values
			this.showFieldValues(responseParameter);

			if ('PREVENTIVE MAINT' != View.controllers.get('editDetailsWizard').selectedSLA.requestParameters.probType) {
				// show optional steps
				View.controllers.get('onDemandWorkflowTabStep').showOptionalSteps(responseParameter);
			}

			// update summary panel
			this.trigger('app:operation:express:sla:switchSummaryPriorityLevelRadio', level);
		}

		// set current priority selected in the tab
		this.trigger('app:operation:express:sla:setSelectedCssForPriorityLevel', level);

		// check application paramter WorkRequestsOnly to determin whether showing Assign to Work order status
		this.checkWorkRequestsOnly();
	},

	/**
	 * Get response parameter by priority level.
	 */
	getResponseParameterByLevel : function(level) {
		var targetResponseParameter = null;
		_.each(View.controllers.get('editDetailsWizard').selectedSLA.responseParameters, function(responseParameter, index) {
			if (responseParameter.priorityLevel == level) {
				targetResponseParameter = responseParameter;
			}
		});

		return targetResponseParameter;
	},

	/**
	 * Show field values
	 */
	showFieldValues : function(responseParameter) {
		Ext.query("*[value=notifyRequestor]")[0].checked = responseParameter.notifyRequestor;
		Ext.query("*[value=autoCreateWo]")[0].checked = responseParameter.autoCreateWo;
		Ext.query("*[value=autoIssue]")[0].checked = responseParameter.autoIssue;
		Ext.query("*[value=notifySupervisor]")[0].checked = responseParameter.notifySupervisor;
		Ext.query("*[value=notifyCraftsperson]")[0].checked = responseParameter.notifyCraftsperson;
		Ext.query("*[value=scheduleimmediately]")[0].checked = responseParameter.scheduleimmediately;
		Ext.query("*[value=enforceNewWorkflowCheckBox]")[0].checked = responseParameter.enforceNewWorkflow;

		this.A_StepForm.setFieldValue('helpdesk_sla_response.cf_id', responseParameter.cfId);
		this.A_StepForm.setFieldValue('helpdesk_sla_response.default_duration', responseParameter.duration == 0 ? '' : responseParameter.duration);
		this.A_StepForm.setFieldValue('helpdesk_sla_response.work_team_id', responseParameter.workTeam);
		this.A_StepForm.setFieldValue('helpdesk_sla_response.supervisor', responseParameter.supervisor);

		if (responseParameter.workTeam) {
			Ext.fly("dispatchToWorkTeam").dom.checked = true;
		} else {
			Ext.fly("dispatchToWorkTeam").dom.checked = false;
		}

		if (responseParameter.supervisor) {
			Ext.fly("dispatchToSupervisor").dom.checked = true;
		} else {
			Ext.fly("dispatchToSupervisor").dom.checked = false;
		}

		if (!responseParameter.supervisor && !responseParameter.workTeam) {
			Ext.fly("dispatchToDispatcher").dom.checked = true;
		} else {
			Ext.fly("dispatchToDispatcher").dom.checked = false;
		}

		SLA_onChagneDispatchForm(this.A_StepForm);

		if (responseParameter.autoIssue) {
			// hide dispath to dispatch step option for auto issue
			Ext.fly("dispatchToDispatcher").parent().setDisplayed(false);
			Ext.fly("addDispatchStep").parent().setDisplayed(false);
		}

		Ext.fly('workflowName').update(responseParameter.workflowName);
		if (responseParameter.workflowTemplate == '1') {
			Ext.fly('selectWorkflowPrefillBlock').setDisplayed(false);
			Ext.fly('saveWorkflowPrefillBlock').setDisplayed(false);
			Ext.fly('workflowTemplateSummaryBlock').setDisplayed(true);
		} else {
			Ext.fly('selectWorkflowPrefillBlock').setDisplayed(true);
			Ext.fly('saveWorkflowPrefillBlock').setDisplayed(true);
			Ext.fly('workflowTemplateSummaryBlock').setDisplayed(false);
		}
		
	},
	
	/**
	 * Update response parameter from the interface.
	 */
	updateResponseParameters : function() {
		var responseParameter = this.getResponseParameterByLevel(this.currentPriorityLevel);
		responseParameter.autoApprove = !Ext.query("*[value=approvalRequired]")[0].checked;
		responseParameter.notifyRequestor = Ext.query("*[value=notifyRequestor]")[0].checked;
		responseParameter.autoCreateWo = Ext.query("*[value=autoCreateWo]")[0].checked;
		responseParameter.autoIssue = Ext.query("*[value=autoIssue]")[0].checked;
		responseParameter.notifySupervisor = Ext.query("*[value=notifySupervisor]")[0].checked;
		responseParameter.notifyCraftsperson = Ext.query("*[value=notifyCraftsperson]")[0].checked;
		responseParameter.scheduleimmediately = Ext.query("*[value=scheduleimmediately]")[0].checked;
		responseParameter.enforceNewWorkflow = Ext.query("*[value=enforceNewWorkflowCheckBox]")[0].checked;
		responseParameter.cfId = this.A_StepForm.getFieldValue('helpdesk_sla_response.cf_id');
		var duration = this.A_StepForm.getFieldValue('helpdesk_sla_response.default_duration');
		responseParameter.duration = valueExistsNotEmpty(duration) ? duration : 0;
		responseParameter.workTeam = this.A_StepForm.getFieldValue('helpdesk_sla_response.work_team_id');
		responseParameter.supervisor = this.A_StepForm.getFieldValue('helpdesk_sla_response.supervisor');
		if (responseParameter.workflowTemplate == 0) {
			responseParameter.workflowName = SLA_getAutoWorkflowName(responseParameter);
		}
		
		responseParameter.autoSchedule = valueExistsNotEmpty(responseParameter.cfId) ? true : false;
		
		if(responseParameter.autoIssue){
			responseParameter.autoSchedule = true;
		}
		
		responseParameter.autoDispatch = (valueExistsNotEmpty(responseParameter.workTeam)|| responseParameter.supervisor) ? true : false;
	},

	/**
	 * Refresh summary form in this tab
	 */
	refreshSlaSummary : function() {
		if (this.requestTabs.selectedTabName == 'workflowTab') {
			jQuery('#summaryForm2').empty();
			jQuery('#summaryForm').clone().appendTo('#summaryForm2');
		}
	},

	/**
	 * Save Workflow template
	 */
	saveWorkflowTemplate : function() {
		this.updateResponseParameters();
		if (this.validateForm()) {
			View.currentResponseParameter = this.getResponseParameterByLevel(this.currentPriorityLevel);
			
			//KB3040804 - select template base on problem type, Form PM SLA, only show PM template, for On Demand SLA, only show On Demand template 
			var restriction = "EXISTS(SELECT 1 FROM helpdesk_sla_request WHERE helpdesk_sla_request.prob_type != 'PREVENTIVE MAINT' " +
			"AND helpdesk_sla_request.activity_type = helpdesk_sla_response.activity_type AND helpdesk_sla_request.ordering_seq = helpdesk_sla_response.ordering_seq)";
			
			if('PREVENTIVE MAINT' == View.controllers.get('editDetailsWizard').selectedSLA.requestParameters.probType){
				restriction = "EXISTS(SELECT 1 FROM helpdesk_sla_request WHERE helpdesk_sla_request.prob_type = 'PREVENTIVE MAINT' " +
				"AND helpdesk_sla_request.activity_type = helpdesk_sla_response.activity_type AND helpdesk_sla_request.ordering_seq = helpdesk_sla_response.ordering_seq)";
			}
			
			View.openDialog('ab-bldgops-sla-def-workflow-template.axvw', restriction, false, {
				width : 600,
				height : 400,
				closeButton : false
			});
		}
	},

	/**
	 * find workflow template to pre-fill
	 */
	findWorkflowPreFill : function() {
		View.preFillParentController = this;
		View.isSelectTemplateValue = true;
		var title = getMessage('prefillWorkflow');
		
		//KB3040804 - select template base on problem type, Form PM SLA, only show PM template, for On Demand SLA, only show On Demand template 
		var restriction = "EXISTS(SELECT 1 FROM helpdesk_sla_request WHERE (helpdesk_sla_request.prob_type is null or helpdesk_sla_request.prob_type != 'PREVENTIVE MAINT') " +
		"AND helpdesk_sla_request.activity_type = helpdesk_sla_response.activity_type AND helpdesk_sla_request.ordering_seq = helpdesk_sla_response.ordering_seq)";
		
		if('PREVENTIVE MAINT' == View.controllers.get('editDetailsWizard').selectedSLA.requestParameters.probType){
			
			title = getMessage('prefillPmWorkflow');
			
			restriction = "EXISTS(SELECT 1 FROM helpdesk_sla_request WHERE helpdesk_sla_request.prob_type = 'PREVENTIVE MAINT' " +
			"AND helpdesk_sla_request.activity_type = helpdesk_sla_response.activity_type AND helpdesk_sla_request.ordering_seq = helpdesk_sla_response.ordering_seq)";
		}
		
		View.openDialog('ab-bldgops-sla-od-wf-pre-fill.axvw', restriction, false, {
			title : title,
			width : 1000,
			height : 600,
			closeButton : false
		});
	},

	/**
	 * After pre-fill the workflow from template
	 */
	afterPreFillWorkFlowTemplate : function(responseParameter) {
		var currentResponseParameter = this.getResponseParameterByLevel(this.currentPriorityLevel);
		currentResponseParameter.copyWorkflowParameters(responseParameter);
		this.loadPriorityLevel(this.currentPriorityLevel);
	},

	/**
	 * remove workflow template
	 */
	removeWorkflowTemplate : function() {
		this.updateResponseParameters();
		var responseParameter = this.getResponseParameterByLevel(this.currentPriorityLevel);
		responseParameter.workflowTemplate = '0';
		this.showFieldValues(responseParameter);
	},

	/**
	 * Check auto issue
	 */
	checkAutoCreateWorkOrder : function(checked) {
		var controller = this;
		var responseParameter = controller.getResponseParameterByLevel(controller.currentPriorityLevel);
		// If auto create work order, REMOVE the steps of status A
		if (checked) {
			var confirmMessage = getMessage("removeStepsA");

			View.confirm(confirmMessage, function(button) {
				if (button == 'yes') {
					var workflowSteps = responseParameter.workflowSteps;
					var tempArray = [];
					for ( var i = 0; i < workflowSteps.length; i++) {
						var workflowStep = workflowSteps[i];
						if (workflowStep.basicStatus == 'A') {

						} else {
							tempArray.push(workflowSteps[i]);
						}
					}
					responseParameter.workflowSteps = tempArray;
					responseParameter.autoCreateWo = true;
					View.controllers.get('onDemandWorkflowTabStep').showOptionalSteps(responseParameter);
				} else {
					Ext.query("*[value=autoCreateWo]")[0].checked = false;
				}
			});
		} else {
			responseParameter.autoCreateWo = false;
			View.controllers.get('onDemandWorkflowTabStep').showOptionalSteps(responseParameter);
		}
	},

	/**
	 * Check auto issue
	 */
	checkAutoIssue : function(checked) {
		var controller = this;
		var responseParameter = controller.getResponseParameterByLevel(controller.currentPriorityLevel);
		// for on demand SLA, REMOVE the steps of status AA if auto issued selected
		if (checked && 'PREVENTIVE MAINT' != View.controllers.get('editDetailsWizard').selectedSLA.requestParameters.probType) {
			var confirmMessage = getMessage("removeStepsAA");
			var workRequestsOnly = View.activityParameters['AbBldgOpsOnDemandWork-WorkRequestsOnly'];
			if (workRequestsOnly == '1') {
				confirmMessage = getMessage("removeStepsA")
			}

			View.confirm(confirmMessage, function(button) {
				if (button == 'yes') {
					var workflowSteps = responseParameter.workflowSteps;
					var tempArray = [];
					for ( var i = 0; i < workflowSteps.length; i++) {
						var workflowStep = workflowSteps[i];
						if (workflowStep.basicStatus == 'A' || workflowStep.basicStatus == 'AA') {

						} else {
							tempArray.push(workflowSteps[i]);
						}
					}
					responseParameter.workflowSteps = tempArray;
					responseParameter.autoIssue = true;
					View.controllers.get('onDemandWorkflowTabStep').showOptionalSteps(responseParameter);
				} else {
					Ext.query("*[value=autoIssue]")[0].checked = false;
				}
			});
		} else {
			if ('PREVENTIVE MAINT' != View.controllers.get('editDetailsWizard').selectedSLA.requestParameters.probType) {
				responseParameter.autoIssue = false;
				View.controllers.get('onDemandWorkflowTabStep').showOptionalSteps(responseParameter);
			}
		}
	},

	/**
	 * check application paramter WorkRequestsOnly to determin whether showing Assign to Work order status
	 */
	checkWorkRequestsOnly : function(checked) {
		var workRequestsOnly = View.activityParameters['AbBldgOpsOnDemandWork-WorkRequestsOnly'];
		if (workRequestsOnly == '1') {
			Ext.fly('AA_StepForm_layoutWrapper').setDisplayed(false);
			// hide autoCreateWo option
			Ext.fly(Ext.query("*[value=autoCreateWo]")[0]).parent().setDisplayed(false);
		}
	},

	/**
	 * Called before click select value of cf_id
	 */
	beforeSelectCf : function(command) {
		var restriction = this.getSelectCfRestriction();
		command.dialogRestriction = restriction;
	},
	
	/**
	 * Get select cf restriction.
	 */
	getSelectCfRestriction : function() {
		var form = this.A_StepForm;

		// get work team and supervisor
		var workTeamId = form.getFieldValue("helpdesk_sla_response.work_team_id").toUpperCase();
		var supervisor = form.getFieldValue("helpdesk_sla_response.supervisor").replace(/\'/g, "''").toUpperCase();

		// give restriction base on value of work team and supervisor
		//KB3016857 -Allow craftspersons to be members of more than one team		
		var restriction = "cf.assign_work = 1";
		if (workTeamId) {
			
			if(Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-checkSchemaExisting','cf_work_team', 'cf_id').value){
			    restriction += " AND EXISTS(SELECT 1 FROM cf_work_team where cf_work_team.cf_id = cf.cf_id and cf_work_team.work_team_id='" + workTeamId + "')";
		    }else{
		    	restriction += " AND cf.work_team_id='" + workTeamId + "'";
		    }

		} else if (supervisor) {

			if(Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-checkSchemaExisting','cf_work_team', 'cf_id').value){
			    restriction += " and cf.cf_id IN (SELECT cf_work_team.cf_id FROM cf_work_team WHERE cf_work_team.work_team_id IN (SELECT cf_work_team.work_team_id FROM cf_work_team,cf where cf_work_team.cf_id = cf.cf_id and cf.email= (SELECT email FROM em WHERE em_id = '" + supervisor + "')))";
		    }else{
		    	restriction += " AND cf.work_team_id = (SELECT work_team_id FROM cf WHERE email = (SELECT email FROM em WHERE em_id = '" + supervisor + "'))";
		    }

		}
		
		return restriction;
	}

});


/**
 * Over write core API to make sure typing cf field can get correct restriction.
 */
Ab.form.Field.prototype.afterChange = function() {
	//KB3044529 - There is no restriction for typing a craftsperson of a team in sla definition
	if(this.fieldDef.id == 'helpdesk_sla_response.work_team_id' || this.fieldDef.id == 'helpdesk_sla_response.supervisor'){
		var onDemandWorkflowTabController = View.controllers.get('onDemandWorkflowTab');
		onDemandWorkflowTabController.A_StepForm.fields.get("helpdesk_sla_response.cf_id").actions.get(0).config.commands[0].dataSource = 'cfSelectValueDS';
		onDemandWorkflowTabController.A_StepForm.fields.get("helpdesk_sla_response.cf_id").actions.get(0).config.commands[0].restriction =  onDemandWorkflowTabController.getSelectCfRestriction();
	}
	
    if (this.config.controlType === 'multiEdit') {
        // auto-grow height for multi-edit fields
        if (this.dom.clientHeight < this.dom.scrollHeight) {
            this.dom.style.height = this.dom.scrollHeight + "px";
            if (this.dom.clientHeight < this.dom.scrollHeight) {
                this.dom.style.height = (this.dom.scrollHeight * 2 - this.dom.clientHeight) + "px";
            }
        }
    }
}