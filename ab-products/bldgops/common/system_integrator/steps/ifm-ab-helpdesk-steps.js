var stepsTabsController =  View.createController("stepsTabsController",{
	
	 afterInitialDataFetch: function() {
 		var tabs = View.panels.get("stepsTabs");
 	 	tabs.addEventListener('afterTabChange',this.onTabsChange);	
 		
 		var editTab = tabs.findTab("edit");
 		editTab.enable(false);
	},
 	
 	onTabsChange: function(tabPanel, selectedTabName, newTabName){
		//disable the view tabs.
		var tabs = View.panels.get("stepsTabs");
 	 	
		if(selectedTabName == 'select'){
		 	var editTab = tabs.findTab("edit");
 			editTab.enable(false);
	 	}else if(selectedTabName == 'edit'){
			var selectTab = tabs.findTab("select");
	 		selectTab.enable(true);
 		}
	}
});