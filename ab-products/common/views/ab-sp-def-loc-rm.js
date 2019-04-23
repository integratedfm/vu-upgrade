/**
 * @author keven.xi
 */
var defineLocRMController = View.createController('defineLocationRM', {

    //Current Selected Node 
    curTreeNode: null,
    
    //The tree panel 
    treeview: null,
    
    //Operation Type // "INSERT", "UPDATE", "DELETE"
    operType: "",
    
    //Operaton Data Type //'SITE','BUILDING','FLOOR','ROOM'
    operDataType: "",
    
    //siteCode changed
    siteCodeChanged: false,
    
    //kb#3047415: the Ab.arcgis.Geocoder control
	geocodeControl: null,

	ctryId: "",
	stateId: "",
	regnId: "",
	cityId: "",
	
	isPopUpView: false,
    
    //----------------event handle--------------------
    afterViewLoad: function(){
        this.site_tree.addParameter('sitetIdSql', "");
        this.site_tree.addParameter('blId', "IS NOT NULL");
        this.site_tree.addParameter('flId', "IS NOT NULL");
        this.site_tree.createRestrictionForLevel = createRestrictionForLevel;

        //kb#3047415: create geocoder control
  		//kb#3049869: do not create geocoder until it is needed
        //this.geocodeControl = new Ab.arcgis.Geocoder();
  		//this.geocodeControl.callbackMethod = refreshBlDetailPanel;
    },
    
    afterInitialDataFetch: function(){
        var titleObj = Ext.get('addNew');
        titleObj.on('click', this.showMenu, this, null);
        
        this.treeview = View.panels.get('site_tree');
        
        //show specified room when current view is opened as pup up to edit a room
        var parentView = View.getOpenerView();
        if(parentView && parentView.editRoomRestriction!=null){
        	this.isPopUpView = true;
        	this.showSpecifiedRoom(parentView.editRoomRestriction);
        }
        
    },
    
    showSpecifiedRoom: function(restriction){
        var console = this.sbfFilterPanel;
        for(var i=0; i< restriction.clauses.length;i++){
    		console.setFieldValue(restriction.clauses[i].name,restriction.clauses[i].value);
    		
    	}
        this.sbfFilterPanel_onShow();
        this.expandTreeToFirstNode();
        
        //hide the filter console and tree panel
		var layoutManager = View.getLayoutManager('mainLayout');
		if (!layoutManager.isRegionCollapsed('north')) {
			layoutManager.collapseRegion('north');
		}
		var layoutManager = View.getLayoutManager('centerLayout');
		if (!layoutManager.isRegionCollapsed('west')) {
			layoutManager.collapseRegion('west');
		}
    },
    
    expandTreeToFirstNode: function(){
    	var root=this.treeview.treeView.getRoot();
    	var siteNode = root.children[0]
    	this.treeview.refreshNode(siteNode);
    	siteNode.expand();
    	var blNode = siteNode.children[0];
    	this.treeview.refreshNode(blNode);
    	blNode.expand();
    	var flNode = blNode.children[0];
    	this.treeview.refreshNode(flNode);
    	flNode.expand();
    	var roomNode = flNode.children[0];
    	roomNode.onLabelClick(roomNode);
    	$(roomNode.labelElId).command.handle();
    },
    
    showMenu: function(e, item){
        var menuItems = [];
        var menutitle_newSite = getMessage("site");
        var menutitle_newBuilding = getMessage("building");
        var menutitle_newFloor = getMessage("floor");
        var menutitle_newRoom = getMessage("room");
        
        menuItems.push({
            text: menutitle_newSite,
            handler: this.onAddNewButtonPush.createDelegate(this, ['SITE'])
        });
        menuItems.push({
            text: menutitle_newBuilding,
            handler: this.onAddNewButtonPush.createDelegate(this, ['BUILDING'])
        });
        menuItems.push({
            text: menutitle_newFloor,
            handler: this.onAddNewButtonPush.createDelegate(this, ['FLOOR'])
        });
        
        menuItems.push({
            text: menutitle_newRoom,
            handler: this.onAddNewButtonPush.createDelegate(this, ['ROOM'])
        });
        
        var menu = new Ext.menu.Menu({
            items: menuItems
        });
        menu.showAt(e.getXY());
        
    },
    
    onAddNewButtonPush: function(menuItemId){
        var siteId = "";
        var buildingId = "";
        var floorId = "";
        var nodeLevelIndex = -1;
        if (this.curTreeNode) {
            nodeLevelIndex = this.curTreeNode.level.levelIndex;
            switch (nodeLevelIndex) {
                case 0:
                    siteId = this.curTreeNode.data["site.site_id"];
                    break;
                case 1:
                    siteId = this.curTreeNode.data["bl.site_id"];
                    buildingId = this.curTreeNode.data["bl.bl_id"];
                    break;
                case 2:
                    siteId = this.curTreeNode.data["bl.site_id"];
                    buildingId = this.curTreeNode.data["fl.bl_id"];
                    floorId = this.curTreeNode.data["fl.fl_id"];
                    break;
                case 3:
                    siteId = this.curTreeNode.data["bl.site_id"];
                    buildingId = this.curTreeNode.data["rm.bl_id"];
                    floorId = this.curTreeNode.data["rm.fl_id"];
                    break;
            }
        }
		// 02/17/2010 IOAN DRAGHICI KB 3024508 - pass region id from site to building
		// 04/09/2010 Cristina MOLDOVAN KB 3024508/3024954 - pass ctry, state, city ids from site to building
		this.regnId = "";
		this.ctryId = "";
		this.stateId = "";
		this.cityId = "";
		if(valueExistsNotEmpty(siteId)){
			var ds = View.dataSources.get('ds_ab-sp-def-loc-rm_form_site');
			var rec = ds.getRecord(new Ab.view.Restriction({'site.site_id':siteId}));
			this.regnId = rec.getValue('site.regn_id');
			this.ctryId = rec.getValue('site.ctry_id');
			this.stateId = rec.getValue('site.state_id');
			this.cityId = rec.getValue('site.city_id');
		}        
		
        var restriction = new Ab.view.Restriction();
        switch (menuItemId) {
            case "SITE":
                this.sbfDetailTabs.selectTab("siteTab", null, true, false, false);
                break;
            case "BUILDING":
                restriction.addClause("bl.site_id", siteId, '=');
				restriction.addClause("bl.ctry_id", this.ctryId, '=');
				restriction.addClause("bl.state_id", this.stateId, '=');
				restriction.addClause("bl.regn_id", this.regnId, '=');
				restriction.addClause("bl.city_id", this.cityId, '=');
                this.sbfDetailTabs.selectTab("blTab", restriction, true, false, false);
                break;
            case "FLOOR":
                if (nodeLevelIndex == 0 || nodeLevelIndex == -1) {
                    View.showMessage(getMessage("errorSelectBuilding"));
                    return;
                }
                restriction.addClause("fl.bl_id", buildingId, '=');
                this.sbfDetailTabs.selectTab("flTab", restriction, true, false, false);
                
                break;
            case "ROOM":
                if (nodeLevelIndex == 0 || nodeLevelIndex == 1 || nodeLevelIndex == -1) {
                    View.showMessage(getMessage("errorSelectFloor"));
                    return;
                }
                restriction.addClause("rm.bl_id", buildingId, '=');
                restriction.addClause("rm.fl_id", floorId, '=');
                this.sbfDetailTabs.selectTab("rmTab", restriction, true, false, false);
                break;
        }
    },
    
    sbfFilterPanel_onShow: function(){
        this.refreshTreeview();
        this.site_detail.show(false);
        this.bl_detail.show(false);
        this.fl_detail.show(false);
        this.rm_detail.show(false);
    },
    
    site_detail_onDelete: function(){
        this.operDataType = "SITE";
        this.commonDelete("ds_ab-sp-def-loc-rm_form_site", "site_detail", "site.site_id");
    },
    bl_detail_onDelete: function(){
        this.operDataType = "BUILDING";
        this.commonDelete("ds_ab-sp-def-loc-rm_form_bl", "bl_detail", "bl.bl_id");
    },
    fl_detail_onDelete: function(){
        this.operDataType = "FLOOR";
        this.commonDelete("ds_ab-sp-def-loc-rm_form_fl", "fl_detail", "fl.fl_id");
    },
    rm_detail_onDelete: function(){
        this.operDataType = "ROOM";
        this.commonDelete("ds_ab-sp-def-loc-rm_form_rm", "rm_detail", "rm.rm_id");
    },
    commonDelete: function(dataSourceID, formPanelID, primaryFieldFullName){
        this.operType = "DELETE";
        var dataSource = View.dataSources.get(dataSourceID);
        var formPanel = View.panels.get(formPanelID);
        var record = formPanel.getRecord();
        var primaryFieldValue = record.getValue(primaryFieldFullName);
        if (!primaryFieldValue) {
            return;
        }
        var controller = this;
        var confirmMessage = getMessage("messageConfirmDelete").replace('{0}', primaryFieldValue);
        View.confirm(confirmMessage, function(button){
            if (button == 'yes') {
                try {
                    dataSource.deleteRecord(record);
                } 
                catch (e) {
                    var errMessage = getMessage("errorDelete").replace('{0}', primaryFieldValue);
                    View.showMessage('error', errMessage, e.message, e.data);
                    return;
                }
                controller.refreshTreePanelAfterUpdate(formPanel);
                formPanel.show(false);
                
            }
        })
    },
    
    site_detail_onSave: function(){
        this.operDataType = "SITE";
        this.commonSave("site_detail");
    },
    bl_detail_onSave: function(){
        this.operDataType = "BUILDING";
		var locationChanged = this.hasChanged(this.bl_detail, "ctryStateRegnCity");
		
		if(locationChanged == true){
			var controller = this;
        	View.confirm(getMessage("confirmChange"), function(button){
            	if (button == 'yes') {
        			controller.commonSave("bl_detail");
				}
			})
		} else {
        this.commonSave("bl_detail");
		}
    },
    
    /**
     * Save floor record.
     */
    fl_detail_onSave: function(){
        this.operDataType = "FLOOR";
        this.commonSave("fl_detail");
    },
    
    /**
     * Save room record method.
     */
    rm_detail_onSave: function(){
    	var form = this.rm_detail;
    	if (!form.newRecord) {
    		var restriction = new Ab.view.Restriction();
            restriction.addClause("rmpct.bl_id", form.getOldFieldValues()[('rm.bl_id')], '=');
            restriction.addClause("rmpct.fl_id", form.getOldFieldValues()[('rm.fl_id')], '=');
            restriction.addClause("rmpct.rm_id", form.getOldFieldValues()[('rm.rm_id')], '=');
            
            //b3037584,In Define Rooms view and Assign Room Attributes and Occupancy view when select Attritubtes Type is "Categories and Types" or "Divisions and Departments"
           // IF EXISTS (SELECT 1 FROM rmpct where bl_id=<bl_id> and fl_id=<fl_id> and rm_id = <rm_id> and date_start><current date> and primary_rm=1)
          //  THEN alert message : �There is a pending request that involves this room. If you continue, please edit that pending request. Do you wish to continue?� <Yes/No>

            if(this.isPrimaryAttributeChange()){
            	var futureRmpctRecords = this.checkFutureRmpctDS.getRecords(restriction);
            	
            	if(futureRmpctRecords.length>0){
            		
        		 var message = getMessage('existFutureRmpct');
 			        View.confirm(message, function(button){
 			        	
 			            if (button == 'yes') {
 			            	
 			            	defineLocRMController.saveRoomForm();
 			                
 			            }
 			        });
            	}else{
            		this.saveRoomForm();
            	}
            }else{
            	this.saveRoomForm();
            }
        }else{
        	this.saveRoomForm();
        }
     
         
    },
    
    /**
     * Save room form .
     */
    saveRoomForm:function(){
    	

     	defineLocRMController.operDataType = "ROOM";
         var isSave = defineLocRMController.commonSave("rm_detail");
         
         //KB3035078 , close form after save when opened as pop up
         if(isSave && defineLocRMController.isPopUpView){
         	var openerView = View.getOpenerView();
         	View.closeThisDialog();
         	//for view ab-sp-asgn-rm-attributes.axvw, reset the drawing panel highlight and labels
         	if(openerView){
         		var drawingPanel = openerView.panels.get('abSpAsgnRmcatRmTypeToRm_drawingPanel');
         		if(drawingPanel){
         			drawingPanel.applyDS('labels');
             		drawingPanel.applyDS('highlight');
         		}
         	}
         }
         
    },
    
    /**
     * Decide if primary attribute changes.
     */
    isPrimaryAttributeChange: function(){
    	var form = this.rm_detail;
    	var record = form.record;
    	if(record.getValue('rm.rm_cat')!=form.getFieldValue('rm.rm_cat')
    		||record.getValue('rm.rm_type')!=form.getFieldValue('rm.rm_type')
    		||record.getValue('rm.dv_id')!=form.getFieldValue('rm.dv_id')
    		||record.getValue('rm.dp_id')!=form.getFieldValue('rm.dp_id')
    		||record.getValue('rm.prorate')!=form.getFieldValue('rm.prorate')){
    		return true;
    	}
    	
    	return false;
    },
    
    commonSave: function(formPanelID){
        var formPanel = View.panels.get(formPanelID);
        this.siteCodeChanged = this.hasChanged(formPanel, "site");
        if (!formPanel.newRecord) {
            this.operType = "UPDATE";
        }
        else {
            this.operType = "INSERT";
        }
        if (formPanel.save()) {
            //refresh tree panel and edit panel
            this.onRefreshPanelsAfterSave(formPanel);
            //get message from view file			 
            var message = getMessage('formSaved');
            //show text message in the form				
            formPanel.displayTemporaryMessage(message);
            
            return true;
        }
        
        return false;
        
    },
    
    
    /**
     * refresh tree panel after save
     * @param {Object} curEditPanel
     */
    onRefreshPanelsAfterSave: function(curEditPanel){
        if (this.siteCodeChanged) {
            this.refreshTreeview();
        }
        else {
            //refresh the tree panel
            this.refreshTreePanelAfterUpdate(curEditPanel);
        }
    },
    
    /**
     * refersh tree panel after save or delete
     * @param {Object} curEditPanel
     */
    refreshTreePanelAfterUpdate: function(curEditPanel){
        var parentNode = this.getParentNode(curEditPanel);
        if (parentNode.isRoot()) {
            this.refreshTreeview();
        }
        else {
            this.treeview.refreshNode(parentNode);
            if (parentNode.parent) {
                parentNode.parent.expand();
            }
            parentNode.expand();
        }
        //reset the global variable :curTreeNode
        this.setCurTreeNodeAfterUpdate(curEditPanel, parentNode);
    },
    
    /**
     * prepare the parentNode parameter for calling refreshNode function
     */
    getParentNode: function(curEditFormPanel){
        var rootNode = this.treeview.treeView.getRoot();
        var levelIndex = -1;
        if (this.curTreeNode) {
            levelIndex = this.curTreeNode.level.levelIndex;
        }
        if ("SITE" == this.operDataType) {
            return rootNode;
        }
        else //BUILDING
             if ("BUILDING" == this.operDataType) {
                switch (levelIndex) {
                    case 0:
                        return this.curTreeNode;
                        break;
                    case 1:
                        return this.curTreeNode.parent;
                        break;
                    case 2:
                        return this.curTreeNode.parent.parent;
                        break;
                    case 3:
                        return this.curTreeNode.parent.parent.parent;
                        break;
                    default:
                        return rootNode;
                        break;
                }
            }
            else 
                if ("FLOOR" == this.operDataType) {
                    //FLOOR
                    switch (levelIndex) {
                        case 1:
                            return this.curTreeNode;
                            break;
                        case 2:
                            return this.curTreeNode.parent;
                            break;
                        case 3:
                            return this.curTreeNode.parent.parent;
                            break;
                        default:
                            View.showMessage(getMessage("errorSelectBuilding"));
                            break;
                    }
                }
                else {
                    //ROOM
                    switch (levelIndex) {
                        case 2:
                            return this.curTreeNode;
                            break;
                        case 3:
                            return this.curTreeNode.parent;
                            break;
                        default:
                            View.showMessage(getMessage("errorSelectFloor"));
                            break;
                    }
                }
    },
    
    refreshTreeview: function(){
        var consolePanel = this.sbfFilterPanel;
        
        var siteId = consolePanel.getFieldValue('bl.site_id');
        if (siteId) {
            this.site_tree.addParameter('siteId', " site.site_id ='" + convert2SafeSqlString(siteId) + "'");
            this.site_tree.addParameter('siteOfNullBl', " site.site_id ='" + convert2SafeSqlString(siteId) + "'");
            this.site_tree.addParameter('siteOfNullFl', " site.site_id ='" + convert2SafeSqlString(siteId) + "'");
            this.site_tree.addParameter('siteOfNullRm', " site.site_id ='" + convert2SafeSqlString(siteId) + "'");
        }
        else {
            this.site_tree.addParameter('siteId', " 1=1 ");
            this.site_tree.addParameter('siteOfNullBl', " 1=1 ");
            this.site_tree.addParameter('siteOfNullFl', " 1=1 ");
            this.site_tree.addParameter('siteOfNullRm', " 1=1 ");
        }
        
        
        var buildingId = consolePanel.getFieldValue('rm.bl_id');
        if (buildingId) {
            this.site_tree.addParameter('blId', " = '" + convert2SafeSqlString(buildingId) + "'");
            this.site_tree.addParameter('blOfNullFl', " bl.bl_id ='" + convert2SafeSqlString(buildingId) + "'");
            this.site_tree.addParameter('siteOfNullBl', " 1=0 ");
            this.site_tree.addParameter('blOfNullRm', " bl.bl_id ='" + convert2SafeSqlString(buildingId) + "'");
        }
        else {
            this.site_tree.addParameter('blId', "IS NOT NULL");
            this.site_tree.addParameter('blOfNullFl', " 1=1 ");
            this.site_tree.addParameter('blOfNullRm', " 1=1 ");
        }
        
        var floorId = consolePanel.getFieldValue('rm.fl_id');
        if (floorId) {
            this.site_tree.addParameter('flId', " = '" + convert2SafeSqlString(floorId) + "'");
            this.site_tree.addParameter('siteOfNullBl', " 1=0 ");
            this.site_tree.addParameter('blOfNullFl', " 1=0 ");
            this.site_tree.addParameter('flOfNullRm', " fl.fl_id ='" + convert2SafeSqlString(floorId) + "'");
        }
        else {
            this.site_tree.addParameter('flId', "IS NOT NULL");
			this.site_tree.addParameter('flOfNullRm', " 1=1 ");
        }

        var roomId = consolePanel.getFieldValue('rm.rm_id');
        if (roomId) {
            this.site_tree.addParameter('rmId', " = '" + convert2SafeSqlString(roomId) + "'");
            this.site_tree.addParameter('siteOfNullBl', " 1=0 ");
            this.site_tree.addParameter('blOfNullFl', " 1=0 ");
            this.site_tree.addParameter('blOfNullRm', " 1=0 ");
			this.site_tree.addParameter('flOfNullRm', " 1=0 ");
        }
        else {
            this.site_tree.addParameter('rmId', "IS NOT NULL");
        }

        this.site_tree.refresh();
        this.curTreeNode = null;
    },
    
    /**
     * reset the curTreeNode variable after operation
     * @param {Object} curEditPanel : current edit form
     * @param {Object} parentNode
     */
    setCurTreeNodeAfterUpdate: function(curEditPanel, parentNode){
        if (this.operType == "DELETE") {
            this.curTreeNode = null;
        }
        else {
            switch (this.operDataType) {
                case "SITE":
                    var pkFieldName = "site.site_id";
                    break;
                case "BUILDING":
                    var pkFieldName = "bl.bl_id";
                    break;
                case "FLOOR":
                    var pkFieldName = "fl.fl_id";
                    break;
                case "ROOM":
                    var pkFieldName = "rm.rm_id";
                    break;
            }
            this.curTreeNode = this.getTreeNodeByCurEditData(curEditPanel, pkFieldName, parentNode);
        }
    },
    
    /**
     * check the curEditFormPanel.getRecord
     *
     * @param {Object} curEditFormPanel
	 * @param {Object} checkWhat What fields to check? Values in "site", "ctryStateRegnCity"
     * return -- true means the user has changed the site code field
	 * 			or one of ctry/state/regn/city code fields
     */
    hasChanged: function(curEditFormPanel, checkWhat){
        if (curEditFormPanel.id == "bl_detail") {
            var oleSiteCode = curEditFormPanel.record.oldValues["bl.site_id"];
            var currentSiteCode = curEditFormPanel.getFieldValue("bl.site_id");
			if (checkWhat == "site") {
            if (curEditFormPanel.getFieldValue("bl.site_id") == oleSiteCode) {
                return false;
            }
            else {
                return true;
            }
        }
			if (checkWhat == "ctryStateRegnCity" && currentSiteCode) {
				var ds = View.dataSources.get('ds_ab-sp-def-loc-rm_form_site');
				var rec = ds.getRecord(new Ab.view.Restriction({'site.site_id':currentSiteCode}));
				this.regnId = rec.getValue('site.regn_id');
				this.ctryId = rec.getValue('site.ctry_id');
				this.stateId = rec.getValue('site.state_id');
				this.cityId = rec.getValue('site.city_id');
				
				ctryId = curEditFormPanel.getFieldValue("bl.ctry_id");
				stateId = curEditFormPanel.getFieldValue("bl.state_id");
				regnId = curEditFormPanel.getFieldValue("bl.regn_id");
				cityId = curEditFormPanel.getFieldValue("bl.city_id");
				
				if ((ctryId && ctryId != this.ctryId)
						|| (stateId && stateId != this.stateId)
						|| (regnId && regnId != this.regnId)
						|| (cityId && cityId != this.cityId)
					) {
					return true;
				}
				else {
					return false;
				}
			}
        }
    },
    /**
     * get the treeNode according to the current edit from,
     * for example :
     * if current edit form is floor(operation is insert), but the current selected treeNode is building,
     * so need to make the two consistent ,by current edit form
     * @param {Object} curEditForm
     * @param {Object} parentNode
     */
    getTreeNodeByCurEditData: function(curEditForm, pkFieldName, parentNode){
        var pkFieldValue = curEditForm.getFieldValue(pkFieldName);
        for (var i = 0; i < parentNode.children.length; i++) {
            var node = parentNode.children[i];
            if (node.data[pkFieldName] == pkFieldValue) {
                return node;
            }
        }
        return null;
    },

    bl_detail_afterRefresh: function(){
    	var record = this.bl_detail.getRecord();
    	var hasGeocode = record.getValue('bl.lat') !== '' && record.getValue('bl.lon') !== '';
    	//this.bl_detail.fields.get('bl.geocodeField').hidden = hasGeocode;
    	var geocodeButton = document.getElementById('geocode');
    	geocodeButton.disabled = hasGeocode;
    },
    
	doGeocode: function() {
    	if (this.geocodeControl === null) {
            this.initGeocodeControl();
        }

        var restriction = this.getCurrentBlRestriction();
    	
		this.geocodeControl.geocode('ds_ab-sp-def-loc-rm_form_bl', 
			restriction, 'bl', 
			'bl.bl_id', 
			['bl.lat', 'bl.lon'], 
			['bl.address1', 'bl.city_id', 'bl.state_id', 'bl.zip', 'bl.ctry_id'], 
			true);
	},
	
    initGeocodeControl: function() {
        this.geocodeControl = new Ab.arcgis.Geocoder();
        this.geocodeControl.callbackMethod = refreshBlDetailPanel;        
    },

	getCurrentBlRestriction:function(){
		var record = this.bl_detail.record;
    	var restriction = new Ab.view.Restriction();
    	
    	if(record) {
 			restriction.addClause('bl.bl_id', record.getValue('bl.bl_id'), '=', 'OR');  
 		} else {
    		restriction.addClause('bl.bl_id', 'null', "=", "OR");
    	}
    	return restriction;
	},
	
	doLocate: function(context){
		var me = this;
		var restriction = this.getCurrentBlRestriction();
		var record = this.bl_detail.getRecord();
		
		View.openDialog('ab-locate-asset.axvw', restriction, false, {
		    width: 800,
		    height: 600,
		    record: record,
		    callback: function(){
		    	refreshBlDetailPanel();
		    }
		});
	},
	
	dialog_onClose:function(dialogController){
		refreshBlDetailPanel();
	},
	
	rm_detail_onCostCentreSelVal: function(){
		var rm_panel=View.panels.get("rm_detail");
		var rm_dp_id = rm_panel.getFieldValue("rm.dp_id");
		var cc_id = rm_panel.getFieldValue("rm.cc_id");
		if (rm_dp_id.length==0 || rm_dp_id=="NULL" ){
			View.selectValue('rm_detail', 
			"Select Cost Centre", 
			['rm.dp_id', 'rm.cc_id','ifm_costcentre.name' ],
			'ifm_costcentre',
			['ifm_costcentre.dp_id', 'ifm_costcentre.cc_id', 'ifm_costcentre.name' ],
			['ifm_costcentre.dp_id', 'ifm_costcentre.cc_id', 'ifm_costcentre.name' ]
			);
		}else {
			View.selectValue('rm_detail', 
				"Select Cost Centre", 
				['rm.dp_id', 'rm.cc_id','ifm_costcentre.name' ],
				'ifm_costcentre',
				['ifm_costcentre.dp_id', 'ifm_costcentre.cc_id', 'ifm_costcentre.name' ],
				['ifm_costcentre.dp_id', 'ifm_costcentre.cc_id', 'ifm_costcentre.name' ],
				"ifm_costcentre.dp_id = '"+rm_dp_id+"'"
			);
		}
	}
})

function refreshBlDetailPanel(){
	defineLocRMController.bl_detail.refresh(defineLocRMController.bl_detail.restriction);
}

/*
 * set the global variable 'curTreeNode' in controller 'defineLocationRM'
 */
function onClickTreeNode(){
    View.controllers.get('defineLocationRM').curTreeNode = View.panels.get("site_tree").lastNodeClicked;
    //kb#3047415: the Ab.arcgis.Geocoder control
    setButtonLabels(new Array('geocode','locate'), new Array('geocode','locate'));
}

function onClickSiteNode(){
    var curTreeNode = View.panels.get("site_tree").lastNodeClicked;
    var siteId = curTreeNode.data['site.site_id'];
    View.controllers.get('defineLocationRM').curTreeNode = curTreeNode;
    if (!siteId) {
        View.panels.get("site_detail").show(false);
        View.panels.get("bl_detail").show(false);
        View.panels.get("fl_detail").show(false);
        View.panels.get("rm_detail").show(false);
    }
    else {
        var restriction = new Ab.view.Restriction();
        restriction.addClause("site.site_id", siteId, '=');
        View.panels.get('sbfDetailTabs').selectTab("siteTab", restriction, false, false, false);
    }
}

function afterGeneratingTreeNode(treeNode){
    if (treeNode.tree.id != 'site_tree') {
        return;
    }
    var labelText1 = "";
    if (treeNode.level.levelIndex == 0) {
        var siteCode = treeNode.data['site.site_id'];
        if (!siteCode) {
            labelText1 = "<span class='" + treeNode.level.cssPkClassName + "'>" + getMessage("noSite") + "</span> ";
            treeNode.setUpLabel(labelText1);
        }
    }
    if (treeNode.level.levelIndex == 1) {
        var buildingName = treeNode.data['bl.name'];
        var buildingId = treeNode.data['bl.bl_id'];
        
        labelText1 = "<span class='" + treeNode.level.cssPkClassName + "'>" + buildingId + "</span> ";
        labelText1 = labelText1 + "<span class='" + treeNode.level.cssClassName + "'>" + buildingName + "</span> ";
        treeNode.setUpLabel(labelText1);
    }
    if (treeNode.level.levelIndex == 2) {
        var floorId = treeNode.data['fl.fl_id'];
        var floorName = treeNode.data['fl.name'];
        
        labelText1 = "<span class='" + treeNode.level.cssPkClassName + "'>" + floorId + "</span> ";
        labelText1 = labelText1 + "<span class='" + treeNode.level.cssClassName + "'>" + floorName + "</span> ";
        treeNode.setUpLabel(labelText1);
    }
    if (treeNode.level.levelIndex == 3) {
        var roomId = treeNode.data['rm.rm_id'];
        var roomName = treeNode.data['rm.name'];
        
        labelText1 = "<span class='" + treeNode.level.cssPkClassName + "'>" + roomId + "</span> ";
        labelText1 = labelText1 + "<span class='" + treeNode.level.cssClassName + "'>" + roomName + "</span> ";
        treeNode.setUpLabel(labelText1);
    }
}

function createRestrictionForLevel(parentNode, level){
    var restriction = null;
    if (parentNode.data) {
        var siteId = parentNode.data['site.site_id'];
        if (!siteId && level == 1) {
            restriction = new Ab.view.Restriction();
            restriction.addClause('bl.site_id', '', 'IS NULL', 'AND', true);
        }
    }
    return restriction;
}

function setButtonLabels(arrButtons, arrLabels){
	var maxLabelIndex = -1;
	var maxLabelLength = -1;
	var maxWidth = 0;
	for(var i=0; i < arrLabels.length; i++){
		var crtText = getMessage(arrLabels[i]);
		if(crtText.length > maxLabelLength){
			maxLabelLength = crtText.length;
			maxLabelIndex = i;
		}
	}
	// set label for maxLabelIndex
	var objButton = document.getElementById(arrButtons[maxLabelIndex]);
	objButton.value = getMessage(arrLabels[maxLabelIndex]);
	maxWidth = objButton.clientWidth;
	for(var i =0;i < arrButtons.length; i++){
		var crtObj = document.getElementById(arrButtons[i]);
		crtObj.value = getMessage(arrLabels[i]);
		crtObj.style.width = (maxWidth+10) + "px";
	}
}
