import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, ActivityIndicator, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Label } from '../../components/ui/Label';
import { Icon } from '../../components/ui/Icon';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';
import { theme } from '../../styles/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useUserApi } from '../../hooks/api/useUserApi';
import { LabelDto } from '../../types/api';
import { buildDataUri, extractBase64, normalizeImageValue } from '../../utils/imageUtils';

interface EditProfilePageProps {
  onBack: () => void;
}

export function EditProfilePage({ onBack }: EditProfilePageProps) {
  const { user, updateUserProfile } = useAuth();
  const { 
    getMyProfile, 
    updateMyProfile, 
    getMyLanguages, 
    updateMyLanguages,
    getMySpecialisations,
    updateMySpecialisations,
    getLanguages,
    getSpecialisations,
    isLoading: apiLoading 
  } = useUserApi();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
    location: "",
    avatar: "",
    languages: [] as string[],
    skills: [] as string[],
    availability: "",
    priceRange: ""
  });
  const [availableLanguages, setAvailableLanguages] = useState<LabelDto[]>([]);
  const [availableSpecialisations, setAvailableSpecialisations] = useState<LabelDto[]>([]);

  const [notifications, setNotifications] = useState({
    messages: true,
    bookings: true,
    marketing: false,
    reviews: true
  });

  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    phoneVisible: false,
    emailVisible: false,
    locationVisible: true
  });

  const requestPhotoPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'Nous avons besoin de votre permission pour accéder à vos photos.',
          [{ text: 'OK' }],
        );
        return false;
      }
    }
    return true;
  };

  const handleChangePhoto = async () => {
    const hasPermission = await requestPhotoPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        if (!asset.base64) {
          Alert.alert('Erreur', 'Impossible de traiter cette image. Veuillez réessayer.');
          return;
        }

        const imageUri = buildDataUri(asset.base64, asset.mimeType);

        if (!imageUri) {
          Alert.alert('Erreur', 'Format de fichier non supporté.');
          return;
        }

        setProfile(prev => ({
          ...prev,
          avatar: imageUri,
        }));
      }
    } catch (error) {
      console.error('Error picking profile photo:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner la photo de profil');
    }
  };

  const handleRemovePhoto = () => {
    setProfile(prev => ({
      ...prev,
      avatar: '',
    }));
  };

  // Load user data on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        
        // Load profile data - use Promise.allSettled to handle individual failures
        const results = await Promise.allSettled([
          getMyProfile(),
          getMyLanguages(),
          getMySpecialisations(),
          getLanguages(),
          getSpecialisations(),
        ]);

        const profileData = results[0].status === 'fulfilled' ? results[0].value : null;
        const languagesData = results[1].status === 'fulfilled' ? results[1].value : null;
        const specialisationsData = results[2].status === 'fulfilled' ? results[2].value : null;
        const allLanguages = results[3].status === 'fulfilled' ? results[3].value : [];
        const allSpecialisations = results[4].status === 'fulfilled' ? results[4].value : [];

        // Extract languages and specialisations labels
        // Handle both 'language' and 'label' properties for backward compatibility
        const loadedLanguages = languagesData?.map(l => l.language || l.label || '') || [];
        const loadedSkills = specialisationsData?.map(s => s.specialisation || s.label || '') || [];
        
        // Debug logging
        console.log(results[2]);
        console.log('Loaded languages:', loadedLanguages);
        console.log('Loaded specialisations:', loadedSkills);
        console.log('Available languages:', allLanguages?.map(l => l.label));
        console.log('Available specialisations:', allSpecialisations?.map(s => s.label));

        if (profileData) {
          setProfile({
            firstName: profileData.firstName || "",
            lastName: profileData.lastName || "",
            email: profileData.email || user.email || "",
            phone: profileData.phoneNumber || "",
            bio: profileData.description || "",
            location: profileData.location || "",
            avatar: normalizeImageValue(profileData.profilePhoto) ?? "",
            languages: loadedLanguages,
            skills: loadedSkills,
            availability: "", // Not available in API yet
            priceRange: "" // Not available in API yet
          });
        } else {
          // Even if profileData is null, we should still set languages and skills if they were loaded
          setProfile(prev => ({
            ...prev,
            languages: loadedLanguages,
            skills: loadedSkills,
          }));
        }

        setAvailableLanguages(allLanguages ?? []);
        setAvailableSpecialisations(allSpecialisations ?? []);

        // Load preferences if available
        if (profileData?.preferences) {
          try {
            // Backend stores preferences as a JSON string
            const prefsString = typeof profileData.preferences === 'string' 
              ? profileData.preferences 
              : JSON.stringify(profileData.preferences);
            const prefs = JSON.parse(prefsString);
            
            if (prefs.notifications) {
              setNotifications({
                messages: prefs.notifications.messages ?? true,
                bookings: prefs.notifications.bookings ?? true,
                marketing: prefs.notifications.marketing ?? false,
                reviews: prefs.notifications.reviews ?? true
              });
            }
            if (prefs.privacy) {
              setPrivacy({
                profileVisible: prefs.privacy.profileVisible ?? true,
                phoneVisible: prefs.privacy.phoneVisible ?? false,
                emailVisible: prefs.privacy.emailVisible ?? false,
                locationVisible: prefs.privacy.locationVisible ?? true
              });
            }
          } catch (error) {
            console.error('Error parsing preferences:', error);
            // Use default preferences if parsing fails
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        Alert.alert('Erreur', 'Impossible de charger les données du profil');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user, getMyProfile, getMyLanguages, getMySpecialisations, getLanguages, getSpecialisations]);

  const toggleSelection = (type: 'language' | 'skill', value: string) => {
    setProfile(prev => {
      const key = type === 'language' ? 'languages' : 'skills';
      const exists = prev[key as 'languages' | 'skills'].includes(value);
      const updated = exists
        ? prev[key as 'languages' | 'skills'].filter(item => item !== value)
        : [...prev[key as 'languages' | 'skills'], value];

      return {
        ...prev,
        [key]: updated,
      };
    });
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setIsSaving(true);

      // Update profile
      const profileUpdates: any = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: profile.phone,
        location: profile.location,
        description: profile.bio,
      };

      let serializedAvatar: string | null | undefined;
      if (profile.avatar) {
        if (profile.avatar.startsWith('http') || profile.avatar.startsWith('file:')) {
          serializedAvatar = profile.avatar;
        } else {
          serializedAvatar = extractBase64(profile.avatar) ?? profile.avatar;
        }
      } else if (profile.avatar === '') {
        serializedAvatar = null;
      }

      if (serializedAvatar !== undefined) {
        profileUpdates.profilePhoto = serializedAvatar;
      }

      // Serialize preferences as JSON string (backend expects String, not object)
      const preferencesObj = {
        notifications,
        privacy
      };
      profileUpdates.preferences = JSON.stringify(preferencesObj);

      // Remove empty fields (but keep preferences even if empty)
      Object.keys(profileUpdates).forEach(key => {
        if (key === 'preferences') return; // Always send preferences
        if (profileUpdates[key] === "" || profileUpdates[key] === undefined) {
          delete profileUpdates[key];
        }
      });

      const updatedProfile = await updateMyProfile(profileUpdates);
      
      // Update languages and specialisations - handle errors separately so profile update can succeed
      const updateResults = await Promise.allSettled([
        // Always update languages (even if empty array to clear them)
        updateMyLanguages(profile.languages),
        // Always update specialisations (even if empty array to clear them)
        updateMySpecialisations(profile.skills),
      ]);

      // Log any errors but don't fail the entire save
      updateResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          const type = index === 0 ? 'languages' : 'specialisations';
          console.error(`Error updating ${type}:`, result.reason);
        }
      });

      if (updatedProfile) {
        // Update AuthContext with new profile data
        const normalizedUpdatedAvatar = normalizeImageValue(updatedProfile.profilePhoto) ?? '';

        await updateUserProfile({
          firstName: updatedProfile.firstName,
          lastName: updatedProfile.lastName,
          telephone: updatedProfile.phoneNumber,
          localisation: updatedProfile.location,
          description: updatedProfile.description,
          photo_profil: normalizedUpdatedAvatar,
          email: updatedProfile.email,
        });

        setProfile(prev => ({
          ...prev,
          avatar: normalizedUpdatedAvatar,
        }));

        Alert.alert('Succès', 'Profil mis à jour avec succès');
        onBack();
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le profil');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color={theme.colors.foreground} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Modifier le profil</Text>
            <View style={styles.spacer} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement du profil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modifier le profil</Text>
          <TouchableOpacity onPress={handleSave} disabled={isSaving}>
            <Text style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}>
              {isSaving ? 'Sauvegarde...' : 'Sauver'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Photo */}
        <Card style={styles.photoCard}>
          <CardContent style={styles.photoContent}>
            <View style={styles.photoSection}>
              {profile.avatar ? (
                <ImageWithFallback
                  source={{ uri: profile.avatar }}
                  style={styles.profilePhoto}
                  fallbackIcon="User"
                />
              ) : (
                <View style={[styles.profilePhoto, styles.profilePhotoPlaceholder]}>
                  <Icon name="User" size={40} color={theme.colors.mutedForeground} />
                </View>
              )}
              <View style={styles.photoActions}>
                <Button
                  variant="outline"
                  size="sm"
                  style={styles.photoButton}
                  onPress={handleChangePhoto}
                >
                  <Icon name="camera" size={16} color={theme.colors.primary} />
                  <Text style={styles.photoButtonText}>Changer la photo</Text>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  style={styles.removeButton}
                  onPress={handleRemovePhoto}
                  disabled={!profile.avatar}
                >
                  <Text style={styles.removeButtonText}>Supprimer</Text>
                </Button>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card style={styles.sectionCard}>
          <CardContent style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Informations personnelles</Text>
            
            <View style={styles.inputRow}>
              <View style={styles.halfInput}>
                <Label>Prénom</Label>
                <Input
                  value={profile.firstName}
                  onChangeText={(text) => setProfile(prev => ({ ...prev, firstName: text }))}
                  placeholder="Prénom"
                />
              </View>
              <View style={styles.halfInput}>
                <Label>Nom</Label>
                <Input
                  value={profile.lastName}
                  onChangeText={(text) => setProfile(prev => ({ ...prev, lastName: text }))}
                  placeholder="Nom"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Label>Email</Label>
              <Input
                value={profile.email}
                onChangeText={(text) => setProfile(prev => ({ ...prev, email: text }))}
                placeholder="Email"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Label>Téléphone</Label>
              <Input
                value={profile.phone}
                onChangeText={(text) => setProfile(prev => ({ ...prev, phone: text }))}
                placeholder="Téléphone"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Label>Localisation</Label>
              <Input
                value={profile.location}
                onChangeText={(text) => setProfile(prev => ({ ...prev, location: text }))}
                placeholder="Ville, Pays"
              />
            </View>
          </CardContent>
        </Card>

        {/* Bio */}
        <Card style={styles.sectionCard}>
          <CardContent style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>À propos de moi</Text>
            <View style={styles.inputGroup}>
              <Label>Description</Label>
              <Textarea
                value={profile.bio}
                onChangeText={(text) => setProfile(prev => ({ ...prev, bio: text }))}
                placeholder="Parlez-nous de vous, de votre expérience..."
                numberOfLines={4}
              />
              <Text style={styles.charCount}>{profile.bio.length}/500 caractères</Text>
            </View>
          </CardContent>
        </Card>

        {/* Skills & Availability */}
        <Card style={styles.sectionCard}>
          <CardContent style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Compétences et disponibilité</Text>
            
            <View style={styles.inputGroup}>
              <Label>Langues parlées</Label>
              <View style={styles.choiceList}>
                {availableLanguages.length === 0 ? (
                  <Text style={styles.emptyChoiceText}>Aucune langue disponible</Text>
                ) : (
                  availableLanguages.map((lang) => {
                    const selected = profile.languages.includes(lang.label);
                    return (
                      <TouchableOpacity
                        key={lang.label}
                        style={[
                          styles.choicePill,
                          selected && styles.choicePillSelected,
                        ]}
                        onPress={() => toggleSelection('language', lang.label)}
                      >
                        <Text
                          style={[
                            styles.choicePillText,
                            selected && styles.choicePillTextSelected,
                          ]}
                        >
                          {lang.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
              {profile.languages.length > 0 && (
                <Text style={styles.selectedChoiceText}>
                  Sélectionnées : {profile.languages.join(', ')}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Label>Spécialisations</Label>
              <View style={styles.choiceList}>
                {availableSpecialisations.length === 0 ? (
                  <Text style={styles.emptyChoiceText}>Aucune spécialisation disponible</Text>
                ) : (
                  availableSpecialisations.map((spec) => {
                    const selected = profile.skills.includes(spec.label);
                    return (
                      <TouchableOpacity
                        key={spec.label}
                        style={[
                          styles.choicePill,
                          selected && styles.choicePillSelected,
                        ]}
                        onPress={() => toggleSelection('skill', spec.label)}
                      >
                        <Text
                          style={[
                            styles.choicePillText,
                            selected && styles.choicePillTextSelected,
                          ]}
                        >
                          {spec.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
              {profile.skills.length > 0 && (
                <Text style={styles.selectedChoiceText}>
                  Sélectionnées : {profile.skills.join(', ')}
                </Text>
              )}
            </View>

          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card style={styles.sectionCard}>
          <CardContent style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Confidentialité</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingText}>Profil visible publiquement</Text>
                <Text style={styles.settingDescription}>Votre profil apparaît dans les recherches</Text>
              </View>
              <Switch
                value={privacy.profileVisible}
                onValueChange={(value) => setPrivacy(prev => ({ ...prev, profileVisible: value }))}
                trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                thumbColor={privacy.profileVisible ? '#ffffff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingText}>Téléphone visible</Text>
                <Text style={styles.settingDescription}>Afficher votre numéro sur votre profil</Text>
              </View>
              <Switch
                value={privacy.phoneVisible}
                onValueChange={(value) => setPrivacy(prev => ({ ...prev, phoneVisible: value }))}
                trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                thumbColor={privacy.phoneVisible ? '#ffffff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingText}>Email visible</Text>
                <Text style={styles.settingDescription}>Afficher votre email sur votre profil</Text>
              </View>
              <Switch
                value={privacy.emailVisible}
                onValueChange={(value) => setPrivacy(prev => ({ ...prev, emailVisible: value }))}
                trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                thumbColor={privacy.emailVisible ? '#ffffff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingText}>Localisation visible</Text>
                <Text style={styles.settingDescription}>Afficher votre ville sur votre profil</Text>
              </View>
              <Switch
                value={privacy.locationVisible}
                onValueChange={(value) => setPrivacy(prev => ({ ...prev, locationVisible: value }))}
                trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                thumbColor={privacy.locationVisible ? '#ffffff' : '#f4f3f4'}
              />
            </View>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card style={styles.sectionCard}>
          <CardContent style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingText}>Messages</Text>
                <Text style={styles.settingDescription}>Recevoir les notifications de nouveaux messages</Text>
              </View>
              <Switch
                value={notifications.messages}
                onValueChange={(value) => setNotifications(prev => ({ ...prev, messages: value }))}
                trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                thumbColor={notifications.messages ? '#ffffff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingText}>Réservations</Text>
                <Text style={styles.settingDescription}>Alertes pour les nouvelles demandes de garde</Text>
              </View>
              <Switch
                value={notifications.bookings}
                onValueChange={(value) => setNotifications(prev => ({ ...prev, bookings: value }))}
                trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                thumbColor={notifications.bookings ? '#ffffff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingText}>Avis et évaluations</Text>
                <Text style={styles.settingDescription}>Notifications lors de nouveaux avis</Text>
              </View>
              <Switch
                value={notifications.reviews}
                onValueChange={(value) => setNotifications(prev => ({ ...prev, reviews: value }))}
                trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                thumbColor={notifications.reviews ? '#ffffff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingText}>Marketing</Text>
                <Text style={styles.settingDescription}>Promotions et nouvelles fonctionnalités</Text>
              </View>
              <Switch
                value={notifications.marketing}
                onValueChange={(value) => setNotifications(prev => ({ ...prev, marketing: value }))}
                trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                thumbColor={notifications.marketing ? '#ffffff' : '#f4f3f4'}
              />
            </View>
          </CardContent>
        </Card>

        {/* Save Button */}
        <View style={styles.saveSection}>
          <Button 
            onPress={handleSave} 
            style={StyleSheet.flatten([styles.saveButtonLarge, isSaving && styles.saveButtonDisabled])}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.saveButtonText}>Sauvegarder les modifications</Text>
            )}
          </Button>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
  },
  saveButton: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  scrollView: {
    flex: 1,
  },
  photoCard: {
    margin: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  photoContent: {
    padding: theme.spacing.xl,
  },
  photoSection: {
    alignItems: 'center',
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: theme.spacing.lg,
  },
  photoActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  photoButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
  },
  removeButton: {
    // No additional styles needed
  },
  removeButtonText: {
    color: '#ef4444',
    fontSize: theme.fontSize.sm,
  },
  sectionCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionContent: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.lg,
  },
  inputRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  choiceList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.sm,
  },
  choicePill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  choicePillSelected: {
    borderColor: '#22c55e',
    backgroundColor: '#dcfce7',
  },
  choicePillText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  choicePillTextSelected: {
    color: '#15803d',
    fontWeight: theme.fontWeight.medium,
  },
  emptyChoiceText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  selectedChoiceText: {
    marginTop: theme.spacing.xs,
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  charCount: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
    textAlign: 'right',
    marginTop: theme.spacing.xs,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingLeft: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  settingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  settingDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  saveSection: {
    padding: theme.spacing.lg,
    paddingBottom: 120, // Space for bottom nav
  },
  saveButtonLarge: {
    width: '100%',
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: theme.fontWeight.medium,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing['6xl'],
  },
  loadingText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
  },
  spacer: {
    width: 60, // Same width as back button for centering
  },
  profilePhotoPlaceholder: {
    backgroundColor: theme.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
});