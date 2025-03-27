import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MessageList from "@/components/messages/message-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MessageSquare, User as UserIcon } from "lucide-react";
import { User } from "@shared/schema";

export default function Messages() {
  const { user } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("contacts");

  // Get all users to show as contacts
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Get unread messages
  const { data: unreadMessages } = useQuery<any[]>({
    queryKey: ["/api/messages/unread"],
    enabled: !!user,
  });

  // Filter users based on search query
  const filteredUsers = users?.filter(u => 
    u.id !== user?.id && 
    (u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
     u.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get users with unread messages
  const usersWithUnreadMessages = unreadMessages?.reduce((acc: {[key: number]: number}, message) => {
    if (!acc[message.senderId]) {
      acc[message.senderId] = 1;
    } else {
      acc[message.senderId]++;
    }
    return acc;
  }, {});

  // Get initials for avatar
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Get role display name
  const getRoleDisplayName = (role: string): string => {
    switch (role) {
      case "farmer":
        return "Farmer";
      case "buyer":
        return "Buyer";
      case "middleman":
        return "Middleman";
      case "transporter":
        return "Transporter";
      default:
        return "User";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold font-nunito text-text mb-6">Messages</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
            {/* Contact list */}
            <div className="md:col-span-1 bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input 
                    type="text" 
                    placeholder="Search contacts..." 
                    className="pl-10" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <Tabs defaultValue="contacts" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="px-4 pt-2">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="contacts">All Contacts</TabsTrigger>
                    <TabsTrigger value="unread">
                      Unread
                      {usersWithUnreadMessages && Object.keys(usersWithUnreadMessages).length > 0 && (
                        <span className="ml-2 bg-secondary text-white text-xs rounded-full px-2 py-0.5">
                          {Object.keys(usersWithUnreadMessages).length}
                        </span>
                      )}
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="contacts" className="flex-1 overflow-y-auto p-0 mt-0">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : filteredUsers && filteredUsers.length > 0 ? (
                    <div className="divide-y">
                      {filteredUsers.map((contact) => (
                        <button
                          key={contact.id}
                          className={`w-full px-4 py-3 flex items-center hover:bg-gray-50 text-left ${
                            selectedUserId === contact.id ? "bg-gray-100" : ""
                          }`}
                          onClick={() => setSelectedUserId(contact.id)}
                        >
                          <Avatar className="h-10 w-10 mr-3">
                            <AvatarFallback>
                              {getInitials(contact.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {contact.fullName}
                              </p>
                              {usersWithUnreadMessages && usersWithUnreadMessages[contact.id] && (
                                <span className="ml-2 bg-secondary text-white text-xs rounded-full px-2 py-0.5">
                                  {usersWithUnreadMessages[contact.id]}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {getRoleDisplayName(contact.role)}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No contacts found
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="unread" className="flex-1 overflow-y-auto p-0 mt-0">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : usersWithUnreadMessages && Object.keys(usersWithUnreadMessages).length > 0 ? (
                    <div className="divide-y">
                      {users?.filter(u => usersWithUnreadMessages[u.id]).map((contact) => (
                        <button
                          key={contact.id}
                          className={`w-full px-4 py-3 flex items-center hover:bg-gray-50 text-left ${
                            selectedUserId === contact.id ? "bg-gray-100" : ""
                          }`}
                          onClick={() => setSelectedUserId(contact.id)}
                        >
                          <Avatar className="h-10 w-10 mr-3">
                            <AvatarFallback>
                              {getInitials(contact.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {contact.fullName}
                              </p>
                              <span className="ml-2 bg-secondary text-white text-xs rounded-full px-2 py-0.5">
                                {usersWithUnreadMessages[contact.id]}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {getRoleDisplayName(contact.role)}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No unread messages
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Message content */}
            <div className="md:col-span-2 bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
              {selectedUserId ? (
                <MessageList recipientId={selectedUserId} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Your Messages</h3>
                  <p className="text-gray-500 mb-6">
                    Select a contact to start messaging
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => setActiveTab("contacts")}
                  >
                    <UserIcon className="h-4 w-4 mr-2" />
                    View all contacts
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
