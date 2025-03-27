import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import TransportRequestForm from "@/components/transport/transport-request-form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Truck, Clock, Check, XCircle } from "lucide-react";
import { TransportRequest } from "@shared/schema";

export default function Transport() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("pending");
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  
  // Fetch transport requests based on user role
  const { data: transportRequests, isLoading } = useQuery<TransportRequest[]>({
    queryKey: user?.role === "transporter" ? ["/api/transport/transporter"] : ["/api/transport/requester"],
  });
  
  // Fetch available transport requests for transporters
  const { data: availableRequests } = useQuery<TransportRequest[]>({
    queryKey: ["/api/transport/available"],
    enabled: user?.role === "transporter",
  });
  
  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case "accepted":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Accepted</Badge>;
      case "in_transit":
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">In Transit</Badge>;
      case "delivered":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Delivered</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-3xl font-bold font-nunito text-text mb-4 md:mb-0">
              {user?.role === "transporter" ? "Transport Jobs" : "Transport Requests"}
            </h1>
            
            {user?.role !== "transporter" && (
              <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="inline-flex items-center">
                    <Truck className="mr-2 -ml-1 h-5 w-5" />
                    New Transport Request
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                  <DialogHeader>
                    <DialogTitle>Request Transport</DialogTitle>
                    <DialogDescription>
                      Enter the details for your transport request.
                    </DialogDescription>
                  </DialogHeader>
                  <TransportRequestForm onSuccess={() => setIsRequestDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          {user?.role === "transporter" ? (
            // Content for transporters
            <Tabs defaultValue="available" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="available">Available Jobs</TabsTrigger>
                <TabsTrigger value="accepted">My Jobs</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              
              <TabsContent value="available">
                {availableRequests?.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableRequests.map((request) => (
                      <Card key={request.id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Transport Request #{request.id}</CardTitle>
                          <CardDescription>
                            Product ID: {request.productId}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center text-sm">
                              <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                              <div>
                                <span className="font-medium text-gray-700">Pickup: </span>
                                {request.pickupLocation}
                              </div>
                            </div>
                            <div className="flex items-center text-sm">
                              <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                              <div>
                                <span className="font-medium text-gray-700">Delivery: </span>
                                {request.deliveryLocation}
                              </div>
                            </div>
                            <div className="flex items-center text-sm">
                              <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                              <div>
                                <span className="font-medium text-gray-700">Date: </span>
                                {new Date(request.date).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex items-center text-sm">
                              <Truck className="mr-2 h-4 w-4 text-gray-500" />
                              <div>
                                <span className="font-medium text-gray-700">Quantity: </span>
                                {request.quantity} quintals
                              </div>
                            </div>
                            <div className="mt-4">
                              <Button className="w-full">Accept Job</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>No Available Jobs</CardTitle>
                      <CardDescription>
                        There are currently no available transport jobs.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500">
                        Check back later for new transportation opportunities.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="accepted">
                {transportRequests?.filter(req => req.status === "accepted" || req.status === "in_transit").length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {transportRequests?.filter(req => req.status === "accepted" || req.status === "in_transit").map((request) => (
                      <Card key={request.id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">Transport #{request.id}</CardTitle>
                              <CardDescription>
                                Product ID: {request.productId}
                              </CardDescription>
                            </div>
                            {getStatusBadge(request.status)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center text-sm">
                              <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                              <div>
                                <span className="font-medium text-gray-700">Pickup: </span>
                                {request.pickupLocation}
                              </div>
                            </div>
                            <div className="flex items-center text-sm">
                              <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                              <div>
                                <span className="font-medium text-gray-700">Delivery: </span>
                                {request.deliveryLocation}
                              </div>
                            </div>
                            <div className="flex items-center text-sm">
                              <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                              <div>
                                <span className="font-medium text-gray-700">Date: </span>
                                {new Date(request.date).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex items-center text-sm">
                              <Truck className="mr-2 h-4 w-4 text-gray-500" />
                              <div>
                                <span className="font-medium text-gray-700">Quantity: </span>
                                {request.quantity} quintals
                              </div>
                            </div>
                            <div className="mt-4">
                              {request.status === "accepted" ? (
                                <Button className="w-full">Mark as In Transit</Button>
                              ) : (
                                <Button className="w-full">Mark as Delivered</Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>No Active Jobs</CardTitle>
                      <CardDescription>
                        You don't have any active transport jobs.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500">
                        Check the "Available Jobs" tab to find transport opportunities.
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setActiveTab("available")}
                      >
                        View Available Jobs
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="completed">
                {transportRequests?.filter(req => req.status === "delivered").length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {transportRequests?.filter(req => req.status === "delivered").map((request) => (
                      <Card key={request.id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">Transport #{request.id}</CardTitle>
                              <CardDescription>
                                Product ID: {request.productId}
                              </CardDescription>
                            </div>
                            {getStatusBadge(request.status)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center text-sm">
                              <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                              <div>
                                <span className="font-medium text-gray-700">Pickup: </span>
                                {request.pickupLocation}
                              </div>
                            </div>
                            <div className="flex items-center text-sm">
                              <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                              <div>
                                <span className="font-medium text-gray-700">Delivery: </span>
                                {request.deliveryLocation}
                              </div>
                            </div>
                            <div className="flex items-center text-sm">
                              <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                              <div>
                                <span className="font-medium text-gray-700">Date: </span>
                                {new Date(request.date).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex items-center text-sm">
                              <Truck className="mr-2 h-4 w-4 text-gray-500" />
                              <div>
                                <span className="font-medium text-gray-700">Quantity: </span>
                                {request.quantity} quintals
                              </div>
                            </div>
                            <div className="flex items-center text-sm mt-2">
                              <Check className="mr-2 h-4 w-4 text-green-500" />
                              <div className="text-green-700">
                                Completed on {new Date(request.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>No Completed Jobs</CardTitle>
                      <CardDescription>
                        You don't have any completed transport jobs yet.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500">
                        Your completed jobs will appear here after delivery.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            // Content for farmers, buyers, and middlemen
            <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-between items-center mb-6">
                <TabsList>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="accepted">In Progress</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="pending">
                {transportRequests?.filter(req => req.status === "pending").length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {transportRequests?.filter(req => req.status === "pending").map((request) => (
                      <Card key={request.id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">Transport Request #{request.id}</CardTitle>
                              <CardDescription>
                                Product ID: {request.productId}
                              </CardDescription>
                            </div>
                            {getStatusBadge(request.status)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center text-sm">
                              <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                              <div>
                                <span className="font-medium text-gray-700">Pickup: </span>
                                {request.pickupLocation}
                              </div>
                            </div>
                            <div className="flex items-center text-sm">
                              <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                              <div>
                                <span className="font-medium text-gray-700">Delivery: </span>
                                {request.deliveryLocation}
                              </div>
                            </div>
                            <div className="flex items-center text-sm">
                              <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                              <div>
                                <span className="font-medium text-gray-700">Date: </span>
                                {new Date(request.date).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex items-center text-sm">
                              <Truck className="mr-2 h-4 w-4 text-gray-500" />
                              <div>
                                <span className="font-medium text-gray-700">Quantity: </span>
                                {request.quantity} quintals
                              </div>
                            </div>
                            <div className="flex items-center text-sm">
                              <Clock className="mr-2 h-4 w-4 text-gray-500" />
                              <div>
                                <span className="font-medium text-gray-700">Waiting for transporter</span>
                              </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                              <Button variant="outline" size="sm" className="mr-2">
                                <XCircle className="mr-1 h-4 w-4" />
                                Cancel
                              </Button>
                              <Button size="sm">
                                Edit
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>No Pending Transport Requests</CardTitle>
                      <CardDescription>
                        You don't have any pending transport requests at the moment.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button onClick={() => setIsRequestDialogOpen(true)}>
                        Create Transport Request
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="accepted">
                {transportRequests?.filter(req => req.status === "accepted" || req.status === "in_transit").length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {transportRequests?.filter(req => req.status === "accepted" || req.status === "in_transit").map((request) => (
                      <Card key={request.id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">Transport #{request.id}</CardTitle>
                              <CardDescription>
                                Product ID: {request.productId}
                              </CardDescription>
                            </div>
                            {getStatusBadge(request.status)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center text-sm">
                              <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                              <div>
                                <span className="font-medium text-gray-700">Pickup: </span>
                                {request.pickupLocation}
                              </div>
                            </div>
                            <div className="flex items-center text-sm">
                              <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                              <div>
                                <span className="font-medium text-gray-700">Delivery: </span>
                                {request.deliveryLocation}
                              </div>
                            </div>
                            <div className="flex items-center text-sm">
                              <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                              <div>
                                <span className="font-medium text-gray-700">Date: </span>
                                {new Date(request.date).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex items-center text-sm">
                              <Truck className="mr-2 h-4 w-4 text-gray-500" />
                              <div>
                                <span className="font-medium text-gray-700">Quantity: </span>
                                {request.quantity} quintals
                              </div>
                            </div>
                            <div className="flex items-center text-sm">
                              <div className="bg-blue-100 text-blue-800 rounded-full p-1 mr-2">
                                <Truck className="h-4 w-4" />
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Transporter ID: </span>
                                {request.transporterId}
                              </div>
                            </div>
                            <div className="mt-4">
                              <Button className="w-full">
                                Contact Transporter
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>No Active Transports</CardTitle>
                      <CardDescription>
                        You don't have any transports in progress at the moment.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500">
                        Transports will appear here once a transporter accepts your request.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="completed">
                {transportRequests?.filter(req => req.status === "delivered").length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {transportRequests?.filter(req => req.status === "delivered").map((request) => (
                      <Card key={request.id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">Transport #{request.id}</CardTitle>
                              <CardDescription>
                                Product ID: {request.productId}
                              </CardDescription>
                            </div>
                            {getStatusBadge(request.status)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center text-sm">
                              <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                              <div>
                                <span className="font-medium text-gray-700">Pickup: </span>
                                {request.pickupLocation}
                              </div>
                            </div>
                            <div className="flex items-center text-sm">
                              <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                              <div>
                                <span className="font-medium text-gray-700">Delivery: </span>
                                {request.deliveryLocation}
                              </div>
                            </div>
                            <div className="flex items-center text-sm">
                              <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                              <div>
                                <span className="font-medium text-gray-700">Date: </span>
                                {new Date(request.date).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex items-center text-sm">
                              <Truck className="mr-2 h-4 w-4 text-gray-500" />
                              <div>
                                <span className="font-medium text-gray-700">Quantity: </span>
                                {request.quantity} quintals
                              </div>
                            </div>
                            <div className="flex items-center text-sm">
                              <div className="bg-blue-100 text-blue-800 rounded-full p-1 mr-2">
                                <Truck className="h-4 w-4" />
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Transporter ID: </span>
                                {request.transporterId}
                              </div>
                            </div>
                            <div className="flex items-center text-sm mt-2">
                              <Check className="mr-2 h-4 w-4 text-green-500" />
                              <div className="text-green-700">
                                Delivered on {new Date(request.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>No Completed Transports</CardTitle>
                      <CardDescription>
                        You don't have any completed transports yet.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500">
                        Completed transports will appear here after delivery.
                      </p>
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
