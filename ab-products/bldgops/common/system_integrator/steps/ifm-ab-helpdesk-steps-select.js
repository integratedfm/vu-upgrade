/**
 * @fileoverview Javascript functions for <a href='../../../../viewdoc/overview-summary.html#ab-helpdesk-steps-select.axvw' target='main'>ab-helpdesk-steps-select.axvw</a>
 */
var stepSelectController = View.createController('stepSelectController', {

    tabs: null,
    
    afterInitialDataFetch: function(){
        this.tabs = View.getControlsByType(parent, 'tabs')[0];
    },
    
    steps_report_onAdd: function(){
        this.selectEditTab(null, true);
    },
    
    steps_report_onDelete: function(){
        var grid = this.steps_report;
        var rows = grid.getSelectedRows();
        
        if (rows.length > 0) {
            View.confirm(getMessage('confirmDelete'), function(button){
                if (button == 'yes') {
                    var records = [];
                    for (var i = 0; i < rows.length; i++) {
                        var record = {};
                        record['afm_wf_steps.activity_id'] = rows[i]['afm_wf_steps.activity_id.key'];
                        record['afm_wf_steps.status'] = rows[i]['afm_wf_steps.status.key'];
                        record['afm_wf_steps.step'] = rows[i]['afm_wf_steps.step.key'];
                        records.push(record);
                    }
                    try {
                        Workflow.callMethod('AbBldgOpsHelpDesk-CommonService-deleteRecords', records, 'afm_wf_steps');
                    } 
                    catch (e) {
                        Workflow.handleError(e);
                    }
                    
                    grid.refresh(grid.restriction);
                }
            });
        }
    },
    
    steps_report_edit_onClick: function(row){
        var restriction = this.getRowRestriction(row);
        this.selectEditTab(restriction, false);
    },
    
    selectEditTab: function(restriction, newRecord){
        this.tabs.stepSelectController = this;
        this.tabs.selectedRestriction = restriction;
        this.tabs.newRecord = newRecord;
        //fix KB3030141- call tab.loadView after the tab is showed to avoid blank page appear(Guo 2011/4/19)
        this.tabs.selectTab('edit');
        //this.tabs.selectTab('afm_wf_steps', restriction, newRecord,false, false);
    },
    
    getRowRestriction: function(row){
        var record = row.record;
        var restriction = new Ab.view.Restriction();
        restriction.addClause('afm_wf_steps.activity_id', record['afm_wf_steps.activity_id.key'], '=');
        restriction.addClause('afm_wf_steps.status', record['afm_wf_steps.status.key'], '=');
        restriction.addClause('afm_wf_steps.step', record['afm_wf_steps.step.key'], '=');
        this.tabs.step_key_value = record['afm_wf_steps.step.key'];
        return restriction;
    }
});

/**
 * Creates custom restriction besed on the selected activity_id and step_type
 * and applies it to report tabs.
 */
function setRestriction(){
    // get reference to the console form
    var console = View.getControl('', 'steps_console');
    
    // prepare the grid report restriction from the console values
    var restriction = new Ab.view.Restriction(console.getFieldValues());
    
    // refresh the grid report tab page
    var report = View.getControl('', 'steps_report');
    report.refresh(restriction);
}

/**
 * Clears previously created restriction.
 */
function clearRestriction(){
    var console = View.getControl('', 'steps_console');
    console.setFieldValue("afm_wf_steps.activity_id", '');
    console.setFieldValue("afm_wf_steps.step_type", '', '');
}
