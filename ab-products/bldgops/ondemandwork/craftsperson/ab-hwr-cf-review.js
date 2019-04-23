var hwrRevController = View.createController('abHwrRevController',{

	/**
	 * IFM - Mehran added for highlighting Emergency requests
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
		if (status=='Rej' || status=='S'|| status=='Can'){
			
			u.style.backgroundColor='#FF5555';
		}else{
			u.style.backgroundColor='#FFFFFF';
		}
		
	}
	
})
