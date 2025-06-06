import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  User, Bell, Shield, Globe, Mail, Phone, 
  Lock, Smartphone, Laptop, Fingerprint, Eye, EyeOff
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  useUserSettings, 
  useUpdateProfile, 
  useUpdatePassword,
  useUpdateNotifications,
  useConnectedDevices,
  useRemoveDevice,
  type UserSettings
} from '@/services/userService';

interface ConnectedDevice {
  id: string;
  name: string;
  type: 'desktop' | 'mobile';
  browser: string;
  lastActive: string;
}

const Settings = () => {
  const { toast } = useToast();
  const { data: userSettings, isLoading } = useUserSettings();
  const updateProfile = useUpdateProfile();
  const updatePassword = useUpdatePassword();
  const updateNotifications = useUpdateNotifications();
  const { data: connectedDevices } = useConnectedDevices();
  const removeDevice = useRemoveDevice();

  // Form states
  const [profileData, setProfileData] = useState({
    name: '',
    displayName: '',
    bio: '',
    email: '',
    timezone: 'UTC'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    courseUpdates: true,
    assignmentReminders: true,
    discussionReplies: true
  });

  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });

  // Update form data when user settings load
  useEffect(() => {
    if (userSettings) {
      const settings = userSettings as UserSettings;
      setProfileData({
        name: settings?.name || '',
        displayName: settings?.displayName || '',
        bio: settings?.bio || '',
        email: settings?.email || '',
        timezone: settings?.timezone || 'UTC'
      });
      
      setNotificationPrefs({
        courseUpdates: settings?.notificationPreferences?.courseUpdates ?? true,
        assignmentReminders: settings?.notificationPreferences?.assignmentReminders ?? true,
        discussionReplies: settings?.notificationPreferences?.discussionReplies ?? true
      });
    }
  }, [userSettings]);

  // Update profile form handler
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync(profileData);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Update password form handler
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "New password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match.",
        variant: "destructive",
      });
      return;
    }
    try {
      await updatePassword.mutateAsync({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast({
        title: "Success",
        description: "Your password has been updated successfully.",
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle notification preference changes
  const handleNotificationChange = async (key: keyof typeof notificationPrefs) => {
    const newPrefs = {
      ...notificationPrefs,
      [key]: !notificationPrefs[key]
    };
    setNotificationPrefs(newPrefs);
    try {
      await updateNotifications.mutateAsync(newPrefs);
    } catch (error) {
      // Revert on error
      setNotificationPrefs(notificationPrefs);
      toast({
        title: "Error",
        description: "Failed to update notification preferences.",
        variant: "destructive",
      });
    }
  };

  // Handle device removal
  const handleRemoveDevice = async (deviceId: string) => {
    try {
      await removeDevice.mutateAsync(deviceId);
      toast({
        title: "Device Removed",
        description: "The device has been removed from your account.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove device. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="h-8 bg-muted animate-pulse rounded" />
            <div className="h-[200px] bg-muted animate-pulse rounded" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="w-full max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Manage your account preferences</p>
              </div>
              <Link to="/profile">
                <Button variant="outline" className="w-full sm:w-auto mt-2 sm:mt-0">View Profile</Button>
              </Link>
            </div>

            <Tabs defaultValue="profile" className="space-y-14">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2">
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="connected" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Connected
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>
                        Update your personal details and public profile
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleProfileSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input 
                              id="name" 
                              value={profileData.name}
                              onChange={e => setProfileData({...profileData, name: e.target.value})}
                              />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="display-name">Display Name</Label>
                            <Input 
                              id="display-name" 
                              value={profileData.displayName}
                              onChange={e => setProfileData({...profileData, displayName: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea 
                            id="bio" 
                            value={profileData.bio}
                            onChange={e => setProfileData({...profileData, bio: e.target.value})}
                            className="min-h-[100px]"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input 
                              id="email" 
                              type="email" 
                              value={profileData.email}
                              onChange={e => setProfileData({...profileData, email: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="timezone">Timezone</Label>
                            <Select 
                              value={profileData.timezone}
                              onValueChange={value => setProfileData({...profileData, timezone: value})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select timezone" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="UTC">UTC</SelectItem>
                                <SelectItem value="EST">EST</SelectItem>
                                <SelectItem value="PST">PST</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button type="submit" disabled={updateProfile.isPending} className="w-full sm:w-auto">
                          {updateProfile.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Choose what notifications you want to receive
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <Label>Course Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications about course content updates
                        </p>
                      </div>
                      <Switch
                        checked={notificationPrefs.courseUpdates}
                        onCheckedChange={() => handleNotificationChange('courseUpdates')}
                        />
                    </div>
                    <Separator />
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <Label>Assignment Reminders</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified about upcoming assignments
                        </p>
                      </div>
                      <Switch
                        checked={notificationPrefs.assignmentReminders}
                        onCheckedChange={() => handleNotificationChange('assignmentReminders')}
                        />
                    </div>
                    <Separator />
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <Label>Discussion Replies</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications when someone replies to your discussions
                        </p>
                      </div>
                      <Switch
                        checked={notificationPrefs.discussionReplies}
                        onCheckedChange={() => handleNotificationChange('discussionReplies')}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Password</CardTitle>
                      <CardDescription>
                        Change your password
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="current-password">Current Password</Label>
                          <div className="relative">
                            <Input 
                              id="current-password" 
                              type={showPasswords.currentPassword ? "text" : "password"}
                              value={passwordData.currentPassword}
                              onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowPasswords(prev => ({
                                ...prev,
                                currentPassword: !prev.currentPassword
                              }))}
                            >
                              {showPasswords.currentPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <div className="relative">
                              <Input 
                                id="new-password" 
                                type={showPasswords.newPassword ? "text" : "password"}
                                value={passwordData.newPassword}
                                onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                                className="pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() => setShowPasswords(prev => ({
                                  ...prev,
                                  newPassword: !prev.newPassword
                                }))}
                              >
                                {showPasswords.newPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <div className="relative">
                              <Input 
                                id="confirm-password" 
                                type={showPasswords.confirmPassword ? "text" : "password"}
                                value={passwordData.confirmPassword}
                                onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                className="pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() => setShowPasswords(prev => ({
                                  ...prev,
                                  confirmPassword: !prev.confirmPassword
                                }))}
                              >
                                {showPasswords.confirmPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                        <Button type="submit" disabled={updatePassword.isPending}>
                          {updatePassword.isPending ? "Updating..." : "Update Password"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Two-Step Verification</CardTitle>
                      <CardDescription>
                        Secure your account with two-step verification
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Alert>
                        <Fingerprint className="h-4 w-4" />
                        <AlertTitle>Not Enabled</AlertTitle>
                        <AlertDescription>
                          Protect your account with an additional layer of security. Once configured, you'll be required to enter both your password and an authentication code to sign in.
                        </AlertDescription>
                      </Alert>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Smartphone className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="font-medium">Authenticator App</p>
                            <p className="text-sm text-muted-foreground">Use an authentication app like Google Authenticator</p>
                          </div>
                          <Button variant="outline" disabled>Coming Soon</Button>
                        </div>
                        <Separator />
                        <div className="flex items-center gap-4">
                          <Phone className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="font-medium">SMS Recovery</p>
                            <p className="text-sm text-muted-foreground">Use your phone number as a backup</p>
                          </div>
                          <Button variant="outline" disabled>Coming Soon</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Login Sessions</CardTitle>
                      <CardDescription>
                        Manage your active sessions and devices
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {(connectedDevices as ConnectedDevice[] || []).map(device => (
                        <div key={device.id} className="flex items-center gap-4">
                          <Laptop className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{device.name}</p>
                              {device.id === 'current' && (
                                <Badge variant="secondary">Current</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {device.browser} • Last active: {new Date(device.lastActive).toLocaleString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={device.id === 'current'}
                            onClick={() => handleRemoveDevice(device.id)}
                          >
                            <Lock className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="connected">
                <Card>
                  <CardHeader>
                    <CardTitle>Connected Devices</CardTitle>
                    <CardDescription>
                      Manage your connected devices and applications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      {(connectedDevices as ConnectedDevice[] || []).map(device => (
                        <div key={device.id}>
                          <div className="flex items-center gap-4">
                            {device.type === 'desktop' ? (
                              <Laptop className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <Smartphone className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium">{device.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {device.browser} • Last active: {new Date(device.lastActive).toLocaleString()}
                              </p>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={device.id === 'current'}
                              onClick={() => handleRemoveDevice(device.id)}
                            >
                              Remove
                            </Button>
                          </div>
                          {device.id !== (connectedDevices as ConnectedDevice[])[
                            (connectedDevices as ConnectedDevice[]).length - 1
                          ].id && <Separator className="my-4" />}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;