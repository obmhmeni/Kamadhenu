import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertOrderSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/lib/auth";
import { parseOrderText } from "@/lib/utils";
import { z } from "zod";

const formSchema = insertOrderSchema.extend({
  totalAmount: z.coerce.number().min(1, "Total amount must be greater than 0"),
});

type FormData = z.infer<typeof formSchema>;

interface OrderFormProps {
  onSuccess: () => void;
}

export default function OrderForm({ onSuccess }: OrderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const user = getCurrentUser();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      telegramId: user?.telegramId || "",
      name: "",
      address: "",
      orderDetails: "",
      productIds: "",
      totalAmount: 0,
      phone: "",
      paymentStatus: "Pending",
      orderStatus: "Processing",
      district: user?.district || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create order");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Order created successfully" });
      onSuccess();
    },
    onError: (error) => {
      toast({ 
        title: "Failed to create order", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOrderTextChange = (orderText: string) => {
    const parsed = parseOrderText(orderText);
    if (parsed) {
      form.setValue("name", parsed.name);
      form.setValue("address", parsed.address);
      
      // Create order details string
      const orderDetails = parsed.items
        .map(item => `${item.product} ${item.quantity} ${item.district} ${item.addedBy} ${item.uniqueNumber}`)
        .join('\n');
      
      form.setValue("orderDetails", orderDetails);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="orderDetails"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Order Text</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={`Name: John Doe
Address: 123 Main Street, Ward 5
Potato 2 SouthDelhi 6338398272 1
Tomato 1 CentralDelhi 1770010257 1`}
                  rows={6}
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    handleOrderTextChange(e.target.value);
                  }}
                />
              </FormControl>
              <FormDescription>
                Enter order in the format: Name, Address, then product lines with format "product qty district addedBy uniqueNumber"
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="9876543210" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea placeholder="123 Main Street, Ward 5" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="district"
          render={({ field }) => (
            <FormItem>
              <FormLabel>District</FormLabel>
              <FormControl>
                <Input placeholder="SouthDelhi" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Order"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
