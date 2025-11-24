import React, { useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Button } from './src/components/ui/Button';
import { Card, CardContent } from './src/components/ui/Card';
import { Badge } from './src/components/ui/Badge';
import { Icon } from './src/components/ui/Icon';
import { ImageWithFallback } from './src/components/ui/ImageWithFallback';
import { SearchPage } from './src/screens/listings/SearchPage';
import { ListingDetailPage } from './src/screens/listings/ListingDetailPage';
import { ProfilePage } from './src/screens/profile/ProfilePage';
import { FavoritesPage } from './src/screens/favorites/FavoritesPage';
import { MessagesPage } from './src/screens/messages/MessagesPage';
import { CreateListingPage } from './src/screens/listings/CreateListingPage';
import { MyListingsPage } from './src/screens/listings/MyListingsPage';
import { GuardHistoryPage } from './src/screens/profile/GuardHistoryPage';
import { ReviewsPage } from './src/screens/profile/ReviewsPage';
import { SubscriptionPage } from './src/screens/profile/SubscriptionPage';
import { PaymentsPage } from './src/screens/profile/PaymentsPage';
import { EditProfilePage } from './src/screens/profile/EditProfilePage';
import { AdvancedSettingsPage } from './src/screens/profile/AdvancedSettingsPage';
import { LanguageSelectorPage } from './src/screens/profile/LanguageSelectorPage';
import { LoginPage } from './src/screens/auth/LoginPage';
import { CompleteProfilePage } from './src/screens/profile/CompleteProfilePage';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { theme } from './src/styles/theme';
import './src/i18n';
import { useTranslation } from 'react-i18next';
import { useAnnouncementsApi } from './src/hooks/api/useAnnouncementsApi';
import { useFavoritesApi } from './src/hooks/api/useFavoritesApi';
import StripeProviderWrapper from './src/stripe/StripeProviderWrapper';

// Main App Component with Authentication
function MainApp() {
  const { isAuthenticated, isLoading, user, accessToken, isProfileComplete, markProfileAsComplete } = useAuth();
  const { t } = useTranslation();
  const enableSimulatedLogin = process.env.EXPO_PUBLIC_ENABLE_SIMULATED_LOGIN === 'true';
  const [activeTab, setActiveTab] = useState("home");
  const [currentPage, setCurrentPage] = useState("home");
  const [selectedListing, setSelectedListing] = useState(null);
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [selectedDiscussionId, setSelectedDiscussionId] = useState<number | undefined>(undefined);
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [navigationStack, setNavigationStack] = useState(["home"]); // Stack pour navigation hiérarchique
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const announcementsFetchInFlightRef = useRef(false);
  const lastAnnouncementsFetchRef = useRef(0);
  const lastAnnouncementsTokenRef = useRef<string | null>(null);

  const { listAnnouncements } = useAnnouncementsApi();
  const { getFavorites, checkFavorite, addFavorite, removeFavorite } = useFavoritesApi();

  // Load announcements on mount
  React.useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const now = Date.now();
    const sameToken = lastAnnouncementsTokenRef.current === accessToken;
    const withinCooldown = sameToken && now - lastAnnouncementsFetchRef.current < 60000;

    if (announcementsFetchInFlightRef.current || withinCooldown) {
      return;
    }

    let cancelled = false;
    announcementsFetchInFlightRef.current = true;
    lastAnnouncementsTokenRef.current = accessToken;

    const loadAnnouncements = async () => {
      try {
        setIsLoadingListings(true);
        const announcements = await listAnnouncements({ status: 'PUBLISHED' });

        if (!announcements || cancelled) {
          return;
        }

        const formattedListings = await Promise.all(
          announcements.map(async (ann) => {
            let isFavorite = false;
            if (user?.username) {
              const favCheck = await checkFavorite(ann.id);
              isFavorite = favCheck ? favCheck.isFavorite : false;
            }

            const careType = ann.careType?.label ?? ann.careTypeLabel ?? '';
            return {
              id: String(ann.id),
              title: ann.title,
              location: ann.location,
              price: ann.remuneration || 0,
              period: ann.startDate ? new Date(ann.startDate).toLocaleDateString('fr-FR') : '',
              frequency: ann.visitFrequency || "À discuter",
              description: ann.description,
              imageUrl: ann.publicImages?.[0]?.imageUrl || "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba",
              publicImages: ann.publicImages?.map(img => img.imageUrl) || [],
              tags: careType ? [careType] : [],
              careType: careType,
              isLiked: isFavorite,
              rating: 4.5,
              reviewCount: 0,
              ownerUsername: ann.ownerUsername || '',
            };
          })
        );

        if (cancelled) {
          return;
        }

        setListings(formattedListings);
        setFilteredListings(formattedListings);
      } catch (error) {
        if (!cancelled) {
          console.error('Error loading announcements:', error);
        }
      } finally {
        if (!cancelled) {
          announcementsFetchInFlightRef.current = false;
          lastAnnouncementsFetchRef.current = Date.now();
          setIsLoadingListings(false);
        }
      }
    };

    loadAnnouncements();

    return () => {
      cancelled = true;
      announcementsFetchInFlightRef.current = false;
    };
  }, [isAuthenticated, accessToken, listAnnouncements, user?.username, checkFavorite]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor="#ffffff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t('app.loading')}</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor="#ffffff" />
        <LoginPage allowSimulatedLogin={enableSimulatedLogin} />
      </SafeAreaProvider>
    );
  }

  // Show profile completion page if profile is not complete
  if (isAuthenticated && isProfileComplete === false) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor="#ffffff" />
        <CompleteProfilePage 
          onComplete={() => {
            markProfileAsComplete();
          }} 
        />
      </SafeAreaProvider>
    );
  }

  const toggleLike = async (id: string) => {
    try {
      const listing = listings.find(l => l.id === id);
      if (!listing) return;

      const announcementId = Number(id);
      
      if (listing.isLiked) {
        // Remove from favorites
        await removeFavorite(announcementId);
      } else {
        // Add to favorites
        await addFavorite({ announcementId });
      }

      // Update local state
      const updatedListings = listings.map(l => 
        l.id === id 
          ? { ...l, isLiked: !l.isLiked }
          : l
      );
      setListings(updatedListings);
      setFilteredListings(updatedListings);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleSearch = (query: string) => {
    const filtered = listings.filter(listing => 
      listing.title.toLowerCase().includes(query.toLowerCase()) ||
      listing.location.toLowerCase().includes(query.toLowerCase()) ||
      listing.description.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredListings(filtered);
  };

  const handleFilterChange = (filters: string[]) => {
    if (filters.length === 0) {
      setFilteredListings(listings);
    } else {
      const filtered = listings.filter(listing => 
        filters.some(filter => 
          listing.careType && listing.careType.toLowerCase() === filter.toLowerCase()
        )
      );
      setFilteredListings(filtered);
    }
  };

  const handleNavigate = (page: string, data?: any) => {
    setNavigationStack(prev => [...prev, page]);
    setCurrentPage(page);
    if (data) {
      setSelectedListing(data);
    }
    
    // Mettre à jour activeTab selon la page
    if (["home", "favorites", "create", "messages", "profile"].includes(page)) {
      setActiveTab(page);
    }
  };

  const handleBack = () => {
    setNavigationStack(prev => {
      const newStack = prev.slice(0, -1);
      const previousPage = newStack[newStack.length - 1] || "home";
      setCurrentPage(previousPage);
      
      // Mettre à jour activeTab
      if (["home", "favorites", "create", "messages", "profile"].includes(previousPage)) {
        setActiveTab(previousPage);
      }
      
      return newStack;
    });
    setSelectedListing(null);
    setSelectedDiscussionId(undefined);
  };

  const handleBackToSearch = () => {
    setActiveTab("home");
    setCurrentPage("home");
    setSelectedListing(null);
    setSelectedDiscussionId(undefined);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "listing-detail":
        return selectedListing ? (
          <ListingDetailPage
            listing={selectedListing}
            onBack={handleBackToSearch}
            onMessage={(discussionId) => {
              setSelectedDiscussionId(discussionId);
              handleNavigate("messages");
            }}
          />
        ) : null;
      
      case "profile":
        return (
          <ProfilePage
            onNavigate={handleNavigate}
          />
        );
      
      case "favorites":
        return (
          <FavoritesPage
            onBack={handleBackToSearch}
            allListings={listings}
            onLikeToggle={toggleLike}
            onListingClick={(listing) => handleNavigate("listing-detail", listing)}
          />
        );
      
      case "messages":
        return (
          <MessagesPage
            initialDiscussionId={selectedDiscussionId}
            onListingClick={(listing) => handleNavigate("listing-detail", listing)}
          />
        );
      
      case "create":
        return (
          <CreateListingPage
            onBack={() => {
              setEditingListingId(null);
            }}
            listingId={editingListingId || undefined}
            showBackButton={Boolean(editingListingId)}
          />
        );
      
      case "my-listings":
        return (
          <MyListingsPage
            onBack={handleBack}
            onCreateListing={() => {
              setEditingListingId(null);
              handleNavigate("create");
            }}
            onEditListing={(listingId) => {
              setEditingListingId(listingId);
              handleNavigate("create");
            }}
          />
        );
      
      case "guard-history":
        return (
          <GuardHistoryPage
            onBack={handleBack}
          />
        );
      
      case "reviews":
        return (
          <ReviewsPage
            onBack={handleBack}
          />
        );
      
      case "subscription":
        return (
          <SubscriptionPage
            onBack={handleBack}
          />
        );
      
      case "payments":
        return (
          <PaymentsPage
            onBack={handleBack}
          />
        );
      
      case "advanced-settings":
        return (
          <AdvancedSettingsPage
            onBack={handleBack}
            onNavigate={handleNavigate}
          />
        );

      case "language-selector":
        return (
          <LanguageSelectorPage
            onBack={handleBack}
          />
        );
      
      case "edit-profile":
        return (
          <EditProfilePage
            onBack={handleBack}
          />
        );
      
      default:
        return (
          <SearchPage
            listings={filteredListings}
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
            onListingClick={(listing) => handleNavigate("listing-detail", listing)}
            onLikeToggle={toggleLike}
          />
        );
    }
  };

  // Main app content - only shown when authenticated
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor="#ffffff" />
      <View style={styles.container}>
        <View style={styles.content}>
          {renderCurrentPage()}
        </View>
        
        {/* Bottom Navigation - TOUJOURS VISIBLE */}
        <View style={styles.bottomNav}>
          {[
            { id: "home", label: t('nav.search'), icon: "Search" },
            { id: "favorites", label: t('nav.favorites'), icon: "heart-outline" },
            { id: "create", label: t('nav.create'), icon: "add-outline" },
            { id: "messages", label: t('nav.messages'), icon: "chatbubble" },
            { id: "profile", label: t('nav.profile'), icon: "person" },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              onPress={() => {
                setActiveTab(tab.id);
                if (tab.id === "home") {
                  setCurrentPage("home");
                  setSelectedListing(null);
                } else {
                  handleNavigate(tab.id);
                }
              }}
              style={styles.tabButton}
            >
              <View style={styles.tabContent}>
                {tab.id === "create" ? (
                  <View style={[
                    styles.createButton,
                    { backgroundColor: activeTab === tab.id ? theme.colors.primary : theme.colors.muted }
                  ]}>
                    <Icon 
                      name={tab.icon as any} 
                      size={16} 
                      color={activeTab === tab.id ? "#ffffff" : theme.colors.mutedForeground}
                    />
                  </View>
                ) : (
                  <Icon 
                    name={tab.icon as any} 
                    size={20} 
                    color={activeTab === tab.id ? theme.colors.primary : theme.colors.mutedForeground}
                  />
                )}
                <Text
                  style={[
                  styles.tabLabel,
                  { color: activeTab === tab.id ? theme.colors.primary : theme.colors.mutedForeground }
                ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {tab.label}
                </Text>
              </View>
            </Button>
          ))}
        </View>
      </View>
    </SafeAreaProvider>
  );
}

// Root App Component with AuthProvider and StripeProvider
export default function App() {
  return (
    <AuthProvider>
      <StripeProviderWrapper>
        <MainApp />
      </StripeProviderWrapper>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingVertical: theme.spacing.sm,
    paddingBottom: 34, // Safe area bottom
    paddingTop: theme.spacing.md,
  },
  tabButton: {
    flex: 1,
    height: 'auto',
    paddingVertical: theme.spacing.xs,
  },
  tabContent: {
    alignItems: 'center',
    gap: 4,
  },
  createButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  tabLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    maxWidth: 100,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
  },
  placeholderPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  placeholderTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
});
