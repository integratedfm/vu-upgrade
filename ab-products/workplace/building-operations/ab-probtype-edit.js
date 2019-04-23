var abProbTypeEditCtrl = View.createController('abProbTypeEditCtrl',{

	// User action type; 'addFirstTier', 'addSecondTier' or 'editFirstTier' or  'editSecondTier'
	actionType: '',

	// first tier problem type
	firstTierProblemType: '',
	
	afterInitialDataFetch:function(){
		//KB3045092 - Add empty option for field Problem Class and set the field to required field
		this.abProbtypeEdit_detailsPanel.fields.get('probtype.prob_class').addAllToEnumFieldForConsole();
	},

	 /**
	 * Before save the problem type in details panel, set the real field values that would save to Database 
	 **/
	abProbtypeEdit_detailsPanel_beforeSave: function(){
		//construct the full problem type by parent and real prob_type
		var probType = this.abProbtypeEdit_detailsPanel.getFieldValue("own_prob_type");
		//if second tier, construct the full problem type by first tier problem type and real prob_type
		if(this.actionType == 'addFirstTier'){
			this.firstTierProblemType = probType;
		}
		
		//if second tier, construct the full problem type by first tier problem type and real prob_type
		if(this.actionType == 'addSecondTier' || this.actionType == 'editSecondTier'){
			probType = this.firstTierProblemType+'|'+this.abProbtypeEdit_detailsPanel.getFieldValue("own_prob_type");
		}
		
		//set field values 
		this.abProbtypeEdit_detailsPanel.setFieldValue("probtype.prob_type", probType);
		this.abProbtypeEdit_detailsPanel.setFieldValue("probtype.hierarchy_ids", probType + '|');
		
		//KB3045092 - Add empty option for field Problem Class and set the field to required field
		if(this.abProbtypeEdit_detailsPanel.getFieldValue("probtype.prob_class") == ''){
			this.abProbtypeEdit_detailsPanel.addInvalidField("probtype.prob_class",'');
			return false;
		}
		return true;
	},
	
	cascadeUpdateChildrenProbtype: function() {
		if (this.actionType == 'editFirstTier') {
			var currentProbtype = this.firstTierProblemType;
			var newProbtype = this.abProbtypeEdit_detailsPanel.getFieldValue("own_prob_type");
			
			if (currentProbtype != newProbtype) {
				//save the children types
				var savingProbtype = newProbtype + "|";
				var ds = View.dataSources.get('abProbtypeEdit_ds_1');
				var records = ds.getRecords(" probtype.prob_type like '" + currentProbtype + '|' + "%'");
				
				for(var i = 0; i < records.length; i++) {
					var record = records[i];
					record.setValue('probtype.prob_type', record.getValue('probtype.prob_type').replace(currentProbtype + '|', savingProbtype));
					record.setValue('probtype.hierarchy_ids', record.getValue('probtype.prob_type') + '|');
					record.isNew = false;
					ds.saveRecord(record);
				}
				this.firstTierProblemType = newProbtype;
			}
		}
	},

	 /**
	 * After the details panel is refreshed for editing clicked tree node or for adding new operation, 
	 * set clean 'Problem Type' only for shown,  as well as set the global sign and property 
	 **/
	abProbtypeEdit_detailsPanel_afterRefresh: function(){
		//set own problem type if edit or after add new
		//Get current problem type
		var ownProbType = this.abProbtypeEdit_detailsPanel.getFieldValue("probtype.prob_type");
		
		//if select tier problem type
		if(this.firstTierProblemType != ownProbType){
			//retrieve actual real 'problem type'  without path and '|'
			var splitTypes = ownProbType.split('|');
			ownProbType =  splitTypes[splitTypes.length-1];
		}
	
		//show real 'problem type' in form 
		this.abProbtypeEdit_detailsPanel.setFieldValue("own_prob_type", ownProbType);
		
		//if second tier, show fisrt tier problem type,
		if(this.actionType == 'addSecondTier' || this.actionType == 'editSecondTier'){
			this.abProbtypeEdit_detailsPanel.showField("parent_prob_type",true);
			this.abProbtypeEdit_detailsPanel.setFieldValue("parent_prob_type", this.firstTierProblemType);
		}else{
			this.abProbtypeEdit_detailsPanel.showField("parent_prob_type",false);
		}
		
		if(this.abProbtypeEdit_detailsPanel.newRecord){
			this.abProbtypeEdit_detailsPanel.setFieldValue("probtype.prob_class", '');
		}
	},

	 /**
	 * Called from actions in 'Add New' menu of tree panel, set correct global property and refresh the details panels with new record
	 *@param {string} type 'Top' or 'Below'
	 **/
	onAddNew: function( type ){
		//take	current selected node from tree as parent problem type 
		this.actionType = type;
		if(this.actionType =='addFirstTier'){
			this.firstTierProblemType = null;
		}
		
		if(!this.firstTierProblemType && this.actionType =='addSecondTier'){
			View.alert(getMessage('noParent'));
			this.abProbtypeEdit_detailsPanel.show(false);
			return;
		}
		
		this.abProbtypeEdit_detailsPanel.refresh(null, true);
	},
	
	/**
	 * Set the addNewType flag before edit the problem type
	 **/
	beforeEditProblemType: function( ){
		var selectedNode = this.abProbtypeEdit_treePanel.lastNodeClicked;
		if (selectedNode.level.levelIndex == 0) {
			this.firstTierProblemType = selectedNode.data['probtype.prob_type'];
			this.actionType = 'editFirstTier';
		}else if (selectedNode.level.levelIndex == 1) {
			this.firstTierProblemType = selectedNode.parent.data['probtype.prob_type'];
			this.actionType = 'editSecondTier'
		}
	}
})


/**
 * IFM - Add Account Code (ac_id) to Problem Type Tree Panel (29/01/2019)
 **/
function afterGeneratingTreeNode(treeNode) {
	if (treeNode.tree.id == "abProbtypeEdit_treePanel") {
		var probType = '';
		var description = '';
		var acId = '';
		if (treeNode.level.levelIndex == 0) {
			probType = treeNode.data['probtype.prob_type'];
			description = treeNode.data['probtype.description'];
			acId = treeNode.data['probtype.ac_id'];
		} else {
			var splitTypes = treeNode.data['probtype.prob_type'].split('|');
			probType = splitTypes[splitTypes.length - 1];
			description = treeNode.data['probtype.description'];
			acId = treeNode.data['probtype.ac_id'];
		}

		var label = "<span class='" + treeNode.level.cssPkClassName + "'>" + probType + "</span> ";
		label = label + "<span class='" + treeNode.level.cssClassName + "'>" + description + "</span> ";
		label = label + "<span class='" + treeNode.level.cssClassName + "'>" + acId + "</span> ";
		treeNode.setUpLabel(label);
	}
}

