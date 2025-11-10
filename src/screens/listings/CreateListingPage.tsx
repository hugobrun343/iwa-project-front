import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Label } from '../../components/ui/Label';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { Icon } from '../../components/ui/Icon';
import { PageHeader } from '../../components/ui/PageHeader';
import { Switch } from '../../components/ui/Switch';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';
import { theme } from '../../styles/theme';

interface CreateListingPageProps {
  onBack: () => void;
}

export function CreateListingPage({ onBack }: CreateListingPageProps) {
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    startDate: "",
    endDate: "",
    price: "",
    frequency: "",
    description: "",
    instructions: "",
    guardType: [] as string[],
    photos: [] as string[],
    privatePhotos: [] as string[],
    hasAnimals: false,
    hasPlants: false,
    needsHouseSitting: false,
    requiresIdVerification: false,
    availableForEmergency: false,
  });

  const guardTypes = [
    { id: "animals", label: "Animaux", description: "Garde d'animaux domestiques" },
    { id: "plants", label: "Plantes", description: "Arrosage et entretien" },
    { id: "house", label: "Logement", description: "Surveillance du domicile" },
    { id: "mail", label: "Courrier", description: "Relève du courrier" },
  ];

  const frequencyOptions = [
    { value: "1 fois par jour", label: "1 fois par jour" },
    { value: "2 fois par jour", label: "2 fois par jour" },
    { value: "3 fois par jour", label: "3 fois par jour" },
    { value: "1 jour sur 2", label: "1 jour sur 2" },
    { value: "1 fois par semaine", label: "1 fois par semaine" },
    { value: "2-3 fois par semaine", label: "2-3 fois par semaine" },
    { value: "Présence continue", label: "Présence continue" },
  ];


  const addPhoto = () => {
    const mockPhotos = [
      "https://images.unsplash.com/photo-1594873604892-b599f847e859?w=400",
      "https://images.unsplash.com/photo-1619774946815-3e1eeeb445fe?w=400",
      "https://images.unsplash.com/photo-1605260346600-f98d9cf022a5?w=400"
    ];
    const randomPhoto = mockPhotos[Math.floor(Math.random() * mockPhotos.length)];
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, randomPhoto]
    }));
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const addPrivatePhoto = () => {
    const mockPrivatePhotos = [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
    ];
    const randomPhoto = mockPrivatePhotos[Math.floor(Math.random() * mockPrivatePhotos.length)];
    setFormData(prev => ({
      ...prev,
      privatePhotos: [...prev.privatePhotos, randomPhoto]
    }));
  };

  const removePrivatePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      privatePhotos: prev.privatePhotos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    console.log("Annonce créée:", formData);
    onBack();
  };

  return (
    <View style={styles.container}>
      <PageHeader 
        title="Créer une annonce"
        icon="add"
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Card style={styles.sectionCard}>
          <CardContent>
            <Label>Titre de l'annonce</Label>
            <Input
              placeholder="Ex: Garde de mes 2 chats pendant les vacances"
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
            />
          </CardContent>
        </Card>

        {/* Location */}
        <Card style={styles.sectionCard}>
          <CardContent>
            <Label>Localisation</Label>
            <View style={styles.locationInputWrapper}>
              <Icon name="MapPin" size={16} color={theme.colors.mutedForeground} style={styles.locationIcon} />
              <Input
                placeholder="Adresse ou ville"
                style={styles.locationInput}
                value={formData.location}
                onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
              />
            </View>
          </CardContent>
        </Card>

        {/* Guard Type */}
        <Card style={styles.sectionCard}>
          <CardContent>
            <Label>Type de garde demandée</Label>
            <View style={styles.guardTypeList}>
              {guardTypes.map((type) => (
                <View key={type.id} style={styles.guardTypeItem}>
                  <View style={styles.guardTypeContent}>
                    <Text style={styles.guardTypeLabel}>
                      {type.label}
                    </Text>
                    <Text style={styles.guardTypeDescription}>
                      {type.description}
                    </Text>
                  </View>
                  <Switch 
                    value={formData[type.id as keyof typeof formData] as boolean} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, [type.id]: value }))}
                  />
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card style={styles.sectionCard}>
          <CardContent>
            <Label>Période de garde</Label>
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Label style={styles.dateLabel}>Date de début</Label>
                <View style={styles.dateInputWrapper}>
                  <Icon name="Calendar" size={16} color={theme.colors.mutedForeground} style={styles.dateIcon} />
                  <Input
                    placeholder="JJ/MM/AAAA"
                    style={styles.dateInput}
                    value={formData.startDate}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, startDate: text }))}
                  />
                </View>
              </View>
              <View style={styles.dateField}>
                <Label style={styles.dateLabel}>Date de fin</Label>
                <View style={styles.dateInputWrapper}>
                  <Icon name="Calendar" size={16} color={theme.colors.mutedForeground} style={styles.dateIcon} />
                  <Input
                    placeholder="JJ/MM/AAAA"
                    style={styles.dateInput}
                    value={formData.endDate}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, endDate: text }))}
                  />
                </View>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Frequency */}
        <Card style={styles.sectionCard}>
          <CardContent>
            <Label>Fréquence de visite requise</Label>
            <View style={styles.frequencyWrapper}>
              <Icon name="Clock" size={16} color={theme.colors.mutedForeground} style={styles.frequencyIcon} />
              <Select
                value={formData.frequency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
                placeholder="Sélectionner la fréquence"
                options={frequencyOptions}
                style={styles.frequencySelect}
              />
            </View>
            <Text style={styles.helpText}>
              À quelle fréquence le gardien doit-il venir pendant votre absence ?
            </Text>
          </CardContent>
        </Card>

        {/* Price */}
        <Card style={styles.sectionCard}>
          <CardContent>
            <Label>Rémunération proposée</Label>
            <View style={styles.priceWrapper}>
              <Icon name="Euro" size={16} color={theme.colors.mutedForeground} style={styles.priceIcon} />
              <Input
                placeholder="0"
                keyboardType="numeric"
                style={styles.priceInput}
                value={formData.price}
                onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
              />
              <Text style={styles.priceSuffix}>/jour</Text>
            </View>
          </CardContent>
        </Card>

        {/* Description */}
        <Card style={styles.sectionCard}>
          <CardContent>
            <Label>Description</Label>
            <Textarea
              placeholder="Décrivez votre demande, votre logement, vos animaux/plantes..."
              rows={4}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            />
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card style={styles.sectionCard}>
          <CardContent>
            <Label>Consignes spécifiques</Label>
            <Textarea
              placeholder="Instructions détaillées, horaires d'alimentation, contacts vétérinaire..."
              rows={4}
              value={formData.instructions}
              onChangeText={(text) => setFormData(prev => ({ ...prev, instructions: text }))}
            />
          </CardContent>
        </Card>

        {/* Public Photos */}
        <Card style={styles.sectionCard}>
          <CardContent>
            <Label>Photos publiques</Label>
            <View style={styles.photosGrid}>
              {formData.photos.map((photo, index) => (
                <View key={index} style={styles.photoItem}>
                  <ImageWithFallback
                    src={photo}
                    style={styles.photoImage}
                  />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto(index)}
                  >
                    <Icon name="Close" size={12} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={addPhoto}
              >
                <Icon name="Plus" size={20} color={theme.colors.foreground} />
                <Text style={styles.addPhotoText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helpText}>
              Photos visibles par tous les gardiens pour présenter votre annonce
            </Text>
          </CardContent>
        </Card>

        {/* Private Photos */}
        <Card style={styles.sectionCard}>
          <CardContent>
            <View style={styles.privatePhotosHeader}>
              <Icon name="ShieldCheckmark" size={16} color={theme.colors.mutedForeground} />
              <Label>Photos d'accès privées</Label>
            </View>
            <View style={styles.photosGrid}>
              {formData.privatePhotos.map((photo, index) => (
                <View key={index} style={styles.photoItem}>
                  <ImageWithFallback
                    src={photo}
                    style={styles.photoImage}
                  />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removePrivatePhoto(index)}
                  >
                    <Icon name="Close" size={12} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={addPrivatePhoto}
              >
                <Icon name="Plus" size={16} color={theme.colors.foreground} />
                <Text style={styles.addPhotoText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helpText}>
              Photos sensibles (codes, clés, accès) révélées uniquement après acceptation de la mission
            </Text>
          </CardContent>
        </Card>

        {/* Additional Options */}
        <Card style={styles.sectionCard}>
          <CardContent>
            <Label>Options supplémentaires</Label>
            <View style={styles.optionsList}>
              <View style={styles.optionItem}>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Vérification d'identité requise</Text>
                  <Text style={styles.optionDescription}>Le gardien devra fournir une pièce d'identité</Text>
                </View>
                <Switch 
                  value={formData.requiresIdVerification} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, requiresIdVerification: value }))}
                />
              </View>
              <View style={styles.optionItem}>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Disponible en urgence</Text>
                  <Text style={styles.optionDescription}>Accepter les demandes de dernière minute</Text>
                </View>
                <Switch 
                  value={formData.availableForEmergency} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, availableForEmergency: value }))}
                />
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity 
            onPress={handleSubmit}
            style={styles.submitButton}
          >
            <Icon name="Send" size={16} color={theme.colors.primaryForeground} />
            <Text style={styles.submitButtonText}>Publier l'annonce</Text>
          </TouchableOpacity>
          <Text style={styles.submitHelpText}>
            Votre annonce sera visible après validation
          </Text>
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
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  sectionCard: {
    marginBottom: theme.spacing.xl,
  },
  locationInputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    position: 'absolute',
    left: theme.spacing.md,
    zIndex: 1,
  },
  locationInput: {
    flex: 1,
    paddingLeft: theme.spacing['3xl'] + theme.spacing.xs,
  },
  guardTypeList: {
    gap: theme.spacing.md,
  },
  guardTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  guardTypeContent: {
    flex: 1,
  },
  guardTypeLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  guardTypeDescription: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  dateRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    fontSize: theme.fontSize.sm,
    marginBottom: theme.spacing.xs,
  },
  dateInputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    position: 'absolute',
    left: theme.spacing.md,
    zIndex: 1,
  },
  dateInput: {
    flex: 1,
    paddingLeft: theme.spacing['3xl'] + theme.spacing.xs,
  },
  frequencyWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  frequencyIcon: {
    position: 'absolute',
    left: theme.spacing.md,
    zIndex: 1,
  },
  frequencySelect: {
    flex: 1,
    paddingLeft: theme.spacing['3xl'] + theme.spacing.xs,
  },
  helpText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.sm,
  },
  priceWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceIcon: {
    position: 'absolute',
    left: theme.spacing.md,
    zIndex: 1,
  },
  priceInput: {
    flex: 1,
    paddingLeft: theme.spacing['3xl'] + theme.spacing.xs,
    paddingRight: theme.spacing['5xl'],
  },
  priceSuffix: {
    position: 'absolute',
    right: theme.spacing.md,
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  photoItem: {
    width: 100,
    height: 100,
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.lg,
  },
  privatePhotoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.destructive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  addPhotoText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.foreground,
  },
  privatePhotosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  optionsList: {
    gap: theme.spacing.lg,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  optionDescription: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  submitContainer: {
    paddingTop: theme.spacing.lg,
    paddingBottom: 100,
    alignItems: 'center',
  },
  submitButton: {
    width: '100%',
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  submitButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primaryForeground,
  },
  submitHelpText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
});
