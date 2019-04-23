/**
 * @author : Michael Ritter (IFM) April 2019
 */

var controller = View.createController('abSpVwBlDepreciation_Controller', {
	// ----------------event handle--------------------
	
	/**
     * After initial data fetch. Show relevant panel.
     */	
	beforeViewLoad: function(){
		//depreciationValueChanged();

	},
	
	/**
	* Set Parameter before the report panel is generated.
	*/
	abSpVwBlDepreciation_detailsPanel_beforeRefresh : function() {
		var filterDepreciationValue = View.panels.get('FilterPanel').getFieldValue('rm.total_depreciation_value');
		this.abSpVwBlDepreciation_detailsPanel.addParameter('depreciation', filterDepreciationValue);
	}
});

/**
* Set the Title of the Depreciation Details Panel upon the 'GenerateReport' button.
*/
function setDepreciationPanelTitle(){
	var filterDepreciationValue = View.panels.get('FilterPanel').getFieldValue('rm.total_depreciation_value');
	if (filterDepreciationValue == 0 || filterDepreciationValue == '') {
		View.panels.get('abSpVwBlDepreciation_detailsPanel').setTitle('Rooms');
	} else {
		View.panels.get('abSpVwBlDepreciation_detailsPanel').setTitle('Rooms (Depreciation Value of ' + View.project.currencies.currencySymbolFor('AUD') + filterDepreciationValue + ')');
	}
	//View.showMessage('message', 'beforeRefresh event : ' + this.abSpVwBlDepreciation_detailsPanel.title);
}

/**
* Disable the 'GenerateReport' button whenever is no value entered for Depreciation Value.
*/
function depreciationValueChanged(){
	if (View.panels.get('FilterPanel').getFieldValue('rm.total_depreciation_value') == 0 || View.panels.get('FilterPanel').getFieldValue('rm.total_depreciation_value') == '') {
		View.panels.get('FilterPanel').actions.get('GenerateReport').enable(false);
	} else {
		View.panels.get('FilterPanel').actions.get('GenerateReport').enable(true);
	}
}