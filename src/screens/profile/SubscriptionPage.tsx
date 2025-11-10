import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { theme } from '../../styles/theme';

interface SubscriptionPageProps {
  onBack: () => void;
}

export function SubscriptionPage({ onBack }: SubscriptionPageProps) {
  const plans = [
    {
      id: "free",
      name: "Gratuit",
      price: 0,
      period: "mois",
      current: true,
      features: [
        "3 annonces par mois",
        "Messages limités",
        "Support par email",
        "Profil de base"
      ],
      limitations: [
        "Pas de photos multiples",
        "Pas de priorité dans les résultats",
        "Pas de badges premium"
      ]
    },
    {
      id: "premium",
      name: "Premium",
      price: 9.99,
      period: "mois",
      current: false,
      popular: true,
      features: [
        "Annonces illimitées",
        "Messages illimités",
        "Support prioritaire 24/7",
        "Profil vérifié",
        "Photos multiples",
        "Badge premium",
        "Priorité dans les résultats",
        "Statistiques avancées",
        "Notifications push",
        "Calendrier intégré"
      ],
      limitations: []
    },
    {
      id: "pro",
      name: "Professionnel",
      price: 19.99,
      period: "mois",
      current: false,
      features: [
        "Tout Premium +",
        "Gestion multi-propriétés",
        "API d'intégration",
        "Rapports détaillés",
        "Manager dédié",
        "Formation personnalisée",
        "Outils marketing avancés"
      ],
      limitations: []
    }
  ];

  const testimonials = [
    {
      id: "1",
      name: "Marie Dubois",
      role: "Propriétaire",
      comment: "Depuis que j'ai Premium, je trouve des gardiens beaucoup plus facilement !",
      rating: 5
    },
    {
      id: "2", 
      name: "Sophie Martin",
      role: "Gardienne",
      comment: "Le badge vérifié m'a vraiment aidée à gagner la confiance des propriétaires.",
      rating: 5
    }
  ];

  const PlanCard = ({ plan }: { plan: any }) => (
    <Card style={StyleSheet.flatten([
      styles.planCard,
      plan.current && styles.currentPlan,
      plan.popular && styles.popularPlan
    ])}>
      <CardContent style={styles.planContent}>
        {plan.popular && (
          <Badge style={styles.popularBadge}>
            <Text style={styles.popularText}>Le plus populaire</Text>
          </Badge>
        )}
        
        <View style={styles.planHeader}>
          <Text style={styles.planName}>{plan.name}</Text>
          {plan.current && (
            <Badge variant="outline" style={styles.currentBadge}>
              <Text style={styles.currentText}>Actuel</Text>
            </Badge>
          )}
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>
            {plan.price === 0 ? "Gratuit" : `${plan.price}€`}
          </Text>
          {plan.price > 0 && (
            <Text style={styles.period}>/{plan.period}</Text>
          )}
        </View>

        <View style={styles.featuresContainer}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.feature}>
              <Icon name="checkmark" size={16} color="#22c55e" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
          
          {plan.limitations.map((limitation, index) => (
            <View key={index} style={styles.limitation}>
              <Icon name="close" size={16} color="#ef4444" />
              <Text style={styles.limitationText}>{limitation}</Text>
            </View>
          ))}
        </View>

        <Button 
          style={StyleSheet.flatten([
            styles.planButton,
            plan.current && styles.currentPlanButton,
            plan.popular && styles.popularPlanButton
          ])}
          variant={plan.current ? "outline" : "default"}
        >
          <Text style={StyleSheet.flatten([
            styles.planButtonText,
            plan.current && styles.currentPlanButtonText
          ])}>
            {plan.current ? "Plan actuel" : `Passer à ${plan.name}`}
          </Text>
        </Button>
      </CardContent>
    </Card>
  );

  const TestimonialCard = ({ testimonial }: { testimonial: any }) => (
    <Card style={styles.testimonialCard}>
      <CardContent style={styles.testimonialContent}>
        <View style={styles.testimonialHeader}>
          <View>
            <Text style={styles.testimonialName}>{testimonial.name}</Text>
            <Text style={styles.testimonialRole}>{testimonial.role}</Text>
          </View>
          <View style={styles.testimonialRating}>
            {[...Array(testimonial.rating)].map((_, i) => (
              <Icon key={i} name="star" size={14} color="#fbbf24" />
            ))}
          </View>
        </View>
        <Text style={styles.testimonialComment}>"{testimonial.comment}"</Text>
      </CardContent>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Abonnement</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Premium Features Highlight */}
        <Card style={styles.highlightCard}>
          <CardContent style={styles.highlightContent}>
            <Icon name="star" size={32} color={theme.colors.primary} />
            <Text style={styles.highlightTitle}>Passez au Premium</Text>
            <Text style={styles.highlightText}>
              Débloquez toutes les fonctionnalités et trouvez des gardes plus facilement
            </Text>
            <View style={styles.highlightFeatures}>
              <View style={styles.highlightFeature}>
                <Icon name="checkmark-circle" size={20} color="#22c55e" />
                <Text style={styles.highlightFeatureText}>Annonces illimitées</Text>
              </View>
              <View style={styles.highlightFeature}>
                <Icon name="checkmark-circle" size={20} color="#22c55e" />
                <Text style={styles.highlightFeatureText}>Badge vérifié</Text>
              </View>
              <View style={styles.highlightFeature}>
                <Icon name="checkmark-circle" size={20} color="#22c55e" />
                <Text style={styles.highlightFeatureText}>Support prioritaire</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Plans */}
        <View style={styles.plansContainer}>
          <Text style={styles.sectionTitle}>Choisissez votre plan</Text>
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </View>

        {/* Testimonials */}
        <View style={styles.testimonialsContainer}>
          <Text style={styles.sectionTitle}>Ce que disent nos utilisateurs</Text>
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </View>

        {/* FAQ */}
        <Card style={styles.faqCard}>
          <CardContent style={styles.faqContent}>
            <Text style={styles.sectionTitle}>Questions fréquentes</Text>
            
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>Puis-je annuler à tout moment ?</Text>
              <Text style={styles.faqAnswer}>
                Oui, vous pouvez annuler votre abonnement à tout moment depuis cette page.
              </Text>
            </View>
            
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>Que se passe-t-il si j'annule ?</Text>
              <Text style={styles.faqAnswer}>
                Vous gardez l'accès Premium jusqu'à la fin de votre période de facturation.
              </Text>
            </View>
            
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>Y a-t-il une période d'essai ?</Text>
              <Text style={styles.faqAnswer}>
                Oui, nous offrons 7 jours d'essai gratuit pour le plan Premium.
              </Text>
            </View>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card style={styles.ctaCard}>
          <CardContent style={styles.ctaContent}>
            <Text style={styles.ctaTitle}>Prêt à passer au niveau supérieur ?</Text>
            <Text style={styles.ctaText}>
              Rejoignez des milliers d'utilisateurs qui font confiance à GuardHome Premium
            </Text>
            <Button style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Commencer l'essai gratuit</Text>
            </Button>
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
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
  highlightCard: {
    margin: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.primary + '05',
    borderColor: theme.colors.primary + '20',
  },
  highlightContent: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  highlightTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.foreground,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  highlightText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  highlightFeatures: {
    gap: theme.spacing.sm,
  },
  highlightFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  highlightFeatureText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.lg,
  },
  plansContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  planCard: {
    marginBottom: theme.spacing.lg,
  },
  currentPlan: {
    borderColor: theme.colors.primary,
  },
  popularPlan: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  planContent: {
    padding: theme.spacing.lg,
  },
  popularBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  popularText: {
    color: '#ffffff',
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  planName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.foreground,
  },
  currentBadge: {
    backgroundColor: theme.colors.muted,
  },
  currentText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: theme.spacing.lg,
  },
  price: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  period: {
    fontSize: theme.fontSize.md,
    color: theme.colors.mutedForeground,
    marginLeft: theme.spacing.xs,
  },
  featuresContainer: {
    marginBottom: theme.spacing.lg,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  featureText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
    flex: 1,
  },
  limitation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  limitationText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    flex: 1,
  },
  planButton: {
    width: '100%',
  },
  currentPlanButton: {
    backgroundColor: 'transparent',
  },
  popularPlanButton: {
    backgroundColor: theme.colors.primary,
  },
  planButtonText: {
    color: '#ffffff',
    fontWeight: theme.fontWeight.medium,
  },
  currentPlanButtonText: {
    color: theme.colors.mutedForeground,
  },
  testimonialsContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  testimonialCard: {
    marginBottom: theme.spacing.md,
  },
  testimonialContent: {
    padding: theme.spacing.lg,
  },
  testimonialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  testimonialName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
  },
  testimonialRole: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  testimonialRating: {
    flexDirection: 'row',
    gap: 2,
  },
  testimonialComment: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  faqCard: {
    margin: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  faqContent: {
    padding: theme.spacing.lg,
  },
  faqItem: {
    marginBottom: theme.spacing.lg,
  },
  faqQuestion: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
  },
  faqAnswer: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    lineHeight: 20,
  },
  ctaCard: {
    margin: theme.spacing.lg,
    marginBottom: 80, // Reduced space for bottom nav
    backgroundColor: theme.colors.primary + '05',
    borderColor: theme.colors.primary + '20',
  },
  ctaContent: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  ctaText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  ctaButton: {
    width: '100%',
  },
  ctaButtonText: {
    color: '#ffffff',
    fontWeight: theme.fontWeight.medium,
  },
});