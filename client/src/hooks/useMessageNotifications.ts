import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Conversation {
  id: string;
  otherUser: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
  unreadCount: number;
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: string;
  };
}

export function useMessageNotifications(enabled: boolean = true) {
  const { toast } = useToast();
  const { user } = useAuth();
  const previousConversationsRef = useRef<Conversation[]>([]);
  const notifiedMessagesRef = useRef<Set<string>>(new Set()); // Track which messages we've already notified about

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    enabled: enabled && !!user,
    refetchInterval: 3000, // Check for new messages every 3 seconds
  });

  useEffect(() => {
    if (!enabled || !conversations.length) return;

    const previousConversations = previousConversationsRef.current;
    
    // Skip notifications on first load (when previousConversations is empty)
    if (previousConversations.length === 0) {
      previousConversationsRef.current = [...conversations];
      return;
    }
    
    // Check for new messages by comparing unread counts
    conversations.forEach((currentConv) => {
      const previousConv = previousConversations.find(p => p.id === currentConv.id);
      
      // Only check for actually NEW unread messages (count increased)
      if (previousConv && currentConv.unreadCount > previousConv.unreadCount) {
        
        // Don't show notification for messages from current user
        if (currentConv.lastMessage && currentConv.lastMessage.senderId === (user as any)?.id) {
          return;
        }
        
        // Create unique key for this notification (conversation + last message timestamp)
        const notificationKey = `${currentConv.id}-${currentConv.lastMessage?.createdAt || Date.now()}`;
        
        // Only show notification if we haven't already shown it for this specific message
        if (!notifiedMessagesRef.current.has(notificationKey)) {
          const senderName = currentConv.otherUser.firstName && currentConv.otherUser.lastName
            ? `${currentConv.otherUser.firstName} ${currentConv.otherUser.lastName}`
            : currentConv.otherUser.email;

          const messagePreview = currentConv.lastMessage?.content?.substring(0, 50) || 'Nowa wiadomość';
          
          toast({
            title: `Nowa wiadomość od ${senderName}`,
            description: messagePreview.length > 50 ? `${messagePreview}...` : messagePreview,
            duration: 5000,
          });
          
          // Mark this notification as shown
          notifiedMessagesRef.current.add(notificationKey);
          
          // Clean up old notification keys (keep only last 50 to prevent memory leak)
          if (notifiedMessagesRef.current.size > 50) {
            const keysArray = Array.from(notifiedMessagesRef.current);
            const oldKeys = keysArray.slice(0, keysArray.length - 50);
            oldKeys.forEach(key => notifiedMessagesRef.current.delete(key));
          }
        }
      }
    });

    // Update the reference for next comparison
    previousConversationsRef.current = [...conversations];
  }, [conversations, enabled, toast, user]);

  return { conversations };
}