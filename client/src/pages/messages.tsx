import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Send, Search, Plus, Check, CheckCheck, X, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import type { Conversation, Message, User } from "@shared/schema";

type ConversationWithDetails = Conversation & { 
  otherUser: User; 
  lastMessage?: Message; 
  unreadCount: number 
};

type MessageWithSender = Message & { sender: User };

export default function Messages() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<ConversationWithDetails[]>({
    queryKey: ["/api/conversations"],
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<MessageWithSender[]>({
    queryKey: ["/api/conversations", selectedConversation, "messages"],
    enabled: !!selectedConversation,
  });

  // Fetch all users for new conversation dropdown
  const { data: allUsers = [] } = useQuery({
    queryKey: ["/api/users"],
    enabled: showNewConversation,
    retry: false,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      const response = await apiRequest(`/api/conversations/${conversationId}/messages`, "POST", { content, messageType: "text" });
      return await response.json();
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversation, "messages"] });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const response = await apiRequest(`/api/conversations/${conversationId}/read`, "PATCH");
      return await response.json();
    },
    onSuccess: (_, conversationId) => {
      // Optimistically update the conversations data to remove unread count immediately
      queryClient.setQueryData(["/api/conversations"], (oldData: ConversationWithDetails[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unreadCount: 0 }
            : conv
        );
      });
      // Don't invalidate immediately to prevent badge flicker
      // Only refetch after a delay to ensure server state is updated
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      }, 500);
    },
  });

  const createConversationMutation = useMutation({
    mutationFn: async (otherUserId: string) => {
      console.log("Creating conversation with user:", otherUserId);
      const response = await apiRequest("/api/conversations", "POST", { otherUserId });
      return await response.json();
    },
    onSuccess: (conversation: any) => {
      console.log("Conversation created:", conversation);
      setSelectedConversation(conversation.id);
      setShowNewConversation(false);
      setSelectedUserId("");
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
    onError: (error) => {
      console.error("Failed to create conversation:", error);
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;
    
    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      content: messageText.trim(),
    });
  };

  const handleCreateConversation = () => {
    if (!selectedUserId) return;
    createConversationMutation.mutate(selectedUserId);
  };

  // Mark conversation as read when selected
  useEffect(() => {
    if (selectedConversation) {
      markAsReadMutation.mutate(selectedConversation);
    }
  }, [selectedConversation]);

  const filteredConversations = conversations.filter((conv) =>
    conv.otherUser.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const hasConversations = conversations.length > 0;
  const noConversations = !conversationsLoading && !hasConversations;

  const getUserDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email || "Użytkownik";
  };

  const getUserInitials = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || "U";
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "student": return "Uczeń";
      case "tutor": return "Korepetytor";
      case "admin": return "Administrator";
      default: return "Użytkownik";
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "student": return "default";
      case "tutor": return "secondary";
      case "admin": return "destructive";
      default: return "outline";
    }
  };

  // Combined users list for dropdown - allUsers already includes type field
  const availableUsers = Array.isArray(allUsers) ? allUsers.filter((u: any) => u.id !== (user as any)?.id) : []; // Exclude current user
  const uniqueAvailableUsers = availableUsers.filter(
    (candidate: any, index: number, self: any[]) => self.findIndex((u) => u.id === candidate.id) === index
  );

  // Get access info message based on user role
  const getAccessInfoMessage = () => {
    const userRole = (user as any)?.role;
    switch (userRole) {
      case 'student':
        return "Jako uczeń możesz pisać z administratorami i wszystkimi korepetytorami.";
      case 'tutor':
        return "Jako korepetytor możesz pisać tylko z administratorami i swoimi przypisanymi uczniami.";
      case 'admin':
        return "Jako administrator możesz pisać ze wszystkimi użytkownikami platformy.";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Access info message */}
        {getAccessInfoMessage() && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-gray-700 font-medium">{getAccessInfoMessage()}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List - Hidden on mobile when conversation selected */}
          <div className={`lg:col-span-1 h-full flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 ${selectedConversation ? 'hidden lg:flex' : 'flex'}`}>
            {/* Header */}
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Wiadomości</h2>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setShowNewConversation(!showNewConversation)}
                  className="h-9 w-9 p-0 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  data-testid="button-new-conversation"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Szukaj rozmowy..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  data-testid="input-search-conversations"
                />
              </div>
              
              {/* New Conversation Form */}
              {showNewConversation && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h4 className="text-sm font-semibold mb-3 text-gray-900">Nowa rozmowa</h4>
                  <div className="space-y-3">
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger className="w-full bg-white border-gray-200 rounded-lg" data-testid="select-new-conversation-user">
                        <SelectValue placeholder="Wybierz osobę" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueAvailableUsers.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">Brak osób do rozmowy</div>
                        ) : (
                          uniqueAvailableUsers.map((user: any) => (
                            <SelectItem key={`user-${user.id}`} value={user.id}>
                              <div className="flex flex-col gap-1 py-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant={user.type === 'student' ? 'default' : 'secondary'} className="text-xs">
                                    {user.type === 'student' ? 'Uczeń' : 'Korepetytor'}
                                  </Badge>
                                  <span className="font-medium text-sm">{user.firstName} {user.lastName}</span>
                                </div>
                                <span className="text-xs text-gray-500">{user.email}</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={handleCreateConversation}
                        disabled={!selectedUserId || createConversationMutation.isPending}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg"
                        data-testid="button-start-conversation"
                      >
                        Rozpocznij
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setShowNewConversation(false);
                          setSelectedUserId("");
                        }}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
                        data-testid="button-cancel-conversation"
                      >
                        Anuluj
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Conversations List */}
            <ScrollArea className="flex-1">
              {conversationsLoading ? (
                <div className="p-6 text-center text-gray-500">
                  <div className="text-sm">Ładowanie rozmów...</div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <div className="text-sm">{searchQuery ? "Nie znaleziono rozmów" : "Brak osób do rozmowy"}</div>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 border-b border-gray-100 cursor-pointer transition-all ${
                      selectedConversation === conversation.id 
                        ? "bg-blue-50" 
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedConversation(conversation.id)}
                    data-testid={`conversation-${conversation.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarImage src={conversation.otherUser.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-semibold">
                          {getUserInitials(conversation.otherUser)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-sm text-gray-900 truncate" data-testid={`conversation-name-${conversation.id}`}>
                            {getUserDisplayName(conversation.otherUser)}
                          </h3>
                          {conversation.unreadCount > 0 && (
                            <Badge 
                              variant="destructive" 
                              className="h-5 min-w-[20px] px-1.5 rounded-full text-xs flex items-center justify-center bg-red-500"
                              data-testid={`unread-badge-${conversation.id}`}
                            >
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <Badge variant={getRoleBadgeVariant(conversation.otherUser.role || "")} className="text-xs mb-1">
                          {getRoleDisplayName(conversation.otherUser.role || "")}
                        </Badge>
                        {conversation.lastMessage && (
                          <p className="text-xs text-gray-600 truncate mt-1" data-testid={`last-message-${conversation.id}`}>
                            {conversation.lastMessage.content}
                          </p>
                        )}
                        {conversation.lastMessageAt && (
                          <p className="text-xs text-gray-400 mt-1">
                            {format(new Date(conversation.lastMessageAt), "dd.MM HH:mm", { locale: pl })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Messages Area - Full screen on mobile when conversation selected */}
          <div className={`lg:col-span-2 h-full flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 ${!selectedConversation ? 'hidden lg:flex' : 'flex'}`}>
            {selectedConversation ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedConversation(null)}
                    className="lg:hidden h-9 w-9 p-0 rounded-full hover:bg-gray-100"
                    data-testid="button-back-to-conversations"
                  >
                    <ArrowLeft className="h-5 w-5 text-gray-700" />
                  </Button>
                  {(() => {
                    const conversation = conversations.find((c) => c.id === selectedConversation);
                    if (!conversation) return <span className="text-gray-900 font-semibold">Rozmowa</span>;
                    return (
                      <>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conversation.otherUser.profileImageUrl || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-semibold">
                            {getUserInitials(conversation.otherUser)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-gray-900" data-testid="conversation-header-name">
                            {getUserDisplayName(conversation.otherUser)}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {getRoleDisplayName(conversation.otherUser.role || "")}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
                
                {/* Messages */}
                <ScrollArea className="flex-1 p-6 bg-gray-50">
                  {messagesLoading ? (
                    <div className="text-center text-gray-500 py-8">
                      <div className="text-sm">Ładowanie wiadomości...</div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <div className="text-sm">Brak wiadomości w tej rozmowie</div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((message, index: number) => {
                        const isCurrentUser = message.senderId === (user as any)?.id;
                        const isSystemMessage = message.messageType === "system";
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                            data-testid={`message-${message.id}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                                isSystemMessage
                                  ? "bg-emerald-50 border border-emerald-200"
                                  : isCurrentUser
                                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                                  : "bg-white border border-gray-200"
                              }`}
                            >
                              {isSystemMessage && (
                                <div className="flex items-center gap-2 mb-1.5 text-emerald-700">
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span className="text-xs font-medium">Wiadomość automatyczna</span>
                                </div>
                              )}
                              <p className={`text-sm leading-relaxed break-words ${
                                isSystemMessage
                                  ? "text-emerald-800"
                                  : isCurrentUser
                                  ? "text-white"
                                  : "text-gray-900"
                              }`}>{message.content}</p>
                              <div className={`flex items-center justify-between text-xs mt-1.5 gap-2 ${
                                isSystemMessage 
                                  ? "text-emerald-600" 
                                  : isCurrentUser 
                                  ? "text-white/70" 
                                  : "text-gray-500"
                              }`}>
                                <span className="flex items-center gap-1.5">
                                  {format(new Date(message.createdAt || new Date()), "HH:mm", { locale: pl })}
                                  {!isCurrentUser && !isSystemMessage && message.sender.firstName && (
                                    <span>• {message.sender.firstName}</span>
                                  )}
                                </span>
                                
                                {/* Read indicator for sent messages */}
                                {isCurrentUser && !isSystemMessage && (
                                  <div className="flex items-center">
                                    {message.readAt ? (
                                      <CheckCheck 
                                        className="w-4 h-4 text-emerald-400" 
                                        data-testid={`message-read-${message.id}`}
                                      />
                                    ) : (
                                      <Check 
                                        className="w-4 h-4" 
                                        data-testid={`message-sent-${message.id}`}
                                      />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
                  <form onSubmit={handleSendMessage}>
                    <div className="flex gap-3">
                      <Input
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Napisz wiadomość..."
                        className="flex-1 h-11 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        disabled={sendMessageMutation.isPending}
                        data-testid="input-message"
                      />
                      <Button 
                        type="submit" 
                        disabled={!messageText.trim() || sendMessageMutation.isPending}
                        className="h-11 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl"
                        data-testid="button-send-message"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Niewłaściwe słowa będą automatycznie ocenzurowane
                    </p>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center max-w-sm">
                  <div className="inline-flex p-6 bg-gray-100 rounded-full mb-4">
                    <MessageCircle className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">
                    {noConversations ? "Brak osób do rozmowy" : "Wybierz rozmowę"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {noConversations
                      ? "Nie masz jeszcze żadnych rozmów."
                      : "Wybierz rozmowę z listy, aby rozpocząć czat"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
