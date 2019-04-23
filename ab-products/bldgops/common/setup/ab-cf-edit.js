/**
 * Controller for the Craftperson Edit.
 */
var craftpersonEditCtrl = View.createController('craftpersonEditCtrl', {
	
	/**
	 * Maps DOM events to event listeners.
	 */
	events : {

		/**
		 * Event handler for Indicate on Drawing.
		 * 
		 * @param event
		 */
		"click #editMultipleTeams" : 'editMultipleTeams'

	},
	
	
	isMultipleTeams: false,
	isCheckMultipleTeams: false,
	oldEmail: null,
	addSelectIsSupervisorEvent: false,

	afterInitialDataFetch: function() {
		var isAdminstratorRole = this.checkAdministratorRole.getRecords().length>0;
		if(isAdminstratorRole){
			//attache 'onchange' event to check-box 'Auto Create User'
	        var autoCreateUser = Ext.get('detailsPanel_autoCreateUser');
			autoCreateUser.on('change', this.onAutoCreateUser.createDelegate(this));
			
		}else{
			jQuery('#detailsPanel_autoCreateUser_labelCell').hide();
			jQuery('#detailsPanel_autoCreateUser_fieldCell').hide();
		}
		
		this.detailsPanel.enableFieldActions("cf.email", false);
		this.user.getFieldElement('afm_users.user_pwd').disabled = true;
	},
	
	 /**
     * Check if multiple teams feature support.
     */
	checkMultileTeams: function() {
		var UseBldgOpsConsole =  View.activityParameters['AbBldgOpsOnDemandWork-UseBldgOpsConsole'];
		if(UseBldgOpsConsole == '1' && !this.isCheckMultipleTeams){
			this.isMultipleTeams = Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-checkSchemaExisting','cf_work_team', 'cf_id').value;
			this.isCheckMultipleTeams = true;
		}
		
		if(this.isMultipleTeams){
			jQuery('#detailsPanel_cf\\.work_team_id_labelCell').hide();
			jQuery('#detailsPanel_cf\\.work_team_id_fieldCell').hide();
			
			if(!this.detailsPanel.newRecord){
				var cfId = this.detailsPanel.getFieldValue('cf.cf_id');
				var workTeamId = this.detailsPanel.getFieldValue('cf.work_team_id');
				var teamsText = workTeamId;
				
				var restriction = new Ab.view.Restriction();
				restriction.addClause('cf_work_team.cf_id', cfId);
				var teams = this.cfWorkTeamDS.getRecords(restriction);
				for(var i=0;i<teams.length;i++){
					var team = teams[i].getValue('cf_work_team.work_team_id');
					if(team!=workTeamId){
						teamsText+="\n"+team;
					}
				}
				
				jQuery('#multiple_teams_field').val(teamsText);
				jQuery('#editMultipleTeams').show();
				jQuery('#multi_teams_message').hide();
				
				
			}else{
				jQuery('#multiple_teams_field').val('');
				jQuery('#editMultipleTeams').hide();
				jQuery('#multi_teams_message').show();
			}
			
	    }else{
	    	jQuery('#detailsPanel_workTeams_labelCell').hide();
			jQuery('#detailsPanel_workTeams_fieldCell').hide();
	    }		
		
	},

    /**
     * Un-check the autoCreateUser when the details panel is loaded.
     */
	detailsPanel_afterRefresh: function() {
		var autoCreateUser =  document.getElementById("detailsPanel_autoCreateUser");
		autoCreateUser.checked=false;
		jQuery('#cf\\.email\\.required_star').remove();
		this.checkMultileTeams();
		
		if(!this.detailsPanel.newRecord){
			this.oldEmail = this.detailsPanel.getFieldValue('cf.email');
		}else{
			this.oldEmail = null;
		}
		
		if(!this.addSelectIsSupervisorEvent){
			if(Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-checkSchemaExisting','cf', 'cf_change_wr').value){
				jQuery('#detailsPanel_cf\\.is_supervisor').change(function(){
					craftpersonEditCtrl.onSelecIsSupervisor(jQuery(this).val());
				});
			}
			
			this.addSelectIsSupervisorEvent = true;
		}
	},
	
	  /**
     * On select is_supervisor select event.
     */
	onSelecIsSupervisor: function(value) {
		if(this.detailsPanel.newRecord){
			if(value == '1'){
				this.detailsPanel.setFieldValue('cf.cf_change_wr',"1");
				this.detailsPanel.setFieldValue('cf.cf_unschedule',"1");
			}else{
				this.detailsPanel.setFieldValue('cf.cf_change_wr',"0");
				this.detailsPanel.setFieldValue('cf.cf_unschedule',"0");
			}
			
		}
    },

    /**
     * Show or Hide user form when check/uncheck 'Auto Create User'.
     */
    onAutoCreateUser: function() {
		if ( $('autoCreateUser').checked ) {
			this.user.show(true);
			this.user.refresh(null,true);
			this.onChangeRole();
			jQuery('#detailsPanel_cf\\.email_labelCell').append('<span id="cf.email.required_star" class="required" name="cf.email.required_star">*</span>');
		} 	
		else{
			jQuery('#cf\\.email\\.required_star').remove();
			this.user.show(false);
		} 
			
    },
    
    user_afterRefresh: function() {
		var username = this.user.getFieldValue('afm_users.user_name');
		var isAdd = (username === '');
		var passwordField = this.user.getFieldElement('afm_users.user_pwd');
		var passwordRow = Ext.get(passwordField.parentNode.parentNode);
    	passwordRow.setDisplayed(!isAdd);
	},

    /**
     * Set role name according to choice of 'Is Supervisor'.
     */
  	onChangeRole: function() {
  		if ( this.detailsPanel.getFieldValue('cf.is_supervisor')==1 ) 
			this.user.setFieldValue('afm_users.role_name', 'OPS SUPERVISOR (ACP)'); 
		else 
			this.user.setFieldValue('afm_users.role_name', 'OPS CRAFTSPERSON (ACP)');
	},

    /**
     * Save craftperson, user and employee in sequence.
     */
  	detailsPanel_onSave: function() {
  		var email = this.detailsPanel.getFieldValue("cf.email");
  		var autoCreatedUser = $('autoCreateUser').checked;
  		if(autoCreatedUser && !valueExistsNotEmpty(email)){
  			View.alert(getMessage('noEmail'));
  			return;
  		}
  		
		this.user.setFieldValue ('afm_users.email', email);
		if (this.detailsPanel.save()) {
			this.confirmEmailChangeOfEmAndUser(email);
			this.treePanel.refresh();			
			this.createUser(autoCreatedUser);
			this.oldEmail = email;
		}
	},
	
	/**
	 * Confirm email change of em and user.
	 */
	confirmEmailChangeOfEmAndUser : function(newEmail) {
		if (newEmail && this.oldEmail != newEmail) {
			var userRecords = this.userDs.getRecords("email='" + this.oldEmail + "'");
			var emRecords = this.employeeDs.getRecords("email='" + this.oldEmail + "'");
			if ((userRecords.length > 0 || emRecords.length > 0) && confirm(getMessage('confirmChangeLinkedEmail'))) {
				if (userRecords.length > 0) {
					var userRecord = userRecords[0];
					userRecord.setValue('afm_users.email', newEmail);
					userRecord.isNew = false;
					this.userDs.saveRecord(userRecord);
				}

				if (emRecords.length > 0) {
					var emRecord = emRecords[0];
					emRecord.setValue('em.email', newEmail);
					emRecord.isNew = false;
					this.employeeDs.saveRecord(emRecord);
				}
			}
		}
	},
	
	/**
	 * Create user if not exist.
	 */
   	createUser: function(autoCreatedUser) {
   		if (autoCreatedUser && !this.checkUserExisting()) {
			this.user.save() 
			this.createEmployee();
		}
	},
	
	/**
     * check user exist or not.
     */
	checkUserExisting: function() {
		var email = this.detailsPanel.getFieldValue("cf.email");
		if(this.userDs.getRecords("email='"+email+"'").length > 0){
			View.showMessage(getMessage('existsUser'));
			return true;
		}
		
		return false;
	},

    /**
     * Create employee if not exist.
     */
   	createEmployee: function() {
		var createEmployee = $('autoCreateEm').checked;
		if (createEmployee) {
			var em_id = this.user.getFieldValue('afm_users.user_name');
			var email = this.detailsPanel.getFieldValue('cf.email');
			var record = null;
			
			var restriction = new Ab.view.Restriction();
			restriction.addClause('em.em_id', em_id);
			var records = this.employeeDs.getRecords(restriction);
			
			if (records.length == 0) {
				// create new employee record with same user_name
				record = new Ab.data.Record();
				record.setValue('em.em_id', em_id);					
			}
			else {
				record = records[0];
			}
			record.setValue('em.email', email);
			this.employeeDs.saveRecord(record);
		}
	},
	
	editMultipleTeams: function() {
		var cfId = this.detailsPanel.getFieldValue('cf.cf_id');
		View.currentCfId = cfId;
		View.openDialog('ab-cf-edit-multiple-teams-dialog.axvw');
	}
});