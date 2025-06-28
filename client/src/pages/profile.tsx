import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { formatDate, getInitials, getRoleColor } from "@/lib/utils";
import { User, Crown, MapPin } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/lib/auth";
import { insertUserSchema, insertUserInfoSchema } from "@shared/schema";
import { z } from "zod";

const userFormSchema = insertUserSchema.partial().extend({
  name: z.string().min(1, "Name is required"),
  primaryPhone: z.string().min(10, "Primary phone must be at least 10 digits"),
});

const addressFormSchema = insertUserInfoSchema.omit({ updatedAt: true }).extend({
  name: z.string().min(1, "Name is required"),
  district: z.string().min(1, "District is required"),
  state: z.string().min(1, "State is required"),
  primaryPhone: z.string().min(10, "Primary phone must be at least 10 digits"),
});

type UserFormData = z.infer<typeof userFormSchema>;
type AddressFormData = z.infer<typeof addressFormSchema>;

export default function Profile() {
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);
  
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  const { data: user } = useQuery({
    queryKey: [`/api/users`],
    select: (users: any[]) => users.find(u => u.telegramId === currentUser?.telegramId),
    enabled: !!currentUser?.telegramId
  });

  const { data: userInfo } = useQuery({
    queryKey: [`/api/user-info/${currentUser?.telegramId}`],
    enabled: !!currentUser?.telegramId
  });

  const userForm = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: user?.name || "",
      primaryPhone: user?.primaryPhone || "",
      secondaryPhone: user?.secondaryPhone || "",
      district: user?.district || "",
    },
  });

  const addressForm = useForm<AddressFormData>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      telegramId: currentUser?.telegramId || "",
      name: userInfo?.name || user?.name || "",
      houseName: userInfo?.houseName || "",
      landmark: userInfo?.landmark || "",
      wardNo: userInfo?.wardNo || "",
      panchayat: userInfo?.panchayat || "",
      block: userInfo?.block || "",
      subDistrict: userInfo?.subDistrict || "",
      district: userInfo?.district || user?.district || "",
      state: userInfo?.state || "",
      primaryPhone: userInfo?.primaryPhone || user?.primaryPhone || "",
      secondaryPhone: userInfo?.secondaryPhone || user?.secondaryPhone || "",
    },
  });

  // Update form defaults when data loads
  React.useEffect(() => {
    if (user) {
      userForm.reset({
        name: user.name,
        primaryPhone: user.primaryPhone,
        secondaryPhone: user.secondaryPhone,
        district: user.district,
      });
    }
  }, [user, userForm]);

  React.useEffect(() => {
    if (userInfo || user) {
      addressForm.reset({
        telegramId: currentUser?.telegramId || "",
        name: userInfo?.name || user?.name || "",
        houseName: userInfo?.houseName || "",
        landmark: userInfo?.landmark || "",
        wardNo: userInfo?.wardNo || "",
        panchayat: userInfo?.panchayat || "",
        block: userInfo?.block || "",
        subDistrict: userInfo?.subDistrict || "",
        district: userInfo?.district || user?.district || "",
        state: userInfo?.state || "",
        primaryPhone: userInfo?.primaryPhone || user?.primaryPhone || "",
        secondaryPhone: userInfo?.secondaryPhone || user?.secondaryPhone || "",
      });
    }
  }, [userInfo, user, addressForm, currentUser]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const response = await fetch(`/api/users/${currentUser?.telegramId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update profile");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Profile updated successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to update profile", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: async (data: AddressFormData) => {
      const response = await fetch("/api/user-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update address");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user-info/${currentUser?.telegramId}`] });
      toast({ title: "Address information updated successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to update address", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const onUpdateProfile = async (data: UserFormData) => {
    setIsUpdatingProfile(true);
    try {
      await updateProfileMutation.mutateAsync(data);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const onUpdateAddress = async (data: AddressFormData) => {
    setIsUpdatingAddress(true);
    try {
      await updateAddressMutation.mutateAsync(data);
    } finally {
      setIsUpdatingAddress(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-foreground mb-2">Not Authenticated</h3>
          <p className="text-muted-foreground">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-medium text-foreground mb-2">My Profile</h2>
        <p className="text-muted-foreground">Manage your account information and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Basic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...userForm}>
                <form onSubmit={userForm.handleSubmit(onUpdateProfile)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={userForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Harshit Sharma" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div>
                      <FormLabel>Telegram ID</FormLabel>
                      <Input 
                        value={currentUser.telegramId} 
                        disabled 
                        className="bg-muted"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={userForm.control}
                      name="primaryPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="9876543210" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={userForm.control}
                      name="secondaryPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Secondary Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="9876543211" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={userForm.control}
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

                  <Button type="submit" disabled={isUpdatingProfile}>
                    {isUpdatingProfile ? "Updating..." : "Update Profile"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Roles & Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Crown className="w-5 h-5" />
              <span>Roles & Permissions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {user?.roles && user.roles.length > 0 ? (
                user.roles.map((role: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-foreground">{role.role}</p>
                      {role.district && (
                        <p className="text-xs text-muted-foreground">{role.district}</p>
                      )}
                    </div>
                    <Badge className={getRoleColor(role.role)}>
                      {role.role}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No roles assigned</p>
              )}
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Account Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Registered:</span>
                  <span className="text-foreground">
                    {user?.registeredAt ? formatDate(user.registeredAt) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Language:</span>
                  <span className="text-foreground">{user?.language || 'English'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>Address Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...addressForm}>
            <form onSubmit={addressForm.handleSubmit(onUpdateAddress)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addressForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Harshit Sharma" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addressForm.control}
                  name="houseName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>House Name/Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Villa NearTemple" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addressForm.control}
                  name="landmark"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Landmark</FormLabel>
                      <FormControl>
                        <Input placeholder="Near Temple" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addressForm.control}
                  name="wardNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ward Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Ward5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={addressForm.control}
                  name="panchayat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Panchayat</FormLabel>
                      <FormControl>
                        <Input placeholder="Gopalpur" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addressForm.control}
                  name="block"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Block</FormLabel>
                      <FormControl>
                        <Input placeholder="Sadar" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addressForm.control}
                  name="subDistrict"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sub-District</FormLabel>
                      <FormControl>
                        <Input placeholder="Hazaribagh" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={addressForm.control}
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
                
                <FormField
                  control={addressForm.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="Delhi" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div>
                  <FormLabel>Primary Phone</FormLabel>
                  <Input 
                    value={addressForm.watch("primaryPhone")} 
                    disabled 
                    className="bg-muted"
                  />
                </div>
              </div>

              <Button type="submit" disabled={isUpdatingAddress}>
                {isUpdatingAddress ? "Saving..." : "Save Address Information"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
