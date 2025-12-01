import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { theme } from '../../styles/theme';
import { useApplicationsApi } from '../../hooks/api/useApplicationsApi';
import { useAnnouncementsApi } from '../../hooks/api/useAnnouncementsApi';
import { useUserApi } from '../../hooks/api/useUserApi';
import { useAuth } from '../../contexts/AuthContext';
import { ApplicationResponseDto, AnnouncementResponseDto, PublicUserDto } from '../../types/api';

interface MyApplicationsPanelProps {
  visible: boolean;
  onClose: () => void;
}

export function MyApplicationsPanel({ visible, onClose }: MyApplicationsPanelProps) {
  const [applications, setApplications] = useState<Array<ApplicationResponseDto & { 
    announcement?: AnnouncementResponseDto; 
    owner?: PublicUserDto;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { listApplications } = useApplicationsApi();
  const { getAnnouncementById } = useAnnouncementsApi();
  const { getUserByUsername } = useUserApi();
  const { user } = useAuth();

  const loadMyApplications = async () => {
    if (!user?.username) {
      console.warn('MyApplicationsPanel: user username is missing');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Loading applications for guardian:', user.username);
      const apps = await listApplications({ guardianUsername: user.username });
      
      console.log('Applications received:', apps);
      console.log('Applications type:', typeof apps);
      console.log('Applications is array:', Array.isArray(apps));
      console.log('Applications length:', apps?.length);

      // Handle null/undefined or empty array
      if (!apps) {
        console.warn('Applications is null or undefined');
        setApplications([]);
        return;
      }

      if (apps.length === 0) {
        console.log('No applications found');
        setApplications([]);
        return;
      }

      // Enrich applications with announcement and owner info
      console.log('Enriching applications...');
      const enrichedApps = await Promise.all(
        apps.map(async (app) => {
          try {
            let announcement: AnnouncementResponseDto | undefined;
            let owner: PublicUserDto | undefined;

            // Fetch announcement details
            if (app.announcementId) {
              announcement = await getAnnouncementById(app.announcementId);
              
              // Fetch owner info if available
              if (announcement?.ownerUsername) {
                try {
                  owner = await getUserByUsername(announcement.ownerUsername);
                } catch (error) {
                  console.error(`Error loading owner info for ${announcement.ownerUsername}:`, error);
                }
              }
            }

            return {
              ...app,
              announcement,
              owner,
            };
          } catch (error) {
            console.error(`Error loading announcement info for ${app.announcementId}:`, error);
            return app;
          }
        })
      );
      
      // Sort by creation date (newest first)
      enrichedApps.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      
      console.log('Enriched applications:', enrichedApps);
      console.log('Setting applications state with', enrichedApps.length, 'items');
      setApplications(enrichedApps);
    } catch (error) {
      console.error('Error loading my applications:', error);
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (visible && user?.username) {
      loadMyApplications();
    } else if (!visible) {
      // Reset applications when modal is closed
      setApplications([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, user?.username]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return <Badge variant="outline" style={styles.sentBadge}>En attente</Badge>;
      case 'ACCEPTED':
        return <Badge variant="outline" style={styles.acceptedBadge}>Acceptée</Badge>;
      case 'REFUSED':
        return <Badge variant="outline" style={styles.refusedBadge}>Refusée</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDisplayName = (owner?: PublicUserDto, announcement?: AnnouncementResponseDto) => {
    if (owner) {
      const fullName = `${owner.firstName ?? ''} ${owner.lastName ?? ''}`.trim();
      return fullName || owner.username || 'Propriétaire';
    }
    return announcement?.ownerUsername || 'Propriétaire';
  };

  // Group applications by status
  const sentApplications = applications.filter(app => app.status === 'SENT');
  const acceptedApplications = applications.filter(app => app.status === 'ACCEPTED');
  const refusedApplications = applications.filter(app => app.status === 'REFUSED');
  
  // Debug logs
  console.log('MyApplicationsPanel - Total applications in state:', applications.length);
  console.log('MyApplicationsPanel - Sent applications:', sentApplications.length);
  console.log('MyApplicationsPanel - Accepted applications:', acceptedApplications.length);
  console.log('MyApplicationsPanel - Refused applications:', refusedApplications.length);
  console.log('MyApplicationsPanel - Applications statuses:', applications.map(app => ({ id: app.id, status: app.status })));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Mes candidatures</Text>
              <Text style={styles.subtitle}>{applications.length} candidature{applications.length > 1 ? 's' : ''}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={theme.colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Chargement de vos candidatures...</Text>
              </View>
            ) : applications.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="Document" size={64} color={theme.colors.mutedForeground} />
                <Text style={styles.emptyTitle}>Aucune candidature</Text>
                <Text style={styles.emptyDescription}>
                  Vous n'avez pas encore postulé à une annonce.
                </Text>
              </View>
            ) : (
              <View style={styles.applicationsList}>
                {/* Pending applications */}
                {sentApplications.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>En attente ({sentApplications.length})</Text>
                    {sentApplications.map((app) => (
                      <ApplicationCard key={app.id} application={app} />
                    ))}
                  </>
                )}

                {/* Accepted applications */}
                {acceptedApplications.length > 0 && (
                  <>
                    {sentApplications.length > 0 && <View style={styles.divider} />}
                    <Text style={styles.sectionTitle}>Acceptées ({acceptedApplications.length})</Text>
                    {acceptedApplications.map((app) => (
                      <ApplicationCard key={app.id} application={app} />
                    ))}
                  </>
                )}

                {/* Refused applications */}
                {refusedApplications.length > 0 && (
                  <>
                    {(sentApplications.length > 0 || acceptedApplications.length > 0) && (
                      <View style={styles.divider} />
                    )}
                    <Text style={styles.sectionTitle}>Refusées ({refusedApplications.length})</Text>
                    {refusedApplications.map((app) => (
                      <ApplicationCard key={app.id} application={app} />
                    ))}
                  </>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

interface ApplicationCardProps {
  application: ApplicationResponseDto & { 
    announcement?: AnnouncementResponseDto; 
    owner?: PublicUserDto;
  };
}

function ApplicationCard({ application }: ApplicationCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return <Badge variant="outline" style={styles.sentBadge}>En attente</Badge>;
      case 'ACCEPTED':
        return <Badge variant="outline" style={styles.acceptedBadge}>Acceptée</Badge>;
      case 'REFUSED':
        return <Badge variant="outline" style={styles.refusedBadge}>Refusée</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDisplayName = (owner?: PublicUserDto, announcement?: AnnouncementResponseDto) => {
    if (owner) {
      const fullName = `${owner.firstName ?? ''} ${owner.lastName ?? ''}`.trim();
      return fullName || owner.username || 'Propriétaire';
    }
    return announcement?.ownerUsername || 'Propriétaire';
  };

  return (
    <Card style={styles.applicationCard}>
      <CardContent>
        <View style={styles.cardHeader}>
          <View style={styles.announcementInfo}>
            <Text style={styles.announcementTitle}>
              {application.announcement?.title || `Annonce #${application.announcementId}`}
            </Text>
            {application.announcement?.location && (
              <View style={styles.locationRow}>
                <Icon name="location" size={12} color={theme.colors.mutedForeground} />
                <Text style={styles.locationText}>{application.announcement.location}</Text>
              </View>
            )}
          </View>
          {getStatusBadge(application.status)}
        </View>

        <View style={styles.ownerInfo}>
          <View style={styles.ownerRow}>
            {application.owner?.profilePhoto ? (
              <ImageWithFallback
                source={{ uri: application.owner.profilePhoto }}
                style={styles.ownerAvatar}
                fallbackIcon="User"
              />
            ) : (
              <View style={styles.ownerAvatarPlaceholder}>
                <Icon name="User" size={16} color={theme.colors.mutedForeground} />
              </View>
            )}
            <Text style={styles.ownerText}>
              Propriétaire : {getDisplayName(application.owner, application.announcement)}
            </Text>
          </View>
        </View>

        {application.message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Votre message :</Text>
            <Text style={styles.messageText}>{application.message}</Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            Candidature du {formatDate(application.createdAt)}
          </Text>
        </View>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    height: '85%',
    maxHeight: '90%',
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  loadingContainer: {
    paddingVertical: theme.spacing['4xl'],
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  emptyState: {
    paddingVertical: theme.spacing['4xl'],
    alignItems: 'center',
    gap: theme.spacing.md,
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
    paddingHorizontal: theme.spacing.xl,
  },
  applicationsList: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.lg,
  },
  applicationCard: {
    marginBottom: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  announcementInfo: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  locationText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  ownerInfo: {
    marginBottom: theme.spacing.md,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  ownerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  ownerAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  sentBadge: {
    borderColor: '#fbbf24',
    backgroundColor: '#fef3c7',
  },
  acceptedBadge: {
    borderColor: '#22c55e',
    backgroundColor: '#d1fae5',
  },
  refusedBadge: {
    borderColor: '#ef4444',
    backgroundColor: '#fee2e2',
  },
  messageContainer: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.muted + '30',
    borderRadius: theme.borderRadius.md,
  },
  messageLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  messageText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
});

