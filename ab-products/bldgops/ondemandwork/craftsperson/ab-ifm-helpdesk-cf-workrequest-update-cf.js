var abHpdCfWrUpdCfController = View.createController("abHpdCfWrUpdCfController",{
	
	afterViewLoad: function(){
		//KB3044152 - Performance issue - use WFR to get workflow substitutes and avoid sub query 
		var cfWorkflowSubstitutes = Workflow.callMethod('AbBldgOpsHelpDesk-RequestsService-getWorkflowSubstitutes','cf_id').message;
		this.requestReportGrid.addParameter('cfWorkflowSubstitutes', cfWorkflowSubstitutes);
	},
	
	afterInitialDataFetch: function() {
		this.inherit();
		//this.prepareWork();
	},
	
	requestPanel_beforeRefresh: function(){
	},
	
	requestPanel_afterRefresh: function(){
		this.prepareWork();
	},
	
	prepareWork: function(){
		
		var wr = this.requestPanel.getFieldValue("wr.wr_id");
		
		var restrication = new Ab.view.Restriction();
		restrication.addClause("wr.wr_id",wr,'=');
		
		//
		var tabs = View.getOpenerView().panels.get("abOdmdCfUpdWrTabs");
		if(tabs == null || tabs == undefined){
			tabs = View.getOpenerView().panels.get("abHpdCfWorkRequestTabs");	
		}
		if(tabs == null || tabs == undefined){
			tabs = View.getOpenerView().panels.get("abHpdCfWrNoRestTabs");	
		}
		tabs.setTabRestriction('details',restrication);
		
		var cfrestriction = new Ab.view.Restriction();
		cfrestriction.addClause("wrcf.wr_id",wr,'=');
		this.requestReportGrid.refresh(cfrestriction);
		
		//add to fix KB3023509
		var supervisor = this.requestPanel.getFieldValue("wr.supervisor");
		var addAction = this.requestReportGrid.actions.get("addCfToWr");
		if(supervisor == View.user.employee.id){
			addAction.show(true);
		}else{
			addAction.show(false);
		}
	},
	
	refreshRequestReportGrid: function(){
		var wr = this.requestPanel.getFieldValue("wr.wr_id");
		var cfrestriction = new Ab.view.Restriction();
		cfrestriction.addClause("wrcf.wr_id",wr,'=');
		this.requestReportGrid.refresh(cfrestriction);
	},
	
	requestReportGrid_onAddCfToWr: function(){
		var wr_id = this.requestPanel.getFieldValue("wr.wr_id");
		
		var rest = new Ab.view.Restriction();
		rest.addClause("wrcf.wr_id",wr_id,"=");
		View.openDialog("ab-helpdesk-cf-workrequest-cf.axvw",rest,true,10,10,800,400);
	}
});
