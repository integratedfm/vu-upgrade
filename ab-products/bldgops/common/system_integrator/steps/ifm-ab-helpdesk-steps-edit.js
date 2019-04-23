/**
 * @fileoverview Javascript functions for <a href='../../../../viewdoc/overview-summary.html#ab-helpdesk-steps-edit.axvw' target='main'>ab-helpdesk-steps-edit.axvw</a>
 */


function user_form_afterSelect(){
    if (View.state >= View.STATE_LAYOUT_COMPLETE) {
    	//fix KB3030141- call tab.loadView after the tab is showed to avoid blank page appear(Guo 2011/4/19)
    	// remove loadView of tabs control to avoid memory leak(Qiang).
    	var tabs  = View.getControlsByType(parent, 'tabs')[0];
    	//IFM Added 
    	stepEditController.tabs = tabs
    	var step_form = View.getControl('', 'step_form');
    	step_form.refresh(tabs.selectedRestriction, tabs.newRecord);
    	showPanelsByStep(step_form.getFieldValue("afm_wf_steps.step_type"));
    }
}

var stepEditController = View.createController('stepEdit', {

    /**
     * Called chan form is loading<br />
     * If the form is loading an existing record <a href='#getFieldsAndStatusList>show status selection and (optional) list of form fields to enter</a><br />
     * Else hide bottom panel
     */
    afterInitialDataFetch: function(){
        this.onInitialData();
        this.translateLables();
    },
    
    onInitialData: function(){
        hidePanels();
        if (!this.step_form.newRecord) {
            var stepType = this.step_form.getFieldValue("afm_wf_steps.step_type");
			this.step_form.setFieldValue('afm_wf_steps.step',this.tabs.step_key_value);
			this.step_form.record.setValue('afm_wf_steps.step', this.tabs.step_key_value);
            showPanelsByStep(stepType);
            getFieldsAndStatusList(this.step_form.getFieldValue("afm_wf_steps.activity_id"));
        }
    },
    
    translateLables: function(){
        document.getElementById("spanTestFor").innerHTML = getMessage("spanTestFor");
        document.getElementById("spanId").innerHTML = getMessage("spanId");
        document.getElementById("btnTest").value = getMessage("btnTest");
        document.getElementById("spanSubject").innerHTML = getMessage("spanSubject");
        document.getElementById("spanBody").innerHTML = getMessage("spanBody");
    }
});

/**
 * Called if the step type is changed<br />
 * Check if the new step type is an approval, then <a href='#getFieldsAndStatusList>show the list of form fields to enter</a><br />
 * Else hide bottom panel
 */
function onChangeStepType(){
    hidePanels();
    var form = View.panels.get('step_form');
    var stepType = form.getFieldValue("afm_wf_steps.step_type");
    var activity = form.getFieldValue("afm_wf_steps.activity_id");
    showPanelsByStep(stepType);
    getFieldsAndStatusList(activity, true);
}

/**
 * <a href='#getFieldsAndStatusList>Show status selection list </a> for selected activity_id<br />
 * Called by select value dialog for activity id
 * @param {String} fieldName name of field for which a new value is selected
 * @param {String} selectedValue new activity_id
 * @param {String} previousValue old activity_id
 */
function onSelectActivityId(fieldName, selectedValue, previousValue){
    var form = View.panels.get('step_form');
    form.setFieldValue(fieldName, selectedValue);
    getFieldsAndStatusList(selectedValue, true);
}

/**
 * Show selection for status according to the current activity_id and if the current step type is approval show list of form fields to enter<br />
 * Calls WFR <a href='../../../../javadoc/com/archibus/eventhandler/steps/StepHandler.html#getStatusValuesAndFormFieldsForActivity(com.archibus.jobmanager.EventHandlerContext)' target='main'>AbBldgOpsHelpDesk-getStatusValuesAndFormFieldsForActivity</a>
 */
function getFieldsAndStatusList(activity_id, isChanged){
    var form = View.panels.get("step_form");
    var newRecord = form.newRecord;
    document.getElementById("fields_grid").innerHTML = "";
    document.getElementById("docs_grid").innerHTML = "";
    try {
        var result = null;
        if (newRecord || isChanged) {
            result = Workflow.callMethod('AbBldgOpsHelpDesk-StepService-getStatusValuesAndFormFieldsForActivity', activity_id, true, "", "");
        }
        else {
            var statusValue = form.getFieldValue("afm_wf_steps.status");
            var step = form.getFieldValue("afm_wf_steps.step");
            result = Workflow.callMethod('AbBldgOpsHelpDesk-StepService-getStatusValuesAndFormFieldsForActivity', activity_id, false, step, statusValue);
        }
        
        var tmp = eval('(' + result.jsonExpression + ')');
        
        //show status lists in 'step_form' panel
        var statusList = tmp.statusList;
        var selectElement = $("afm_wf_steps.status");
        var selectElement2 = $("afm_wf_steps.status_after");
        removeOptionList(selectElement);
        removeOptionList(selectElement2);
        for (var i = 0; i < statusList.length; i++) {
            var option = new Option(statusList[i].text, statusList[i].value);
            selectElement.options[i + 1] = option;
            var option = new Option(statusList[i].text, statusList[i].value);
            selectElement2.options[i + 1] = option;
        }
        $("afm_wf_steps.status").value = statusValue;
        var status_after = form.record.getValue('afm_wf_steps.status_after');
        $("afm_wf_steps.status_after").value = status_after;
        
        
        //show fields to enter for approval in 'panel_fields' panel
        if (tmp.fieldList.length != 0) {
            var columns = [new Ab.grid.Column('check', '', 'checkbox'), new Ab.grid.Column('text', getMessage("fieldTitle"), 'text', null, null, "1", "80%"), new Ab.grid.Column('value', getMessage("fieldName"), 'text')]
            var configObj = new Ab.view.ConfigObject();
            configObj['rows'] = tmp.fieldList;
            configObj['columns'] = columns;
            // create new Grid component instance
            var field_grid = new Ab.grid.ReportGrid('fields_grid', configObj);
            field_grid.build();
        }
        
        //show attachment fields in 'panel_documents' grid
        if (valueExists(tmp.documents) && tmp.documents.length != 0) {
            var columns = [new Ab.grid.Column('check', '', 'checkbox'), new Ab.grid.Column('text', getMessage("fieldTitle"), 'text', null, null, "1", "80%"), new Ab.grid.Column('value', getMessage("fieldName"), 'text')]
            var configObj = new Ab.view.ConfigObject();
            configObj['rows'] = tmp.documents;
            configObj['columns'] = columns;
            // create new Grid component instance
            var doc_grid = new Ab.grid.ReportGrid('docs_grid', configObj);
            doc_grid.build();
        }
        
        var stepType = form.getFieldValue("afm_wf_steps.step_type");
        //show notification msgs
        if (stepType == 'notification') {
            document.getElementById("subject").value = "";
            document.getElementById("body").value = "";
            document.getElementById("is_rich_msg_format_subject").value = '0';
            document.getElementById("is_rich_msg_format_body").value = '0';
            if (valueExists(tmp.subject)) {
                if (valueExists(tmp.subject.message)) {
                    document.getElementById("subject").value = tmp.subject.message;
                }
                if (valueExists(tmp.subject.is_rich_msg_format)) {
                    document.getElementById("is_rich_msg_format_subject").value = tmp.subject.is_rich_msg_format;
                }
            }
            if (valueExists(tmp.body)) {
                if (valueExists(tmp.body.message)) {
                    document.getElementById("body").value = tmp.body.message;
                }
                if (valueExists(tmp.body.is_rich_msg_format)) {
                    document.getElementById("is_rich_msg_format_body").value = tmp.body.is_rich_msg_format;
                }
            }
        }
        
        if (tmp.tableName != null) {
            document.getElementById("wfTable").innerHTML = tmp.tableName;
        }
    } 
    catch (e) {
        Workflow.handleError(e);
    }
}

/**
 * Called before the form is saved<br />
 * Fills field value for afm_wf_steps.form_fields with selected fields in bottom panel if current step type = approval
 */
function saveFields(){
    var form = View.panels.get("step_form");
    var stepType = form.getFieldValue("afm_wf_steps.step_type");
    //add to fix KB3029105(Cannot set Status After in Manage Service Desk Steps)
    form.setFieldValue('afm_wf_steps.status_after', $("afm_wf_steps.status_after").value);
    
    if (stepType == 'approval') {
        var grid = View.getControl('', 'fields_grid');
        var rows = grid.getSelectedRows();
        var formFields = "";
        
        for (i = 0; i < rows.length; i++) {
            formFields += ";" + rows[i].value;
        }
        form.setFieldValue("afm_wf_steps.form_fields", formFields.substr(1));
        form.setFieldValue("afm_wf_steps.attachments", "");
        
    }
    else 
        if (stepType == 'notification') {
        	/*
            var grid = View.getControl('', 'docs_grid');
            var rows = grid.getSelectedRows();
            if (rows.length > 0) {
                var docFields = ""
                for (i = 0; i < rows.length; i++) {
                    docFields += ";" + rows[i].value;
                }
                form.setFieldValue("afm_wf_steps.attachments", docFields.substr(1));
            }
            else {
                form.setFieldValue("afm_wf_steps.attachments", "");
            }
            //*/
            form.setFieldValue("afm_wf_steps.form_fields", "");
            
            //save messages
            var subject = document.getElementById("subject").value;
            var is_rich_msg_format_subject = document.getElementById("is_rich_msg_format_subject").value;
            var body = document.getElementById("body").value;
            var is_rich_msg_format_body = document.getElementById("is_rich_msg_format_body").value;
            
            var activity_id = form.getFieldValue("afm_wf_steps.activity_id");
            var step = form.getFieldValue("afm_wf_steps.step");
            var status = form.getFieldValue("afm_wf_steps.status");
            
            var subjectId = form.getFieldValue("afm_wf_steps.subject_message_id");
            var bodyId = form.getFieldValue("afm_wf_steps.body_message_id");
            
            /*
            if (subject && body) {
				
                try {
                    var result = Workflow.callMethod('AbBldgOpsHelpDesk-NotificationService-saveNotificationMessage', activity_id, step, status, subjectId, bodyId, subject, body, is_rich_msg_format_subject, is_rich_msg_format_body);
                } 
                catch (e) {
                    Workflow.handleError(e);
                }
                
                if (result.code == 'executed') {
                    var res = eval('(' + result.jsonExpression + ')');
                    if (res.subjectMessageId != null) {
                        form.setFieldValue("afm_wf_steps.subject_message_id", res.subjectMessageId);
                    }
                    if (res.bodyMessageId != null) {
                        form.setFieldValue("afm_wf_steps.body_message_id", res.bodyMessageId);
                    }
                }
                else {
                    Workflow.handleError(result);
                }
            }else{
				View.showMessage(getMessage('emailNull'));
				return false;
			}
            //*/
            
        }
        else {
            form.setFieldValue("afm_wf_steps.form_fields", "");
        }
}

function testTemplate(){
    //save messages
    var subject = document.getElementById("subject").value;
    var body = document.getElementById("body").value;
    
    var tableName = document.getElementById("wfTable").innerHTML;
    var fieldName = tableName + "_id";
    var pkeyValue = document.getElementById("recordId").value;
    if (!/^[0-9]+$/.test(pkeyValue)) {
        View.showMessage(getMessage("inputIntErr"));
        return;
    }
    try {
        var result = Workflow.callMethod('AbBldgOpsHelpDesk-NotificationService-testTemplate', subject, body, tableName, fieldName, pkeyValue);
    } 
    catch (e) {
        Workflow.handleError(e);
    }
    if (result.code == 'executed') {
        var res = eval('(' + result.jsonExpression + ')');
        if (res.subject != null) {
            document.getElementById("resultSubject").innerHTML = res.subject;
        }
        else {
            document.getElementById("resultSubject").innerHTML = "";
        }
        if (res.body != null) {
            document.getElementById("resultBody").innerHTML = res.body.replace(/\n/g, "<br />");
        }
        else {
            document.getElementById("resultBody").innerHTML = "";
        }
    }
    else {
        Workflow.handleError(result);
    }
}

function clearTestPanel(){
    document.getElementById("recordId").value = "";
    document.getElementById("resultSubject").innerHTML = "";
    document.getElementById("resultBody").innerHTML = "";
}

function removeOptionList(element){
    while (element.options.length != 0) {
        element.remove(0);
    }
}

function hidePanels(){
    View.panels.get('panel_fields').show(false);
    View.panels.get('panel_documents').show(false);
    View.panels.get('panel_message').show(false);
    View.panels.get('panel_test').show(false);
    var form = View.panels.get('step_form');
    form.fields.get("afm_wf_steps.body_message_id").hidden=true;
    form.fields.get("afm_wf_steps.subject_message_id").hidden=true;
    
}

function showPanelsByStep(step){
    var form = View.panels.get('step_form');
    form.enableField("afm_wf_steps.step_status_result", true);
    form.enableField("afm_wf_steps.step_status_rejected", true);
    $("afm_wf_steps.status_after").disabled = false;
    //IFM Added
    hidePanels();
    form.fields.get("afm_wf_steps.body_message_id").hidden=true;
    form.fields.get("afm_wf_steps.subject_message_id").hidden=true;
    $("afm_wf_steps.body_message_id").style.display = "none";
    $("afm_wf_steps.subject_message_id").style.display = "none";
    $("step_form_afm_wf_steps.body_message_id_labelCell").style.display = "none";
    $("step_form_afm_wf_steps.subject_message_id_labelCell").style.display = "none";
    if (step == "approval") {
        View.panels.get('panel_fields').show(true);
    } else if (step == "notification") {
            form.enableField("afm_wf_steps.step_status_result", false);
            form.enableField("afm_wf_steps.step_status_rejected", false);
            
            $("afm_wf_steps.status_after").disabled = true;
            //IFM Added to display 
            form.fields.get("afm_wf_steps.body_message_id").hidden=false;
            form.fields.get("afm_wf_steps.subject_message_id").hidden=false;
            $("afm_wf_steps.body_message_id").style.display = "block";
            $("afm_wf_steps.subject_message_id").style.display = "block";
            $("step_form_afm_wf_steps.body_message_id_labelCell").style.display = "block";
            $("step_form_afm_wf_steps.subject_message_id_labelCell").style.display = "block";
            
            
            clearTestPanel();
            $("step_form_afm_wf_steps.body_message_id_labelCell").style = "";
            $("step_form_afm_wf_steps.subject_message_id_labelCell").style = "";
            
            //View.panels.get('panel_documents').show(true);
            //View.panels.get('panel_message').show(true);
            //View.panels.get('panel_test').show(true);
        }
}

function goBack(){
	var tabs = stepEditController.tabs;
    tabs.stepSelectController.steps_report.refresh(tabs.stepSelectController.steps_report.restriction);
    tabs.selectTab('select', null, false, false, true);
}
