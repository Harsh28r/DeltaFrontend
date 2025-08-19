
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


const page = () => {
  return (
    <>
      <div className="grid grid-cols-12 gap-30">
        <div className="lg:col-span-6  col-span-12">
          <Welcome />
        </div>
        <div className="lg:col-span-6 col-span-12">
          <SmallCards />
        </div>
        <div className="lg:col-span-8 col-span-12">
          <SalesProfit />
        </div>
        <div className="lg:col-span-4 col-span-12">
          <ProductSales />
        </div>
        <div className="lg:col-span-5 col-span-12">
          <MarketingReport />
        </div>
        <div className="lg:col-span-3 col-span-12">
          <Payments />
        </div>
        <div className="lg:col-span-4 col-span-12">
          <AnnualProfit />
        </div>
        <div className="lg:col-span-8 col-span-12">
          <TopProducts />
        </div>
        <div className="lg:col-span-4 col-span-12">
          <RecentTransaction />
        </div>
      </div>
     
    </>
  );
};

export default page;
