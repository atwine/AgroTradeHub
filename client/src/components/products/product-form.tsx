import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { insertProductSchema, Product } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Upload } from "lucide-react";

interface ProductFormProps {
  onSuccess?: () => void;
  productToEdit?: Product; // Optional product for editing
  isEditing?: boolean;
}

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

export default function ProductForm({ onSuccess, productToEdit, isEditing = false }: ProductFormProps) {
  const { toast } = useToast();
  const [tags, setTags] = useState<string[]>(productToEdit?.tags || []);
  const [tagInput, setTagInput] = useState("");

  // Prepare product schema
  const productSchema = insertProductSchema.extend({
    price: z.coerce.number().positive("Price must be positive"),
    quantity: z.coerce.number().positive("Quantity must be positive"),
  });

  // Handle default category
  const defaultCategory = ((): "Grains" | "Vegetables" | "Fruits" | "Pulses" | "Dairy" | "Other" => {
    if (!productToEdit?.category) return "Grains";
    return ["Grains", "Vegetables", "Fruits", "Pulses", "Dairy", "Other"].includes(productToEdit.category)
      ? productToEdit.category as "Grains" | "Vegetables" | "Fruits" | "Pulses" | "Dairy" | "Other"
      : "Grains";
  })();

  // Handle default unit
  const defaultUnit = ((): "kg" | "tonne" | "quintal" | "liter" | "pound" | "piece" => {
    if (!productToEdit?.unit) return "kg";
    return ["kg", "tonne", "quintal", "liter", "pound", "piece"].includes(productToEdit.unit)
      ? productToEdit.unit as "kg" | "tonne" | "quintal" | "liter" | "pound" | "piece"
      : "kg";
  })();

  // Handle default currency
  const defaultCurrency = ((): "INR" | "USD" | "EUR" | "GBP" | "JPY" | "AUD" | "CAD" | "ZAR" | "NGN" | "KES" => {
    if (!productToEdit?.currency) return "INR";
    return ["INR", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "ZAR", "NGN", "KES"].includes(productToEdit.currency)
      ? productToEdit.currency as "INR" | "USD" | "EUR" | "GBP" | "JPY" | "AUD" | "CAD" | "ZAR" | "NGN" | "KES"
      : "INR";
  })();

  // Set up form
  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: productToEdit?.name || "",
      category: defaultCategory,
      description: productToEdit?.description || "",
      quantity: productToEdit?.quantity || 0,
      unit: defaultUnit,
      currency: defaultCurrency,
      price: productToEdit?.price || 0,
      location: productToEdit?.location || "",
    },
  });

  // Update form when editing product changes
  useEffect(() => {
    if (productToEdit) {
      // Handle category validation - ensure it's one of the allowed values
      const validCategory = ["Grains", "Vegetables", "Fruits", "Pulses", "Dairy", "Other"].includes(productToEdit.category) 
        ? productToEdit.category as "Grains" | "Vegetables" | "Fruits" | "Pulses" | "Dairy" | "Other"
        : "Grains";
      
      // Handle unit validation
      const validUnit = ["kg", "tonne", "quintal", "liter", "pound", "piece"].includes(productToEdit.unit || "kg")
        ? productToEdit.unit as "kg" | "tonne" | "quintal" | "liter" | "pound" | "piece"
        : "kg";
      
      // Handle currency validation
      const validCurrency = ["INR", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "ZAR", "NGN", "KES"].includes(productToEdit.currency || "INR")
        ? productToEdit.currency as "INR" | "USD" | "EUR" | "GBP" | "JPY" | "AUD" | "CAD" | "ZAR" | "NGN" | "KES"
        : "INR";
      
      form.reset({
        name: productToEdit.name,
        category: validCategory,
        description: productToEdit.description || "",
        quantity: productToEdit.quantity,
        unit: validUnit,
        currency: validCurrency,
        price: productToEdit.price,
        location: productToEdit.location,
      });
      setTags(productToEdit.tags || []);
    }
  }, [productToEdit, form]);

  // Mutation for creating a product
  const createProductMutation = useMutation({
    mutationFn: async (values: z.infer<typeof productSchema>) => {
      // Add tags to the values
      const productData = { ...values, tags };
      const res = await apiRequest("POST", "/api/products", productData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Product created",
        description: "Your product has been listed successfully",
      });
      // Reset form
      form.reset();
      setTags([]);
      setTagInput("");
      // Invalidate queries to refresh the products list
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/products"] });
      // Call the onSuccess callback if provided
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for updating a product
  const updateProductMutation = useMutation({
    mutationFn: async (values: z.infer<typeof productSchema>) => {
      if (!productToEdit) return null;
      // Add tags to the values
      const productData = { ...values, tags };
      const res = await apiRequest("PATCH", `/api/products/${productToEdit.id}`, productData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Product updated",
        description: "Your product has been updated successfully",
      });
      // Invalidate queries to refresh the products list
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/products"] });
      // Call the onSuccess callback if provided
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof productSchema>) => {
    if (isEditing && productToEdit) {
      updateProductMutation.mutate(values);
    } else {
      createProductMutation.mutate(values);
    }
  };

  // Handle adding a tag
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Handle tag input keydown
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Premium Basmati Rice" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Grains">Grains</SelectItem>
                  <SelectItem value="Vegetables">Vegetables</SelectItem>
                  <SelectItem value="Fruits">Fruits</SelectItem>
                  <SelectItem value="Pulses">Pulses</SelectItem>
                  <SelectItem value="Dairy">Dairy</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="25" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="kg">Kilogram (kg)</SelectItem>
                    <SelectItem value="tonne">Tonne</SelectItem>
                    <SelectItem value="quintal">Quintal</SelectItem>
                    <SelectItem value="liter">Liter</SelectItem>
                    <SelectItem value="pound">Pound (lb)</SelectItem>
                    <SelectItem value="piece">Piece</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                    <SelectItem value="USD">US Dollar ($)</SelectItem>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                    <SelectItem value="GBP">British Pound (£)</SelectItem>
                    <SelectItem value="JPY">Japanese Yen (¥)</SelectItem>
                    <SelectItem value="AUD">Australian Dollar (A$)</SelectItem>
                    <SelectItem value="CAD">Canadian Dollar (C$)</SelectItem>
                    <SelectItem value="ZAR">South African Rand (R)</SelectItem>
                    <SelectItem value="NGN">Nigerian Naira (₦)</SelectItem>
                    <SelectItem value="KES">Kenyan Shilling (KSh)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Price per {form.watch('unit')} ({getCurrencySymbol(form.watch('currency'))})
                </FormLabel>
                <FormControl>
                  <Input type="number" placeholder="2400" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe your product quality, harvesting time, etc." 
                  rows={3} 
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

        <div className="space-y-2">
          <FormLabel>Product Images</FormLabel>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/90 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                  <span>Upload files</span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF up to 5MB
              </p>
            </div>
          </div>
        </div>

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="Village, District, State" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>Tags</FormLabel>
          <div className="mt-1">
            <div className="flex flex-wrap gap-2 mb-2">
              {/* Display all added tags with a remove button */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 w-full mb-2">
                  {tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                      {tag}
                      <button 
                        type="button" 
                        className="ml-1.5 inline-flex text-primary focus:outline-none"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <span className="sr-only">Remove tag</span>
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              {/* Tag input field with add button */}
              <div className="flex items-center w-full">
                <Input
                  type="text"
                  className="flex-1"
                  placeholder="Add tag... (press Enter or Add button)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="default"
                  onClick={handleAddTag}
                  className="ml-2"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onSuccess}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isEditing ? updateProductMutation.isPending : createProductMutation.isPending}
          >
            {isEditing ? (
              updateProductMutation.isPending ? "Updating..." : "Update Listing"
            ) : (
              createProductMutation.isPending ? "Creating..." : "Create Listing"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
