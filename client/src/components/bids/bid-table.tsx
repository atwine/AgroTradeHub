import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bid, Product, User } from "@shared/schema";
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";

interface BidTableProps {
  filterStatus?: string | null;
}

export default function BidTable({ filterStatus }: BidTableProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [bidsWithDetails, setBidsWithDetails] = useState<any[]>([]);

  // Fetch bids based on user role
  const { data: bids, isLoading } = useQuery<Bid[]>({
    queryKey: [user?.role === "farmer" ? "/api/products/bids" : "/api/user/bids"],
  });

  // Fetch all products (needed to get product details for bids)
  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Fetch all users (needed to get bidder/farmer details)
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Update bid status mutation
  const updateBidStatusMutation = useMutation({
    mutationFn: async ({ bidId, status }: { bidId: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/bids/${bidId}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Bid status updated",
        description: "The bid status has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products/bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/bids"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update bid status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Merge bids with product and user details
  useEffect(() => {
    if (bids && products && users) {
      const enrichedBids = bids.map(bid => {
        const product = products.find(p => p.id === bid.productId);
        const bidder = users.find(u => u.id === bid.buyerId);
        const farmer = product ? users.find(u => u.id === product.farmerId) : null;
        
        return {
          ...bid,
          product,
          bidder,
          farmer
        };
      });
      
      // Apply filter if specified
      let filteredBids = enrichedBids;
      if (filterStatus) {
        filteredBids = enrichedBids.filter(bid => bid.status === filterStatus);
      }
      
      setBidsWithDetails(filteredBids);
    }
  }, [bids, products, users, filterStatus]);

  // Handle bid acceptance
  const handleAcceptBid = (bidId: number) => {
    updateBidStatusMutation.mutate({ bidId, status: "accepted" });
  };

  // Handle bid rejection
  const handleRejectBid = (bidId: number) => {
    updateBidStatusMutation.mutate({ bidId, status: "rejected" });
  };

  // Format date
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    const now = new Date();
    
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    
    return date.toLocaleDateString();
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case "accepted":
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Accepted
          </span>
        );
      case "rejected":
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            Rejected
          </span>
        );
      case "countered":
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            Countered
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {user?.role === "farmer" ? "Bidder" : "Farmer"}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bid Amount
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bidsWithDetails.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No bids found
                </td>
              </tr>
            ) : (
              bidsWithDetails.map((bid) => (
                <tr key={bid.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img 
                          className="h-10 w-10 rounded-md object-cover" 
                          src={bid.product?.images?.[0] || "https://via.placeholder.com/40"} 
                          alt={bid.product?.name || "Product"} 
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{bid.product?.name || `Product #${bid.productId}`}</div>
                        <div className="text-sm text-gray-500">{bid.quantity} Quintals</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user?.role === "farmer" 
                        ? bid.bidder?.fullName || `User #${bid.buyerId}`
                        : bid.farmer?.fullName || `Farmer #${bid.product?.farmerId}`
                      }
                    </div>
                    <div className="text-sm text-gray-500">
                      {user?.role === "farmer" 
                        ? (bid.bidder?.role === "buyer" ? "Buyer" : "Middleman")
                        : "Farmer"
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-primary">₹{bid.amount}/quintal</div>
                    <div className="text-xs text-gray-500">
                      {bid.product ? `Listed: ₹${bid.product.price}` : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(bid.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(bid.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {user?.role === "farmer" && bid.status === "pending" ? (
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          className="bg-primary hover:bg-primary/90"
                          onClick={() => handleAcceptBid(bid.id)}
                          disabled={updateBidStatusMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button 
                          size="sm"
                          className="border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                          onClick={() => handleRejectBid(bid.id)}
                          disabled={updateBidStatusMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                        <Button 
                          size="sm"
                          className="border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Counter
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        size="sm"
                        className="bg-primary hover:bg-primary/90"
                      >
                        View Details
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">1</span> to <span className="font-medium">{bidsWithDetails.length}</span> of{" "}
            <span className="font-medium">{bidsWithDetails.length}</span> bids
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <Button 
                size="sm" 
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </Button>
              <Button
                size="sm"
                className="relative inline-flex items-center px-4 py-2 bg-primary text-sm font-medium text-white hover:bg-primary/90"
              >
                {page}
              </Button>
              <Button 
                size="sm" 
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                disabled={bidsWithDetails.length < 10}
                onClick={() => setPage(page + 1)}
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </Button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
