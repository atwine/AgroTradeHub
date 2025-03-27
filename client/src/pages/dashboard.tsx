import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import StatsCard from "@/components/dashboard/stats-card";
import ProductCard from "@/components/dashboard/product-card";
import BidTable from "@/components/bids/bid-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ProductForm from "@/components/products/product-form";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, BarChart2, Truck, Database, ShoppingCart } from "lucide-react";
import { Product, User } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);

  // Fetch user's products if they are a farmer
  const { data: userProducts } = useQuery<Product[]>({
    queryKey: ["/api/user/products"],
    enabled: user?.role === "farmer",
  });

  // Fetch user's bids if they are a buyer or middleman
  const { data: userBids } = useQuery<any[]>({
    queryKey: ["/api/user/bids"],
    enabled: user?.role === "buyer" || user?.role === "middleman",
  });

  // Fetch user's transport requests if they are a transporter
  const { data: transportRequests } = useQuery<any[]>({
    queryKey: ["/api/transport/transporter"],
    enabled: user?.role === "transporter",
  });

  // Stats based on user role
  const getDashboardStats = () => {
    switch (user?.role) {
      case "farmer":
        return [
          { title: "Active Listings", value: userProducts?.filter(p => p.status === "active").length || 0, icon: <Database className="h-8 w-8 text-primary" /> },
          { title: "Pending Bids", value: 0, icon: <ShoppingCart className="h-8 w-8 text-secondary" /> },
          { title: "Completed Sales", value: userProducts?.filter(p => p.status === "sold").length || 0, icon: <BarChart2 className="h-8 w-8 text-accent" /> },
          { title: "In Transit", value: 0, icon: <Truck className="h-8 w-8 text-info" /> },
        ];
      case "buyer":
      case "middleman":
        return [
          { title: "Active Bids", value: userBids?.filter(b => b.status === "pending").length || 0, icon: <ShoppingCart className="h-8 w-8 text-primary" /> },
          { title: "Accepted Bids", value: userBids?.filter(b => b.status === "accepted").length || 0, icon: <BarChart2 className="h-8 w-8 text-secondary" /> },
          { title: "Products Bought", value: userBids?.filter(b => b.status === "accepted").length || 0, icon: <Database className="h-8 w-8 text-accent" /> },
          { title: "In Transit", value: 0, icon: <Truck className="h-8 w-8 text-info" /> },
        ];
      case "transporter":
        return [
          { title: "Pending Requests", value: transportRequests?.filter(t => t.status === "pending").length || 0, icon: <Database className="h-8 w-8 text-primary" /> },
          { title: "Accepted Jobs", value: transportRequests?.filter(t => t.status === "accepted").length || 0, icon: <ShoppingCart className="h-8 w-8 text-secondary" /> },
          { title: "In Transit", value: transportRequests?.filter(t => t.status === "in_transit").length || 0, icon: <Truck className="h-8 w-8 text-accent" /> },
          { title: "Delivered", value: transportRequests?.filter(t => t.status === "delivered").length || 0, icon: <BarChart2 className="h-8 w-8 text-info" /> },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Role badge */}
          <div className="mb-6">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary text-white">
              <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              {user?.role === "farmer" && "Farmer Dashboard"}
              {user?.role === "buyer" && "Buyer Dashboard"}
              {user?.role === "middleman" && "Middleman Dashboard"}
              {user?.role === "transporter" && "Transporter Dashboard"}
            </div>
          </div>

          {/* Dashboard stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            {getDashboardStats().map((stat, index) => (
              <StatsCard
                key={index}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
              />
            ))}
          </div>

          {/* Action buttons */}
          <div className="mb-6 flex flex-wrap gap-4">
            {user?.role === "farmer" && (
              <>
                <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="inline-flex items-center">
                      <Plus className="mr-2 -ml-1 h-5 w-5" />
                      Add New Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Product</DialogTitle>
                      <DialogDescription>
                        Enter the details of your agricultural product to list it on the marketplace.
                      </DialogDescription>
                    </DialogHeader>
                    <ProductForm onSuccess={() => setIsProductDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
                
                <Button variant="outline" className="inline-flex items-center text-primary">
                  <Database className="mr-2 -ml-1 h-5 w-5" />
                  View All Products
                </Button>
                
                <Button variant="outline" className="inline-flex items-center text-secondary">
                  <ShoppingCart className="mr-2 -ml-1 h-5 w-5" />
                  Review Bids
                </Button>
              </>
            )}
            
            {(user?.role === "buyer" || user?.role === "middleman") && (
              <>
                <Button className="inline-flex items-center">
                  <Database className="mr-2 -ml-1 h-5 w-5" />
                  Browse Products
                </Button>
                
                <Button variant="outline" className="inline-flex items-center text-primary">
                  <ShoppingCart className="mr-2 -ml-1 h-5 w-5" />
                  View My Bids
                </Button>
                
                <Button variant="outline" className="inline-flex items-center text-secondary">
                  <Truck className="mr-2 -ml-1 h-5 w-5" />
                  Request Transport
                </Button>
              </>
            )}
            
            {user?.role === "transporter" && (
              <>
                <Button className="inline-flex items-center">
                  <Database className="mr-2 -ml-1 h-5 w-5" />
                  Available Transport Jobs
                </Button>
                
                <Button variant="outline" className="inline-flex items-center text-primary">
                  <Truck className="mr-2 -ml-1 h-5 w-5" />
                  My Transports
                </Button>
              </>
            )}
          </div>

          {/* Products or content based on role */}
          {user?.role === "farmer" && (
            <div className="mb-8">
              <h2 className="text-2xl font-nunito font-bold text-text mb-4">Your Active Listings</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {userProducts?.filter(product => product.status === "active").slice(0, 3).map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                ))}
                
                {(!userProducts || userProducts.filter(p => p.status === "active").length === 0) && (
                  <div className="col-span-3 p-8 text-center bg-white rounded-lg shadow-md">
                    <h3 className="text-lg font-medium text-gray-900">No active listings</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Click "Add New Product" to create your first listing.
                    </p>
                  </div>
                )}
              </div>
              {userProducts && userProducts.filter(p => p.status === "active").length > 3 && (
                <div className="mt-4 text-center">
                  <Button variant="outline">
                    View All Listings
                    <svg className="ml-2 -mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Bids table for farmer */}
          {user?.role === "farmer" && (
            <div>
              <h2 className="text-2xl font-nunito font-bold text-text mb-4">Recent Bids on Your Products</h2>
              <BidTable />
            </div>
          )}
          
          {/* Content for buyer/middleman */}
          {(user?.role === "buyer" || user?.role === "middleman") && (
            <div className="mb-8">
              <h2 className="text-2xl font-nunito font-bold text-text mb-4">Available Products</h2>
              {/* Placeholder for available products - would be replaced with real data */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="col-span-3 p-8 text-center bg-white rounded-lg shadow-md">
                  <h3 className="text-lg font-medium text-gray-900">Browse products</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Go to the Products page to browse available agricultural products.
                  </p>
                  <Button className="mt-4">Browse Products</Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Content for transporter */}
          {user?.role === "transporter" && (
            <div className="mb-8">
              <h2 className="text-2xl font-nunito font-bold text-text mb-4">Available Transport Jobs</h2>
              {/* Placeholder for transport jobs - would be replaced with real data */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="col-span-3 p-8 text-center bg-white rounded-lg shadow-md">
                  <h3 className="text-lg font-medium text-gray-900">Find transport jobs</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Go to the Transport page to find available transport jobs.
                  </p>
                  <Button className="mt-4">Find Jobs</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
