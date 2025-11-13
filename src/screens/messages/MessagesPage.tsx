import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { PageHeader } from '../../components/ui/PageHeader';
import { theme } from '../../styles/theme';
import { useChatApi } from '../../hooks/api/useChatApi';
import { useAuth } from '../../contexts/AuthContext';
import { DiscussionDto, MessageDto, PublicUserDto } from '../../types/api';
import { useUserApi } from '../../hooks/api/useUserApi';

interface ConversationItem {
  id: number;
  counterpartId: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
  listingTitle?: string;
}

interface UiMessage {
  id: number;
  text: string;
  timestamp: string;
  isOwn: boolean;
}

interface MessagesPageProps {
  onBack?: () => void;
}

export function MessagesPage({ onBack }: MessagesPageProps) {
  const { user } = useAuth();
  const {
    getMyDiscussions,
    getDiscussionMessages,
    sendMessageToDiscussion,
  } = useChatApi();
  const { getUserByUsername } = useUserApi();

  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');

  const [discussions, setDiscussions] = useState<DiscussionDto[]>([]);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [participantProfiles, setParticipantProfiles] = useState<Record<string, PublicUserDto>>({});
  const [conversationSummaries, setConversationSummaries] = useState<Record<number, { lastMessage: string; lastMessageAt: string }>>({});

  const [isLoadingDiscussions, setIsLoadingDiscussions] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [discussionsError, setDiscussionsError] = useState<string | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const currentUserIdentifiers = useMemo(
    () =>
      [user?.id, user?.username].filter(
        (value, index, self): value is string => Boolean(value) && self.indexOf(value) === index,
      ),
    [user?.id, user?.username],
  );

  const resolveCounterpartId = useCallback(
    (discussion: DiscussionDto) => {
      const { senderId, recipientId } = discussion;
      if (senderId && currentUserIdentifiers.includes(senderId)) {
        return recipientId;
      }
      if (recipientId && currentUserIdentifiers.includes(recipientId)) {
        return senderId;
      }
      return recipientId ?? senderId ?? '';
    },
    [currentUserIdentifiers],
  );

  const formatListTimestamp = useCallback((value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const now = new Date();
    const sameDay = date.toDateString() === now.toDateString();
    if (sameDay) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    if (diffInDays === 1) {
      return 'Hier';
    }
    if (diffInDays < 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    }
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }, []);

  const formatMessageTimestamp = useCallback((value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }, []);

  useEffect(() => {
    if (!user?.id && !user?.username) {
      return;
    }

    let isCancelled = false;

    const fetchDiscussions = async () => {
      setIsLoadingDiscussions(true);
      setDiscussionsError(null);
      try {
        const response = await getMyDiscussions({ page: 0, limit: 50 });
        const fetched = response?.content ?? [];
        if (!isCancelled) {
          setDiscussions(fetched);
          setConversationSummaries((prev) => {
            const next = { ...prev };
            fetched.forEach((discussion) => {
              next[discussion.id] = {
                lastMessage: prev[discussion.id]?.lastMessage ?? '',
                lastMessageAt: discussion.lastMessageAt,
              };
            });
            return next;
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement des discussions:', error);
        if (!isCancelled) {
          setDiscussionsError("Impossible de charger vos discussions pour le moment.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingDiscussions(false);
        }
      }
    };

    fetchDiscussions();

    return () => {
      isCancelled = true;
    };
  }, [user?.id, user?.username, getMyDiscussions]);

  useEffect(() => {
    if (discussions.length === 0) {
      return;
    }

    const counterpartIds = Array.from(
      new Set(
        discussions
          .map((discussion) => resolveCounterpartId(discussion))
          .filter((id): id is string => Boolean(id)),
      ),
    );

    const missingIds = counterpartIds.filter((id) => !(id in participantProfiles));
    if (missingIds.length === 0) {
      return;
    }

    let isCancelled = false;

    const fetchProfiles = async () => {
      const entries = await Promise.all(
        missingIds.map(async (id) => {
          try {
            const profile = await getUserByUsername(id);
            if (profile) {
              return [id, profile] as const;
            }
          } catch (error) {
            console.warn("Impossible de récupérer le profil utilisateur", id, error);
          }
          return null;
        }),
      );

      if (!isCancelled) {
        setParticipantProfiles((prev) => {
          const next = { ...prev };
          entries.forEach((entry) => {
            if (entry) {
              const [id, profile] = entry;
              next[id] = profile;
            }
          });
          return next;
        });
      }
    };

    fetchProfiles();

    return () => {
      isCancelled = true;
    };
  }, [discussions, participantProfiles, getUserByUsername, resolveCounterpartId]);

  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      setMessagesError(null);
      return;
    }

    let isCancelled = false;

    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      setMessagesError(null);
      try {
        const response = await getDiscussionMessages(selectedConversation, { page: 0, limit: 50 });
        const fetched = response?.content ?? [];
        const sorted = fetched.sort(
          (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
        );
        if (!isCancelled) {
          setMessages(sorted);
          if (sorted.length > 0) {
            const last = sorted[sorted.length - 1];
            setConversationSummaries((prev) => ({
              ...prev,
              [selectedConversation]: {
                lastMessage: last.content,
                lastMessageAt: last.sentAt,
              },
            }));
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
        if (!isCancelled) {
          setMessagesError("Impossible de charger les messages de cette conversation.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingMessages(false);
        }
      }
    };

    fetchMessages();

    return () => {
      isCancelled = true;
    };
  }, [selectedConversation, getDiscussionMessages]);

  const conversationItems = useMemo<ConversationItem[]>(() => {
    if (discussions.length === 0) {
      return [];
    }

    const itemsWithMeta = discussions.map((discussion) => {
      const counterpartId = resolveCounterpartId(discussion) ?? '';
      const profile = participantProfiles[counterpartId];
      const summary = conversationSummaries[discussion.id];
      const rawTimestamp = summary?.lastMessageAt ?? discussion.lastMessageAt;
      const fullName = profile ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() : '';
      const displayName = fullName || profile?.username || counterpartId || 'Utilisateur';
      const lastMessage = summary?.lastMessage ?? '';

      return {
        conversation: {
          id: discussion.id,
          counterpartId,
          name: displayName,
          lastMessage: lastMessage || 'Ouvrir la conversation',
          timestamp: formatListTimestamp(rawTimestamp),
          unreadCount: 0,
          isOnline: false,
          listingTitle: discussion.announcementId ? `Annonce #${discussion.announcementId}` : undefined,
        } as ConversationItem,
        rawTimestamp,
      };
    });

    itemsWithMeta.sort((a, b) => {
      const timeA = a.rawTimestamp ? new Date(a.rawTimestamp).getTime() : 0;
      const timeB = b.rawTimestamp ? new Date(b.rawTimestamp).getTime() : 0;
      return timeB - timeA;
    });

    return itemsWithMeta.map((item) => item.conversation);
  }, [discussions, participantProfiles, conversationSummaries, resolveCounterpartId, formatListTimestamp]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return conversationItems;
    }
    const query = searchQuery.trim().toLowerCase();
    return conversationItems.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        (item.listingTitle ?? '').toLowerCase().includes(query) ||
        item.lastMessage.toLowerCase().includes(query),
    );
  }, [conversationItems, searchQuery]);

  const selectedConversationItem = useMemo(
    () =>
      selectedConversation
        ? conversationItems.find((item) => item.id === selectedConversation) ?? null
        : null,
    [conversationItems, selectedConversation],
  );

  const counterpartProfile = useMemo(() => {
    if (!selectedConversationItem) {
      return undefined;
    }
    return participantProfiles[selectedConversationItem.counterpartId];
  }, [selectedConversationItem, participantProfiles]);

  const uiMessages = useMemo<UiMessage[]>(() => {
    if (messages.length === 0) {
      return [];
    }
    return messages.map((message) => ({
      id: message.id,
      text: message.content,
      timestamp: formatMessageTimestamp(message.sentAt),
      isOwn: currentUserIdentifiers.includes(message.authorId),
    }));
  }, [messages, currentUserIdentifiers, formatMessageTimestamp]);

  const handleSelectConversation = (conversationId: number) => {
    setSelectedConversation(conversationId);
    setMessages([]);
    setMessagesError(null);
  };

  const handleSendMessage = async () => {
    if (!selectedConversation) {
      return;
    }
    const content = newMessage.trim();
    if (!content || isSendingMessage) {
      return;
    }

    setIsSendingMessage(true);
    setMessagesError(null);

    try {
      const response = await sendMessageToDiscussion(selectedConversation, { content });
      if (response) {
        setMessages((prev) => [...prev, response]);
        setConversationSummaries((prev) => ({
          ...prev,
          [selectedConversation]: {
            lastMessage: response.content,
            lastMessageAt: response.sentAt,
          },
        }));
        setNewMessage('');
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      setMessagesError("Impossible d'envoyer le message. Veuillez réessayer.");
    } finally {
      setIsSendingMessage(false);
    }
  };

  if (selectedConversation && selectedConversationItem) {
    return (
      <SafeAreaView style={styles.container}>
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
              {selectedConversationItem.isOnline && <View style={styles.onlineIndicator} />}
            </View>

            <View style={styles.conversationDetails}>
              <Text style={styles.conversationName}>
                {counterpartProfile
                  ? `${counterpartProfile.firstName ?? ''} ${counterpartProfile.lastName ?? ''}`.trim() ||
                    counterpartProfile.username ||
                    selectedConversationItem.name
                  : selectedConversationItem.name}
              </Text>
              <Text style={styles.conversationStatus}>
                {selectedConversationItem.timestamp
                  ? `Dernier message ${selectedConversationItem.timestamp}`
                  : 'Discussion ouverte'}
              </Text>
            </View>
          </View>
        </View>

        {selectedConversationItem.listingTitle && (
          <View style={styles.listingInfo}>
            <Icon name="Star" size={16} color="#2563eb" />
            <Text style={styles.listingTitle}>{selectedConversationItem.listingTitle}</Text>
          </View>
        )}

        <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
          {isLoadingMessages && <Text style={styles.loadingText}>Chargement des messages…</Text>}
          {!isLoadingMessages && messagesError && (
            <Text style={styles.errorText}>{messagesError}</Text>
          )}
          {!isLoadingMessages && !messagesError && uiMessages.length === 0 && (
            <Text style={styles.loadingText}>Aucun message pour le moment.</Text>
          )}
          {uiMessages.map((message) => (
            <View
              key={message.id}
              style={[styles.messageWrapper, message.isOwn && styles.ownMessageWrapper]}
            >
              <View
                style={[
                  styles.messageBubble,
                  message.isOwn ? styles.ownMessage : styles.otherMessage,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.isOwn ? styles.ownMessageText : styles.otherMessageText,
                  ]}
                >
                  {message.text}
                </Text>
                <View style={[styles.messageFooter, message.isOwn && styles.ownMessageFooter]}>
                  <Text
                    style={[
                      styles.messageTime,
                      message.isOwn ? styles.ownMessageTime : styles.otherMessageTime,
                    ]}
                  >
                    {message.timestamp}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

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
            style={[
              styles.sendButton,
              (isSendingMessage || !newMessage.trim()) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={isSendingMessage || !newMessage.trim()}
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
        showBackButton={Boolean(onBack)}
        onBack={onBack}
      />

      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Icon
            name="Search"
            size={16}
            color={theme.colors.mutedForeground}
            style={styles.searchIcon}
          />
          <Input
            placeholder="Rechercher une conversation..."
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView style={styles.conversationsList} showsVerticalScrollIndicator={false}>
        {isLoadingDiscussions && (
          <Text style={styles.loadingText}>Chargement des conversations…</Text>
        )}
        {!isLoadingDiscussions && discussionsError && (
          <Text style={styles.errorText}>{discussionsError}</Text>
        )}
        {!isLoadingDiscussions &&
          !discussionsError &&
          filteredConversations.length === 0 && (
            <View style={styles.emptyState}>
              <Icon name="Search" size={64} color={theme.colors.mutedForeground} />
              <Text style={styles.emptyTitle}>Aucune conversation</Text>
              <Text style={styles.emptyDescription}>
                {searchQuery
                  ? 'Aucun résultat pour votre recherche'
                  : 'Vos conversations apparaîtront ici'}
              </Text>
            </View>
          )}

        {!isLoadingDiscussions && !discussionsError && filteredConversations.length > 0 && (
          <View style={styles.conversationsContainer}>
            {filteredConversations.map((conversation) => (
              <TouchableOpacity
                key={conversation.id}
                style={styles.conversationItem}
                onPress={() => handleSelectConversation(conversation.id)}
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
                        <Badge style={styles.unreadBadge}>{conversation.unreadCount}</Badge>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
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
  loadingText: {
    textAlign: 'center',
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.sm,
    marginVertical: theme.spacing.lg,
  },
  errorText: {
    textAlign: 'center',
    color: theme.colors.destructive,
    fontSize: theme.fontSize.sm,
    marginVertical: theme.spacing.lg,
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
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
