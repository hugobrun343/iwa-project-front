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

interface ReviewsPageProps {
  onBack: () => void;
}

export function ReviewsPage({ onBack }: ReviewsPageProps) {
  const [activeTab, setActiveTab] = useState("received");

  const reviewsData = {
    received: [
      {
        id: "1",
        reviewer: "Marie Dubois",
        reviewerAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b65c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        rating: 5,
        date: "12 Jan 2024",
        listing: "Appartement moderne avec vue - 2 chats adorables",
        comment: "Sophie a pris un soin exceptionnel de mes chats ! Ils étaient très heureux et détendus à mon retour. Elle a suivi toutes mes instructions à la lettre et m'a envoyé des photos régulièrement. Je la recommande vivement !",
        verified: true
      },
      {
        id: "2",
        reviewer: "Thomas Martin",
        reviewerAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        rating: 5,
        date: "25 Déc 2023",
        listing: "Golden Retriever énergique - Maison avec jardin",
        comment: "Max était en excellentes mains avec Sophie. Elle a parfaitement géré son énergie et ses besoins de sorties. Merci Sophie !",
        verified: true
      },
      {
        id: "3",
        reviewer: "Camille Leroy",
        reviewerAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        rating: 4,
        date: "10 Nov 2023",
        listing: "Jungle urbaine - Arrosage intensif requis",
        comment: "Bon travail sur les plantes, la plupart étaient en bonne santé à mon retour. Quelques petites améliorations possibles sur l'arrosage des plantes tropicales.",
        verified: true
      }
    ],
    given: [
      {
        id: "4",
        reviewee: "Laura Silva",
        revieweeAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        rating: 5,
        date: "15 Jan 2024",
        listing: "Mon appartement avec plantes",
        comment: "Laura était une propriétaire parfaite ! Très accueillante, instructions claires, appartement impeccable. Les plantes et poissons étaient en excellent état.",
        myRole: "gardienne"
      },
      {
        id: "5",
        reviewee: "Pierre Bonnet",
        revieweeAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        rating: 4,
        date: "8 Déc 2023",
        listing: "Garde de Minou",
        comment: "Propriétaire sympa, chat adorable ! Petit souci avec les clés au début mais tout s'est bien passé ensuite.",
        myRole: "gardienne"
      }
    ]
  };

  const ReceivedReviewCard = ({ review }: { review: any }) => (
    <Card style={styles.card}>
      <CardContent style={styles.cardContent}>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewerInfo}>
            <ImageWithFallback
              src={review.reviewerAvatar}
              style={styles.avatar}
              alt={review.reviewer}
            />
            <View style={styles.reviewerDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.reviewerName}>{review.reviewer}</Text>
                {review.verified && (
                  <Badge variant="outline" style={styles.verifiedBadge}>
                    <Icon name="checkmark-circle" size={12} color="#22c55e" />
                    <Text style={styles.verifiedText}>Vérifié</Text>
                  </Badge>
                )}
              </View>
              <Text style={styles.reviewDate}>{review.date}</Text>
            </View>
          </View>
          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {[...Array(5)].map((_, i) => (
                <Icon 
                  key={i} 
                  name="star" 
                  size={16} 
                  color={i < review.rating ? "#fbbf24" : "#d1d5db"}
                />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.listingInfo}>
          <Text style={styles.listingTitle}>{review.listing}</Text>
        </View>

        <Text style={styles.reviewComment}>{review.comment}</Text>

        <View style={styles.reviewActions}>
          <Button variant="ghost" size="sm" style={styles.actionButton}>
            <Icon name="chatbubble" size={16} color={theme.colors.primary} />
            <Text style={styles.actionText}>Répondre</Text>
          </Button>
          <Button variant="ghost" size="sm" style={styles.actionButton}>
            <Icon name="share" size={16} color={theme.colors.primary} />
            <Text style={styles.actionText}>Partager</Text>
          </Button>
        </View>
      </CardContent>
    </Card>
  );

  const GivenReviewCard = ({ review }: { review: any }) => (
    <Card style={styles.card}>
      <CardContent style={styles.cardContent}>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewerInfo}>
            <ImageWithFallback
              src={review.revieweeAvatar}
              style={styles.avatar}
              alt={review.reviewee}
            />
            <View style={styles.reviewerDetails}>
              <Text style={styles.reviewerName}>{review.reviewee}</Text>
              <Text style={styles.reviewDate}>{review.date}</Text>
            </View>
          </View>
          <View style={styles.ratingContainer}>
            <Badge variant="outline" style={styles.roleBadge}>
              <Text style={styles.roleText}>Vous étiez {review.myRole}</Text>
            </Badge>
          </View>
        </View>

        <View style={styles.listingInfo}>
          <Text style={styles.listingTitle}>{review.listing}</Text>
        </View>

        <View style={styles.givenRating}>
          <Text style={styles.ratingLabel}>Votre évaluation :</Text>
          <View style={styles.starsContainer}>
            {[...Array(5)].map((_, i) => (
              <Icon 
                key={i} 
                name="star" 
                size={16} 
                color={i < review.rating ? "#fbbf24" : "#d1d5db"}
              />
            ))}
          </View>
        </View>

        <Text style={styles.reviewComment}>{review.comment}</Text>

        <View style={styles.reviewActions}>
          <Button variant="ghost" size="sm" style={styles.actionButton}>
            <Icon name="create" size={16} color={theme.colors.primary} />
            <Text style={styles.actionText}>Modifier</Text>
          </Button>
        </View>
      </CardContent>
    </Card>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "received":
        return reviewsData.received.length > 0 ? (
          reviewsData.received.map((review) => (
            <ReceivedReviewCard key={review.id} review={review} />
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <CardContent style={styles.emptyContent}>
              <Icon name="star" size={48} color={theme.colors.mutedForeground} />
              <Text style={styles.emptyTitle}>Aucun avis reçu</Text>
              <Text style={styles.emptyText}>
                Les avis de vos clients apparaîtront ici après vos premières gardes.
              </Text>
            </CardContent>
          </Card>
        );

      case "given":
        return reviewsData.given.length > 0 ? (
          reviewsData.given.map((review) => (
            <GivenReviewCard key={review.id} review={review} />
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <CardContent style={styles.emptyContent}>
              <Icon name="create" size={48} color={theme.colors.mutedForeground} />
              <Text style={styles.emptyTitle}>Aucun avis donné</Text>
              <Text style={styles.emptyText}>
                Vos évaluations des propriétaires apparaîtront ici.
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
        title="Mes avis"
        showBackButton={true}
        onBack={onBack}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Statistiques rapides */}
        <Card style={styles.statsCard}>
          <CardContent style={styles.statsContent}>
            <Text style={styles.statsTitle}>Votre réputation</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {(reviewsData.received.reduce((sum, review) => sum + review.rating, 0) / reviewsData.received.length).toFixed(1)}
                </Text>
                <Text style={styles.statLabel}>Note moyenne</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{reviewsData.received.length}</Text>
                <Text style={styles.statLabel}>Avis reçus</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{reviewsData.given.length}</Text>
                <Text style={styles.statLabel}>Avis donnés</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabsList}>
            {[
              { id: "received", label: "Reçus" },
              { id: "given", label: "Donnés" }
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  activeTab === tab.id && styles.activeTab
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text style={[
                  styles.tabText,
                  activeTab === tab.id && styles.activeTabText
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Content */}
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
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
  },
  scrollView: {
    flex: 1,
  },
  statsCard: {
    margin: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  statsContent: {
    padding: theme.spacing.lg,
  },
  statsTitle: {
    fontSize: theme.fontSize.md,
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
  statNumber: {
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
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  tabsList: {
    flexDirection: 'row',
    backgroundColor: theme.colors.muted,
    borderRadius: theme.borderRadius.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  activeTab: {
    backgroundColor: theme.colors.background,
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
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 120, // Space for bottom nav
  },
  card: {
    marginBottom: theme.spacing.lg,
  },
  cardContent: {
    padding: theme.spacing.lg,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  reviewerDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  reviewerName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
  },
  reviewDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  verifiedText: {
    fontSize: theme.fontSize.xs,
    color: '#22c55e',
  },
  roleBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.muted,
  },
  roleText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  ratingContainer: {
    alignItems: 'flex-end',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  listingInfo: {
    marginBottom: theme.spacing.md,
  },
  listingTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primary,
  },
  givenRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  ratingLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  reviewComment: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  actionText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
  },
  emptyCard: {
    padding: theme.spacing.xl,
  },
  emptyContent: {
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
});