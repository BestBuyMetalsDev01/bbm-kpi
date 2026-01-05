/**
 * Handles POST requests from the frontend to trigger sync actions.
 */
var TARGET_PRODUCT_IDS = "ACOVENT4BK,ACOVENT4GY"; 
var SOURCE_SS_ID = "1pqhqWWGmUppu1TX31hby2I0-eloSyhR8tx6zz7YEGQ8"; 

/**
 * Helper function for Time-Driven Triggers.
 * Runs all sync processes in sequence.
 */
function scheduledSync() {
  Logger.log("Starting Automated Scheduled Sync...");
  try {
    updateKPIFromAPI();
    syncEmployees();
    syncProductsFromAPI();
    Logger.log("Automated Sync Finished Successfully.");
  } catch (e) {
    Logger.log("Automated Sync Error: " + e.toString());
  }
}

function doPost(e) {
  const result = { status: 'success', message: 'Sync process started.' };
  try {
    const contents = JSON.parse(e.postData.contents);
    const action = contents.action;

    if (action === 'triggerSync') {
      // Trigger all syncs
      updateKPIFromAPI();
      syncEmployees();
      syncProductsFromAPI();
      // importSettingsFromSheet(); // Disabled to prevent overwriting changes made in the Dashboard UI
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Formats the SQL query with dynamic dates for use in the Apps Script bridge.
 * @param {string} DateBegin - Start date in 'yyyy-MM-dd' format.
 * @param {string} DateEnd - End date in 'yyyy-MM-dd' format.
 * @returns {string} - The parameterized SQL query.
 */
function getSalesQuery(DateBegin, DateEnd) {
  // Extract Year from DateEnd for YTD calculations
  // Expects DateEnd in "yyyy-MM-dd" format
  const yearEnd = DateEnd.split('-')[0];

  return `
select strSalesperson
,tbl.strDepartmentID
,iif(tbl.strSalesperson ='No Salesperson','No Salesperson',isnull(e.strFirstName,'')+isnull(' '+e.strlastName,'')) as strName
,iif(tbl.strDepartmentID ='None','No Department', g.strDescription) as strDepartment
,ISNULL(curOrderTotals,0) as curOrderTotals
,ISNULL(intOrders,0) as intOrders
,ISNULL(curQuoted,0) as curQuoted
,ISNULL(intQuotes,0) as intQuotes
,ISNULL(curSubTotal,0) as curSubTotal
,ISNULL(decProfitPercent,0) as decProfitPercent
,ISNULL(curSubTotalLast30,0) as curSubTotalLast30
,ISNULL(decProfitPercentLast30,0) as decProfitPercentLast30
,ISNULL(curOrderTotalsYTD,0) as curOrderTotalsYTD
,ISNULL(intOrdersYTD,0) as intOrdersYTD
,ISNULL(curQuotedYTD,0) as curQuotedYTD
,ISNULL(intQuotesYTD,0) as intQuotesYTD
,isnull(curInvoiceProfit,0) as curInvoiceProfit
,ISNULL(intInvoices,0) as intInvoices

from (
	select isnull(isnull(isnull(isnull(ot.strSalesperson,qt.strSalesperson),it.strSalesPerson),otytd.strSalesperson),qtytd.strSalesperson) as strSalesperson,isnull(isnull(isnull(isnull(ot.strDepartmentID,qt.strDepartmentID),it.strDepartmentID),otytd.strDepartmentID),qtytd.strDepartmentID) as strDepartmentID,ot.curOrderTotals,qt.curQuoted,qt.intQuotes,it.curSubTotal,it.decProfitPercent,it.curProfit as curInvoiceProfit,it.intInvoices,it30.curSubTotal curSubTotalLast30,it30.decProfitPercent as decProfitPercentLast30,intOrders,otytd.curOrderTotalsYTD,otytd.intOrdersYTD,qtytd.curQuotedYTD,qtytd.intQuotesYTD from(
		select iif(isnull(oe.strSalesperson,'')='','No Salesperson',oe.strSalesPerson) as strSalesperson
		,iif(isnull(oe.strDepartmentID,'')='','None',oe.strDepartmentID) strDepartmentID
		,sum(oe.curOrderTotal-oe.curFreight-oe.curFreightTax-oe.curFreightTax2-oe.curSalesTax-oe.curSalesTax2-oe.curOther-oe.curOtherTax) curOrderTotals,count(oe.strOrderNumber) as intOrders
		from tblOEOrder oe 
		where oe.ysnCanceled = 0 and strOrderType='order' and oe.dtmDate between '${DateBegin}' and '${DateEnd}'
		group by iif(isnull(oe.strSalesperson,'')='','No Salesperson',oe.strSalesPerson)
		,iif(isnull(oe.strDepartmentID,'')='','None',oe.strDepartmentID) 
	) as ot
	full join (
		select strSalesperson,count(strOrderNumber) as intQuotes,sum(curQuoted) as curQuoted,strDepartmentID
		 from (
			select o.strOrderNumber,o.dtmDate,o.strCustomerPO,iif(isnull(e.strEmployeeID,'')='','No Salesperson',e.strEmployeeID) as strSalesperson,o.strCustomerID
			, sum(round(curOrderTotal-curFreight-curFreightTax-o.curSalesTax-curOther-curOtherTax-o.curSalesTax2-curFreightTax2,2)) as curQuoted
			, isnull(o.strDepartmentID,'None') as strDepartmentID,d.strDescription

			from tblOEOrder o 
			inner join tblARCustomer c on c.strCustomerID = o.strCustomerID
			left join tblPREmployee e on e.strEmployeeID = o.strSalesperson
			left join tblGLDepartment d on d.strDepartmentID = o.strDepartmentID
			where o.dtmDate between '${DateBegin}' and '${DateEnd}' and o.ysnCanceled = 0 and strOrderType in ('quote','estimate')
			group by  o.strDepartmentID,d.strDescription,o.strOrderNumber,o.dtmDate,o.strCustomerPO,o.strSalesperson,e.strFirstName,e.strLastName,o.strCustomerID,e.strEmployeeID
		) as a
		group by strSalesperson,strDepartmentID
	) as qt on qt.strSalesperson = ot.strSalesperson and ot.strDepartmentID = qt.strDepartmentID
	full join (
		select strSalesPerson,strDepartmentID,curSubTotal,IIF(curSubTotal= 0,0,(curProfit/curSubtotal)*100) as decProfitPercent,curProfit,intInvoices from(
		select iif(isnull(i.strSalesperson,'') = '','No Internal Rep',i.strSalesperson) as strSalesPerson,i.strDepartmentID
		,sum(curOrderTotal-curFreight-curFreightTax-curSalesTax-curOther-curOtherTax-curSalesTax2-curFreightTax2
		) as curSubTotal
		, sum(p.curProfit) as curProfit
		,count(i.strOrderNumber) as intInvoices
		from tblARInvoice i
		inner join tblARCustomer c on c.strCustomerID = i.strCustomerID
		left join (
			SELECT tblARInvoiceDetail.strOrderNumber,
				 SUM(decQtyShipped * curCost) AS curCostSum,
				 SUM(decQtyShipped * curSalesPrice*(100-decDiscount)/100) AS curSalesSum,  
				 SUM(decQtyShipped * curSalesPrice*(100-decDiscount)/100)-SUM(decQtyShipped * curCost)AS curProfit,
				 ((SUM(decQtyShipped * curSalesPrice*(100-decDiscount)/100)-SUM(decQtyShipped * curCost))/ CASE WHEN SUM(decQtyShipped * curSalesPrice*(100-decDiscount)/100) = 0 THEN 1 ELSE SUM(decQtyShipped * curSalesPrice*(100-decDiscount)/100) END) * 100 AS decProfitPercent
			FROM   tblARInvoiceDetail INNER JOIN tblARInvoice ON tblARInvoiceDetail.strOrderNumber=tblARInvoice.strOrderNumber
			WHERE  (dtmDate>='${DateBegin}' AND dtmDate<='${DateEnd}') AND tblARInvoice.ysnPosted=1 and strOrderType in ('invoice','Credit Memo')
			GROUP BY dtmDate, strCustomerID,tblARInvoiceDetail.strOrderNumber
		) as p on p.strOrderNumber = i.strOrderNumber
		left join tblARInvoiceSplitComm com on com.strOrderNumber = i.strOrderNumber
		left join tblPREmployee e on e.strEmployeeID = iif(isnull(i.strSalesperson,'') = '','No Internal Rep',i.strSalesperson)
		left join tblSMTerm t on t.strTerm = i.strTerms
		left join tblGLDepartment d on d.strDepartmentID = i.strDepartmentID
		where i.ysnPosted = 1 and ysnVoid = 0 and strOrderType in ('invoice','Credit Memo')
		and (dtmdate>='${DateBegin}' and dtmdate<='${DateEnd}')
		group by iif(isnull(i.strSalesperson,'') = '','No Internal Rep',i.strSalesperson) ,i.strDepartmentID) tbl
	) as it on it.strSalesperson = isnull(ot.strSalesperson,qt.strSalesperson) and it.strDepartmentID = isnull(ot.strDepartmentID,qt.strDepartmentID)
	full join (
		select strSalesPerson,strDepartmentID,curSubTotal,IIF(curSubTotal= 0,0,(curProfit/curSubtotal)*100) as decProfitPercent from(
		select iif(isnull(i.strSalesperson,'') = '','No Internal Rep',i.strSalesperson) as strSalesPerson,i.strDepartmentID
		,sum(curOrderTotal-curFreight-curFreightTax-curSalesTax-curOther-curOtherTax-curSalesTax2-curFreightTax2
		) as curSubTotal
		, sum(p.curProfit) as curProfit
		from tblARInvoice i
		inner join tblARCustomer c on c.strCustomerID = i.strCustomerID
		left join (
			SELECT tblARInvoiceDetail.strOrderNumber,
				 SUM(decQtyShipped * curCost) AS curCostSum,
				 SUM(decQtyShipped * curSalesPrice*(100-decDiscount)/100) AS curSalesSum,  
				 SUM(decQtyShipped * curSalesPrice*(100-decDiscount)/100)-SUM(decQtyShipped * curCost)AS curProfit,
				 ((SUM(decQtyShipped * curSalesPrice*(100-decDiscount)/100)-SUM(decQtyShipped * curCost))/ CASE WHEN SUM(decQtyShipped * curSalesPrice*(100-decDiscount)/100) = 0 THEN 1 ELSE SUM(decQtyShipped * curSalesPrice*(100-decDiscount)/100) END) * 100 AS decProfitPercent
			FROM   tblARInvoiceDetail INNER JOIN tblARInvoice ON tblARInvoiceDetail.strOrderNumber=tblARInvoice.strOrderNumber
			WHERE  (dtmDate>=Dateadd(day,-30,cast('${DateEnd}' as date)) AND dtmDate<=cast('${DateEnd}' as date)) AND tblARInvoice.ysnPosted=1 and strOrderType in ('invoice','Credit Memo')
			GROUP BY dtmDate, strCustomerID,tblARInvoiceDetail.strOrderNumber
		) as p on p.strOrderNumber = i.strOrderNumber
		left join tblARInvoiceSplitComm com on com.strOrderNumber = i.strOrderNumber
		left join tblPREmployee e on e.strEmployeeID = iif(isnull(i.strSalesperson,'') = '','No Internal Rep',i.strSalesperson)
		left join tblSMTerm t on t.strTerm = i.strTerms
		left join tblGLDepartment d on d.strDepartmentID = i.strDepartmentID
		where i.ysnPosted = 1 and ysnVoid = 0 and strOrderType in ('invoice','Credit Memo')
		and (dtmDate>=Dateadd(day,-30,cast('${DateEnd}' as date)) AND dtmDate<=cast('${DateEnd}' as date))
		group by iif(isnull(i.strSalesperson,'') = '','No Internal Rep',i.strSalesperson) ,i.strDepartmentID) tbl
	) as it30 on it30.strSalesperson = isnull(ot.strSalesperson,qt.strSalesperson) and it30.strDepartmentID = isnull(ot.strDepartmentID,qt.strDepartmentID)
	full join (
		select iif(isnull(oe.strSalesperson,'')='','No Salesperson',oe.strSalesPerson) as strSalesperson
		,iif(isnull(oe.strDepartmentID,'')='','None',oe.strDepartmentID) strDepartmentID
		,sum(oe.curOrderTotal-oe.curFreight-oe.curFreightTax-oe.curFreightTax2-oe.curSalesTax-oe.curSalesTax2-oe.curOther-oe.curOtherTax) curOrderTotalsYTD,count(oe.strOrderNumber) as intOrdersYTD
		from tblOEOrder oe 
		where oe.ysnCanceled = 0 and strOrderType='order' and oe.dtmDate between '1/1/${yearEnd}' and '${DateEnd}'
		group by iif(isnull(oe.strSalesperson,'')='','No Salesperson',oe.strSalesPerson)
		,iif(isnull(oe.strDepartmentID,'')='','None',oe.strDepartmentID) 
	) as otytd on otytd.strSalesperson = isnull(isnull(ot.strSalesperson,qt.strSalesperson),it.strSalesPerson) and otytd.strDepartmentID = isnull(isnull(ot.strDepartmentID,qt.strDepartmentID),it.strSalesPerson)
	full join (
		select strSalesperson,count(strOrderNumber) as intQuotesYTD,sum(curQuoted) as curQuotedYTD,strDepartmentID
		 from (
			select o.strOrderNumber,o.dtmDate,o.strCustomerPO,iif(isnull(e.strEmployeeID,'')='','No Salesperson',e.strEmployeeID) as strSalesperson,o.strCustomerID
			,sum(round(curOrderTotal-curFreight-curFreightTax-o.curSalesTax-curOther-curOtherTax-o.curSalesTax2-curFreightTax2,2)) as curQuoted
			, isnull(o.strDepartmentID,'None') as strDepartmentID,d.strDescription
			from tblOEOrder o 
			inner join tblARCustomer c on c.strCustomerID = o.strCustomerID
			left join tblPREmployee e on e.strEmployeeID = o.strSalesperson
			left join tblGLDepartment d on d.strDepartmentID = o.strDepartmentID
			where o.dtmDate between '1/1/${yearEnd}' and '${DateEnd}' and o.ysnCanceled = 0 and strOrderType in ('quote','estimate')
			group by  o.strDepartmentID,d.strDescription,o.strOrderNumber,o.dtmDate,o.strCustomerPO,o.strSalesperson,e.strFirstName,e.strLastName,o.strCustomerID,e.strEmployeeID
		) as a
		group by strSalesperson,strDepartmentID
	) as qtytd on qtytd.strSalesperson = isnull(isnull(isnull(ot.strSalesperson,qt.strSalesperson),it.strSalesPerson),otytd.strSalesperson) and qtytd.strDepartmentID = isnull(isnull(isnull(ot.strDepartmentID,qt.strDepartmentID),it.strSalesPerson),otytd.strDepartmentID)
) tbl
left  join tblPREmployee e on e.strEmployeeID = tbl.strSalesperson
left join tblGLDepartment g on g.strDepartmentID = tbl.strDepartmentID
where isnull(curOrderTotals,0)<>0
order by tbl.strDepartmentID,strSalesperson
  `;
}

/**
 * Formats the Product of the Month SQL query.
 * @param {string} DateBegin - Start date.
 * @param {string} DateEnd - End date.
 * @param {string} ProductIDs - Comma-separated product IDs.
 */
function getProductQuery(DateBegin, DateEnd, ProductIDs) {
  return `
    declare @DateBegin varchar(20) = '${DateBegin}',
    @DateEnd varchar(20) = '${DateEnd}',
    @ProductID varchar(max) = '${ProductIDs}'

    select id.strProductID
    ,i.strOrderNumber
    ,i.dtmDate
    ,id.decQtyOrdered
    ,id.curSalesPrice
    ,id.curCost
    ,id.decDiscount
    ,i.strBillToCompany
    ,i.strBillToFirstName
    ,i.strBillToLastName
    ,id.decUnitMeasureQty 
    ,ic.memDescription
    ,IIF(e.strEmployeeID is null,'No Salesperson',isnull(e.strFirstname+' ','')+isnull(e.strLastName,'')) as strSalesperson
    ,ISNULL(e.strEmployeeID,'') as strSalespersonID
    from tblOEOrderDetail id 
    inner join tblOEOrder i on i.strOrderNumber = id.strOrderNumber
    inner join tblICInventory ic on ic.strProductID = id.strProductID
    left join (select strProductID,ROW_NUMBER()over(order by strProductID) as intSort from tblICInventory) a on a.strProductID = id.strProductID
    left join tblPREmployee e on e.strEmployeeID = i.strSalesperson
    where i.ysnCanceled = 0 and i.dtmDate between @DateBegin and @DateEnd and id.strProductID in (select * from dbo.funcSplitList(@ProductID,','))
    and i.strOrderType in ('Order','Back Order')
  `;
}

/**
 * Pushes formatted JSON data to a Supabase table.
 * @param {Array<Object>} data - The array of data objects.
 * @param {string} tableName - The name of the Supabase table.
 */
function pushToSupabase(data, tableName) {
  const ss = PropertiesService.getScriptProperties();
  const SUPABASE_URL = ss.getProperty("SUPABASE_URL");
  const SUPABASE_KEY = ss.getProperty("SUPABASE_KEY");
  
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    Logger.log("Error: SUPABASE_URL or SUPABASE_KEY not set in Script Properties.");
    return;
  }
  
  const url = SUPABASE_URL + "/rest/v1/" + tableName;
  
  const options = {
    method: "POST",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": "Bearer " + SUPABASE_KEY,
      "Content-Type": "application/json",
      "Prefer": "resolution=merge-duplicates" 
    },
    payload: JSON.stringify(data),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const respCode = response.getResponseCode();
    if (respCode >= 200 && respCode < 300) {
      Logger.log(`Successfully pushed to ${tableName}. Code: ${respCode}`);
    } else {
      Logger.log(`Supabase push failed for ${tableName}. Code: ${respCode} Response: ${response.getContentText()}`);
    }
  } catch (e) {
    Logger.log(`Supabase fetch error for ${tableName}: ` + e.toString());
  }
}

/**
 * Syncs the Employee Directory from the ERP API to Supabase.
 */
function syncEmployees() {
  const ss = PropertiesService.getScriptProperties();
  const link = ss.getProperty("Live_Link");
  const key = ss.getProperty("Live_Key");
  const url = link + "/api/employees"; // Assuming this endpoint exists on your ERP API
  
  const headers = { "Accept": "application/json", "x-api-key": key };
  const options = { 'method': 'GET', 'headers': headers, 'muteHttpExceptions': true };

  try {
    const response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() !== 200) {
      Logger.log("Employee API Error: " + response.getContentText());
      return;
    }

    const jsonData = JSON.parse(response.getContentText());
    
    // Transform for Supabase
    const employeeData = jsonData.map(item => ({
      email: item.strEmail || item.email,
      name: item.strName || item.name,
      department: item.strDepartment || item.department,
      job_title: item.strJobTitle || item.jobTitle,
      employee_id: item.strEmployeeID || item.employeeId,
      metadata: item.metadata || {}
    }));

    pushToSupabase(employeeData, "employees");
    Logger.log("Employee Sync Complete.");
    
  } catch (e) {
    Logger.log("Employee Sync Error: " + e.toString());
  }
}

/**
 * Syncs Products of the Month from a Google Sheet to Supabase.
 * Expects a sheet named "Products" with headers: 
 * Month, Year, Product Name, Description, Image URL
 */
function syncProductsFromSheet() {
  const ss = SpreadsheetApp.openById(SOURCE_SS_ID);
  const sheet = ss.getSheetByName("Products");
  
  if (!sheet) {
    Logger.log("Error: Sheet named 'Products' not found.");
    return;
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  const productData = rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      const key = header.toLowerCase().replace(/ /g, "_");
      obj[key] = row[index];
    });
    return {
      month: obj.month,
      year: obj.year,
      product_name: obj.product_name,
      description: obj.description,
      image_url: obj.image_url
    };
  });
  
  pushToSupabase(productData, "products_of_the_month");
  Logger.log("Product Sync (Sheet) Complete.");
}

/**
 * Syncs Products of the Month from the ERP API using SQL Query.
 */
function syncProductsFromAPI(customStartStr, customEndStr) {
  const ss = PropertiesService.getScriptProperties();
  const ProductIDs = ss.getProperty("POTM_PRODUCT_IDS") || TARGET_PRODUCT_IDS; 
  
  if (!ProductIDs) {
    Logger.log("Error: POTM_PRODUCT_IDS not set in Script Properties.");
    return;
  }

  const timeZone = Session.getScriptTimeZone();
  const now = new Date();
  var startObj = customStartStr ? new Date(customStartStr) : new Date(now.getFullYear(), now.getMonth(), 1);
  var endObj = customEndStr ? new Date(customEndStr) : now;

  const DateBegin = Utilities.formatDate(startObj, timeZone, "yyyy-MM-dd");
  const DateEnd = Utilities.formatDate(endObj, timeZone, "yyyy-MM-dd");

  const link = ss.getProperty("Live_Link");
  const key = ss.getProperty("Live_Key");
  const url = link + "/api/report";
  const sqlQuery = getProductQuery(DateBegin, DateEnd, ProductIDs);
  
  const headers = { "Accept": "text/plain", "Content-Type": "application/json", "x-api-key": key };
  const options = { 'method': 'POST', 'headers': headers, 'payload': JSON.stringify(sqlQuery), 'muteHttpExceptions': true };

  try {
    const response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() !== 200) {
      Logger.log("POTM API Error: " + response.getContentText());
      return;
    }

    const jsonData = JSON.parse(response.getContentText());
    
    // Transform for Supabase (matching products_of_the_month schema)
    const productData = jsonData.map(item => ({
      month: Utilities.formatDate(startObj, timeZone, "MMMM"),
      year: Utilities.formatDate(startObj, timeZone, "yyyy"),
      product_name: item.memDescription || item.strProductID,
      description: item.strProductID,
      image_url: "",
      salesperson_id: item.strSalespersonID,
      salesperson_name: item.strSalesperson,
      qty_ordered: parseFloat(item.decQtyOrdered) || 0,
      period_date: DateBegin,
      order_number: item.strOrderNumber,
      order_date: item.dtmDate ? item.dtmDate.substring(0, 10) : "",
      bill_to_company: item.strBillToCompany,
      bill_to_first: item.strBillToFirstName,
      bill_to_last: item.strBillToLastName
    }));

    pushToSupabase(productData, "products_of_the_month");
    Logger.log("Product Sync (API) Complete: " + productData.length + " rows.");
    
  } catch (e) {
    Logger.log("Product Sync (API) Error: " + e.toString());
  }
}

/**
 * Imports AdminSettings from a Google Sheet named "AdminSettings" and pushes to Supabase.
 */
function importSettingsFromSheet() {
  const SETTINGS_SHEET_NAME = "AdminSettings";
  const ss = SpreadsheetApp.openById(SOURCE_SS_ID);
  const sheet = ss.getSheetByName(SETTINGS_SHEET_NAME);
  
  if (!sheet) {
    Logger.log("Error: '" + SETTINGS_SHEET_NAME + "' sheet not found.");
    return;
  }

  const data = sheet.getDataRange().getValues();
  if (data.length < 1) {
    Logger.log("Error: '" + SETTINGS_SHEET_NAME + "' sheet is empty.");
    return;
  }

  const settingsJson = {};
  
  data.forEach(row => {
    const key = String(row[0]).trim();
    let val = row[1];
    
    if (!key) return;

    // Try to parse JSON if it looks like an object or array
    if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
      try {
        val = JSON.parse(val);
      } catch (e) {
        Logger.log("Warning: Could not parse JSON for key '" + key + "': " + e.toString());
      }
    }
    
    // Convert "TRUE"/"FALSE" strings to bullets if needed
    if (val === "TRUE") val = true;
    if (val === "FALSE") val = false;

    settingsJson[key] = val;
  });

  if (Object.keys(settingsJson).length > 0) {
    const supabaseData = {
      id: "primary",
      data: settingsJson,
      updated_at: new Date()
    };
    
    // pushToSupabase expects an array
    pushToSupabase([supabaseData], "dashboard_settings");
    Logger.log("Settings Import Complete: " + Object.keys(settingsJson).length + " keys synchronized.");
  } else {
    Logger.log("Error: No valid keys found in '" + SETTINGS_SHEET_NAME + "'.");
  }
}

/**
 * Main function to trigger the report update and sync to Supabase.
 * @param {string} customStartStr - Optional start date "yyyy-MM-dd"
 * @param {string} customEndStr - Optional end date "yyyy-MM-dd"
 */
function updateKPIFromAPI(customStartStr, customEndStr) {
  // 1. Prevent concurrent execution
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); 
  } catch (e) {
    Logger.log("Could not obtain lock: " + e.toString());
    throw new Error("Lock timeout: Another process is currently updating the report.");
  }

  const ScriptProperties = PropertiesService.getScriptProperties();
  const timeZone = Session.getScriptTimeZone();
  const now = new Date();

  // --- DATE LOGIC ---
  var startObj, endObj;

  // Set End Date
  if (customEndStr && typeof customEndStr === 'string') {
    var eParts = customEndStr.split("-");
    endObj = new Date(eParts[0], eParts[1] - 1, eParts[2]); 
  } else {
    endObj = now; 
  }

  // Set Start Date
  if (customStartStr && typeof customStartStr === 'string') {
    var sParts = customStartStr.split("-");
    startObj = new Date(sParts[0], sParts[1] - 1, sParts[2]);
  } else {
    startObj = new Date(now.getFullYear(), now.getMonth(), 1); 
  }

  var DateBegin = Utilities.formatDate(startObj, timeZone, "yyyy-MM-dd");
  var DateEnd = Utilities.formatDate(endObj, timeZone, "yyyy-MM-dd");
  var reportMonthName = Utilities.formatDate(startObj, timeZone, "MMMM");
  var reportYear = Utilities.formatDate(startObj, timeZone, "yyyy");

  // -----------------------

  // 2. Build Query and Fetch
  const link = ScriptProperties.getProperty("Live_Link");
  const key = ScriptProperties.getProperty("Live_Key");
  const endpoint = "/api/report";
  const url = link + endpoint;
  const sqlQuery = getSalesQuery(DateBegin, DateEnd);
  
  const headers = { "Accept": "text/plain", "Content-Type": "application/json", "x-api-key": key };
  const options = { 'method': 'POST', 'headers': headers, 'payload': JSON.stringify(sqlQuery), 'muteHttpExceptions': true };

  try {
    var response = UrlFetchApp.fetch(url, options);
    var responseBody = response.getContentText();
    if (response.getResponseCode() !== 200) { 
      Logger.log("API Error: " + responseBody); 
      return; 
    }

    var jsonData = JSON.parse(responseBody);
    
    // 3. Transform for Supabase (Full Mapping)
    var supabaseData = jsonData.map(item => ({
      salesperson_id: String(item["strSalesperson"] || "No Salesperson"),
      salesperson_name: (item["strName"] && item["strName"].trim() !== "") ? item["strName"].trim() : "No Salesperson",
      department: item["strDepartment"] || "No Department",
      department_id: item["strDepartmentID"] || "None",
      order_totals: parseFloat(item["curOrderTotals"]) || 0,
      order_count: parseInt(item["intOrders"]) || 0,
      quoted_amount: parseFloat(item["curQuoted"]) || 0,
      quote_count: parseInt(item["intQuotes"]) || 0,
      sub_total: parseFloat(item["curSubTotal"]) || 0,
      profit_percent: parseFloat(item["decProfitPercent"]) || 0,
      invoiced_amount: parseFloat(item["curSubTotal"]) || 0,
      invoice_profit: parseFloat(item["curInvoiceProfit"]) || 0,
      invoice_count: parseInt(item["intInvoices"]) || 0,
      order_totals_ytd: parseFloat(item["curOrderTotalsYTD"]) || 0,
      order_count_ytd: parseInt(item["intOrdersYTD"]) || 0,
      quoted_amount_ytd: parseFloat(item["curQuotedYTD"]) || 0,
      quote_count_ytd: parseInt(item["intQuotesYTD"]) || 0,
      sub_total_last_30: parseFloat(item["curSubTotalLast30"]) || 0,
      profit_percent_last_30: parseFloat(item["decProfitPercentLast30"]) || 0,
      period_date: DateBegin
    }));

    // 4. Push to Supabase (Upsert Logic)
    pushToSupabase(supabaseData, "kpi_data");

    // 5. (OPTIONAL) Update Google Sheet as well
    const DESTINATION_SS_ID = ScriptProperties.getProperty("DESTINATION_SS_ID");
    if (DESTINATION_SS_ID) {
      updateGoogleSheet(jsonData, reportMonthName, reportYear, DESTINATION_SS_ID);
    }

    Logger.log("Sync Complete for: " + reportMonthName + " " + reportYear);
  } catch (e) {
    Logger.log("Critical Error: " + e.toString());
  } finally {
    lock.releaseLock(); 
  }
}

/**
 * Updates the classic Google Sheet report (Optional).
 */
function updateGoogleSheet(jsonData, reportMonthName, reportYear, spreadsheetId) {
  const DESTINATION_SHEET_NAME = "RAW";
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const sh = ss.getSheetByName(DESTINATION_SHEET_NAME);
  
  const headerRow = ["Month", "Year", "Order Totals YTD", "Quoted (Current)", "Salesperson ID", "Order Totals (Current)", "Salesperson Name", "Sub Total", "Orders Count YTD", "Dept ID", "Quotes Count YTD", "Department Name", "Profit %", "Quotes Count (Current)", "Orders Count (Current)", "Quoted YTD", "Sub Total (Last 30)", "Profit % (Last 30)", "Invoice Profit", "Invoice Count"];

  const newRows = jsonData.map(item => [
    reportMonthName, reportYear.toString(), item["curOrderTotalsYTD"], item["curQuoted"],
    item["strSalesperson"] || "No Salesperson", item["curOrderTotals"],
    (item["strName"] && item["strName"].trim() !== "") ? item["strName"] : "No Salesperson",
    item["curSubTotal"], item["intOrdersYTD"], item["strDepartmentID"], item["intQuotesYTD"],
    item["strDepartment"], item["decProfitPercent"], item["intQuotes"], item["intOrders"],
    item["curQuotedYTD"], item["curSubTotalLast30"], item["decProfitPercentLast30"],
    item["curInvoiceProfit"], item["intInvoices"]
  ]);

  const existingData = sh.getLastRow() > 0 ? sh.getDataRange().getValues().slice(1) : [];
  const finalData = existingData.filter(r => !(r[0] == reportMonthName && r[1] == reportYear.toString()));
  
  sh.clearContents();
  const output = [headerRow].concat(finalData).concat(newRows);
  sh.getRange(1, 1, output.length, headerRow.length).setValues(output);
}

/**
 * One-time function to backfill historical data.
 * Modify the start and end month indices as needed.
 */
function runHistoricalBackfill() {
  const years = [2024, 2025];
  
  years.forEach(year => {
    // Determine the max month to process (don't go past current month for current year)
    const now = new Date();
    const maxMonth = (year === now.getFullYear()) ? now.getMonth() : 11;
    
    for (let month = 0; month <= maxMonth; month++) {
      // Calculate first and last day of the month
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      
      const startStr = Utilities.formatDate(start, Session.getScriptTimeZone(), "yyyy-MM-dd");
      const endStr = Utilities.formatDate(end, Session.getScriptTimeZone(), "yyyy-MM-dd");
      
      Logger.log(`[BACKFILL] Starting ${startStr} to ${endStr}...`);
      try {
        updateKPIFromAPI(startStr, endStr);
      } catch (e) {
        Logger.log(`[BACKFILL] Failed for ${startStr}: ${e.toString()}`);
      }
      
      // Small delay to avoid API rate limits if any
      Utilities.sleep(1000);
    }
  });
}
