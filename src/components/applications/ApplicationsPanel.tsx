import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { theme } from '../../styles/theme';
import { useApplicationsApi } from '../../hooks/api/useApplicationsApi';
import { useUserApi } from '../../hooks/api/useUserApi';
import { useRatingsApi } from '../../hooks/api/useRatingsApi';
import { ApplicationResponseDto, PublicUserDto } from '../../types/api';

interface ApplicationsPanelProps {
  visible: boolean;
  announcementId: number;
  announcementTitle: string;
  onClose: () => void;
  onApplicationUpdated?: () => void;
}

export function ApplicationsPanel({
  visible,
  announcementId,
  announcementTitle,
  onClose,
  onApplicationUpdated,
}: ApplicationsPanelProps) {
  const [applications, setApplications] = useState<Array<ApplicationResponseDto & { guardian?: PublicUserDto; rating?: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingApplicationId, setUpdatingApplicationId] = useState<number | null>(null);

  const { listApplications, updateApplicationStatus } = useApplicationsApi();
  const { getUserByUsername } = useUserApi();
  const { getAverageRating } = useRatingsApi();

  useEffect(() => {
    if (visible && announcementId) {
      loadApplications();
    }
  }, [visible, announcementId]);

  const loadApplications = async () => {
    try {
      setIsLoading(true);
      const apps = await listApplications({ announcementId });
      
      if (apps && apps.length > 0) {
        // Enrich applications with guardian info and ratings
        const enrichedApps = await Promise.all(
          apps.map(async (app) => {
            try {
              const guardian = await getUserByUsername(app.guardianUsername);
              const rating = await getAverageRating(app.guardianUsername);
              return {
                ...app,
                guardian,
                rating: rating !== null && rating !== undefined ? Number(rating.toFixed(1)) : undefined,
              };
            } catch (error) {
              console.error(`Error loading guardian info for ${app.guardianUsername}:`, error);
              return app;
            }
          })
        );
        setApplications(enrichedApps);
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      Alert.alert('Erreur', 'Impossible de charger les candidatures.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (applicationId: number, newStatus: 'ACCEPTED' | 'REFUSED') => {
    try {
      setUpdatingApplicationId(applicationId);
      await updateApplicationStatus(applicationId, newStatus);
      
      // Reload applications to get updated status
      await loadApplications();
      
      // Notify parent component
      onApplicationUpdated?.();
      
      Alert.alert(
        'Succès',
        newStatus === 'ACCEPTED' 
          ? 'Candidature acceptée avec succès.' 
          : 'Candidature refusée.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error updating application status:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut de la candidature.');
    } finally {
      setUpdatingApplicationId(null);
    }
  };


  const sentApplications = applications.filter(app => app.status === 'SENT');
  const otherApplications = applications.filter(app => app.status !== 'SENT');

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
              <Text style={styles.title}>Candidatures</Text>
              <Text style={styles.subtitle}>{announcementTitle}</Text>
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
                <Text style={styles.loadingText}>Chargement des candidatures...</Text>
              </View>
            ) : applications.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="Person" size={64} color={theme.colors.mutedForeground} />
                <Text style={styles.emptyTitle}>Aucune candidature</Text>
                <Text style={styles.emptyDescription}>
                  Aucune candidature n'a été reçue pour cette annonce pour le moment.
                </Text>
              </View>
            ) : (
              <View style={styles.applicationsList}>
                {/* Pending applications first */}
                {sentApplications.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>En attente ({sentApplications.length})</Text>
                    {sentApplications.map((app) => (
                      <ApplicationCard
                        key={app.id}
                        application={app}
                        onAccept={() => handleUpdateStatus(app.id, 'ACCEPTED')}
                        onRefuse={() => handleUpdateStatus(app.id, 'REFUSED')}
                        isUpdating={updatingApplicationId === app.id}
                      />
                    ))}
                  </>
                )}

                {/* Other applications */}
                {otherApplications.length > 0 && (
                  <>
                    {sentApplications.length > 0 && (
                      <View style={styles.divider} />
                    )}
                    <Text style={styles.sectionTitle}>Autres ({otherApplications.length})</Text>
                    {otherApplications.map((app) => (
                      <ApplicationCard
                        key={app.id}
                        application={app}
                        onAccept={() => handleUpdateStatus(app.id, 'ACCEPTED')}
                        onRefuse={() => handleUpdateStatus(app.id, 'REFUSED')}
                        isUpdating={updatingApplicationId === app.id}
                        readOnly={app.status !== 'SENT'}
                      />
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
  application: ApplicationResponseDto & { guardian?: PublicUserDto; rating?: number };
  onAccept: () => void;
  onRefuse: () => void;
  isUpdating: boolean;
  readOnly?: boolean;
}

function ApplicationCard({ application, onAccept, onRefuse, isUpdating, readOnly = false }: ApplicationCardProps) {
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

  const getDisplayName = (guardian?: PublicUserDto) => {
    if (!guardian) return application.guardianUsername;
    const fullName = `${guardian.firstName ?? ''} ${guardian.lastName ?? ''}`.trim();
    return fullName || guardian.username || application.guardianUsername;
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

  return (
    <Card style={styles.applicationCard}>
      <CardContent>
        <View style={styles.cardHeader}>
          <View style={styles.guardianInfo}>
            {application.guardian?.profilePhoto ? (
              <ImageWithFallback
                source={{ uri: application.guardian.profilePhoto }}
                style={styles.avatar}
                fallbackIcon="User"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Icon name="User" size={24} color={theme.colors.mutedForeground} />
              </View>
            )}
            <View style={styles.guardianDetails}>
              <Text style={styles.guardianName}>{getDisplayName(application.guardian)}</Text>
              <View style={styles.guardianMeta}>
                {application.rating !== undefined && (
                  <View style={styles.ratingRow}>
                    <Icon name="Star" size={12} color="#fbbf24" />
                    <Text style={styles.ratingText}>{application.rating}</Text>
                  </View>
                )}
                {application.guardian?.location && (
                  <>
                    {application.rating !== undefined && <Text style={styles.metaSeparator}>•</Text>}
                    <Text style={styles.metaText}>{application.guardian.location}</Text>
                  </>
                )}
              </View>
            </View>
          </View>
          {getStatusBadge(application.status)}
        </View>

        {application.message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Message :</Text>
            <Text style={styles.messageText}>{application.message}</Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            Candidature du {formatDate(application.createdAt)}
          </Text>
          {!readOnly && application.status === 'SENT' && (
            <View style={styles.actionButtons}>
              <Button
                variant="outline"
                size="sm"
                onPress={onRefuse}
                disabled={isUpdating}
                style={styles.refuseButton}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color={theme.colors.foreground} />
                ) : (
                  <>
                    <Icon name="Close" size={14} color={theme.colors.foreground} />
                    <Text style={styles.refuseButtonText}>Refuser</Text>
                  </>
                )}
              </Button>
              <Button
                size="sm"
                onPress={onAccept}
                disabled={isUpdating}
                style={styles.acceptButton}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Icon name="checkmark" size={14} color="#ffffff" />
                    <Text style={styles.acceptButtonText}>Accepter</Text>
                  </>
                )}
              </Button>
            </View>
          )}
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
  guardianInfo: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guardianDetails: {
    flex: 1,
  },
  guardianName: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  guardianMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  ratingText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  metaSeparator: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  metaText: {
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
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  refuseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  refuseButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  acceptButtonText: {
    fontSize: theme.fontSize.sm,
    color: '#ffffff',
  },
});

