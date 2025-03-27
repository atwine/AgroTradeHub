import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertBidSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Calendar, Edit } from "lucide-react";
import { Product } from "@shared/schema";
import ProductForm from "@/components/products/product-form";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isBidDialogOpen, setIsBidDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Get farmer info for the product
  const { data: farmerInfo } = useQuery<any>({
    queryKey: [`/api/users/${product.farmerId}`],
    enabled: !!product.farmerId,
  });

  // Get bid count for the product
  const { data: bids } = useQuery<any[]>({
    queryKey: [`/api/products/${product.id}/bids`],
    enabled: !!product.id,
  });
  
  // Helper function to get currency symbol
  const getCurrencySymbol = (currency: string): string => {
    switch (currency) {
      case "USD": return "$";
      case "EUR": return "€";
      case "GBP": return "£";
      case "JPY": return "¥";
      case "INR": return "₹";
      case "AUD": return "A$";
      case "CAD": return "C$";
      case "ZAR": return "R";
      case "NGN": return "₦";
      case "KES": return "KSh";
      default: return currency;
    }
  };

  // Prepare the bid form schema
  const bidSchema = insertBidSchema.extend({
    productId: z.number().default(product.id),
    amount: z.coerce.number().positive("Bid amount must be positive"),
    quantity: z.coerce.number().positive("Quantity must be positive").max(product.quantity, `Maximum available quantity is ${product.quantity} ${product.unit || 'kg'}`),
  });

  // Set up the bid form
  const bidForm = useForm<z.infer<typeof bidSchema>>({
    resolver: zodResolver(bidSchema),
    defaultValues: {
      productId: product.id,
      amount: 0,
      quantity: 0,
      message: "",
    },
  });

  // Mutation for placing a bid
  const placeBidMutation = useMutation({
    mutationFn: async (values: z.infer<typeof bidSchema>) => {
      const res = await apiRequest("POST", "/api/bids", values);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Bid placed successfully",
        description: "Your bid has been sent to the farmer",
      });
      setIsBidDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/products/${product.id}/bids`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to place bid",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle bid submission
  const onBidSubmit = (values: z.infer<typeof bidSchema>) => {
    placeBidMutation.mutate(values);
  };

  // Format date
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "Recently";
    
    const date = new Date(dateString);
    const now = new Date();
    
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  };

  // Get a placeholder image for the product category
  const getCategoryImage = (category: string) => {
    switch (category) {
      case "Grains":
        return "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
      case "Vegetables":
        return "https://images.unsplash.com/photo-1595054607409-1877047271a0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
      case "Fruits":
        return "https://images.unsplash.com/photo-1518843875459-f738682238a6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
      case "Pulses":
        return "https://images.unsplash.com/photo-1515543904379-3d757abe3d10?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
      case "Dairy":
        return "https://images.unsplash.com/photo-1628088062854-d1870b4553da?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
      default:
        return "https://images.unsplash.com/photo-1571945227444-5b623ae9427f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
    }
  };

  return (
    <Card className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="relative pb-1/2">
        <img 
          src={product.images?.length ? product.images[0] : getCategoryImage(product.category)} 
          alt={product.name} 
          className="h-48 w-full object-cover"
        />
        {bids && (
          <div className="absolute top-0 right-0 m-2 px-2 py-1 bg-secondary text-white text-xs font-bold rounded">
            {bids.length} {bids.length === 1 ? 'bid' : 'bids'}
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
          <div className="text-sm text-gray-500">Listed {formatDate(product.createdAt)}</div>
        </div>
        <div className="mt-2 text-2xl font-bold text-primary">
          {getCurrencySymbol(product.currency || 'INR')}{product.price}/{product.unit || 'kg'}
        </div>
        <div className="mt-1 flex items-center">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span className="ml-1 text-sm text-gray-500">{product.location}</span>
        </div>
        <div className="mt-2 flex items-center flex-wrap gap-2">
          {product.tags && product.tags.length > 0 && product.tags.map((tag, index) => (
            <span key={index} className="px-2 py-1 text-xs rounded-full bg-accent/20 text-accent">
              {tag}
            </span>
          ))}
          <span className="px-2 py-1 text-xs rounded-full bg-secondary/20 text-secondary">
            {product.quantity} {product.unit || 'kg'}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {user?.role === "farmer" && user.id === product.farmerId ? (
            <>
              <Button className="px-4 py-2" variant="default">
                View Bids
              </Button>
              <Button 
                className="px-4 py-2" 
                variant="outline"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </>
          ) : (user?.role === "buyer" || user?.role === "middleman") ? (
            <>
              <Button 
                className="px-4 py-2" 
                variant="default"
                onClick={() => setIsBidDialogOpen(true)}
              >
                Place Bid
              </Button>
              <Button className="px-4 py-2" variant="outline">
                Contact Seller
              </Button>
            </>
          ) : (
            <Button className="col-span-2 px-4 py-2" variant="default">
              View Details
            </Button>
          )}
        </div>

        {/* Bid Dialog */}
        <Dialog open={isBidDialogOpen} onOpenChange={setIsBidDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Place a Bid</DialogTitle>
              <DialogDescription>
                Enter your bid details for {product.name}
              </DialogDescription>
            </DialogHeader>
            <Form {...bidForm}>
              <form onSubmit={bidForm.handleSubmit(onBidSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={bidForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Bid ({getCurrencySymbol(product.currency || 'INR')}/{product.unit || 'kg'})</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Enter amount" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={bidForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity ({product.unit || 'kg'})</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Enter quantity" 
                            {...field} 
                            max={product.quantity}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={bidForm.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add a message to the seller"
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={placeBidMutation.isPending}>
                    {placeBidMutation.isPending ? "Submitting..." : "Submit Bid"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Edit Product Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>
                Update the details of your product listing.
              </DialogDescription>
            </DialogHeader>
            <ProductForm 
              onSuccess={() => setIsEditDialogOpen(false)} 
              productToEdit={product} 
              isEditing={true} 
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
