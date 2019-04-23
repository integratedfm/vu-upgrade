/**
 * Controller for the Operation Console filter restriction
 */
var opsConsoleFilterRestrictionController = View.createController('opsConsoleFilterRestrictionController', {

	/**
	 * Client restriction
	 */	
	clientRestriction: "(wr.requestor = ${sql.literal(user.employee.id)})",
	
	/**
	 * isWorkTeamSelfAssignSql
	 */	
	isWorkTeamSelfAssignSql: '1=0',
	
	/**
	 * isRequestCraftspersonSql
	 */	
	isRequestCraftspersonSql: "(wr.status IN ('I','HA','HP','HL','Rej')  AND  EXISTS(SELECT 1 FROM wrcf WHERE wrcf.wr_id = wr.wr_id and (wrcf.cf_id IN (select cf.cf_id from cf where cf.email = ${sql.literal(user.email)})"
		+ "   OR wrcf.cf_id${sql.concat}'craftsperson' IN(${parameters['cfWorkflowSubstitutes']}))"
		+ "))",
	
	/**
	 * Craftsperson restriction
	 * KB3027463 - Show work request with status AA if work_team.cf_assign = 1 (SELF_ASSIGN_RESTRICTION)
	 * (2014-3-11) KB3016857 -Allow craftspersons to be members of more than one team
	 */	
	craftspersonRestriction: "((SELF_ASSIGN_RESTRICTION)"
		+ " OR (wr.status IN ('I','HA','HP','HL') AND  EXISTS(SELECT 1 FROM wrcf WHERE wrcf.wr_id = wr.wr_id and (wrcf.cf_id IN (select cf.cf_id from cf where cf.email = ${sql.literal(user.email)})"
		+ "   OR wrcf.cf_id${sql.concat}'craftsperson' IN(${parameters['cfWorkflowSubstitutes']}))"
		+ ")))",
	
	/**
	 * Step completer restriction
	 */	
	stepCompleterRestriction: "(EXISTS(SELECT 1 FROM wr_step_waiting where wr_step_waiting.wr_id=wr.wr_id and wr_step_waiting.status = wr.status"
		+ " AND ( wr_step_waiting.role_name = ${sql.literal(user.role)} OR wr_step_waiting.user_name = ${sql.literal(user.name)}"
		+ "     OR wr_step_waiting.em_id = ${sql.literal(user.employee.id)} "
		+ "     OR wr_step_waiting.em_id${sql.concat}wr_step_waiting.step_type IN (${parameters['emWorkflowSubstitutes']}))))",
        
    /**
	 * Supervisor restriction
	 * (2014-3-11) KB3016857 -Allow craftspersons to be members of more than one team
	 */	
	supervisorRestriction: "(wr.supervisor =  ${sql.literal(user.employee.id)} "
		+" OR (wr.supervisor IS NULL AND wr.work_team_id IN (WR_WORK_TEAM_RESTRICTION cf.email = ${sql.literal(user.email)}))"
		+" OR wr.supervisor${sql.concat}'supervisor' IN (${parameters['emWorkflowSubstitutes']})"
    	+" OR (wr.supervisor IS NULL AND wr.work_team_id IN (WR_WORK_TEAM_RESTRICTION cf.email IN (SELECT email FROM em WHERE em_id${sql.concat}'supervisor' IN (${parameters['emWorkflowSubstitutes']})))))",
        
	/**
	 * permanent restriction determined by role
	 */
	permanentRestriction : '1=1',
	
	/**
	 * filter restriction in console
	 */
	filterRestriction : '1=1',
	
	/**
	 * Controller for the category grid (ie.opsConsoleWrListController)
	 */
	wrListController : null,
	
	/**
	 * Check schema and set restriction base on schema.
	 */
	checkSchemaAndSetRestriction : function() {
		var selfAssignRestriction = ' 1=0 ';
		if(Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-checkSchemaExisting','work_team', 'cf_assign').value){
			this.isWorkTeamSelfAssignSql = "  NOT EXISTS(SELECT 1 FROM wrcf WHERE wrcf.wr_id = wr.wr_id) AND" 
			+ " (EXISTS (SELECT 1 FROM cf,cf_work_team WHERE cf.cf_id = cf_work_team.cf_id and cf.is_supervisor = 0 and cf.email = ${sql.literal(user.email)} and cf_work_team.work_team_id = wr.work_team_id)) AND"
			+ " wr.status = 'AA' AND exists (SELECT 1 FROM cf,cf_work_team,work_team WHERE  cf.cf_id = cf_work_team.cf_id and cf_work_team.work_team_id = work_team.work_team_id and work_team.cf_assign= 1 and cf_work_team.work_team_id = wr.work_team_id and cf.email  =${sql.literal(user.email)}) ";
		}
		
		var wrWorkTeamRestriction = ' select cf.work_team_id from cf where ';
		if(Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-checkSchemaExisting','cf_work_team', 'cf_id').value){
			wrWorkTeamRestriction =  " select cf_work_team.work_team_id from cf,cf_work_team WHERE cf.cf_id = cf_work_team.cf_id and  ";
		}
		
		this.craftspersonRestriction = this.craftspersonRestriction.replace('SELF_ASSIGN_RESTRICTION', this.isWorkTeamSelfAssignSql);
		this.supervisorRestriction = this.supervisorRestriction.replaceAll('WR_WORK_TEAM_RESTRICTION', wrWorkTeamRestriction);
		
		//KB3047261 - load pending steps based on application parameter
		var BldgOpsConsoleLoadPendingSteps = View.activityParameters['AbBldgOpsOnDemandWork-BldgOpsConsoleLoadPendingSteps'];
		if(typeof BldgOpsConsoleLoadPendingSteps == 'undefined' || (valueExists(BldgOpsConsoleLoadPendingSteps) && BldgOpsConsoleLoadPendingSteps == '1')){
			if(Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-checkSchemaExisting','helpdesk_step_log', 'rejected_step').value){
				this.wrList.addParameter('rejectedStatusField', 'wr_step_waiting.rejected_step');
			}
		}
		
	},
	
	/**
	 * After view loads
	 */
	afterViewLoad : function() {
		this.wrListController = View.controllers.get('opsConsoleWrListController');
		this.setWorkflowSubstitutes();
	},
	
	/**
	 * Set workflow substitutes
	 */
	setWorkflowSubstitutes : function() {
		this.wrList.addParameter('emWorkflowSubstitutes', Workflow.callMethod('AbBldgOpsHelpDesk-RequestsService-getWorkflowSubstitutes','em_id').message);
		this.wrList.addParameter('cfWorkflowSubstitutes', Workflow.callMethod('AbBldgOpsHelpDesk-RequestsService-getWorkflowSubstitutes','cf_id').message);
	},
	
	/**
	 * set permanent restriction by role
	 */
	setPermanentRestrictionByRole : function(roleName) {
		// get what to show
		var whatToShow = this.getWhatToShow(roleName);
		
		if (whatToShow == 'myApproved') {
			// add permanentRestriction
			this.wrList.addParameter('permanentRestriction', '1=1');
			return;
		}
		
		this.permanentRestriction = this.clientRestriction + " OR " + this.craftspersonRestriction;

		if (roleName == 'supervisor') {

			this.permanentRestriction = this.permanentRestriction + " OR " + this.supervisorRestriction;

		}
		
		//KB3047261 - load pending steps based on application parameter
		var BldgOpsConsoleLoadPendingSteps = View.activityParameters['AbBldgOpsOnDemandWork-BldgOpsConsoleLoadPendingSteps'];
		if(typeof BldgOpsConsoleLoadPendingSteps == 'undefined' || (valueExists(BldgOpsConsoleLoadPendingSteps) && BldgOpsConsoleLoadPendingSteps == '1')){
			this.permanentRestriction = this.permanentRestriction + " OR " + this.stepCompleterRestriction;
			this.wrList.addParameter('leftJoinPendingSteps', "LEFT OUTER JOIN wr_step_waiting ON wr.wr_id=wr_step_waiting.wr_id AND (wr_step_waiting.role_name = ${sql.literal(user.role)} OR wr_step_waiting.user_name = ${sql.literal(user.name)} OR wr_step_waiting.em_id${sql.concat}wr_step_waiting.step_type IN (${parameters['emWorkflowSubstitutes']}))");
		}else{
			if (whatToShow == 'pendingSteps') {
				this.permanentRestriction = this.permanentRestriction + " OR " + this.stepCompleterRestriction;
				this.wrList.addParameter('leftJoinPendingSteps', "LEFT OUTER JOIN wr_step_waiting ON wr.wr_id=wr_step_waiting.wr_id AND (wr_step_waiting.role_name = ${sql.literal(user.role)} OR wr_step_waiting.user_name = ${sql.literal(user.name)} OR wr_step_waiting.em_id${sql.concat}wr_step_waiting.step_type IN (${parameters['emWorkflowSubstitutes']}))");
				this.wrList.addParameter('stepWaiting', "wr_step_waiting.step");
				this.wrList.addParameter('stepWaitingType', "wr_step_waiting.step_type");
				this.wrList.addParameter('stepWaitingCode', "wr_step_waiting.step_log_id");
				if(Workflow.callMethod('AbBldgOpsOnDemandWork-WorkRequestService-checkSchemaExisting','helpdesk_step_log', 'rejected_step').value){
					this.wrList.addParameter('rejectedStatusField', 'wr_step_waiting.rejected_step');
				}
				
			}else{
				//remove the pending steps in the query
				this.wrList.addParameter('leftJoinPendingSteps', "");
				this.wrList.addParameter('stepWaiting', "''");
				this.wrList.addParameter('stepWaitingType', "''");
				this.wrList.addParameter('stepWaitingCode', "null");
				this.wrList.addParameter('rejectedStatusField', "''");
			}
		}

		this.permanentRestriction = "(" + this.permanentRestriction + ")";

		this.setPermanentRestriction();
	},
	
	/**
	 * set permanent restriction
	 */
	setPermanentRestriction : function() {
		this.wrList.addParameter('permanentRestriction', this.permanentRestriction);
	},

	/**
	 * Set parameters based on filter selections.
	 */
	setFilterRestriction : function() {
		// role name
		var roleName = View.controllers.get('opsExpressConsoleCtrl').roleName;
		if (roleName == 'supervisor') {
			this.wrList.addParameter('isRequestSupervisorSql', this.supervisorRestriction);
			this.wrList.addParameter('isRequestCraftspersonSql', this.isRequestCraftspersonSql);
		} else if (roleName == 'craftsperson') {
			
			this.wrList.addParameter('isRequestCraftspersonSql', this.isRequestCraftspersonSql);
			this.wrList.addParameter('isWorkTeamSelfAssignSql', this.isWorkTeamSelfAssignSql);
			
		}
		
		//set permanent restriction
		this.setPermanentRestrictionByRole(roleName);

		// get filter restrictions
		var restriction = this.getFilterRestriction();
		this.filterRestriction = ' 1=1 ' + " and " + restriction;

		// get what to show
		var whatToShow = this.getWhatToShow(roleName);
				
		//KB3047261 - load pending steps based on application parameter
		var BldgOpsConsoleLoadPendingSteps = View.activityParameters['AbBldgOpsOnDemandWork-BldgOpsConsoleLoadPendingSteps'];
		if(valueExists(BldgOpsConsoleLoadPendingSteps) && BldgOpsConsoleLoadPendingSteps == '0' && whatToShow == 'pendingSteps'){
			this.filterRestriction += " AND EXISTS(SELECT 1 FROM wr_step_waiting where wr_step_waiting.wr_id=wr.wr_id AND (wr_step_waiting.role_name = ${sql.literal(user.role)} OR wr_step_waiting.user_name = ${sql.literal(user.name)} OR wr_step_waiting.em_id${sql.concat}wr_step_waiting.step_type IN (${parameters['emWorkflowSubstitutes']}))) ";
		}

		// apply appropriate record limit for "top 10", "last 10", "all"
		this.wrList.recordLimit = (whatToShow == 'newest' || whatToShow == 'oldest' || whatToShow == 'near') ? 10 : 0;

		// set appropriate parameters based on whatToShow selection
		this.setParameterBaseOnWhatToShow(whatToShow);

		// add filter restriction
		this.wrList.addParameter('where', this.filterRestriction);

		// get what to group
		var whatToGroup = this.getWhatToGroup(roleName);

		// set group by configuration
		this.setGroupByConfiguration(whatToGroup, whatToShow);

		// determine what columns to show, based on what to group
		this.determineColumnsToShow(whatToGroup);
	},

	/**
	 * Set parameters based on url parameter.
	 */
	setUrlRestriction : function() {
		var urlRestriction = '1=1';
		if(valueExists(window.location.parameters)){
			var code = window.location.parameters["code"];
			if (valueExists(code)) {
				urlRestriction += " AND wr_step_waiting.step_code='" + code + "'";
			}

			var activityLogId = window.location.parameters["activity_log_id"];
			if (valueExists(activityLogId)) {
				urlRestriction += " AND wr.activity_log_id=" + activityLogId;
			}

			var wrId = window.location.parameters["wr_id"];
			if (valueExists(wrId)) {
				urlRestriction += " AND wr.wr_id=" + wrId;
			}
		}
		
		this.wrList.addParameter('urlRestriction', urlRestriction);
	},
	
	/**
	 * Get restriction from filter fields.
	 */
	getFilterRestriction : function() {
		var filterRestriction = '1=1';
		var probTypeRes = this.getProbTypeRes();
		var workTypeRes = this.getWorkTypeRes();
		var statusRes = this.getStatusRes();
		var partStatusRes = this.getPartStatusRes();
		var costRes = this.getCostRes();
		var dateRequiredRes = this.getDateRes('wr.date_requested');
		var dateAssignedRes = this.getDateRes('wr.date_assigned');
		var priorityRes = this.getPriorityRes();
		var escalatedRes = this.getEscalatedRes();
		var returnedRes = this.getReturnedRes();
		var descriptionRes = this.getDescriptionRes();

		filterRestriction += probTypeRes + workTypeRes + statusRes + partStatusRes+ costRes + dateRequiredRes + dateAssignedRes 
		+ priorityRes + escalatedRes + returnedRes + descriptionRes + " AND " 
		+ this.addRestrictionFromFieldArray("bigBadFilter", 
				[ 'wrcf.cf_id', 'wrpt.part_id', 'eq.eq_std', 'wr.work_team_id','wr.dv_id', 'wr.dp_id', 'wr.eq_id', 'wr.wr_id', 'wr.wo_id', 'wr.requestor', 'wr.rm_id' , 'wrtr.tr_id','wr.pmp_id','wr.pms_id', 'wr.manager'  ]) 
				+ " AND " + this.addRestrictionFromFieldArray("wrFilter", [ 'wr.site_id','wr.bl_id', 'wr.fl_id']);

		return filterRestriction;
	},

	/**
	 * get problem type restriction in easy filter
	 */
	getProbTypeRes : function() {
		var probTypeRes = '';
		// work type
		var probTypes = this.wrFilter.getFieldMultipleValues('wr.prob_type');
		for ( var i = 0; i < probTypes.length; i++) {
			var probType = probTypes[i];
			if (probType != '') {
				probTypeRes += " OR wr.prob_type like '" + probType + "%'";
			}
		}

		if (probTypeRes) {

			probTypeRes = ' AND (' + probTypeRes.substring(3) + ')';

		}

		return probTypeRes;
	},

	/**
	 * get work type restriction in big filter
	 */
	getWorkTypeRes : function() {
		var workTypeRes = '';
		// work type
		var workType = this.getSelectBoxValue('bigBadFilter_worktype');
		if (workType == 'OD') {
			workTypeRes += " AND wr.prob_type != 'PREVENTIVE MAINT'";
		} else if (workType == 'PM') {
			workTypeRes += " AND wr.prob_type = 'PREVENTIVE MAINT'";
		}

		return workTypeRes;
	},

	/**
	 * get status restriction in big filter
	 */
	getStatusRes : function() {
		var statusRes = '';
		// status
		var statusValues = this.bigBadFilter.getCheckboxValues('wr.status');
		var statuses = [];
		for ( var i = 0; i < statusValues.length; i++) {
			var status = statusValues[i];
			if (status == 'H') {
				statuses.push('HA');
				statuses.push('HL');
				statuses.push('HP');
			} else {
				statuses.push(status);
			}
		}
		if (statuses.length > 0) {
			var statusInClause = "('" + statuses[0] + "'";
			for (i = 1; i < statuses.length; i++) {
				statusInClause += " ,'" + statuses[i] + "'";
			}
			statusInClause += ")";
			statusRes += " AND wr.status IN " + statusInClause;
		}

		return statusRes;
	},
	
	/**
	 * get part status restriction in big filter
	 */
	getPartStatusRes : function() {
		var statusRes = '';
		// status
		var statusValues = this.bigBadFilter.getCheckboxValues('wrpt.status');
		var statuses = [];
		for ( var i = 0; i < statusValues.length; i++) {
			var status = statusValues[i];
			statuses.push(status);
		}
		if (statuses.length > 0) {
			var statusInClause = "('" + statuses[0] + "'";
			for (i = 1; i < statuses.length; i++) {
				statusInClause += " ,'" + statuses[i] + "'";
			}
			statusInClause += ")";
			statusRes += " AND exists(select 1 from wrpt where wrpt.wr_id=wr.wr_id and wrpt.status IN " + statusInClause+')';
		}

		return statusRes;
	},

	/**
	 * get cost restriction in big filter
	 */
	getCostRes : function() {
		var costRes = '';
		// cost estimated
		var operator = this.getSelectBoxValue('bigBadFilter_operator');
		var cost = Ext.get('bigBadFilter_wr.cost_est_total').dom.value;
		if (operator != '') {
			if (operator == 'IS NULL' || operator == 'IS NOT NULL') {
				costRes += " AND wr.cost_est_total " + operator;
			} else if (cost != '') {
				costRes += " AND wr.cost_est_total " + operator + cost;
			}
		}

		return costRes;
	},

	/**
	 * get date field restriction in big filter
	 */
	getDateRes : function(dateFieldName) {
		var dateRes = '';
		var dateFrom = this.bigBadFilter.getFieldValue(dateFieldName + ".from");
		var dateTo = this.bigBadFilter.getFieldValue(dateFieldName + ".to");
		if (valueExistsNotEmpty(dateFrom) && valueExistsNotEmpty(dateTo)) {
			var objDateFrom = this.bigBadFilter.getDataSource().parseValue(dateFieldName + ".from", dateFrom, false);
			var objDateTo = this.bigBadFilter.getDataSource().parseValue(dateFieldName + ".to", dateTo, false);
		}

		// add the date comparison clauses
		if (valueExistsNotEmpty(dateFrom)) {
			dateRes += " AND " + dateFieldName + ">=${sql.date('" + dateFrom + "')}";
		}
		if (valueExistsNotEmpty(dateTo)) {
			dateRes += " AND " + dateFieldName + "<=${sql.date('" + dateTo + "')}";
		}

		return dateRes;
	},

	/**
	 * get priority restriction in big filter
	 */
	getPriorityRes : function() {
		var priorityRes = '';
		// priority
		var priorities = this.bigBadFilter.getCheckboxValues('wr.priority');
		if (priorities.length > 0) {
			var prioritiesClause = "(" + priorities[0];
			for (i = 1; i < priorities.length; i++) {
				prioritiesClause += " ," + priorities[i];
			}
			prioritiesClause += ")";
			priorityRes += " AND wr.priority IN " + prioritiesClause;
		}

		return priorityRes;
	},

	/**
	 * get escalated restriction in big filter
	 */
	getEscalatedRes : function() {
		var escalatedRes = '';
		// escalated
		var escalated = Ext.get('bigBadFilter_wr.escalated').dom.checked;
		if (escalated) {
			escalatedRes += " AND (activity_log.escalated_response = 1 OR activity_log.escalated_completion = 1)";
		}

		return escalatedRes;
	},
	
	/**
	 * get Returned restriction in big filter
	 */
	getReturnedRes : function() {
		var returnedRes = '';
		// returned
		var returned = Ext.get('bigBadFilter_wr.returned').dom.checked;
		if (returned) {
			returnedRes += " AND (exists(select 1 from wrcf where wrcf.wr_id = wr.wr_id and wrcf.status='Returned'))";
		}

		return returnedRes;
	},
	
	/**
	 * get description restriction in big filter
	 */
	getDescriptionRes : function() {
		var descriptionRes = '';
		// escalated
		var description = this.bigBadFilter.getFieldValue('wr.description');
		if(valueExistsNotEmpty(description)){
			
			if (description.length>1 && description.substring(0,1)=="'" && description.substring(description.length-1,description.length)=="'") {
				descriptionRes += " AND (wr.description='"+ description.substring(1,description.length-1).replace(/\'/g, "''")+"')";
			}else{
				descriptionRes += " AND (wr.description like '%"+ description.replace(/\'/g, "''")+"%')";
			}
		}

		return descriptionRes;
	},
	
	/**
	 * add restriction from field array
	 */
	addRestrictionFromFieldArray : function(panelId, fieldArray) {
		var restriction = '1=1';
		for ( var i = 0; i < fieldArray.length; i++) {
			var fieldName = fieldArray[i];
			var queryParameter = View.panels.get(panelId).getFieldQueryParameter(fieldName);

			if (queryParameter != " IS NOT NULL") {
				restriction += " AND ";

				if (fieldName == 'wrcf.cf_id') {
					restriction += ' EXISTS(SELECT 1 FROM wrcf WHERE wrcf.wr_id = wr.wr_id AND ' + fieldName + queryParameter + ')';
				} else if (fieldName == 'wrpt.part_id') {
					restriction += ' EXISTS(SELECT 1 FROM wrpt WHERE wrpt.wr_id = wr.wr_id AND ' + fieldName + queryParameter + ')';
				} else if (fieldName == 'wrtr.tr_id') {
					restriction += ' EXISTS(SELECT 1 FROM wrtr WHERE wrtr.wr_id = wr.wr_id AND ' + fieldName + queryParameter + ')';
				}else {
					restriction += fieldName + queryParameter;
				}
			}
		}

		return restriction;
	},

	/**
	 * get what to show base on role name
	 */
	getWhatToShow : function(roleName) {
		var whatToShowBoxId = 'wrFilter_wr_whatToShow';

		if (roleName == 'client' || roleName == 'approver' || roleName == 'step completer') {
			whatToShowBoxId = 'wrFilter_activity_log_whatToShow';
		}

		var whatToShow = this.getSelectBoxValue(whatToShowBoxId);
		this.wrFilter.getSidecar().set('whatToShow', whatToShow);
		this.wrFilter.getSidecar().save();

		return whatToShow;
	},

	/**
	 * get what to group base on role name
	 */
	getWhatToGroup : function(roleName) {
		var whatToGroupBoxId = 'wrFilter_wr_whatToGroup';

		if (roleName == 'client' || roleName == 'approver' || roleName == 'step completer') {
			whatToGroupBoxId = 'wrFilter_activity_log_whatToGroup';
		}

		var whatToGroup = this.getSelectBoxValue(whatToGroupBoxId);

		return whatToGroup;
	},

	/**
	 * Set parameter base on what to show selection
	 */
	setParameterBaseOnWhatToShow : function(whatToShow) {
		this.wrList.addParameter('sortBy', "ORDER BY wr.wr_id DESC");
		this.wrList.addParameter('top10', "TOP 100000");
		if (whatToShow == 'all') {
			this.wrList.addParameter('oracleTop10', "");
		} else if (whatToShow == 'esc') {
			this.wrList.addParameter('oracleTop10', "");
			this.filterRestriction += " AND (activity_log.escalated_completion = 1)";
		} else if (whatToShow == 'my') {
			this.wrList.addParameter('oracleTop10', "");
			this.filterRestriction += " AND (wr.requestor = '" + View.user.employee.id + "')";
		} else if (whatToShow == 'unassigned') {
			this.wrList.addParameter('oracleTop10', "");
			this.filterRestriction += " AND (wr.status IN ('A', 'AA') and not exists (select 1 from wrcf where wrcf.wr_id = wr.wr_id))";
		} else if (whatToShow == 'newest') {
			this.wrList.addParameter('top10', "TOP 10");
			this.wrList.addParameter('oracleTop10', " WHERE (rownum >=1 and rownum<=10 )");
			this.wrList.addParameter('sortBy', "ORDER BY wr.date_requested DESC, wr.time_requested DESC, wr.wr_id DESC");
		} else if (whatToShow == 'oldest') {
			this.wrList.addParameter('top10', "TOP 10");
			this.wrList.addParameter('oracleTop10', " WHERE (rownum >=1 and rownum<=10 )");
			this.wrList.addParameter('sortBy', "ORDER BY wr.date_requested ASC, wr.time_requested ASC, wr.wr_id ASC");
		} else if (whatToShow == 'near') {
			this.wrList.addParameter('top10', "TOP 10");
			this.wrList.addParameter('oracleTop10', " WHERE (rownum >=1 and rownum<=10 )");
			this.wrList.addParameter('sortBy', "ORDER BY wr.date_escalation_completion ASC, wr.time_escalation_completion ASC, wr.wr_id ASC");
			this.filterRestriction += " AND (wr.date_escalation_completion>=${sql.currentDate})";
		} else if (whatToShow == 'requiringMyApproval') {
			this.wrList.addParameter('oracleTop10', "");
			this.filterRestriction += " AND (EXISTS(SELECT 1 FROM wr_step_waiting where wr_step_waiting.step_type IN ('review','approval') AND wr_step_waiting.wr_id=wr.wr_id and wr_step_waiting.status = wr.status" 
				+ " AND ( wr_step_waiting.role_name = ${sql.literal(user.role)} OR wr_step_waiting.user_name = ${sql.literal(user.name)}"
				+ "     OR wr_step_waiting.em_id = ${sql.literal(user.employee.id)} "
				+ "     OR wr_step_waiting.em_id${sql.concat}wr_step_waiting.step_type IN (${parameters['emWorkflowSubstitutes']}))))";
		} else if (whatToShow == 'myApproved') {
			this.wrList.addParameter('oracleTop10', "");
			this.filterRestriction += " AND (wr.wr_id IN (SELECT pkey_value FROM helpdesk_step_log WHERE (table_name='wr' OR table_name='hwr')" + " AND (user_name =${sql.literal(user.name)} OR em_id =${sql.literal(user.employee.id)}) " + " AND helpdesk_step_log.date_response IS NOT NULL AND helpdesk_step_log.step_type IN ('review','approval')))";
		}
	},

	/**
	 * Set group by configuration based on group by datasource.
	 * 
	 * @param groupByDS
	 *            id of datasource for which to group by
	 */
	setGroupByConfiguration : function(groupByDS, whatToShow) {
		var showWithoutGroupings = (groupByDS == 'none') ? true : false;
		if (showWithoutGroupings == true) {

			// show without groupings (ie. as a regular grid)
			this.wrListController.groupBy = {
				fieldName : '',
				order : [],
				categoryDataSourceId : '',
				setCategoryDataSouceById : false,
				showWithoutGroupings : true
			};

		} else {

			// show as category grid
			var categoryDataSource = View.dataSources.get(groupByDS);
			var fieldName = categoryDataSource.fieldDefs.items[0].fullName;
			var order = [];

			if (groupByDS == 'statusDS') {
				order = this.wrListController.statusOrderArray;
			}

			this.wrListController.groupBy = {
				fieldName : fieldName,
				order : order,
				categoryDataSourceId : groupByDS,
				setCategoryDataSouceById : true,
				showWithoutGroupings : false,
				getStyleForCategory : this.wrListController.getStyleForCategory
			};
		}

		this.addGroupByStatusClause();
		this.wrList.setCategoryConfiguration(this.wrListController.groupBy);

		if (groupByDS == 'cfIdDS') {
			if (whatToShow == 'myApproved') {
				this.wrList.addParameter('mainTable', 'wrcf LEFT OUTER JOIN wrhwr wr ON wrcf.wr_id=wr.wr_id');
			} else {
				this.wrList.addParameter('mainTable', 'wrcf LEFT OUTER JOIN wr ON wrcf.wr_id=wr.wr_id');
			}

			this.wrList.addParameter('assignToSql', 'wrcf.cf_id');
			this.wrList.addParameter('assignToSqlOracle', 'wrcf.cf_id');
		} else {
			if (whatToShow == 'myApproved') {
				this.wrList.addParameter('mainTable', 'wrhwr wr');
			} else {
				this.wrList.addParameter('mainTable', 'wr');
			}
			this.wrList.addParameter('assignToSql', " CASE WHEN (select count(1) from wrcf  where wrcf.wr_id = wr.wr_id) > 1" + " THEN (select top 1 wrcf.cf_id${sql.concat}'...' from wrcf  where wrcf.wr_id = wr.wr_id)" + " ELSE (select wrcf.cf_id from wrcf  where wrcf.wr_id = wr.wr_id)  END ");
			this.wrList.addParameter('assignToSqlOracle', " CASE WHEN (select count(1) from wrcf  where wrcf.wr_id = wr.wr_id) > 1" + " THEN (select wrcf.cf_id${sql.concat}'...' from wrcf  where wrcf.wr_id = wr.wr_id and rownum = 1)" + " ELSE (select wrcf.cf_id from wrcf  where wrcf.wr_id = wr.wr_id)  END ");
		}

	},

	/**
	 * Grouping by status returns only certains statuses. Keep this consistant while changing the group by
	 */
	addGroupByStatusClause : function() {
		var statusClause = this.getArrayValuesAsInClause('wr.status', this.wrListController.statusOrderArray);
		if (this.filterRestriction != '1=1') {
			this.filterRestriction += "AND (" + statusClause + ")";
		} else {
			this.filterRestriction = statusClause;
		}
	},

	/**
	 * Get status order as an "IN" clause
	 * 
	 * @return statusClause
	 */
	getArrayValuesAsInClause : function(id, arr) {
		var clause = id + " IN(";
		for ( var i = 0; i < arr.length; i++) {
			if (i > 0) {
				clause += ", ";
			}
			clause += "'" + arr[i] + "'";
		}
		clause += ")";
		return clause;
	},

	/**
	 * Determine which columns to show/hide based on group by selection
	 * 
	 * @param groupByDS
	 *            id of datasource for which to group by
	 */
	determineColumnsToShow : function(groupBy) {
		this.showDefaultColumns();
		switch (groupBy) {
		case 'statusDS':
			this.wrList.showColumn('wr.status', false);
			break;

		case 'blIdDS':
			this.wrList.showColumn('wr.location', false);
			break;

		case 'probTypeDS':
			this.wrList.showColumn('wr.prob_type', false);
			break;

		default:

		}

		this.wrList.updateHeader();
	},

	/**
	 * Show prob_type, location, status columns as default
	 */
	showDefaultColumns : function() {
		this.wrList.showColumn('wr.prob_type', true);
		this.wrList.showColumn('wr.location', true);
		this.wrList.showColumn('wr.status', true);
	},

	/**
	 * Helper for getting the value of a drop down box
	 * 
	 * @param id
	 *            Id of the drop down
	 */
	getSelectBoxValue : function(id) {
		var el = Ext.get(id).dom;
		return el.options[el.selectedIndex].value;
	}

});

String.prototype.replaceAll = function(search, replacement){
	var i = this.indexOf(search);
	var object = this;
	
	while (i > -1){
		object = object.replace(search, replacement); 
		i = object.indexOf(search);
	}
	return object;
}