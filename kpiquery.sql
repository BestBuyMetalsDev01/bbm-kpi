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
		where oe.ysnCanceled = 0 and strOrderType='order' and oe.dtmDate between '1/1/2025' and '12/31/2025'
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
			where o.dtmDate between '1/1/2025' and '12/31/2025' and o.ysnCanceled = 0 and strOrderType in ('quote','estimate')
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
			WHERE  (dtmDate>='1/1/2025' AND dtmDate<='12/31/2025') AND tblARInvoice.ysnPosted=1 and strOrderType in ('invoice','Credit Memo')
			GROUP BY dtmDate, strCustomerID,tblARInvoiceDetail.strOrderNumber
		) as p on p.strOrderNumber = i.strOrderNumber
		left join tblARInvoiceSplitComm com on com.strOrderNumber = i.strOrderNumber
		left join tblPREmployee e on e.strEmployeeID = iif(isnull(i.strSalesperson,'') = '','No Internal Rep',i.strSalesperson)
		left join tblSMTerm t on t.strTerm = i.strTerms
		left join tblGLDepartment d on d.strDepartmentID = i.strDepartmentID
		where i.ysnPosted = 1 and ysnVoid = 0 and strOrderType in ('invoice','Credit Memo')
		and (dtmdate>='1/1/2025' and dtmdate<='12/31/2025')
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
			WHERE  (dtmDate>=Dateadd(day,-30,cast(Getdate() as date)) AND dtmDate<=cast(Getdate() as date)) AND tblARInvoice.ysnPosted=1 and strOrderType in ('invoice','Credit Memo')
			GROUP BY dtmDate, strCustomerID,tblARInvoiceDetail.strOrderNumber
		) as p on p.strOrderNumber = i.strOrderNumber
		left join tblARInvoiceSplitComm com on com.strOrderNumber = i.strOrderNumber
		left join tblPREmployee e on e.strEmployeeID = iif(isnull(i.strSalesperson,'') = '','No Internal Rep',i.strSalesperson)
		left join tblSMTerm t on t.strTerm = i.strTerms
		left join tblGLDepartment d on d.strDepartmentID = i.strDepartmentID
		where i.ysnPosted = 1 and ysnVoid = 0 and strOrderType in ('invoice','Credit Memo')
		and (dtmDate>=Dateadd(day,-30,cast(Getdate() as date)) AND dtmDate<=cast(Getdate() as date))
		group by iif(isnull(i.strSalesperson,'') = '','No Internal Rep',i.strSalesperson) ,i.strDepartmentID) tbl
	) as it30 on it30.strSalesperson = isnull(ot.strSalesperson,qt.strSalesperson) and it30.strDepartmentID = isnull(ot.strDepartmentID,qt.strDepartmentID)
	full join (
		select iif(isnull(oe.strSalesperson,'')='','No Salesperson',oe.strSalesPerson) as strSalesperson
		,iif(isnull(oe.strDepartmentID,'')='','None',oe.strDepartmentID) strDepartmentID
		,sum(oe.curOrderTotal-oe.curFreight-oe.curFreightTax-oe.curFreightTax2-oe.curSalesTax-oe.curSalesTax2-oe.curOther-oe.curOtherTax) curOrderTotalsYTD,count(oe.strOrderNumber) as intOrdersYTD
		from tblOEOrder oe 
		where oe.ysnCanceled = 0 and strOrderType='order' and oe.dtmDate between '1/1/'+cast(YEAR(cast('12/31/2025' as date)) as varchar) and '12/31/2025'
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
			where o.dtmDate between '1/1/'+cast(YEAR(cast('12/31/2025' as date)) as varchar) and '12/31/2025' and o.ysnCanceled = 0 and strOrderType in ('quote','estimate')
			group by  o.strDepartmentID,d.strDescription,o.strOrderNumber,o.dtmDate,o.strCustomerPO,o.strSalesperson,e.strFirstName,e.strLastName,o.strCustomerID,e.strEmployeeID
		) as a
		group by strSalesperson,strDepartmentID
	) as qtytd on qtytd.strSalesperson = isnull(isnull(isnull(ot.strSalesperson,qt.strSalesperson),it.strSalesPerson),otytd.strSalesperson) and qtytd.strDepartmentID = isnull(isnull(isnull(ot.strDepartmentID,qt.strDepartmentID),it.strSalesPerson),otytd.strDepartmentID)
) tbl
left  join tblPREmployee e on e.strEmployeeID = tbl.strSalesperson
left join tblGLDepartment g on g.strDepartmentID = tbl.strDepartmentID
where isnull(curOrderTotals,0)<>0
order by tbl.strDepartmentID,strSalesperson