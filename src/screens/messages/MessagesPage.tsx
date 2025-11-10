import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { PageHeader } from '../../components/ui/PageHeader';
import { theme } from '../../styles/theme';

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
  listingTitle?: string;
}

interface Message {
  id: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
  isRead: boolean;
}

interface MessagesPageProps {
  onBack?: () => void;
}

export function MessagesPage({ onBack }: MessagesPageProps) {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const conversations: Conversation[] = [
    {
      id: "1",
      name: "Marie Dubois",
      avatar: "https://images.unsplash.com/photo-1590905775253-a4f0f3c426ff?w=100",
      lastMessage: "Parfait ! Je serai là vers 18h pour récupérer les clés",
      timestamp: "14:32",
      unreadCount: 2,
      isOnline: true,
      listingTitle: "Appartement avec 2 chats"
    },
    {
      id: "2", 
      name: "Thomas Martin",
      avatar: "https://images.unsplash.com/photo-1614917752523-3e61c00e5e68?w=100",
      lastMessage: "Merci pour cette super garde ! Max était ravi 😊",
      timestamp: "Hier",
      unreadCount: 0,
      isOnline: false,
      listingTitle: "Golden Retriever Max"
    },
    {
      id: "3",
      name: "Sophie Chen",
      avatar: "https://images.unsplash.com/photo-1694299352873-0c29d862e87a?w=100",
      lastMessage: "Vous avez des questions sur les plantes ?",
      timestamp: "Lun",
      unreadCount: 0,
      isOnline: true,
      listingTitle: "Jungle urbaine"
    }
  ];

  const currentMessages: Message[] = [
    {
      id: "1",
      text: "Bonjour ! Je suis intéressée par votre annonce pour la garde de vos chats",
      timestamp: "14:20",
      isOwn: false,
      isRead: true
    },
    {
      id: "2", 
      text: "Bonjour Marie ! Merci pour votre message. Mes chats sont très sociables, ça devrait bien se passer 😊",
      timestamp: "14:25",
      isOwn: true,
      isRead: true
    },
    {
      id: "3",
      text: "Parfait ! Quand puis-je passer récupérer les clés ?",
      timestamp: "14:30",
      isOwn: false,
      isRead: true
    },
    {
      id: "4",
      text: "Parfait ! Je serai là vers 18h pour récupérer les clés",
      timestamp: "14:32",
      isOwn: false,
      isRead: false
    }
  ];

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.listingTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setNewMessage("");
    }
  };

  if (selectedConversation) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header conversation */}
        <View style={styles.conversationHeaderView}>
          <Button 
            variant="ghost" 
            size="sm" 
            onPress={() => setSelectedConversation(null)}
            style={styles.backButton}
          >
            <Icon name="ArrowLeft" size={20} color={theme.colors.foreground} />
          </Button>
          
          <View style={styles.conversationInfo}>
            <View style={styles.conversationAvatar}>
              <Icon name="User" size={20} color={theme.colors.mutedForeground} />
              {selectedConv?.isOnline && <View style={styles.onlineIndicator} />}
            </View>
            
            <View style={styles.conversationDetails}>
              <Text style={styles.conversationName}>{selectedConv?.name}</Text>
              <Text style={styles.conversationStatus}>
                {selectedConv?.isOnline ? "En ligne" : "Vu récemment"}
              </Text>
            </View>
          </View>

        </View>

        {/* Info annonce */}
        {selectedConv?.listingTitle && (
          <View style={styles.listingInfo}>
            <Icon name="Star" size={16} color="#2563eb" />
            <Text style={styles.listingTitle}>{selectedConv.listingTitle}</Text>
          </View>
        )}

        {/* Messages */}
        <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
          {currentMessages.map((message) => (
            <View 
              key={message.id}
              style={[styles.messageWrapper, message.isOwn && styles.ownMessageWrapper]}
            >
              <View style={[
                styles.messageBubble,
                message.isOwn ? styles.ownMessage : styles.otherMessage
              ]}>
                <Text style={[
                  styles.messageText,
                  message.isOwn ? styles.ownMessageText : styles.otherMessageText
                ]}>
                  {message.text}
                </Text>
                <View style={[styles.messageFooter, message.isOwn && styles.ownMessageFooter]}>
                  <Text style={[
                    styles.messageTime,
                    message.isOwn ? styles.ownMessageTime : styles.otherMessageTime
                  ]}>
                    {message.timestamp}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Input message */}
        <View style={styles.messageInput}>
          <TouchableOpacity style={styles.attachButton}>
            <Icon name="Plus" size={18} color={theme.colors.primaryForeground} />
          </TouchableOpacity>
          
          <View style={styles.inputWrapper}>
            <Input
              placeholder="Tapez votre message..."
              value={newMessage}
              onChangeText={setNewMessage}
              style={styles.textInput}
              multiline
            />
          </View>
          
          <TouchableOpacity 
            style={styles.sendButton}
            onPress={handleSendMessage}
          >
            <Icon name="Send" size={18} color={theme.colors.primaryForeground} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader 
        title="Messages"
        icon="chatbubble"
      />

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchWrapper}>
            <Icon name="Search" size={16} color={theme.colors.mutedForeground} style={styles.searchIcon} />
            <Input 
              placeholder="Rechercher une conversation..." 
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

      {/* Conversations List */}
      <ScrollView style={styles.conversationsList} showsVerticalScrollIndicator={false}>
        {filteredConversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="Search" size={64} color={theme.colors.mutedForeground} />
            <Text style={styles.emptyTitle}>Aucune conversation</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery ? "Aucun résultat pour votre recherche" : "Vos conversations apparaîtront ici"}
            </Text>
          </View>
        ) : (
          <View style={styles.conversationsContainer}>
            {filteredConversations.map((conversation) => (
              <View
                key={conversation.id}
                style={styles.conversationItem}
                onTouchEnd={() => setSelectedConversation(conversation.id)}
              >
                <View style={styles.conversationItemLeft}>
                  <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                      <Icon name="User" size={24} color={theme.colors.mutedForeground} />
                    </View>
                    {conversation.isOnline && <View style={styles.onlineIndicator} />}
                  </View>

                  <View style={styles.conversationContent}>
                    <View style={styles.conversationHeader}>
                      <Text style={styles.conversationName}>{conversation.name}</Text>
                      <Text style={styles.conversationTime}>{conversation.timestamp}</Text>
                    </View>
                    
                    {conversation.listingTitle && (
                      <Text style={styles.conversationListing}>{conversation.listingTitle}</Text>
                    )}
                    
                    <View style={styles.conversationFooter}>
                      <Text style={styles.lastMessage} numberOfLines={1}>
                        {conversation.lastMessage}
                      </Text>
                      {conversation.unreadCount > 0 && (
                        <Badge style={styles.unreadBadge}>
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#f9fafb',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.foreground,
  },
  searchContainer: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  searchWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: theme.spacing.md,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 44,
    paddingLeft: theme.spacing['3xl'] + theme.spacing.xs,
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.borderRadius.full,
    borderWidth: 0,
  },
  conversationsList: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing['6xl'],
    gap: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
  },
  emptyDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
  conversationsContainer: {
    gap: theme.spacing.xs,
  },
  conversationItem: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.xs,
  },
  conversationItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  conversationName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
  },
  conversationTime: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  conversationListing: {
    fontSize: theme.fontSize.xs,
    color: '#2563eb',
    marginBottom: theme.spacing.xs,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
    marginRight: theme.spacing.sm,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Conversation view styles
  conversationHeaderView: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  conversationInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  conversationAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  conversationDetails: {
    flex: 1,
  },
  conversationStatus: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  listingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: '#eff6ff',
    borderBottomWidth: 1,
    borderBottomColor: '#bfdbfe',
  },
  listingTitle: {
    fontSize: theme.fontSize.sm,
    color: '#1e40af',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: 80, // Space for message input
  },
  messageWrapper: {
    marginBottom: theme.spacing.lg,
    alignItems: 'flex-start',
  },
  ownMessageWrapper: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius['2xl'],
  },
  otherMessage: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  ownMessage: {
    backgroundColor: theme.colors.primary,
  },
  messageText: {
    fontSize: theme.fontSize.sm,
    lineHeight: 20,
  },
  otherMessageText: {
    color: theme.colors.foreground,
  },
  ownMessageText: {
    color: theme.colors.primaryForeground,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  ownMessageFooter: {
    justifyContent: 'flex-end',
  },
  messageTime: {
    fontSize: theme.fontSize.xs,
  },
  otherMessageTime: {
    color: theme.colors.mutedForeground,
  },
  ownMessageTime: {
    color: theme.colors.primaryForeground + '70',
  },
  messageInput: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.muted,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  textInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
});
