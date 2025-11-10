import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { PageHeader } from '../../components/ui/PageHeader';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';
import { theme } from '../../styles/theme';

interface GuardHistoryPageProps {
  onBack: () => void;
}

export function GuardHistoryPage({ onBack }: GuardHistoryPageProps) {
  const [activeTab, setActiveTab] = useState("current");

  const guardHistory = {
    completed: [
      {
        id: "1",
        title: "Appartement moderne avec vue - 2 chats adorables",
        location: "Paris 11ème",
        period: "5-12 Jan 2024",
        duration: "7 jours",
        owner: "Marie Dubois",
        ownerAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b65c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        payment: 245,
        rating: 5,
        review: "Sophie a pris un soin exceptionnel de mes chats ! Ils étaient très heureux.",
        animals: ["2 chats"],
        plants: ["Plantes d'intérieur"],
        photos: 12
      },
      {
        id: "2",
        title: "Golden Retriever énergique - Maison avec jardin",
        location: "Vincennes",
        period: "20-25 Déc 2023",
        duration: "5 jours",
        owner: "Thomas Martin",
        ownerAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        payment: 225,
        rating: 5,
        review: "Max était en excellentes mains. Merci Sophie !",
        animals: ["1 chien"],
        plants: [],
        photos: 8
      },
      {
        id: "3",
        title: "Jungle urbaine - Arrosage intensif requis",
        location: "Belleville",
        period: "3-10 Nov 2023",
        duration: "7 jours",
        owner: "Camille Leroy",
        ownerAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        payment: 140,
        rating: 4,
        review: "Bon travail sur les plantes, quelques petites améliorations possibles.",
        animals: [],
        plants: ["15 plantes tropicales"],
        photos: 6
      }
    ],
    upcoming: [
      {
        id: "4",
        title: "Garde de Minou pendant les vacances",
        location: "Levallois-Perret",
        period: "15-22 Fév 2024",
        duration: "7 jours",
        owner: "Pierre Bonnet",
        ownerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        payment: 175,
        animals: ["1 chat"],
        plants: ["Petites plantes"],
        status: "confirmed"
      }
    ],
    current: [
      {
        id: "5",
        title: "Appartement avec plantes et poissons",
        location: "République",
        period: "1-7 Fév 2024",
        duration: "7 jours",
        owner: "Laura Silva",
        ownerAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        payment: 210,
        animals: ["Poissons"],
        plants: ["Plantes vertes"],
        status: "in_progress",
        daysLeft: 4
      }
    ]
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <View style={[styles.badge, styles.completedBadge]}>
            <Text style={styles.completedBadgeText}>Terminée</Text>
          </View>
        );
      case "in_progress":
        return (
          <View style={[styles.badge, styles.inProgressBadge]}>
            <Text style={styles.inProgressBadgeText}>En cours</Text>
          </View>
        );
      case "confirmed":
        return (
          <View style={[styles.badge, styles.confirmedBadge]}>
            <Text style={styles.confirmedBadgeText}>Confirmée</Text>
          </View>
        );
      default:
        return null;
    }
  };

  const CompletedGuardCard = ({ guard }: { guard: any }) => (
    <Card style={styles.guardCard}>
      <CardContent>
        <View style={styles.cardHeader}>
          <View style={styles.ownerInfo}>
            <View style={styles.avatar}>
              <ImageWithFallback 
                src={guard.ownerAvatar} 
                style={styles.avatarImage}
                alt={guard.owner}
              />
            </View>
            <View style={styles.guardInfo}>
              <Text style={styles.guardTitle}>{guard.title}</Text>
              <View style={styles.locationRow}>
                <Icon name="location" size={12} color={theme.colors.mutedForeground} />
                <Text style={styles.locationText}>{guard.location}</Text>
              </View>
            </View>
          </View>
          {getStatusBadge("completed")}
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Période :</Text>
            <Text style={styles.detailValue}>{guard.period}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Durée :</Text>
            <Text style={styles.detailValue}>{guard.duration}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Paiement :</Text>
            <Text style={[styles.detailValue, styles.paymentText]}>{guard.payment}€</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Photos :</Text>
            <View style={styles.photosRow}>
              <Icon name="camera" size={12} color={theme.colors.mutedForeground} />
              <Text style={styles.detailValue}>{guard.photos}</Text>
            </View>
          </View>
        </View>

        <View style={styles.tagsRow}>
          {guard.animals.length > 0 && (
            <Badge variant="outline" style={styles.animalBadge}>
              {guard.animals.join(', ')}
            </Badge>
          )}
          {guard.plants.length > 0 && (
            <Badge variant="outline" style={styles.plantBadge}>
              {guard.plants.join(', ')}
            </Badge>
          )}
        </View>

        <View style={styles.ratingRow}>
          <View style={styles.starsRow}>
            {[...Array(5)].map((_, i) => (
              <Icon 
                key={i} 
                name="star" 
                size={16} 
                color={i < guard.rating ? "#fbbf24" : "#d1d5db"} 
              />
            ))}
            <Text style={styles.ownerText}>par {guard.owner}</Text>
          </View>
          <Button variant="ghost" size="sm" style={styles.contactButton}>
            <Icon name="chatbubble" size={16} color={theme.colors.foreground} style={styles.buttonIcon} />
            <Text style={styles.contactButtonText}>Contacter</Text>
          </Button>
        </View>

        {guard.review && (
          <View style={styles.reviewContainer}>
            <Text style={styles.reviewText}>"{guard.review}"</Text>
          </View>
        )}
      </CardContent>
    </Card>
  );

  const UpcomingGuardCard = ({ guard }: { guard: any }) => (
    <Card style={styles.guardCard}>
      <CardContent>
        <View style={styles.cardHeader}>
          <View style={styles.ownerInfo}>
            <View style={styles.avatar}>
              <ImageWithFallback 
                src={guard.ownerAvatar} 
                style={styles.avatarImage}
                alt={guard.owner}
              />
            </View>
            <View style={styles.guardInfo}>
              <Text style={styles.guardTitle}>{guard.title}</Text>
              <View style={styles.locationRow}>
                <Icon name="location" size={12} color={theme.colors.mutedForeground} />
                <Text style={styles.locationText}>{guard.location}</Text>
              </View>
            </View>
          </View>
          {getStatusBadge(guard.status)}
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Période :</Text>
            <Text style={styles.detailValue}>{guard.period}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Durée :</Text>
            <Text style={styles.detailValue}>{guard.duration}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Paiement :</Text>
            <Text style={[styles.detailValue, styles.paymentText]}>{guard.payment}€</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Propriétaire :</Text>
            <Text style={styles.detailValue}>{guard.owner}</Text>
          </View>
        </View>

        <View style={styles.tagsRow}>
          {guard.animals.length > 0 && (
            <Badge variant="outline" style={styles.animalBadge}>
              {guard.animals.join(', ')}
            </Badge>
          )}
          {guard.plants.length > 0 && (
            <Badge variant="outline" style={styles.plantBadge}>
              {guard.plants.join(', ')}
            </Badge>
          )}
        </View>

        <View style={styles.actionButtons}>
          <Button variant="outline" size="sm" style={styles.detailsButton}>
            <Icon name="calendar" size={16} color={theme.colors.foreground} style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Voir détails</Text>
          </Button>
          <Button variant="ghost" size="sm" style={styles.messageButton}>
            <Icon name="chatbubble" size={16} color={theme.colors.foreground} style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Message</Text>
          </Button>
        </View>
      </CardContent>
    </Card>
  );

  const CurrentGuardCard = ({ guard }: { guard: any }) => (
    <Card style={StyleSheet.flatten([styles.guardCard, styles.currentGuardCard])}>
      <CardContent>
        <View style={styles.cardHeader}>
          <View style={styles.ownerInfo}>
            <View style={styles.avatar}>
              <ImageWithFallback 
                src={guard.ownerAvatar} 
                style={styles.avatarImage}
                alt={guard.owner}
              />
            </View>
            <View style={styles.guardInfo}>
              <Text style={styles.guardTitle}>{guard.title}</Text>
              <View style={styles.locationRow}>
                <Icon name="location" size={12} color={theme.colors.mutedForeground} />
                <Text style={styles.locationText}>{guard.location}</Text>
              </View>
            </View>
          </View>
          {getStatusBadge(guard.status)}
        </View>

        <View style={styles.currentGuardAlert}>
          <View style={styles.alertHeader}>
            <Icon name="time" size={16} color={theme.colors.primary} />
            <Text style={styles.alertTitle}>Garde en cours</Text>
          </View>
          <Text style={styles.alertText}>Plus que {guard.daysLeft} jours restants</Text>
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Période :</Text>
            <Text style={styles.detailValue}>{guard.period}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Paiement :</Text>
            <Text style={[styles.detailValue, styles.paymentText]}>{guard.payment}€</Text>
          </View>
        </View>

        <View style={styles.tagsRow}>
          {guard.animals.length > 0 && (
            <Badge variant="outline" style={styles.animalBadge}>
              {guard.animals.join(', ')}
            </Badge>
          )}
          {guard.plants.length > 0 && (
            <Badge variant="outline" style={styles.plantBadge}>
              {guard.plants.join(', ')}
            </Badge>
          )}
        </View>

        <View style={styles.actionButtons}>
          <Button size="sm" style={styles.addPhotosButton}>
            <Icon name="camera" size={16} color={theme.colors.primaryForeground} style={styles.buttonIcon} />
            <Text style={styles.primaryButtonText}>Ajouter photos</Text>
          </Button>
          <Button variant="outline" size="sm" style={styles.messageButton}>
            <Icon name="chatbubble" size={16} color={theme.colors.foreground} style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Message</Text>
          </Button>
        </View>
      </CardContent>
    </Card>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "current":
        return guardHistory.current.length > 0 ? (
          guardHistory.current.map((guard) => (
            <CurrentGuardCard key={guard.id} guard={guard} />
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <CardContent style={styles.emptyContent}>
              <Icon name="time" size={48} color={theme.colors.mutedForeground} />
              <Text style={styles.emptyTitle}>Aucune garde en cours</Text>
              <Text style={styles.emptyText}>
                Vous n'avez actuellement aucune garde active.
              </Text>
            </CardContent>
          </Card>
        );
      
      case "upcoming":
        return guardHistory.upcoming.length > 0 ? (
          guardHistory.upcoming.map((guard) => (
            <UpcomingGuardCard key={guard.id} guard={guard} />
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <CardContent style={styles.emptyContent}>
              <Icon name="calendar" size={48} color={theme.colors.mutedForeground} />
              <Text style={styles.emptyTitle}>Aucune garde planifiée</Text>
              <Text style={styles.emptyText}>
                Vous n'avez aucune garde prévue pour le moment.
              </Text>
            </CardContent>
          </Card>
        );
      
      case "completed":
        return guardHistory.completed.length > 0 ? (
          guardHistory.completed.map((guard) => (
            <CompletedGuardCard key={guard.id} guard={guard} />
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <CardContent style={styles.emptyContent}>
              <Icon name="checkmark-circle" size={48} color={theme.colors.mutedForeground} />
              <Text style={styles.emptyTitle}>Aucune garde terminée</Text>
              <Text style={styles.emptyText}>
                Votre historique de gardes apparaîtra ici.
              </Text>
            </CardContent>
          </Card>
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <PageHeader
        title="Mes gardes"
        showBackButton={true}
        onBack={onBack}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Statistiques */}
        <Card style={styles.statsCard}>
          <CardContent>
            <Text style={styles.statsTitle}>Vos statistiques</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{guardHistory.completed.length}</Text>
                <Text style={styles.statLabel}>Gardes terminées</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {guardHistory.completed.reduce((sum, guard) => sum + guard.payment, 0)}€
                </Text>
                <Text style={styles.statLabel}>Gains totaux</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {guardHistory.completed.length > 0 
                    ? (guardHistory.completed.reduce((sum, guard) => sum + guard.rating, 0) / guardHistory.completed.length).toFixed(1)
                    : '0'
                  }
                </Text>
                <Text style={styles.statLabel}>Note moyenne</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabsList}>
            {[
              { key: "current", label: "En cours" },
              { key: "upcoming", label: "À venir" },
              { key: "completed", label: "Terminées" }
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {renderTabContent()}
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  statsCard: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  statsTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
  tabsContainer: {
    marginBottom: theme.spacing.xl,
  },
  tabsList: {
    flexDirection: 'row',
    backgroundColor: theme.colors.muted,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
  },
  activeTab: {
    backgroundColor: theme.colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    fontWeight: theme.fontWeight.medium,
  },
  activeTabText: {
    color: theme.colors.foreground,
  },
  tabContent: {
    paddingBottom: 100,
  },
  guardCard: {
    marginBottom: theme.spacing.lg,
  },
  currentGuardCard: {
    borderColor: `${theme.colors.primary}30`,
    backgroundColor: `${theme.colors.primary}05`,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  ownerInfo: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  guardInfo: {
    flex: 1,
  },
  guardTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
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
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
  },
  completedBadge: {
    borderColor: '#dcfce7',
    backgroundColor: '#f0fdf4',
  },
  completedBadgeText: {
    color: '#16a34a',
    fontSize: theme.fontSize.xs,
  },
  inProgressBadge: {
    borderColor: '#dbeafe',
    backgroundColor: '#eff6ff',
  },
  inProgressBadgeText: {
    color: '#2563eb',
    fontSize: theme.fontSize.xs,
  },
  confirmedBadge: {
    borderColor: '#fed7aa',
    backgroundColor: '#fff7ed',
  },
  confirmedBadgeText: {
    color: '#ea580c',
    fontSize: theme.fontSize.xs,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  detailItem: {
    width: '45%',
  },
  detailLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.xs,
  },
  detailValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
  },
  paymentText: {
    fontWeight: theme.fontWeight.medium,
  },
  photosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  animalBadge: {
    borderColor: '#d1d5db',
  },
  plantBadge: {
    borderColor: '#d1d5db',
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  ownerText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginLeft: theme.spacing.sm,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  contactButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
  },
  reviewContainer: {
    backgroundColor: `${theme.colors.muted}30`,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  reviewText: {
    fontSize: theme.fontSize.sm,
    fontStyle: 'italic',
    color: theme.colors.foreground,
  },
  currentGuardAlert: {
    backgroundColor: `${theme.colors.primary}10`,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  alertTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primary,
  },
  alertText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  detailsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  addPhotosButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  buttonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
  },
  primaryButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primaryForeground,
  },
  buttonIcon: {
    marginRight: theme.spacing.xs,
  },
  emptyCard: {
    padding: theme.spacing.xl,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
});
