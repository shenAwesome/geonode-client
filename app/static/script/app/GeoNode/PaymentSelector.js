Ext.namespace("GeoNode");
GeoNode.PaymentSelector = Ext.extend(Ext.util.Observable, {

	paymentType : null,
	currency :  null,
	payment_options : null,
	
	edit_period : false,
	edit_byte : false,

	PAYMENT_BY_PERIOD : 'By Period',
	PAYMENT_BY_BYTE_USAGE : 'By Byte Usage',

	lisenceSelectionWindow : null,
	lisenceAgreementList : null,
	lisenceAgreementStore : null, 

    constructor: function (config) {
    	Ext.apply(this, config);
    	
    	this.initPeriodStore();
        this.payment_options = config.payment_options;
       
    	this.panel = this.doLayout();
        this.setDisabled(true);

    },
    initPaymentOptions: function (payment_options){
    	    	
    	 if(payment_options != undefined ){
    		 if(payment_options.length > 0 && this.periodStore.getCount() > 0){
    			 
    			 for (var i = 0; i < payment_options.length ; i++){
    				 paymentType   =   payment_options[i][0];
    				 paymentAmount =   payment_options[i][1];
    				 currencyType  =   payment_options[i][2];
    				 typeDesc      =   payment_options[i][3];

    				 if (this.periodStore.find('payment_type_value', paymentType) >=  0){
    					 this.paymentTypeSelector.setValue( this.PAYMENT_BY_PERIOD);
    					 var paymentData = {
    							 payment_type_value: ''+ paymentType,
    							 payment: paymentAmount,
    							 payment_currency : '' + currencyType,
    							 payment_type_description : typeDesc
    							};
    					 
    					 var r = new this.peroidPaymentTypes.recordType(paymentData, 100 + i); 		 
    					 this.peroidPaymentTypes.add(r, i); 	
    					 this.setInitialPeriodOptionsforEditing();
    				 }else{
    					 this.paymentTypeSelector.setValue(  this.PAYMENT_BY_BYTE_USAGE )
    					 var paymentByteData = {
    							 payment_type_value: paymentType,
    							 payment: paymentAmount,
    							 payment_currency : currencyType

    							};
    					 var r1 = new this.transactionPaymentTypes.recordType(paymentByteData, 200 + i); 		 
    					 this.transactionPaymentTypes.add(r1, i); 	
    					 this.setinitialByteOptionForEditing(); 
    				 }
    				 this.currencyTypeSelector.setValue( currencyType );
    				 
    			 }

    		 }
    	 }
    },

    initPeriodStore: function () {
    	
    	
    	if (!this.peroidPaymentTypes) {
         this.peroidPaymentTypes = new Ext.data.ArrayStore({
                idIndex: 0,
                fields: ['payment_type_value', 'payment', 'payment_currency', 'payment_type_description'],
                data: []
            });
    	}

    	 if (!this.transactionPaymentTypes) {
             this.transactionPaymentTypes = new Ext.data.ArrayStore({
                 idIndex: 0,
                 fields: ['payment', 'payment_type_value', 'payment_currency'],
                 data: []
             });
         }
    	 
    	 if (!this.availabletransactions) {
             this.availabletransactions = new Ext.data.ArrayStore({
                 idIndex: 0,
                 id:0,
        		 storeId: 'availabletransactions',
                 fields: ['payment', 'numberOfTransactions', 'payment_type_value'],
                 data:[ ['0', '1', '5'] ]
             });
         }

         
         if (!this.paymentTypeStore) {
             var cfg = {
                 proxy: new Ext.data.HttpProxy({ url: '/payment/payment_options_lookup', method: 'POST' }),
                 reader: new Ext.data.JsonReader({
                     root: 'payment_options',
                     fields: [{name: 'payment_type_desc'}]
                 })
             };
             Ext.apply(cfg);
             this.paymentTypeStore = new Ext.data.Store(cfg);
             this.paymentTypeStore.load({params: {query: ''},
            	 	callback: function (r, options, success){
            	 		this.paymentTypeStore.add(r);
            	 	},
					scope : this,
             
             });
         } 

         if (!this.CurrencyTypeStore) {
             var cfg = {
                 proxy: new Ext.data.HttpProxy({ url: '/payment/payment_currency_options', method: 'POST' }),
                 reader: new Ext.data.JsonReader({
                     root: 'payment_currency_options',
                     fields: [{ name : 'currency_id'},
                              { name : 'currency_type_code'}
                     		]
                 })
             };
             Ext.apply(cfg);
             this.CurrencyTypeStore = new Ext.data.Store(cfg);
             this.CurrencyTypeStore.load({
            	 						  params: {query: ''},
            	 						  callback: function (r, options, success){
            	 							  this.CurrencyTypeStore.add(r);
            	 						  	},
            	 						  	scope : this
            	 					});
         }


         if (!this.periodStore) {
             var cfg = {
                 proxy: new Ext.data.HttpProxy({ url: '/payment/payment_period_options', method: 'POST' }),
                 reader: new Ext.data.JsonReader({
                     root: 'payment_period_options',
                     fields: [{ name : 'payment_type_description'},
                              { name : 'payment_type_value'},
                              { name : 'payment'}
                     		]
                 })
             };
             Ext.apply(cfg);
             this.periodStore = new Ext.data.Store(cfg);
             this.periodStore.load({params: {query: ''},
             	callback: function (r, options, success){
             		this.periodStore.add(r);
         	 		this.initPaymentOptions(this.payment_options);
         	 	},
 				 scope : this,
          
          });
         }
         if(!this.lisenceAgreementStore){
             var cfg = {
                     proxy: new Ext.data.HttpProxy({ url: '/payment/ajax_payment_lookup', method: 'POST' }),
                     reader: new Ext.data.JsonReader({
                         root: 'license_agreement_options',
                         fields: [{ name : 'title'},
                                  { name : 'filePath'},
                                  { name : 'id'}
                         		]
                     })
                 };
                 Ext.apply(cfg);
                 this.lisenceAgreementStore = new Ext.data.Store(cfg);
                 this.lisenceAgreementStore.load({params: {query: 'payment_license_agreement_list'},
                 	callback: function (r, options, success){
                 		
             	 		
             	 	},
     				 scope : this,
              
              });
         }
         
         
    	 
    },
    doLayout: function () {
        var owner = this.owner;
        var periodOptionPlugin = (function () {
            var view;

            function init(v) {
            	 view = v;
                 view.on('render', addHooks);
            }

            function addHooks() {
            	 view.getEl().on('mousedown', removeItem, this, { delegate: 'button' });
            }

            function removeItem(e, target) {
            	 var item = view.findItemFromChild(target);
                 var idx = view.indexOf(item);
                 var rec = view.store.getAt(idx);
                 if (rec.get("payment_type_value") !== owner) {
                     view.store.removeAt(view.indexOf(item));
                 }
            }
            return {
                init: init
            };
        })();

        var transactoinOptionPlugin = (function () {
            var view;

            function init(v) {
            	 view = v;
                 view.on('render', addHooks);
            }

            function addHooks() {
            	 view.getEl().on('mousedown', removeItem, this, { delegate: 'button' });
            }

            function removeItem(e, target) {
            	 var item = view.findItemFromChild(target);
                 var idx = view.indexOf(item);
                 var rec = view.store.getAt(idx);
                 if (rec.get("payment_type_value") !== owner) {
                     view.store.removeAt(view.indexOf(item));
                 }
            }
            return {
                init: init
            };
        })();
        
        
        this.selectedPeriods = new Ext.DataView({
            store: this.peroidPaymentTypes,
            itemSelector: 'div.period_item',
            tpl: new Ext.XTemplate('<div><tpl for="."> <div class="x-btn period_item"><button class="icon-removeuser remove-button">&nbsp;</button>${payment} for {payment_type_description} </div></tpl></div>'),
            plugins: [periodOptionPlugin],
            autoHeight: true,
            multiSelect: true
            
        });


        this.transactionPayments = new Ext.DataView({
            store: this.transactionPaymentTypes,
            itemSelector: 'div.paymentTransaction_item',
            tpl: new Ext.XTemplate('<div><tpl for="."> <div class="x-btn paymentTransaction_item"><button class="icon-removeuser remove-button">&nbsp;</button> ${payment} per byte</div></tpl></div>'),
            plugins: [transactoinOptionPlugin],
            autoHeight: true,
        	multiSelect: true
        });
        
        function addSelectedPeriod() {	
            var value = this.availablePeriods.getValue();
            var index = this.availablePeriods.store.findExact('payment_type_value', value);
            if (index != -1 &&
                this.selectedPeriods.store.findExact('payment_type_value', value) == -1 &&
                this.paymentAmount.getValue() != ''
            ) {
            	period_obj = this.availablePeriods.store.getAt(index);
            	period_obj.set('payment', this.paymentAmount.getValue());
            	period_obj.set('payment_currency', this.currencyTypeSelector.getValue());
                this.selectedPeriods.store.add([period_obj]);
                this.availablePeriods.reset();
                this.paymentAmount.reset();
            }        
        }
        
        function addTransactionPayment() {	
   
			var value = this.transactionPayment.getValue();
			
			var transaction_obj = this.availabletransactions.getAt(0);
            var index = this.transactionPayments.store.findExact('numberOfTransactions','1');
			if(index < 0 && value != ''){
				transaction_obj.set('payment', value);
				transaction_obj.set('payment_currency', this.currencyTypeSelector.getValue());
				this.transactionPayments.store.add([transaction_obj]);
				this.transactionPayment.reset();
			}
		}
        
        
        this.periodAddButton = new Ext.Button({
            iconCls: 'icon-adduser',
            handler: addSelectedPeriod,
            scope: this
        });
        this.transactionAddButton = new Ext.Button({
            iconCls: 'icon-adduser',
            handler: addTransactionPayment,
            scope: this
        });
        this.availablePeriods = new Ext.form.ComboBox({
            width: 100,
            store: this.periodStore,
            typeAhead: true,
            mode: 'remote',
            align: 'right',
            border: 'false',
            minChars: 0,
            displayField: 'payment_type_description',
		    valueField: 'payment_type_value',
		    triggerAction: 'all',
            emptyText: gettext("Add Period..."),
            listeners: {
                scope: this
            }
        });
        this.paymentAmount = new Ext.form.TextField({
            name: 'periodCost',
            id: 'periodCost',
            width: 130,
            allowBlank:false,
            emptyText: 'Enter dollars cost for period',
            listeners: {
           		scope: this,
           		specialkey: function(f,e){
                    if (e.getKey() == e.ENTER) {
                    	this.addSelectedPeriod;
                    }
           		}
            }
        });
        this.paymentTypeSelector =  new Ext.form.ComboBox({
            width: 130,
            store: this.paymentTypeStore,
            typeAhead: true,
            align: 'right',
            minChars: 0,
            border: 'false',
            mode: 'remote',
            displayField: 'payment_type_desc',
		    valueField: 'payment_type_desc',
		    value: this.paymentType,
            emptyText: gettext("Select Payment Type..."),
            listeners: {
                scope: this,
                'select': function( combo, index, scrollIntoView) {
                  if(combo.getValue() === this.PAYMENT_BY_PERIOD){
                	  this.setDisabledPeriodOptions(false);
                	  this.setDisabledTransactionOptions(true);
                  }else if (combo.getValue() === this.PAYMENT_BY_BYTE_USAGE){
                	  this.setDisabledPeriodOptions(true);
                	  this.setDisabledTransactionOptions(false);
                  }
                }
                
            }       	
        });
        
        this.currencyTypeSelector =  new Ext.form.ComboBox({
        	width: 130,
            store: this.CurrencyTypeStore,
            typeAhead: true,
            triggerAction: 'all',
            mode: 'remote',
            minChars: 0,
            border: 'false',
            displayField: 'currency_type_code',
		    valueField: 'currency_id',
		    value:this.currency,
            emptyText: gettext("Select Currency..."),
            listeners: {
                scope: this
            }       	
        });
        

        
        this.transactionPayment = new Ext.form.TextField({
            name: 'transactionPayment',
            id: 'transactionPayment',
            width: 180,
            allowBlank:false,
            emptyText: 'Enter dollars cost per byte..',
            listeners: {
           		scope: this
            }
        });
        
        this.paymentSelectorPanel = new Ext.Panel({
            border: false,
            renderTo: this.renderTo,
            width:400,
            height:28,
            items: [
                    {
                        border: false,
                        items: [                                	
                                {layout: 'hbox', border: false, items: [ this.paymentTypeSelector, this.currencyTypeSelector ]}
                               ]
                    }]           
        });
        
        this.paymentByPeriodPanel =  new Ext.Panel({
            border: false,
            renderTo: this.renderTo,
            width:400,
            
            items: [
                    {
                        border: false,
                        items: [
                                 { layout: 'hbox', border: false, items: [ this.periodAddButton, this.availablePeriods, this.paymentAmount ]} ,
                                 this.selectedPeriods
                               ]
                    }]           
        });
        
        this.transactionPaymentPanel = new Ext.Panel({
            border: false,
            renderTo: this.renderTo,
            width:400,
            items: [
                    {
                        border: false,
                        items: [
                                 { layout: 'hbox', border: false, items: [this.transactionAddButton, this.transactionPayment] },
                                 this.transactionPayments
                               ]
                    }]           
        });
        
        
        this.liscgrdsm = new Ext.grid.CheckboxSelectionModel({
            checkOnly: true,
            singleSelect : true,
            renderer: function(v, p, record){
               return '<div class="x-grid3-row-checker">&#160;</div>';
              
            },
            listeners: {
                'beforerowselect' : function(sm, rowIndex, keepExisting, record){

                }
            }
        });
        this.liscgrdsmcolumns = [
                        {
                            header: 'Title',
                            dataIndex: 'title',
                            sortable: true,
                            width:182
                            
                          },
                          {
                              header: '',
                              dataIndex: 'id',
                              sortable: false,
                              width:50,
                              renderer: this.renderAction                	  
                           }

                        ];
        
        this.liscgrdsmcolumns.push(this.liscgrdsm);
        
        this.lisenceAgreementList = new Ext.grid.GridPanel({
           
            width: 260,//475,
            renderTo: this.renderTo,
            store: this.lisenceAgreementStore,
            autoHeight:true, 
            selModel:this.liscgrdsm,
            columns: this.liscgrdsmcolumns
          });
        
        this.uploadlicense = new Ext.ux.form.FileUploadField({
            id: 'licenseFile',
            emptyText: 'Select license file',
            fieldLabel: 'Data File or ZIP',
          
            name: 'licenseFile',
            allowBlank: false,
            validator: function(name) {
                /*
                if ((name.length > 0) && (name.search(/\.zip$/i) == -1)) {
                    return 'Please select a zip file' ;
                } else {
                    return true;
                }
                */
                return true;
            }
            
        });
        
        this.licenseTitle = new Ext.form.TextField({
            name: 'licenseTitle',
            id: 'licenseTitle',
            width: 260,
            allowBlank:false,
            emptyText: 'License title',
            listeners: {
           		scope: this
            }
        });
        
        
        this.lisenceSelectionWindow = new Ext.Panel({
    	    title: 'Select License',
    	    renderTo: this.renderTo,
            width:260,
            collapsible:true,
            collapsed:true,
            items: [
                    	{ layout: 'hbox', border: false, items: [this.lisenceAgreementList] },
                    	{ layout: 'hbox', border: false, items: [this.licenseTitle] },
                    	{ layout: 'hbox', border: false, items: [this.uploadlicense] }
                   ]
               			
          });
        

        
        return new Ext.Panel({
        	
            border: false,
            renderTo: this.renderTo,
            width:400,
            items: [
            {
                border: false,
                items: [
                        this.paymentSelectorPanel,
                        this.paymentByPeriodPanel,
                        this.transactionPaymentPanel,
                        this.lisenceSelectionWindow
                        ]
            }]
        });

        
    },renderAction: function(val){ 
    	 var url = '../payment/license/'+val;
    	 return '<a target = "_blank" href="' + url + '">'+ 'view' +'</a>';
    },licensePopup : function (url){
    	popupWindow = window.open(
    			url,'popUpWindow','height=700,width=800,left=10,top=10,resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no,directories=no,status=yes')   	
    }, 
    setDisabled: function (disabled) {
    	
    	this.paymentSelectorPanel.setDisabled(disabled);
   		if(!disabled){
    		if(this.paymentTypeSelector.getValue() == this.PAYMENT_BY_BYTE_USAGE){
    			this.setDisabledPeriodOptions(true);
    			this.setDisabledTransactionOptions(false);
   			}
    		if(this.paymentTypeSelector.getValue() == this.PAYMENT_BY_PERIOD){
    			this.setDisabledTransactionOptions(true);
    			this.setDisabledPeriodOptions(false);
    		}
    	}else{
    		this.setDisabledPeriodOptions(disabled);
    		this.setDisabledTransactionOptions(disabled);
    	}  
    },
    setDisabledPeriodOptions: function (disable){
    	this.paymentByPeriodPanel.setDisabled(disable);
    },
    setDisabledTransactionOptions: function (disable){
    	this.transactionPaymentPanel.setDisabled(disable);
    },setInitialPeriodOptionsforEditing : function (){
    	
    	this.paymentSelectorPanel.setDisabled(false);
    	this.setDisabledPeriodOptions(false);
    	this.setDisabledTransactionOptions(true);
    	
    	
    },setinitialByteOptionForEditing: function (){
    	this.paymentSelectorPanel.setDisabled(false);
    	this.setDisabledPeriodOptions(true);
    	this.setDisabledTransactionOptions(false);
    },
    readPaymentType: function (){
    	return this.paymentTypeSelector.getValue();
    }
    
});
