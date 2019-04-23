/**
IFM Mehran added on 22-08-2017 for mutually exclusive po_no and invoice_no
*/

var ifmPOInvoice=View.createController('ifmWRPurchaseInvoiceDetails', {

	afterViewLoad: function(){
		//alert("In the view load");
		var po_input=document.getElementById("abViewdefEditformDrilldown_detailsPanel_hwr.po_no");
		var invoice_no_input=document.getElementById("abViewdefEditformDrilldown_detailsPanel_hwr.invoice_no");
		
		
		po_input.addEventListener('input', function(evt){
				ifmPOInvoice.abViewdefEditformDrilldown_detailsPanel_afterRefresh();
		});
		
		invoice_no_input.addEventListener('input', function(evt){
				
				ifmPOInvoice.abViewdefEditformDrilldown_detailsPanel_afterRefresh();
				
		});
	},
	
	//check if a new wr_id then update the hidden fields with the data read from db
	abViewdefEditformDrilldown_detailsPanel_afterRefresh: function(){
	//	alert("In the view refresh");
		
		var poNOField=this.abViewdefEditformDrilldown_detailsPanel.getFieldCell("hwr.po_no").children[0];
		var invoiceNOField=this.abViewdefEditformDrilldown_detailsPanel.getFieldCell("hwr.invoice_no").children[0];
		
		var wr_id = this.abViewdefEditformDrilldown_detailsPanel.getFieldCell("hwr.wr_id").children[0];
		var pwr_id= this.wrDetails.getFieldCell("hwr.wr_id").children[0];
		
		var poHiddenField = this.wrDetails.getFieldCell("hwr.po_no").children[0];
		var invoice_no_hidden = this.wrDetails.getFieldCell("hwr.invoice_no").children[0];
				
		
		if (wr_id.value != pwr_id.value){
			pwr_id.value = wr_id.value;
			poHiddenField.value = poNOField.value;
			invoice_no_hidden.value = invoiceNOField.value
		}
		
		var invoice_date=this.abViewdefEditformDrilldown_detailsPanel.getFieldCell("hwr.invoice_date").children[0];
		var invoice_file=this.abViewdefEditformDrilldown_detailsPanel.getFieldCell("hwr.invoice_file_name").children[0];
		var doc_img=document.getElementById("abViewdefEditformDrilldown_detailsPanel_hwr.invoice_file_name_checkInNewDocument");
		var cal_img = document.getElementById("AFMCALENDAR_abViewdefEditformDrilldown_detailsPanel_hwr.invoice_date");
		
		
		var poHiddenFieldVal = poHiddenField.value;
		var invoice_no_hidden_val = invoice_no_hidden.value;
		
		
		var poVal = this.abViewdefEditformDrilldown_detailsPanel.getFieldValue("hwr.po_no");
		var invoiceNumVal = this.abViewdefEditformDrilldown_detailsPanel.getFieldValue("hwr.invoice_no");
		
		if (poVal !=null && poVal.length>0){
			poNOField.readOnly=false;//"false";
			invoiceNOField.readOnly=true;//"true";
			invoice_file.readOnly=true;//"false";
			invoice_date.readOnly=true;//"false";
			
			doc_img.hidden=true;
			cal_img.disabled=true;
		}else if(invoiceNumVal !=null && invoiceNumVal.length>0){
			poNOField.readOnly=true;//"true";
			invoiceNOField.readOnly=false;//"false";
			invoice_file.readOnly=false;//"false";
			invoice_date.readOnly=false;//"false";
			
			doc_img.hidden=false;
			cal_img.disabled=false;
			
		}else if (invoice_no_hidden_val.length==0 && poHiddenFieldVal==0){
			invoiceNOField.readOnly=false;//"false";
			poNOField.readOnly=false;//"false";
			invoice_file.readOnly=false;//"false";
			invoice_date.readOnly=false;//"false";
			doc_img.hidden=true;
			
			cal_img.disabled=true;

		}
		
		//var poVal = this.abViewdefEditformDrilldown_detailsPanel.setFieldValue("wr.po_no","ifm_test");
		
		/** Highlight the STatus field **/
		var p= this.abViewdefEditformDrilldown_detailsPanel;
		var u=p.getFieldElement("hwr.status")
		var status = p.getFieldValue("hwr.status");
		if (status=='Rej' || status=='S'|| status=='Can'){
			u.style.backgroundColor='#FF5555';
		}else{
			u.style.backgroundColor='#FFFFFF';
		}
		
	}
});