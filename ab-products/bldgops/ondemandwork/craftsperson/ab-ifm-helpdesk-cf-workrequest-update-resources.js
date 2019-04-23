
var abHpdCfWrUpdResourceController = View.createController("abHpdCfWrUpdResourceController",{
	afterInitialDataFetch: function() {
		this.inherit();
		//this.loadData();
	},
	
	requestPanel_beforeRefresh: function(){
	},
	
	requestPanel_afterRefresh: function(){
		this.loadData();
	},
	
	loadData: function(){
		var wrId = this.requestPanel.getFieldValue("wr.wr_id");
		
		var ptrest = new Ab.view.Restriction();
		ptrest.addClause("wrpt.wr_id",wrId,'=');
		this.partReportGrid.refresh(ptrest);
		 
		var tlrest = new Ab.view.Restriction();
		tlrest.addClause("wrtl.wr_id",wrId,'=');
		this.toolReportGrid.refresh(tlrest);
				 
		var otrest = new AFM.view.Restriction();
		otrest.addClause("wr_other.wr_id",wrId,'=');
		this.otherReportGrid.refresh(otrest);
	},
	
	partReportGrid_onAddPart: function(){
		var wr_id = this.requestPanel.getFieldValue("wr.wr_id");
		
		var rest = new Ab.view.Restriction();
		rest.addClause("wrpt.wr_id",wr_id,"=");
		rest.addClause("wrpt.part_id",'',"=");
		View.openDialog("ab-helpdesk-workrequest-newpart.axvw",rest,true);
	},
	
	otherReportGrid_onAddOther: function(){
		var wr_id = this.requestPanel.getFieldValue("wr.wr_id");
		
		var rest = new Ab.view.Restriction();
		rest.addClause("wr_other.wr_id",wr_id,"=");
		rest.addClause("wr_other.other_rs_type",'',"=");
		View.openDialog("ab-helpdesk-cf-workrequest-newother.axvw",rest,true);
	},
	
	toolReportGrid_onAddTool: function(){
	 	var wr_id = this.requestPanel.getFieldValue("wr.wr_id");
		
		var rest = new Ab.view.Restriction();
		rest.addClause("wrtl.wr_id",wr_id,"=");
		rest.addClause("wrtl.tool_id",'',"=");
		View.openDialog("ab-helpdesk-workrequest-newtool.axvw",rest,true);
	}
});