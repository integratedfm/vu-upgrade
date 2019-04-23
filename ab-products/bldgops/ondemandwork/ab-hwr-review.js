var hwrRevController = View.createController('abHwrRevController',{
	
	/**
	 * IFM Mehran added for highlighting Emergency requests 08-11-16
	 * Highlight the emergency request in orange-color.
	 */	
	
	/** abHwrEdit_treePanel_afterRefresh: function(){
		this.highlightRequest();
	}, **/

	/** highlightRequest : function(record) {
		this.abHwrEdit_treePanel.gridRows.each(function(row) {
			var status = row.getRecord().getValue('hwr.status');
			
			if (status=='Rej' || status=='S'|| status=='Can') {
				
				Ext.get(row.dom).setStyle('color', '#FF4500');
				row.dom.bgColor='#FF5555'
				
			}
		});
	}, **/
	
	abHwrEdit_detailsPanel_afterRefresh: function(){
		var p= this.abHwrEdit_detailsPanel;
		var u=p.getFieldElement("hwr.status")
		var status = p.getFieldValue("hwr.status");
		this.ifmGetStepInfo();
		if (status=='Rej' || status=='S'|| status=='Can'){
			
			u.style.backgroundColor='#FF5555';
		}else{
			u.style.backgroundColor='#FFFFFF';
		}
	},
	
	ifmGetStepInfo: function(){
		try {
			//call wfr to get all steps of the selected work request
			var result = Workflow.callMethod('AbBldgOpsHelpDesk-StepService-getStepInformation', 'hwr','wr_id',this.abHwrEdit_detailsPanel.getFieldValue('hwr.wr_id'));
			var steps = eval('('+result.jsonExpression+')');
			
			//if no steps, hide history panel 
            if (steps.length == 0) {
                this.ifmHistoryPanel.show(false);
            }
            else {
            	//if exists steps, show history panel and refresh the history panel 
            	this.ifmHistoryPanel.show(true);
            	
            	//prepare restrition for history panel
                var restriction = new Ab.view.Restriction();
                if (steps.length == 1) {
                    restriction.addClause('hhelpdesk_step_log.step_log_id', steps[0].step_log_id, "=");
                }
                else {
                    restriction.addClause('hhelpdesk_step_log.step_log_id', steps[0].step_log_id, "=", ")AND(");
                    for (var i = 1, step; step = steps[i]; i++) {
                        restriction.addClause('hhelpdesk_step_log.step_log_id', step.step_log_id, "=", "OR");
                    }
                }
                
                //refresh the history panel
                this.ifmHistoryPanel.refresh(restriction);
	         }
		}catch(e){
			Workflow.handleError(e);
		}
	},
	
	
    /**
     * Set history field
     */
	ifmHistoryPanel_afterRefresh: function(){
		var rows = this.ifmHistoryPanel.rows;
	    
	    var datetime = "";
	    for (var i = 0; i < rows.length; i++) {
	        var row = rows[i];
	        var user = "";
	        if (row['hhelpdesk_step_log.user_name']) 
	            user = row['helpdesk_step_log.user_name'];
	        if (row['hhelpdesk_step_log.em_id']) 
	            user = row['helpdesk_step_log.em_id'];
	        if (row['hhelpdesk_step_log.vn_id']) 
	            user = row['helpdesk_step_log.vn_id'];
	        row['hhelpdesk_step_log.vn_id'] = user;
	        
	        if (row["hhelpdesk_step_log.date_response"] == "" && row["hhelpdesk_step_log.time_response"] == "") {
	            datetime = getMessage("pending");
	        }
	        else {
	            datetime = row["hhelpdesk_step_log.date_response"] + " " + row["hhelpdesk_step_log.time_response"];
	        }
	        row['hhelpdesk_step_log.date_response'] = datetime;
	    }
	    this.ifmHistoryPanel.reloadGrid();
    }


	
})
