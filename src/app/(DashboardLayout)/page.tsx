
import React from "react";
import Welcome from "../components/dashboards/ecommerce/Welcome";
import SmallCards from "../components/dashboards/ecommerce/smallCards";
import SalesProfit from "../components/dashboards/ecommerce/SalesProfit";
import ProductSales from "../components/dashboards/ecommerce/ProductSales";
import MarketingReport from "../components/dashboards/ecommerce/MarketingReport";
import Payments from "../components/dashboards/ecommerce/Payments";
import AnnualProfit from "../components/dashboards/ecommerce/AnnualProfit";
import RecentTransaction from "../components/dashboards/ecommerce/RecentTransaction";
import TopProducts from "../components/dashboards/ecommerce/TopProducts";
import CrmDashboard from "../(DashboardLayout)/dashboards/crm/page";


const page = () => {
  return (
    <>
      <div className="space-y-6">
        {/* Full Width CRM Dashboard */}
        <div className="w-full">
          <CrmDashboard />
        </div>
        
        {/* Additional Components Row */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* <div className="lg:col-span-1">
              <Payments />
            </div> */}
            {/* Uncomment other components as needed */}
            {/* <div className="lg:col-span-1">
              <ProductSales />
            </div> */}
            {/* <div className="lg:col-span-1">
              <MarketingReport />
            </div> */}
            {/* <div className="lg:col-span-1">
              <AnnualProfit />
            </div> */}
          </div>
      </div>
    </>
  );
};

export default page;

