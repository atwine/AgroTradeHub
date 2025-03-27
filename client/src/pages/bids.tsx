import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import BidTable from "@/components/bids/bid-table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bid, Product } from "@shared/schema";

export default function Bids() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  
  // Fetch different types of bids based on user role
  const { data: userBids } = useQuery<Bid[]>({
    queryKey: ["/api/user/bids"],
    enabled: user?.role === "buyer" || user?.role === "middleman",
  });
  
  // Fetch user's products to see bids on them (for farmers)
  const { data: userProducts } = useQuery<Product[]>({
    queryKey: ["/api/user/products"],
    enabled: user?.role === "farmer",
  });
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold font-nunito text-text mb-6">
            {user?.role === "farmer" ? "Bids on Your Products" : "Your Bids"}
          </h1>
          
          {user?.role === "farmer" ? (
            // Farmers see bids others have made on their products
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="all">All Bids</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="accepted">Accepted</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="all">
                <BidTable filterStatus={null} />
              </TabsContent>
              
              <TabsContent value="pending">
                <BidTable filterStatus="pending" />
              </TabsContent>
              
              <TabsContent value="accepted">
                <BidTable filterStatus="accepted" />
              </TabsContent>
              
              <TabsContent value="rejected">
                <BidTable filterStatus="rejected" />
              </TabsContent>
            </Tabs>
          ) : (
            // Buyers and middlemen see their own bids
            <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="accepted">Accepted</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>
                
                <Button onClick={() => window.location.href = "/products"}>
                  Find Products to Bid
                </Button>
              </div>
              
              <TabsContent value="pending">
                {userBids?.filter(bid => bid.status === "pending").length ? (
                  <Card>
                    <CardContent className="pt-6">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Your Bid</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {userBids?.filter(bid => bid.status === "pending").map((bid) => (
                            <tr key={bid.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">Product #{bid.productId}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-primary">₹{bid.amount}/quintal</div>
                                <div className="text-xs text-gray-500">Qty: {bid.quantity} quintals</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(bid.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                  Pending
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <Button variant="outline" size="sm">View Details</Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>No Pending Bids</CardTitle>
                      <CardDescription>
                        You don't have any pending bids at the moment.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button onClick={() => window.location.href = "/products"}>
                        Find Products to Bid
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="accepted">
                {userBids?.filter(bid => bid.status === "accepted").length ? (
                  <Card>
                    <CardContent className="pt-6">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Your Bid</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {userBids?.filter(bid => bid.status === "accepted").map((bid) => (
                            <tr key={bid.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">Product #{bid.productId}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-primary">₹{bid.amount}/quintal</div>
                                <div className="text-xs text-gray-500">Qty: {bid.quantity} quintals</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(bid.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Accepted
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <Button variant="outline" size="sm">View Details</Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>No Accepted Bids</CardTitle>
                      <CardDescription>
                        You don't have any accepted bids yet.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button onClick={() => window.location.href = "/products"}>
                        Find Products to Bid
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="rejected">
                {userBids?.filter(bid => bid.status === "rejected").length ? (
                  <Card>
                    <CardContent className="pt-6">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Your Bid</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {userBids?.filter(bid => bid.status === "rejected").map((bid) => (
                            <tr key={bid.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">Product #{bid.productId}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-primary">₹{bid.amount}/quintal</div>
                                <div className="text-xs text-gray-500">Qty: {bid.quantity} quintals</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(bid.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                  Rejected
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <Button variant="outline" size="sm">View Details</Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>No Rejected Bids</CardTitle>
                      <CardDescription>
                        You don't have any rejected bids.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button onClick={() => window.location.href = "/products"}>
                        Find Products to Bid
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
