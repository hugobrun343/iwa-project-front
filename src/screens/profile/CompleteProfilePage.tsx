import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Label } from '../../components/ui/Label';
import { Icon } from '../../components/ui/Icon';
import { theme } from '../../styles/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useUserApi } from '../../hooks/api/useUserApi';
import { LabelDto } from '../../types/api';

interface CompleteProfilePageProps {
  onComplete?: () => void;
}

export function CompleteProfilePage({ onComplete }: CompleteProfilePageProps) {
  const { user, accessToken, updateUserProfile } = useAuth();
  const { 
    getMyProfile, 
    updateMyProfile,
    createUser,
    checkUserExists,
    getMyLanguages,
    getMySpecialisations,
    getLanguages,
    getSpecialisations,
    updateMyLanguages,
    updateMySpecialisations,
    isLoading: apiLoading 
  } = useUserApi();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userExists, setUserExists] = useState<boolean | null>(null);
  
  const [profile, setProfile] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    location: '',
    description: '',
  });

  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedSpecialisations, setSelectedSpecialisations] = useState<string[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<LabelDto[]>([]);
  const [availableSpecialisations, setAvailableSpecialisations] = useState<LabelDto[]>([]);
  const [languagesModalVisible, setLanguagesModalVisible] = useState(false);
  const [specialisationsModalVisible, setSpecialisationsModalVisible] = useState(false);

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user || !accessToken || !user.username) return;

      try {
        setIsLoading(true);
        
        // Load available languages and specialisations
        const [languagesList, specialisationsList] = await Promise.all([
          getLanguages().catch(() => []),
          getSpecialisations().catch(() => []),
        ]);
        setAvailableLanguages(languagesList || []);
        setAvailableSpecialisations(specialisationsList || []);
        
        // First, check if user exists in the backend
        const existsResponse = await checkUserExists(user.username);
        const exists = existsResponse?.exists ?? false;
        setUserExists(exists);

        if (exists) {
          // User exists, load profile data from API
          try {
            const [profileData, languagesData, specialisationsData] = await Promise.all([
              getMyProfile(),
              getMyLanguages().catch(() => null),
              getMySpecialisations().catch(() => null),
            ]);
            
            if (profileData) {
              setProfile({
                email: profileData.email || user.email || '',
                firstName: profileData.firstName || user.firstName || '',
                lastName: profileData.lastName || user.lastName || '',
                phoneNumber: profileData.phoneNumber || user.telephone || '',
                location: profileData.location || user.localisation || '',
                description: profileData.description || user.description || '',
              });
              
              // Set selected languages and specialisations
              if (languagesData && languagesData.length > 0) {
                setSelectedLanguages(languagesData.map(l => l.language || l.label || ''));
              }
              if (specialisationsData && specialisationsData.length > 0) {
                setSelectedSpecialisations(specialisationsData.map(s => s.specialisation || s.label || ''));
              }
            } else {
              // Fallback to user data from auth context
              setProfile({
                email: user.email || '',
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phoneNumber: user.telephone || '',
                location: user.localisation || '',
                description: user.description || '',
              });
            }
          } catch (error) {
            console.error('Error loading profile:', error);
            // Fallback to user data from auth context
            setProfile({
              email: user.email || '',
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              phoneNumber: user.telephone || '',
              location: user.localisation || '',
              description: user.description || '',
            });
          }
        } else {
          // User doesn't exist, use data from auth context
          setProfile({
            email: user.email || '',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            phoneNumber: user.telephone || '',
            location: user.localisation || '',
            description: user.description || '',
          });
        }
      } catch (error) {
        console.error('Error checking user existence:', error);
        // On error, assume user doesn't exist and use auth context data
        setUserExists(false);
        setProfile({
          email: user.email || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          phoneNumber: user.telephone || '',
          location: user.localisation || '',
          description: user.description || '',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user, accessToken, checkUserExists, getMyProfile, getLanguages, getSpecialisations]);

  const handleSave = async () => {
    // Validate required fields according to backend validation
    if (!profile.firstName || !profile.firstName.trim() || !profile.lastName || !profile.lastName.trim()) {
      Alert.alert('Champs requis', 'Veuillez remplir le prénom et le nom.');
      return;
    }

    if (!profile.phoneNumber || !profile.phoneNumber.trim()) {
      Alert.alert('Champs requis', 'Veuillez remplir votre numéro de téléphone.');
      return;
    }

    if (!profile.location || !profile.location.trim()) {
      Alert.alert('Champs requis', 'Veuillez remplir votre localisation.');
      return;
    }

    if (selectedLanguages.length === 0) {
      Alert.alert('Champs requis', 'Veuillez sélectionner au moins une langue.');
      return;
    }

    if (selectedSpecialisations.length === 0) {
      Alert.alert('Champs requis', 'Veuillez sélectionner au moins une spécialisation.');
      return;
    }

    if (!user || !user.username) {
      Alert.alert('Erreur', 'Informations utilisateur manquantes.');
      return;
    }

    try {
      setIsSaving(true);

      // Prepare payload according to backend DTO
      // Only include fields that have values (not empty strings)
      const payload: any = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: profile.phoneNumber,
        location: profile.location,
      };

      if (profile.email && profile.email.trim()) {
        payload.email = profile.email;
      }
      if (profile.description && profile.description.trim()) {
        payload.description = profile.description;
      }

      let result;
      
      if (userExists === false) {
        // User doesn't exist, create it
        console.log('Creating new user profile...');
        result = await createUser(payload);
      } else {
        // User exists, update it
        console.log('Updating existing user profile...');
        result = await updateMyProfile(payload);
      }

      if (result) {
        // Update languages
        await updateMyLanguages(selectedLanguages);
        
        // Update specialisations
        await updateMySpecialisations(selectedSpecialisations);

        // Also update via auth context
        await updateUserProfile({
          firstName: profile.firstName,
          lastName: profile.lastName,
          telephone: profile.phoneNumber,
          localisation: profile.location,
          description: profile.description,
        });

        Alert.alert('Succès', 'Votre profil a été complété avec succès !', [
          {
            text: 'OK',
            onPress: () => {
              onComplete?.();
            },
          },
        ]);
      } else {
        Alert.alert('Erreur', 'Échec de la sauvegarde du profil.');
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      const errorMessage = error?.message || error?.data?.message || 'Échec de la sauvegarde du profil.';
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleLanguage = (language: string) => {
    setSelectedLanguages(prev => 
      prev.includes(language) 
        ? prev.filter(l => l !== language)
        : [...prev, language]
    );
  };

  const toggleSpecialisation = (specialisation: string) => {
    setSelectedSpecialisations(prev => 
      prev.includes(specialisation) 
        ? prev.filter(s => s !== specialisation)
        : [...prev, specialisation]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement de votre profil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <CardContent style={styles.cardContent}>
            <View style={styles.header}>
              <Icon name="person-add" size={48} color={theme.colors.primary} />
              <Text style={styles.title}>Complétez votre profil</Text>
              <Text style={styles.subtitle}>
                Pour utiliser toutes les fonctionnalités de l'application, veuillez compléter votre profil.
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Label required>Prénom</Label>
                <Input
                  placeholder="Votre prénom"
                  value={profile.firstName}
                  onChangeText={(text) => setProfile({ ...profile, firstName: text })}
                  style={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Label required>Nom</Label>
                <Input
                  placeholder="Votre nom"
                  value={profile.lastName}
                  onChangeText={(text) => setProfile({ ...profile, lastName: text })}
                  style={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Label>Email</Label>
                <Input
                  placeholder="votre.email@exemple.com"
                  value={profile.email}
                  onChangeText={(text) => setProfile({ ...profile, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Label required>Téléphone</Label>
                <Input
                  placeholder="06 12 34 56 78"
                  value={profile.phoneNumber}
                  onChangeText={(text) => setProfile({ ...profile, phoneNumber: text })}
                  keyboardType="phone-pad"
                  style={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Label required>Localisation</Label>
                <Input
                  placeholder="Paris, France"
                  value={profile.location}
                  onChangeText={(text) => setProfile({ ...profile, location: text })}
                  style={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Label>Description</Label>
                <Textarea
                  placeholder="Parlez-nous de vous..."
                  value={profile.description}
                  onChangeText={(text) => setProfile({ ...profile, description: text })}
                  rows={4}
                  style={styles.textarea}
                />
              </View>

              <View style={styles.inputGroup}>
                <Label required>Langues parlées</Label>
                <TouchableOpacity
                  style={styles.selectTrigger}
                  onPress={() => setLanguagesModalVisible(true)}
                >
                  <Text style={[styles.selectText, selectedLanguages.length === 0 && styles.placeholder]}>
                    {selectedLanguages.length > 0 
                      ? `${selectedLanguages.length} langue${selectedLanguages.length > 1 ? 's' : ''} sélectionnée${selectedLanguages.length > 1 ? 's' : ''}`
                      : 'Sélectionnez vos langues'}
                  </Text>
                  <Icon name="chevron-forward" size={20} color={theme.colors.mutedForeground} />
                </TouchableOpacity>
                {selectedLanguages.length > 0 && (
                  <View style={styles.selectedTags}>
                    {selectedLanguages.map((lang) => (
                      <View key={lang} style={styles.tag}>
                        <Text style={styles.tagText}>{lang}</Text>
                        <TouchableOpacity
                          onPress={() => toggleLanguage(lang)}
                          style={styles.tagClose}
                        >
                          <Icon name="close" size={14} color={theme.colors.foreground} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Label required>Spécialisations</Label>
                <TouchableOpacity
                  style={styles.selectTrigger}
                  onPress={() => setSpecialisationsModalVisible(true)}
                >
                  <Text style={[styles.selectText, selectedSpecialisations.length === 0 && styles.placeholder]}>
                    {selectedSpecialisations.length > 0 
                      ? `${selectedSpecialisations.length} spécialisation${selectedSpecialisations.length > 1 ? 's' : ''} sélectionnée${selectedSpecialisations.length > 1 ? 's' : ''}`
                      : 'Sélectionnez vos spécialisations'}
                  </Text>
                  <Icon name="chevron-forward" size={20} color={theme.colors.mutedForeground} />
                </TouchableOpacity>
                {selectedSpecialisations.length > 0 && (
                  <View style={styles.selectedTags}>
                    {selectedSpecialisations.map((spec) => (
                      <View key={spec} style={styles.tag}>
                        <Text style={styles.tagText}>{spec}</Text>
                        <TouchableOpacity
                          onPress={() => toggleSpecialisation(spec)}
                          style={styles.tagClose}
                        >
                          <Icon name="close" size={14} color={theme.colors.foreground} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <Button
                onPress={handleSave}
                disabled={isSaving || !profile.firstName || !profile.lastName || !profile.phoneNumber || !profile.location || selectedLanguages.length === 0 || selectedSpecialisations.length === 0}
                style={styles.saveButton}
                size="lg"
              >
                {isSaving ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={styles.buttonText}>Enregistrement...</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>Enregistrer et continuer</Text>
                )}
              </Button>
            </View>
          </CardContent>
        </Card>
      </ScrollView>

      {/* Languages Selection Modal */}
      <Modal
        visible={languagesModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLanguagesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionnez vos langues</Text>
              <TouchableOpacity
                onPress={() => setLanguagesModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="close" size={24} color={theme.colors.foreground} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={availableLanguages}
              keyExtractor={(item) => item.label}
              renderItem={({ item }) => {
                const isSelected = selectedLanguages.includes(item.label);
                return (
                  <TouchableOpacity
                    style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                    onPress={() => toggleLanguage(item.label)}
                  >
                    <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}>
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Icon name="checkmark-circle" size={20} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
            <View style={styles.modalFooter}>
              <Button
                onPress={() => setLanguagesModalVisible(false)}
                style={styles.modalButton}
              >
                <Text style={styles.buttonText}>Valider</Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Specialisations Selection Modal */}
      <Modal
        visible={specialisationsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSpecialisationsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionnez vos spécialisations</Text>
              <TouchableOpacity
                onPress={() => setSpecialisationsModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="close" size={24} color={theme.colors.foreground} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={availableSpecialisations}
              keyExtractor={(item) => item.label}
              renderItem={({ item }) => {
                const isSelected = selectedSpecialisations.includes(item.label);
                return (
                  <TouchableOpacity
                    style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                    onPress={() => toggleSpecialisation(item.label)}
                  >
                    <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}>
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Icon name="checkmark-circle" size={20} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
            <View style={styles.modalFooter}>
              <Button
                onPress={() => setSpecialisationsModalVisible(false)}
                style={styles.modalButton}
              >
                <Text style={styles.buttonText}>Valider</Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
  },
  card: {
    margin: theme.spacing.lg,
  },
  cardContent: {
    padding: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.foreground,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    gap: theme.spacing.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  input: {
    marginTop: theme.spacing.xs,
  },
  textarea: {
    marginTop: theme.spacing.xs,
    minHeight: 100,
  },
  saveButton: {
    marginTop: theme.spacing.lg,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
  },
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.inputBackground,
    marginTop: theme.spacing.xs,
  },
  selectText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
    flex: 1,
  },
  placeholder: {
    color: theme.colors.mutedForeground,
  },
  selectedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  tagText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  tagClose: {
    padding: theme.spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '80%',
    paddingBottom: theme.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.foreground,
  },
  modalCloseButton: {
    padding: theme.spacing.xs,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalOptionSelected: {
    backgroundColor: theme.colors.primary + '10',
  },
  modalOptionText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
  },
  modalOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  modalFooter: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  modalButton: {
    width: '100%',
  },
});

