import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { Settings as SettingsIcon, Database, Clock, Activity } from "lucide-react";

export default function Settings() {
  const [lowStockThreshold, setLowStockThreshold] = useState("100");
  const [orderTimeout, setOrderTimeout] = useState("6");
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [paymentReminders, setPaymentReminders] = useState(true);
  
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  const { data: thresholdSetting } = useQuery({
    queryKey: ["/api/settings/low_stock_threshold"],
    onSuccess: (data: any) => {
      if (data?.value) setLowStockThreshold(data.value);
    }
  });

  const { data: timeoutSetting } = useQuery({
    queryKey: ["/api/settings/order_timeout"],
    onSuccess: (data: any) => {
      if (data?.value) setOrderTimeout(data.value);
    }
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update setting");
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/settings/${variables.key}`] });
      toast({ title: `${variables.key.replace('_', ' ')} updated successfully` });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to update setting", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleUpdateThreshold = () => {
    const threshold = parseInt(lowStockThreshold);
    if (isNaN(threshold) || threshold < 1) {
      toast({
        title: "Invalid threshold",
        description: "Threshold must be a positive number",
        variant: "destructive"
      });
      return;
    }
    updateSettingMutation.mutate({ key: "low_stock_threshold", value: lowStockThreshold });
  };

  const handleUpdateTimeout = () => {
    const timeout = parseInt(orderTimeout);
    if (isNaN(timeout) || timeout < 1) {
      toast({
        title: "Invalid timeout",
        description: "Timeout must be a positive number",
        variant: "destructive"
      });
      return;
    }
    updateSettingMutation.mutate({ key: "order_timeout", value: orderTimeout });
  };

  // Only allow admin users to access this page
  if (!hasRole(currentUser, 'admin')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-foreground mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-medium text-foreground mb-2">Settings</h2>
        <p className="text-muted-foreground">Configure system parameters and thresholds.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Management Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <SettingsIcon className="w-5 h-5" />
              <span>Stock Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                Low Stock Threshold
              </Label>
              <div className="flex items-center space-x-3">
                <Input
                  type="number"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleUpdateThreshold}
                  disabled={updateSettingMutation.isPending}
                >
                  Update
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Alert when product quantity falls below this value
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                Order Timeout (minutes)
              </Label>
              <div className="flex items-center space-x-3">
                <Input
                  type="number"
                  value={orderTimeout}
                  onChange={(e) => setOrderTimeout(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleUpdateTimeout}
                  disabled={updateSettingMutation.isPending}
                >
                  Update
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Automatically cancel orders after this duration without payment
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Notifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Low Stock Alerts</p>
                <p className="text-xs text-muted-foreground">Notify when products are running low</p>
              </div>
              <Switch
                checked={lowStockAlerts}
                onCheckedChange={setLowStockAlerts}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Order Notifications</p>
                <p className="text-xs text-muted-foreground">Notify suppliers about new orders</p>
              </div>
              <Switch
                checked={orderNotifications}
                onCheckedChange={setOrderNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Payment Reminders</p>
                <p className="text-xs text-muted-foreground">Send payment reminders at 2, 4, 6 minutes</p>
              </div>
              <Switch
                checked={paymentReminders}
                onCheckedChange={setPaymentReminders}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>System Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Database Status</p>
              <div className="flex items-center mt-1">
                <div className="w-2 h-2 bg-secondary rounded-full mr-2"></div>
                <span className="text-sm text-foreground">Connected</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">System Version</p>
              <p className="text-lg font-bold text-foreground mt-1">v1.0.0</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
              <p className="text-lg font-bold text-foreground mt-1">
                {new Date().toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
