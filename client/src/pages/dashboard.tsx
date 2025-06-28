import { useQuery } from "@tanstack/react-query";
import StatsCard from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, getStockStatus } from "@/lib/utils";
import { Package, Clock, AlertTriangle, DollarSign } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["/api/orders"],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const recentOrders = orders.slice(0, 5);
  const lowStockProducts = products.filter(p => {
    const status = getStockStatus(p.quantity);
    return status.status === 'low' || status.status === 'out';
  }).slice(0, 5);

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-medium text-foreground mb-2">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back! Here's your system overview.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-card rounded-lg shadow-sm p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-medium text-foreground mb-2">Dashboard</h2>
        <p className="text-muted-foreground">Welcome back! Here's your system overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Products"
          value={stats?.totalProducts || 0}
          change={{ value: "12%", trend: "up", period: "from last month" }}
          icon={Package}
          iconColor="text-primary"
        />
        <StatsCard
          title="Pending Orders"
          value={stats?.pendingOrders || 0}
          change={{ value: "5%", trend: "up", period: "from yesterday" }}
          icon={Clock}
          iconColor="text-accent"
        />
        <StatsCard
          title="Low Stock Items"
          value={stats?.lowStockItems || 0}
          change={{ value: "3%", trend: "down", period: "from last week" }}
          icon={AlertTriangle}
          iconColor="text-destructive"
        />
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(stats?.totalRevenue || 0)}
          change={{ value: "18%", trend: "up", period: "from last month" }}
          icon={DollarSign}
          iconColor="text-secondary"
        />
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/products">
              <Button className="w-full" variant="default">
                <Package className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </Link>
            <Link href="/orders">
              <Button className="w-full" variant="secondary">
                <Clock className="w-4 h-4 mr-2" />
                Create Order
              </Button>
            </Link>
            <Link href="/payments">
              <Button className="w-full" variant="outline">
                <DollarSign className="w-4 h-4 mr-2" />
                Process SMS
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.length > 0 ? (
                recentOrders.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{order.name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {order.orderDetails}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        {formatCurrency(order.totalAmount)}
                      </p>
                      <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent">
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent orders</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.map((product: any) => {
                  const status = getStockStatus(product.quantity);
                  return (
                    <div key={product.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.district}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-destructive">
                          {product.quantity} left
                        </p>
                        <p className="text-xs text-muted-foreground">#{product.uniqueNumber}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">No low stock items</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
