import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, parseSMSText, getPaymentStatusColor } from "@/lib/utils";
import { Settings, CheckCircle, XCircle } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Payments() {
  const [smsText, setSmsText] = useState("");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  
  const { toast } = useToast();

  const { data: pendingOrders = [] } = useQuery({
    queryKey: ["/api/orders/pending"],
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const processSMSMutation = useMutation({
    mutationFn: async (data: { smsText: string; amount: number; phone: string }) => {
      const response = await fetch("/api/payments/process-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process SMS");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
      if (data.success) {
        toast({ 
          title: "Payment processed successfully", 
          description: data.message 
        });
      } else {
        toast({ 
          title: "Payment not matched", 
          description: data.message,
          variant: "destructive" 
        });
      }
      
      // Clear form
      setSmsText("");
      setAmount("");
      setPhone("");
    },
    onError: (error) => {
      toast({ 
        title: "Failed to process SMS", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleSMSTextChange = (text: string) => {
    setSmsText(text);
    const parsed = parseSMSText(text);
    if (parsed) {
      setAmount(parsed.amount.toString());
      setPhone(parsed.phone);
    }
  };

  const handleProcessSMS = () => {
    if (!smsText || !amount || !phone) {
      toast({ 
        title: "Missing information", 
        description: "Please fill in SMS text, amount, and phone number",
        variant: "destructive" 
      });
      return;
    }

    processSMSMutation.mutate({
      smsText,
      amount: parseFloat(amount),
      phone
    });
  };

  const recentTransactions = transactions.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-medium text-foreground mb-2">Payment SMS Processing</h2>
        <p className="text-muted-foreground">Process payment confirmations and match with orders.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SMS Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Process Payment SMS</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                SMS Text
              </label>
              <Textarea
                rows={4}
                placeholder="Rs.150 Credited to A/c ... by 9876543210"
                value={smsText}
                onChange={(e) => handleSMSTextChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Format: "Rs.[amount] Credited to A/c ... by [phone]"
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Amount (₹)
                </label>
                <Input
                  type="number"
                  placeholder="150"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Phone Number
                </label>
                <Input
                  type="text"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={handleProcessSMS}
              disabled={processSMSMutation.isPending}
            >
              <Settings className="w-4 h-4 mr-2" />
              {processSMSMutation.isPending ? "Processing..." : "Process SMS"}
            </Button>
          </CardContent>
        </Card>

        {/* Pending Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {pendingOrders.length > 0 ? (
                pendingOrders.map((order: any) => (
                  <div key={order.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-foreground">{order.name}</p>
                        <p className="text-xs text-muted-foreground">{order.phone}</p>
                        <p className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
                          {order.orderDetails}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">
                          {formatCurrency(order.totalAmount)}
                        </p>
                        <p className="text-xs text-muted-foreground">#{order.id}</p>
                        <div className="mt-2">
                          <Badge variant="outline" className="bg-accent/10 text-accent">
                            Pending Payment
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs"
                        onClick={() => {
                          setAmount(order.totalAmount.toString());
                          setPhone(order.phone.replace('+91', ''));
                        }}
                      >
                        Auto-fill Amount
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No pending orders
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                    Transaction ID
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                    Phone
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                    Order ID
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction: any) => (
                    <tr key={transaction.id}>
                      <td className="px-4 py-2 text-sm font-mono text-foreground">
                        TXN{transaction.id}
                      </td>
                      <td className="px-4 py-2 text-sm font-medium text-foreground">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-4 py-2 text-sm text-foreground">
                        {transaction.senderPhone}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {transaction.orderId ? (
                          <span className="text-primary">#{transaction.orderId}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center space-x-1">
                          {transaction.status === "Matched" ? (
                            <CheckCircle className="w-4 h-4 text-secondary" />
                          ) : (
                            <XCircle className="w-4 h-4 text-accent" />
                          )}
                          <Badge className={getPaymentStatusColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm text-muted-foreground">
                        {formatDate(transaction.createdAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
