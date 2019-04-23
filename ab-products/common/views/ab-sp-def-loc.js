/**
 * @author keven.xi
 */
var defineLocFLController = View.createController('defineLocationFL', {

    //Current Selected Node 
    curTreeNode: null,
    
    //The tree panel 
    treeview: null,
    
    //Operation Type // "INSERT", "UPDATE", "DELETE"
    operType: "",
    
    //Operaton Data Type //'SITE','BUILDING','FLOOR'
    operDataType: "",
    
    //siteCode was changed
    siteCodeChanged: false,
	
    //kb#3047415: the Ab.arcgis.Geocoder control
	geocodeControl: null,

	// geographical id's
	ctryId: "",
	stateId: "",
	regnId: "",
	cityId: "",
    
    //----------------event handle--------------------
    afterViewLoad: function(){
		if(View.taskInfo.activityId != "AbRPLMLeaseAdministration" && View.taskInfo.activityId != "AbRPLMPortfolioAdministration") {
			var instructions = document.getElementById("bl_detail_instructions");
			if(instructions != undefined && instructions) {
				instructions.parentNode.removeChild(instructions);
			}
		}
        this.site_tree.addParameter('sitetIdSql', "");
        this.site_tree.addParameter('blId', "IS NOT NULL");
        this.site_tree.addParameter('flId', "IS NOT NULL");
        this.site_tree.createRestrictionForLevel = createRestrictionForLevel;

        //kb#3047415: create geocoder control//IFM Commented out
  		//this.geocodeControl = new Ab.arcgis.Geocoder();
  		//this.geocodeControl.callbackMethod = refreshBlDetailPanel;
    },
    
    afterInitialDataFetch: function(){
        var titleObj = Ext.get('addNew');
        titleObj.on('click', this.showMenu, this, null);
        
        this.treeview = View.panels.get('site_tree');
    },
    
    showMenu: function(e, item){
        var menuItems = [];
        var menutitle_newSite = getMessage("site");
        var menutitle_newBuilding = getMessage("building");
        var menutitle_newFloor = getMessage("floor");
        
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
        
        var menu = new Ext.menu.Menu({
            items: menuItems
        });
        menu.showAt(e.getXY());
        
    },
    
    onAddNewButtonPush: function(menuItemId){
        var siteId = "";
        var buildingId = "";
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
                    break;
            }
        }
        
        this.operDataType = menuItemId;
        var restriction = new Ab.view.Restriction();
        switch (menuItemId) {
            case "SITE":
                this.sbfDetailTabs.selectTab("siteTab", null, true, false, false);
                break;
            case "BUILDING":
				this.regnId = "";
				this.ctryId = "";
				this.stateId = "";
				this.cityId = "";
				if(valueExistsNotEmpty(siteId)){
					var ds = View.dataSources.get('ds_ab-sp-def-loc_form_site');
					var rec = ds.getRecord(new Ab.view.Restriction({'site.site_id':siteId}));
					this.regnId = rec.getValue('site.regn_id');
					this.ctryId = rec.getValue('site.ctry_id');
					this.stateId = rec.getValue('site.state_id');
					this.cityId = rec.getValue('site.city_id');
				}        

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
        }
    },
    
    sbfFilterPanel_onShow: function(){
        this.refreshTreeview();
        this.site_detail.show(false);
        this.bl_detail.show(false);
        this.fl_detail.show(false);
    },
    
    site_detail_onDelete: function(){
        this.operDataType = "SITE";
        this.commonDelete("ds_ab-sp-def-loc_form_site", "site_detail", "site.site_id");
    },
    bl_detail_onDelete: function(){
        this.operDataType = "BUILDING";
        this.commonDelete("ds_ab-sp-def-loc_form_bl", "bl_detail", "bl.bl_id");
    },
    fl_detail_onDelete: function(){
        this.operDataType = "FLOOR";
        this.commonDelete("ds_ab-sp-def-loc_form_fl", "fl_detail", "fl.fl_id");
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
        this.commonSave("ds_ab-sp-def-loc_form_site", "site_detail");
    },
    bl_detail_onSave: function(){
        this.operDataType = "BUILDING";
		var locationChanged = this.hasChanged(this.bl_detail, "ctryStateRegnCity");
		
		if(locationChanged == true){
			var controller = this;
        	View.confirm(getMessage("confirmChange"), function(button){
            	if (button == 'yes') {
        			controller.commonSave("ds_ab-sp-def-loc_form_bl", "bl_detail");
				}
			})
		} else {
			this.commonSave("ds_ab-sp-def-loc_form_bl", "bl_detail");
		}
    },
    fl_detail_onSave: function(){
        this.operDataType = "FLOOR";
        this.commonSave("ds_ab-sp-def-loc_form_fl", "fl_detail");
    },
    
    commonSave: function(dataSourceID, formPanelID){
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
        }
    },
    
    /**
     * refresh tree panel and edit panel after save
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
                    default:
                        return rootNode;
                        break;
                }
            }
            else {
                //FLOOR
                switch (levelIndex) {
                    case 1:
                        return this.curTreeNode;
                        break;
                    case 2:
                        return this.curTreeNode.parent;
                        break;
                    default:
                        View.showMessage(getMessage("errorSelectBuilding"));
                        break;
                }
            }
    },
    
    refreshTreeview: function(){
        var consolePanel = this.sbfFilterPanel;
        
        var siteId = consolePanel.getFieldValue('bl.site_id');
        if (siteId) {
            this.site_tree.addParameter('siteId', " site.site_id ='" + siteId + "'");
            this.site_tree.addParameter('siteOfNullBl', " site.site_id ='" + siteId + "'");
            this.site_tree.addParameter('siteOfNullFl', " site.site_id ='" + siteId + "'");
        }
        else {
            this.site_tree.addParameter('siteId', " 1=1 ");
            this.site_tree.addParameter('siteOfNullBl', " 1=1 ");
            this.site_tree.addParameter('siteOfNullFl', " 1=1 ");
        }
        
        
        var buildingId = consolePanel.getFieldValue('fl.bl_id');
        if (buildingId) {
            this.site_tree.addParameter('blId', " = '" + buildingId + "'");
            this.site_tree.addParameter('blOfNullFl', " bl.bl_id ='" + buildingId + "'");
            this.site_tree.addParameter('siteOfNullBl', " 1=0 ");
        }
        else {
            this.site_tree.addParameter('blId', "IS NOT NULL");
            this.site_tree.addParameter('blOfNullFl', " 1=1 ");
        }
        
        var floorId = consolePanel.getFieldValue('fl.fl_id');
        if (floorId) {
            this.site_tree.addParameter('flId', " = '" + floorId + "'");
            this.site_tree.addParameter('siteOfNullBl', " 1=0 ");
            this.site_tree.addParameter('blOfNullFl', " 1=0 ");
        }
        else {
            this.site_tree.addParameter('flId', "IS NOT NULL");
        }
        
		var countryId = consolePanel.getFieldValue('bl.ctry_id');
        if(countryId){
			this.site_tree.addParameter('countryId', "site.ctry_id = '" + countryId + "'");
		}else{
			this.site_tree.addParameter('countryId', "1=1");
		}
		
		var cityId = consolePanel.getFieldValue('bl.city_id');
        if(cityId){
			this.site_tree.addParameter('cityId', "site.city_id = '" + cityId + "'");
		}else{
			this.site_tree.addParameter('cityId', "1=1");
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
    	var isChanged = false;
        if (curEditFormPanel.id == "bl_detail") {
			var oleSiteCode = curEditFormPanel.record.oldValues["bl.site_id"];
			var currentSiteCode = curEditFormPanel.getFieldValue("bl.site_id");
			if (checkWhat == "site") {
				if (currentSiteCode != oleSiteCode) {
					isChanged = true;
				}
			}
			//fix KB3031546 - Change the logic to show the confirm message only when building location 
			//fields not empty and not consistent with site location fields(Guo 2011/6/3)
			if (checkWhat == "ctryStateRegnCity" && currentSiteCode) {
				var ds = View.dataSources.get('ds_ab-sp-def-loc_form_site');
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
	                isChanged = true;
				}
			}
        }
        return isChanged;
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
    	var restriction = this.getCurrentBlRestriction();
    	
		this.geocodeControl.geocode('ds_ab-sp-def-loc_form_bl', 
			restriction, 'bl', 
			'bl.bl_id', 
			['bl.lat', 'bl.lon'], 
			['bl.address1', 'bl.city_id', 'bl.state_id', 'bl.zip', 'bl.ctry_id'], 
			true);
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
	}
})

function refreshBlDetailPanel(){
	defineLocFLController.bl_detail.refresh(defineLocFLController.bl_detail.restriction);
}

/*
 * set the global variable 'curTreeNode' in controller 'defineLocationFL'
 */
function onClickTreeNode(){
    View.controllers.get('defineLocationFL').curTreeNode = View.panels.get("site_tree").lastNodeClicked;
    //kb#3047415: the Ab.arcgis.Geocoder control
    setButtonLabels(new Array('geocode','locate'), new Array('geocode','locate'));
}

function onClickSiteNode(){
    var curTreeNode = View.panels.get("site_tree").lastNodeClicked;
    var siteId = curTreeNode.data['site.site_id'];
    View.controllers.get('defineLocationFL').curTreeNode = curTreeNode;
    if (!siteId) {
        View.panels.get("site_detail").show(false);
        View.panels.get("bl_detail").show(false);
        View.panels.get("fl_detail").show(false);
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
            labelText1 = "<span class='" + treeNode.level.cssPkClassName + "'>" + getMessage("noSite") + "</span>";
            treeNode.setUpLabel(labelText1);
        }
    }
    if (treeNode.level.levelIndex == 1) {
        var buildingName = treeNode.data['bl.name'];
        var buildingId = treeNode.data['bl.bl_id'];
        
        labelText1 = "<span class='" + treeNode.level.cssPkClassName + "'>" + buildingId + "</span>";
        labelText1 = labelText1 + "<span class='" + treeNode.level.cssClassName + "'> " + buildingName + "</span>";
        treeNode.setUpLabel(labelText1);
    }
    if (treeNode.level.levelIndex == 2) {
        var floorId = treeNode.data['fl.fl_id'];
        var floorName = treeNode.data['fl.name'];
        
        labelText1 = "<span class='" + treeNode.level.cssPkClassName + "'>" + floorId + "</span>";
        labelText1 = labelText1 + "<span class='" + treeNode.level.cssClassName + "'> " + floorName + "</span>";
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