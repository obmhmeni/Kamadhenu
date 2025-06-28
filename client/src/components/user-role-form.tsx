import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRoleSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getRoleColor } from "@/lib/utils";
import { X } from "lucide-react";
import { z } from "zod";

const formSchema = insertRoleSchema.extend({
  telegramId: z.string().min(1, "Telegram ID is required"),
});

type FormData = z.infer<typeof formSchema>;

interface UserRoleFormProps {
  user?: any;
  onSuccess: () => void;
}

export default function UserRoleForm({ user, onSuccess }: UserRoleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      telegramId: user?.telegramId || "",
      role: "",
      district: "",
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to assign role");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Role assigned successfully" });
      form.reset();
    },
    onError: (error) => {
      toast({ 
        title: "Failed to assign role", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({ telegramId, role }: { telegramId: string; role: string }) => {
      const response = await fetch("/api/roles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId, role }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove role");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Role removed successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to remove role", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await assignRoleMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveRole = (telegramId: string, role: string) => {
    if (confirm(`Are you sure you want to remove the ${role} role?`)) {
      removeRoleMutation.mutate({ telegramId, role });
    }
  };

  const selectedRole = form.watch("role");
  const requiresDistrict = selectedRole === "district_head" || selectedRole === "supplier";

  return (
    <div className="space-y-6">
      {/* Current Roles */}
      {user && user.roles && user.roles.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-foreground mb-2">Current Roles</h4>
          <div className="flex flex-wrap gap-2">
            {user.roles.map((role: any, index: number) => (
              <div key={index} className="flex items-center">
                <Badge className={getRoleColor(role.role)}>
                  {role.role}
                  {role.district && ` (${role.district})`}
                </Badge>
                {role.role !== 'admin' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-6 w-6 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleRemoveRole(user.telegramId, role.role)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Role Form */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-2">
          {user ? 'Add New Role' : 'Assign Role'}
        </h4>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!user && (
              <FormField
                control={form.control}
                name="telegramId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telegram ID</FormLabel>
                    <FormControl>
                      <Input placeholder="6338398272" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="district_head">District Head</SelectItem>
                      <SelectItem value="worker">Worker</SelectItem>
                      <SelectItem value="supplier">Supplier</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {requiresDistrict && (
              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>District</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select district" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SouthDelhi">South Delhi</SelectItem>
                        <SelectItem value="CentralDelhi">Central Delhi</SelectItem>
                        <SelectItem value="NorthDelhi">North Delhi</SelectItem>
                        <SelectItem value="Chennai">Chennai</SelectItem>
                        <SelectItem value="Shahdara">Shahdara</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onSuccess}>
                {user ? 'Close' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Assigning..." : "Assign Role"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
