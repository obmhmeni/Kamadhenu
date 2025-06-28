import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return dateString;
  }
}

export function getStockStatus(quantity: number, threshold: number = 100): {
  status: 'out' | 'low' | 'available';
  label: string;
  color: string;
} {
  if (quantity === 0) {
    return { status: 'out', label: 'Out of Stock', color: 'bg-destructive' };
  } else if (quantity < threshold) {
    return { status: 'low', label: 'Low Stock', color: 'bg-error' };
  } else {
    return { status: 'available', label: 'In Stock', color: 'bg-secondary' };
  }
}

export function parseOrderText(orderText: string): {
  name: string;
  address: string;
  items: Array<{
    product: string;
    quantity: number;
    district: string;
    addedBy: string;
    uniqueNumber: number;
  }>;
} | null {
  try {
    const lines = orderText.trim().split('\n');
    if (lines.length < 3) return null;

    const nameLine = lines.find(line => line.startsWith('Name:'));
    const addressLine = lines.find(line => line.startsWith('Address:'));
    
    if (!nameLine || !addressLine) return null;

    const name = nameLine.replace('Name:', '').trim();
    const address = addressLine.replace('Address:', '').trim();

    const items = lines
      .filter(line => !line.startsWith('Name:') && !line.startsWith('Address:') && line.trim())
      .map(line => {
        const parts = line.trim().split(' ');
        if (parts.length >= 5) {
          return {
            product: parts[0],
            quantity: parseInt(parts[1]),
            district: parts[2],
            addedBy: parts[3],
            uniqueNumber: parseInt(parts[4])
          };
        }
        return null;
      })
      .filter(item => item !== null) as Array<{
        product: string;
        quantity: number;
        district: string;
        addedBy: string;
        uniqueNumber: number;
      }>;

    return { name, address, items };
  } catch {
    return null;
  }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
}

export function getRoleColor(role: string): string {
  switch (role) {
    case 'admin':
      return 'bg-primary/10 text-primary';
    case 'district_head':
      return 'bg-secondary/10 text-secondary';
    case 'worker':
      return 'bg-accent/10 text-accent';
    case 'supplier':
      return 'bg-purple-100 text-purple-700';
    case 'client':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function getOrderStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'processing':
      return 'bg-primary/10 text-primary';
    case 'packed':
      return 'bg-secondary/10 text-secondary';
    case 'delivered':
      return 'bg-green-100 text-green-700';
    case 'cancelled':
      return 'bg-destructive/10 text-destructive';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function getPaymentStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'bg-accent/10 text-accent';
    case 'confirmed':
      return 'bg-secondary/10 text-secondary';
    case 'failed':
      return 'bg-destructive/10 text-destructive';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function parseSMSText(smsText: string): { amount: number; phone: string } | null {
  try {
    const amountMatch = smsText.match(/Rs\.?\s*(\d+\.?\d*)\s+Credited/i);
    const phoneMatch = smsText.match(/by\s+(\d{10})/i);
    
    if (amountMatch && phoneMatch) {
      return {
        amount: parseFloat(amountMatch[1]),
        phone: phoneMatch[1]
      };
    }
    
    return null;
  } catch {
    return null;
  }
}
